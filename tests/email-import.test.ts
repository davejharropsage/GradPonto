// Run with:  npm test
import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalAddress,
  describeEmailOutcome,
  eventToStatus,
  gmailFilterQuery,
  gmailSearchUrl,
  htmlToText,
  inboxTokenFromRecipient,
  matchApplication,
  messageKeyFor,
  newInboxToken,
  parseForwardingConfirmation,
  parseInlineForward,
  planProposals,
  prefilterMessage,
  shouldProposeStatusChange,
  unprocessedIds,
  type ClassifiedEmail,
  type MatchCandidate,
  type PendingProposal,
} from "../src/lib/inbound/core.ts";

const ME = "lucas.harrop@gmail.com";

// --- Classification mapping ----------------------------------------------------------------------

test("eventToStatus maps every email event onto a real pipeline stage", () => {
  assert.equal(eventToStatus("applied"), "APPLIED");
  assert.equal(eventToStatus("online_assessment"), "ONLINE_ASSESSMENT");
  assert.equal(eventToStatus("video_interview"), "VIDEO_INTERVIEW");
  assert.equal(eventToStatus("interview"), "VIDEO_INTERVIEW");
  assert.equal(eventToStatus("assessment_centre"), "VIDEO_INTERVIEW");
  assert.equal(eventToStatus("offer"), "OFFER");
  assert.equal(eventToStatus("rejected"), "REJECTED");
  assert.equal(eventToStatus("withdrawn"), "WITHDRAWN");
  assert.equal(eventToStatus("other"), null);
  assert.equal(eventToStatus("something-the-model-made-up"), null);
});

test("shouldProposeStatusChange only moves forward along the pipeline", () => {
  assert.equal(shouldProposeStatusChange("INTERESTED", "APPLIED"), true);
  assert.equal(shouldProposeStatusChange("APPLIED", "ONLINE_ASSESSMENT"), true);
  assert.equal(shouldProposeStatusChange("ONLINE_ASSESSMENT", "VIDEO_INTERVIEW"), true);
  // An old "thanks for applying" must not drag an interview back to Applied.
  assert.equal(shouldProposeStatusChange("VIDEO_INTERVIEW", "APPLIED"), false);
  assert.equal(shouldProposeStatusChange("VIDEO_INTERVIEW", "ONLINE_ASSESSMENT"), false);
  assert.equal(shouldProposeStatusChange("APPLIED", "APPLIED"), false);
});

test("shouldProposeStatusChange always allows a rejection or an offer", () => {
  assert.equal(shouldProposeStatusChange("VIDEO_INTERVIEW", "REJECTED"), true);
  assert.equal(shouldProposeStatusChange("INTERESTED", "REJECTED"), true);
  assert.equal(shouldProposeStatusChange("REJECTED", "OFFER"), true);
  assert.equal(shouldProposeStatusChange("OFFER", "REJECTED"), true);
  assert.equal(shouldProposeStatusChange("REJECTED", "REJECTED"), false);
});

test("shouldProposeStatusChange never reopens a closed application, and withdrawal only applies to open ones", () => {
  assert.equal(shouldProposeStatusChange("REJECTED", "VIDEO_INTERVIEW"), false);
  assert.equal(shouldProposeStatusChange("WITHDRAWN", "APPLIED"), false);
  assert.equal(shouldProposeStatusChange("OFFER", "WITHDRAWN"), false);
  assert.equal(shouldProposeStatusChange("APPLIED", "WITHDRAWN"), true);
});

// --- Pre-filter ----------------------------------------------------------------------------------

test("prefilterMessage keeps an ATS email addressed to you", () => {
  const verdict = prefilterMessage(
    {
      from: "Acme Careers <acme@myworkday.com>",
      to: "Lucas Harrop <lucas.harrop@gmail.com>",
      subject: "Thank you for applying to Acme",
    },
    [ME]
  );
  assert.deepEqual(verdict, { keep: true });
});

test("prefilterMessage skips spam addressed to random @web.de recipients", () => {
  const verdict = prefilterMessage(
    {
      from: "HR Team <hr@some-spammer.biz>",
      to: "k.mueller1984@web.de, anna.schmidt@web.de",
      subject: "Your application has been accepted - job offer inside",
    },
    [ME]
  );
  assert.deepEqual(verdict, { keep: false, reason: "not-addressed-to-you" });
});

test("prefilterMessage skips undisclosed-recipients mail (Delivered-To isn't trusted)", () => {
  const verdict = prefilterMessage({ from: "x@spam.example", to: "undisclosed-recipients:;", subject: "Interview offer" }, [ME]);
  assert.equal(verdict.keep, false);
});

test("prefilterMessage recognises your address despite Gmail dots, +tags, case and googlemail.com", () => {
  for (const to of ["LucasHarrop@gmail.com", "lucas.harrop+jobs@gmail.com", "lucasharrop@googlemail.com"]) {
    const verdict = prefilterMessage({ from: "no-reply@greenhouse.io", to, subject: "Your application" }, [ME]);
    assert.deepEqual(verdict, { keep: true }, to);
  }
  assert.equal(canonicalAddress("Lucas.Harrop+x@GoogleMail.com"), "lucasharrop@gmail.com");
  // Dots matter outside Gmail.
  assert.notEqual(canonicalAddress("a.b@uni.ac.uk"), canonicalAddress("ab@uni.ac.uk"));
});

test("prefilterMessage accepts Cc and a second own address", () => {
  const verdict = prefilterMessage(
    { from: "talent@acme.com", to: "team@acme.com", cc: "lucas@uni.ac.uk", subject: "Interview invitation" },
    [ME, "lucas@uni.ac.uk"]
  );
  assert.deepEqual(verdict, { keep: true });
});

test("prefilterMessage skips Bright Network and Gradcracker mail", () => {
  assert.deepEqual(
    prefilterMessage({ from: "Bright Network <jobs@email.brightnetwork.co.uk>", to: ME, subject: "Your application tips" }, [ME]),
    { keep: false, reason: "newsletter" }
  );
  assert.deepEqual(
    prefilterMessage({ from: "Gradcracker <news@gradcracker.com>", to: ME, subject: "Interview with Rolls-Royce engineers" }, [ME]),
    { keep: false, reason: "newsletter" }
  );
});

test("prefilterMessage skips job-alert subjects unless they come from an ATS", () => {
  assert.deepEqual(
    prefilterMessage({ from: "alerts@jobsite.example", to: ME, subject: "12 new jobs matching you - apply now" }, [ME]),
    { keep: false, reason: "job-alert" }
  );
  assert.deepEqual(
    prefilterMessage({ from: "noreply@company.example", to: ME, subject: "Your weekly digest of graduate roles" }, [ME]),
    { keep: false, reason: "job-alert" }
  );
  assert.deepEqual(
    prefilterMessage({ from: "acme@myworkday.com", to: ME, subject: "Weekly update on your application" }, [ME]),
    { keep: true }
  );
});

test("prefilterMessage skips mail with nothing application-shaped in it", () => {
  assert.deepEqual(prefilterMessage({ from: "friend@example.com", to: ME, subject: "Dinner on Friday?" }, [ME]), {
    keep: false,
    reason: "no-application-keywords",
  });
});

test("gmailFilterQuery ORs the phrases and ATS senders into one Gmail filter", () => {
  const query = gmailFilterQuery();
  assert.match(query, /^\{.*\}$/);
  assert.match(query, /"thank you for applying"/);
  assert.match(query, /from:myworkday\.com/);
  assert.match(query, /from:greenhouse\.io/);
  // Gmail rejects very long filters.
  assert.ok(query.length < 1000, `${query.length} characters`);
});

// --- Matching ------------------------------------------------------------------------------------

const apps: MatchCandidate[] = [
  { id: "a1", company: "Acme Robotics Ltd", title: "Graduate Software Engineer 2026", jobUrl: null, status: "APPLIED" },
  { id: "a2", company: "Northwind Group plc", title: "Graduate Data Analyst", jobUrl: null, status: "ONLINE_ASSESSMENT" },
  { id: "a3", company: "Northwind Group", title: "Finance Graduate Programme", jobUrl: null, status: "APPLIED" },
  { id: "a4", company: "Contoso", title: "Summer Internship", jobUrl: "https://careers.contoso.com/jobs/123?src=li", status: "APPLIED" },
];

test("matchApplication matches a fuzzy company name with only one application there", () => {
  assert.equal(matchApplication({ company: "Acme Robotics", roleTitle: "" }, apps)?.candidate.id, "a1");
  assert.equal(matchApplication({ company: "ACME Robotics Limited", roleTitle: "Software Engineer" }, apps)?.candidate.id, "a1");
});

test("matchApplication picks the right role when there are several at one company", () => {
  assert.equal(matchApplication({ company: "Northwind", roleTitle: "Data Analyst Graduate" }, apps)?.candidate.id, "a2");
  assert.equal(matchApplication({ company: "Northwind Group", roleTitle: "Graduate Programme - Finance" }, apps)?.candidate.id, "a3");
});

test("matchApplication treats a clearly different role at the same company as new", () => {
  assert.equal(matchApplication({ company: "Northwind", roleTitle: "Marketing Graduate" }, apps), null);
  assert.equal(matchApplication({ company: "Acme Robotics", roleTitle: "HR Assistant" }, apps), null);
});

test("matchApplication matches on job URL regardless of tracking params", () => {
  assert.equal(
    matchApplication({ company: "Something Else", roleTitle: "", jobUrl: "http://www.careers.contoso.com/jobs/123/" }, apps)?.candidate.id,
    "a4"
  );
});

test("matchApplication returns null for an unknown company", () => {
  assert.equal(matchApplication({ company: "Globex", roleTitle: "Graduate Software Engineer" }, apps), null);
  assert.equal(matchApplication({ company: "", roleTitle: "Graduate Software Engineer" }, apps), null);
});

// --- Planning and dedupe -------------------------------------------------------------------------

function email(messageId: string, company: string, roleTitle: string, event: string, confidence = 0.9): ClassifiedEmail {
  return { messageId, company, roleTitle, event, confidence };
}

test("planProposals proposes a forward status change for a matched application", () => {
  const steps = planProposals([email("m1", "Acme Robotics", "", "online_assessment")], apps, []);
  assert.deepEqual(steps, [
    {
      type: "create",
      messageId: "m1",
      kind: "STATUS_CHANGE",
      applicationId: "a1",
      fromStatus: "APPLIED",
      proposedStatus: "ONLINE_ASSESSMENT",
      matchScore: 0.6,
    },
  ]);
});

test("planProposals skips a backward move and a same-stage email", () => {
  const steps = planProposals(
    [email("m1", "Northwind", "Data Analyst", "applied"), email("m2", "Northwind", "Data Analyst", "online_assessment")],
    apps,
    []
  );
  assert.deepEqual(
    steps.map((step) => [step.type, step.type === "skip" ? step.outcome : ""]),
    [
      ["skip", "no-change"],
      ["skip", "no-change"],
    ]
  );
});

test("planProposals proposes a new application when nothing matches", () => {
  const [step] = planProposals([email("m1", "Globex", "Graduate Engineer", "applied")], apps, []);
  assert.equal(step.type, "create");
  assert.equal(step.type === "create" && step.kind, "NEW_APPLICATION");
  assert.equal(step.type === "create" && step.proposedStatus, "APPLIED");
});

test("planProposals folds several emails about one new application into a single proposal", () => {
  const steps = planProposals(
    [
      email("m1", "Globex", "Graduate Engineer", "applied"),
      email("m2", "Globex Corporation", "", "online_assessment"),
      email("m3", "Globex", "Graduate Engineer", "applied"), // a reminder: not forward
    ],
    apps,
    []
  );
  assert.equal(steps[0].type, "create");
  assert.deepEqual(steps[1], { type: "supersede", messageId: "m2", proposalId: "new:0", proposedStatus: "ONLINE_ASSESSMENT" });
  assert.deepEqual(steps[2], { type: "skip", messageId: "m3", outcome: "duplicate" });
});

test("planProposals updates an already-pending proposal instead of adding a second one", () => {
  const pending: PendingProposal[] = [
    {
      id: "p1",
      kind: "STATUS_CHANGE",
      applicationId: "a1",
      company: "Acme Robotics Ltd",
      roleTitle: "Graduate Software Engineer 2026",
      jobUrl: null,
      proposedStatus: "ONLINE_ASSESSMENT",
    },
  ];
  const steps = planProposals([email("m9", "Acme Robotics", "", "rejected")], apps, pending);
  assert.deepEqual(steps, [{ type: "supersede", messageId: "m9", proposalId: "p1", proposedStatus: "REJECTED" }]);
});

test("planProposals ignores low-confidence, 'other' and company-less classifications", () => {
  const steps = planProposals(
    [email("m1", "Globex", "Engineer", "applied", 0.2), email("m2", "Globex", "Engineer", "other"), email("m3", "", "", "applied")],
    apps,
    []
  );
  assert.deepEqual(
    steps.map((step) => step.type === "skip" && step.outcome),
    ["irrelevant", "irrelevant", "irrelevant"]
  );
});

test("unprocessedIds drops messages already in the ledger and repeats", () => {
  assert.deepEqual(unprocessedIds(["m1", "m2", "m3", "m2", "m4"], ["m1", "m4"]), ["m2", "m3"]);
  assert.deepEqual(unprocessedIds([], ["m1"]), []);
});

// --- Inbound addresses, dedupe keys ------------------------------------------------------------

test("newInboxToken is 12 random lower-case alphanumerics", () => {
  const a = newInboxToken();
  assert.match(a, /^[a-z0-9]{12}$/);
  assert.notEqual(a, newInboxToken());
});

test("inboxTokenFromRecipient reads the token only for our domain", () => {
  assert.equal(inboxTokenFromRecipient("k3x9q2m7p1zz@in.gradponto.com", "in.gradponto.com"), "k3x9q2m7p1zz");
  assert.equal(inboxTokenFromRecipient(" K3X9Q2M7P1ZZ+gmail@IN.gradponto.com ", "in.gradponto.com"), "k3x9q2m7p1zz");
  assert.equal(inboxTokenFromRecipient("k3x9q2m7p1zz@gradponto.com", "in.gradponto.com"), null);
  assert.equal(inboxTokenFromRecipient("short@in.gradponto.com", "in.gradponto.com"), null);
  assert.equal(inboxTokenFromRecipient("not-an-address", "in.gradponto.com"), null);
});

test("messageKeyFor uses the Message-ID, so the same email forwarded twice dedupes", () => {
  assert.equal(messageKeyFor({ messageId: "<ABC.123@mail.workday.com>" }), messageKeyFor({ messageId: "abc.123@mail.workday.com" }));
  const a = messageKeyFor({ from: "a@x.com", subject: "Hi", date: "Mon, 20 Oct 2026" });
  assert.match(a, /^hash:[0-9a-f]{40}$/);
  assert.equal(a, messageKeyFor({ from: "a@x.com", subject: "Hi", date: "Mon, 20 Oct 2026" }));
  assert.notEqual(a, messageKeyFor({ from: "a@x.com", subject: "Hi again", date: "Mon, 20 Oct 2026" }));
});

test("gmailSearchUrl searches by rfc822msgid", () => {
  assert.equal(gmailSearchUrl("<abc@x.com>"), "https://mail.google.com/mail/u/0/#search/rfc822msgid%3Aabc%40x.com");
});

// --- Gmail forwarding confirmation ---------------------------------------------------------------

test("parseForwardingConfirmation pulls out the code, link and Gmail address", () => {
  const confirmation = parseForwardingConfirmation({
    from: "Gmail Team <forwarding-noreply@google.com>",
    subject: "(#618294751) Gmail Forwarding Confirmation - Receive Mail from lucas.harrop@gmail.com",
    text:
      "lucas.harrop@gmail.com has requested to automatically forward mail to your email address k3x9q2m7p1zz@in.gradponto.com.\n" +
      "Confirmation code: 618294751\n\nTo allow lucas.harrop@gmail.com to automatically forward mail to your address, please click the link below to confirm the request:\n\n" +
      "https://mail-settings.google.com/mail/vf-%5BANGjdJ8x%5D-abc123\n\nIf you click the link and it appears to be broken...",
  });
  assert.deepEqual(confirmation, {
    code: "618294751",
    url: "https://mail-settings.google.com/mail/vf-%5BANGjdJ8x%5D-abc123",
    from: "lucas.harrop@gmail.com",
  });
});

test("parseForwardingConfirmation ignores lookalikes from other senders", () => {
  assert.equal(
    parseForwardingConfirmation({ from: "evil@phish.example", subject: "(#1234567) Gmail Forwarding Confirmation - Receive Mail from x@gmail.com" }),
    null
  );
  assert.equal(parseForwardingConfirmation({ from: "forwarding-noreply@google.com", subject: "Something else" }), null);
});

// --- Inline forwards ----------------------------------------------------------------------------

test("parseInlineForward reads Gmail's forwarded-message block", () => {
  const forward = parseInlineForward(
    [
      "FYI",
      "",
      "---------- Forwarded message ---------",
      "From: Acme Careers <acme@myworkday.com>",
      "Date: Mon, 20 Oct 2026 at 10:15",
      "Subject: Thank you for applying",
      "To: <lucas.harrop@gmail.com>",
      "",
      "Dear Lucas,",
      "We have received your application.",
    ].join("\n")
  );
  assert.deepEqual(forward, {
    from: "Acme Careers <acme@myworkday.com>",
    to: "<lucas.harrop@gmail.com>",
    cc: "",
    subject: "Thank you for applying",
    date: "Mon, 20 Oct 2026 at 10:15",
    text: "Dear Lucas,\nWe have received your application.",
  });
});

test("parseInlineForward reads Outlook's original-message block and rejects plain mail", () => {
  const forward = parseInlineForward(
    "-----Original Message-----\nFrom: talent@globex.com\nSent: 21 October 2026 09:00\nTo: lucas@uni.ac.uk\nSubject: Interview invitation\n\nHi Lucas"
  );
  assert.equal(forward?.from, "talent@globex.com");
  assert.equal(forward?.date, "21 October 2026 09:00");
  assert.equal(forward?.text, "Hi Lucas");
  assert.equal(parseInlineForward("Just a normal email\nFrom: me"), null);
});

// --- Bodies --------------------------------------------------------------------------------------

test("htmlToText strips tags, styles and entities", () => {
  assert.equal(htmlToText("<style>p{}</style><p>Dear Lucas,</p><p>We&#39;re pleased</p>"), "Dear Lucas,\nWe're pleased");
});

test("describeEmailOutcome explains every outcome the pipeline records", () => {
  assert.deepEqual(describeEmailOutcome("QUEUED", null), { label: "Waiting to be read", tone: "waiting" });
  assert.deepEqual(describeEmailOutcome("PROCESSING", null), { label: "Waiting to be read", tone: "waiting" });
  assert.equal(describeEmailOutcome("DONE", "proposed").tone, "suggested");
  for (const outcome of [
    "no-change",
    "duplicate",
    "irrelevant",
    "skipped:no-application-keywords",
    "skipped:not-addressed-to-you",
    "skipped:newsletter",
    "skipped:job-alert",
  ]) {
    const { label, tone } = describeEmailOutcome("DONE", outcome);
    assert.equal(tone, "ignored");
    assert.notEqual(label, "Read, no suggestion", `${outcome} should have its own wording`);
  }
  assert.equal(describeEmailOutcome("DONE", "something-new").label, "Read, no suggestion");
});
