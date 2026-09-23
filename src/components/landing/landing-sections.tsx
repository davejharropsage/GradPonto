import type { CSSProperties } from "react";
import Link from "next/link";

// Marketing sections of the landing page, converted from the static prototype. They are plain
// server components; the interactive feature tabs live in feature-tabs.tsx.
// All product imagery is original CSS/SVG, and every job, employer and number shown is sample data.

export function Hero() {
  return (
    <section className="hero-section" id="top">
          <div className="wrap">
            <div className="hero gp-panel gp-panel--wash">
              <div className="hero__copy">
                <p className="gp-eyebrow"><svg className="spk spk--inline" width="14" height="14" aria-hidden="true"><use href="#gp-sparkle"/></svg>For UK graduates</p>
                <h1 className="display"><span className="line">Find it.</span> <span className="line">Apply for it.</span> <span className="line"><span className="gp-gradient-text">Track it.</span></span></h1>
                <p className="lede">GradPonto pulls UK placements, internships and apprenticeships into one ranked list, then helps you keep every application moving, from saved to signed.</p>
                <div className="btn-row">
                  <Link className="gp-btn gp-btn--lg" href="/signup">Get started free</Link>
                  <a className="gp-btn gp-btn--ghost gp-btn--lg" href="#how">See how it works</a>
                </div>
                <p className="sources">
                  <span className="sources__label">Listings gathered from</span>
                  <span className="sources__list"><span>Adzuna</span><span>Reed</span><span>Find an Apprenticeship</span></span>
                </p>
              </div>

              <div className="hero__visual" aria-hidden="true">
                <svg className="gp-sparkle spk s1" width="40" height="40"><use href="#gp-sparkle"/></svg>
                <svg className="gp-sparkle spk s2" width="22" height="22"><use href="#gp-sparkle"/></svg>
                <svg className="gp-sparkle spk s3" width="30" height="30"><use href="#gp-sparkle"/></svg>
                <svg className="gp-sparkle spk s4" width="16" height="16"><use href="#gp-sparkle"/></svg>

                <div className="ghost ghost--check">
                  <b>Application checklist</b>
                  <ul><li className="done">CV tailored</li><li className="done">Cover letter</li><li>Submit by Friday</li></ul>
                </div>
                <div className="ghost ghost--prep">
                  <b>Interview prep</b>
                  <span>Tue 2:00pm · Video call</span>
                </div>

                <div className="gp-phone">
                  <div className="gp-phone__screen">
                    <div className="ph-top"><span className="ph-title">Your shortlist</span><span className="ph-count-badge">12</span></div>
                    <div className="ph-chips"><span className="gp-chip">data analytics</span><span className="gp-chip">London</span></div>
                    <ul className="ph-list">
                      <li className="ph-row"><span className="gp-score">4.0</span><div className="ph-body"><strong>Data Analyst Placement</strong><span>Brightwave Energy · London</span></div><span className="gp-tag gp-tag--applied">Applied</span></li>
                      <li className="ph-row"><span className="gp-score">4.0</span><div className="ph-body"><strong>Business Insights Intern</strong><span>Harbour &amp; Finch · Leeds</span></div><span className="gp-tag">Saved</span></li>
                      <li className="ph-row"><span className="gp-score gp-score--mid">3.0</span><div className="ph-body"><strong>Junior Engineer Apprentice</strong><span>Oakfield Labs · Bristol</span></div><span className="gp-tag gp-tag--interview">Interview</span></li>
                      <li className="ph-row"><span className="gp-score gp-score--mid">3.0</span><div className="ph-body"><strong>Marketing Placement Student</strong><span>Riverside Media · Manchester</span></div><span className="gp-tag">Saved</span></li>
                    </ul>
                    <div className="ph-summary"><span><b>3</b> applied</span><span><b>1</b> interview</span><span><b>0</b> offers</span></div>
                  </div>
                </div>

                <div className="gp-float f-deadline">
                  <span className="f-icon f-icon--blue"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span>
                  <div><strong>Closes in 3 days</strong><small>Data Analyst Placement</small></div>
                </div>
                <div className="gp-float f-applied">
                  <span className="f-icon f-icon--sage">✓</span>
                  <div><strong>Application sent</strong><small>Brightwave Energy</small></div>
                </div>
              </div>
            </div>
            <p className="sample-note">Sample data shown for illustration.</p>
          </div>
        </section>
  );
}

export function FeaturesHeading() {
  return (
    <div className="section__head">
      <p className="gp-eyebrow"><svg className="spk spk--inline" width="14" height="14" aria-hidden="true"><use href="#gp-sparkle"/></svg>One place for your whole search</p>
      <h2 className="h2">Stop juggling tabs, spreadsheets and job boards</h2>
      <p className="lede lede--dim">Finding a placement is a part-time job on its own. GradPonto gathers the search, the shortlist and the follow-ups so you can spend your time on the applications that matter.</p>
    </div>
  );
}

export function featurePanels() {
  return {
    find: (
      <>
        <div className="tpanel__copy">
          <h3>Search every source at once</h3>
          <p>Type the subjects, skills and interests from your course or CV. GradPonto searches UK job sources together and removes the duplicates for you.</p>
          <ul className="checks">
            <li>Placements, internships and apprenticeships together</li>
            <li>Filter by UK location</li>
            <li>One tidy list instead of five job boards</li>
          </ul>
        </div>
        <div className="tviz" aria-hidden="true">
          <svg className="gp-sparkle spk t1" width="26" height="26"><use href="#gp-sparkle"/></svg>
          <svg className="gp-sparkle spk t2" width="14" height="14"><use href="#gp-sparkle"/></svg>
          <div className="gp-phone gp-phone--sm"><div className="gp-phone__screen">
            <div className="ph-search"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>data analytics</div>
            <div className="ph-chips"><span className="gp-chip">London</span><span className="gp-chip">Placement</span></div>
            <p className="ph-count"><b>49</b> listings · 3 sources</p>
            <ul className="ph-list">
              <li className="ph-row"><span className="gp-score">4.0</span><div className="ph-body"><strong>Data Analyst Placement</strong><span>Brightwave Energy</span></div></li>
              <li className="ph-row"><span className="gp-score">4.0</span><div className="ph-body"><strong>Insights Intern</strong><span>Harbour &amp; Finch</span></div></li>
              <li className="ph-row"><span className="gp-score gp-score--mid">3.0</span><div className="ph-body"><strong>Graduate Analyst</strong><span>Oakfield Labs</span></div></li>
            </ul>
          </div></div>
        </div>
      </>
    ),
    match: (
      <>
        <div className="tpanel__copy">
          <h3>See what fits you first</h3>
          <p>Every listing gets a match score against your keywords. A hit in the job title counts for more than a mention further down, so the strongest matches rise to the top.</p>
          <ul className="checks">
            <li>Ranked by relevance, best match first</li>
            <li>See exactly which of your keywords matched</li>
            <li>Irrelevant roles filtered out of the way</li>
          </ul>
        </div>
        <div className="tviz" aria-hidden="true">
          <svg className="gp-sparkle spk t1" width="26" height="26"><use href="#gp-sparkle"/></svg>
          <svg className="gp-sparkle spk t2" width="14" height="14"><use href="#gp-sparkle"/></svg>
          <div className="gp-phone gp-phone--sm"><div className="gp-phone__screen">
            <div className="ph-top"><span className="ph-title">Best matches</span></div>
            <div className="ph-bar"><span>Data Analyst Placement</span><i style={{ "--w": "100%" } as CSSProperties}></i><b>4.0</b></div>
            <div className="ph-bar"><span>Business Insights Intern</span><i style={{ "--w": "75%" } as CSSProperties}></i><b>3.0</b></div>
            <div className="ph-bar"><span>Operations Assistant</span><i style={{ "--w": "25%" } as CSSProperties}></i><b>1.0</b></div>
            <p className="ph-label">Your keywords</p>
            <div className="ph-chips"><span className="gp-chip">data analytics</span><span className="gp-chip">business studies</span></div>
          </div></div>
        </div>
      </>
    ),
    apply: (
      <>
        <div className="tpanel__copy">
          <h3>Apply on the employer&apos;s own listing</h3>
          <p>You never apply through us. Each result links straight back to the original advert, so you send your application where the employer expects it.</p>
          <ul className="checks">
            <li>One click to the source listing</li>
            <li>Short summaries, never a copy of the advert</li>
            <li>Mark it applied and move on</li>
          </ul>
        </div>
        <div className="tviz" aria-hidden="true">
          <svg className="gp-sparkle spk t1" width="26" height="26"><use href="#gp-sparkle"/></svg>
          <svg className="gp-sparkle spk t2" width="14" height="14"><use href="#gp-sparkle"/></svg>
          <div className="gp-phone gp-phone--sm"><div className="gp-phone__screen">
            <div className="ph-detail-title">Data Analyst Placement</div>
            <div className="ph-detail-sub">Brightwave Energy · London</div>
            <div className="ph-chips"><span className="gp-chip">12 months</span><span className="gp-chip">Placement</span></div>
            <div className="ph-skel"><i></i><i></i><i className="short"></i></div>
            <div className="ph-btn">Open original listing ↗</div>
            <div className="ph-btn ph-btn--ghost">Mark as applied</div>
          </div></div>
        </div>
      </>
    ),
    track: (
      <>
        <div className="tpanel__copy">
          <h3>Know where every application stands</h3>
          <p>Move each role through saved, applied, interview and offer. Deadlines and next steps sit beside it, so nothing slips through the cracks.</p>
          <ul className="checks">
            <li>A clear pipeline from saved to offer</li>
            <li>Deadlines and follow-up reminders</li>
            <li>Notes for each role in one place</li>
          </ul>
        </div>
        <div className="tviz" aria-hidden="true">
          <svg className="gp-sparkle spk t1" width="26" height="26"><use href="#gp-sparkle"/></svg>
          <svg className="gp-sparkle spk t2" width="14" height="14"><use href="#gp-sparkle"/></svg>
          <div className="gp-phone gp-phone--sm"><div className="gp-phone__screen">
            <div className="ph-top"><span className="ph-title">Pipeline</span></div>
            <div className="ph-kanban">
              <div className="ph-col"><h4>Applied <b>2</b></h4><div className="ph-card"><strong>Data Analyst</strong><span>Brightwave</span></div><div className="ph-card"><strong>Insights Intern</strong><span>Harbour &amp; Finch</span></div><div className="ph-card"><strong>Marketing Student</strong><span>Riverside Media</span></div></div>
              <div className="ph-col"><h4>Interview <b>1</b></h4><div className="ph-card ph-card--hot"><strong>Engineer Apprentice</strong><span>Tue 2:00pm</span></div></div>
            </div>
            <div className="ph-next"><small>Next up</small><strong>Interview, Tue 2:00pm</strong></div>
          </div></div>
        </div>
      </>
    ),
  };
}

export function Bento() {
  return (
    <section className="section">
          <div className="wrap">
            <div className="gp-panel gp-panel--dark gp-dark bento-panel">
              <svg className="gp-sparkle spk b1" width="34" height="34" aria-hidden="true"><use href="#gp-sparkle"/></svg>
              <svg className="gp-sparkle spk b2" width="16" height="16" aria-hidden="true"><use href="#gp-sparkle"/></svg>
              <div className="section__head">
                <p className="gp-eyebrow"><svg className="spk spk--inline" width="14" height="14" aria-hidden="true"><use href="#gp-sparkle"/></svg>Everything in one dashboard</p>
                <h2 className="h2 h2--xl">From first search to signed offer</h2>
              </div>

              <div className="bento">
                <article className="bcard bcard--wide">
                  <h3>Ranked by how well they fit you</h3>
                  <p className="gp-muted">Your keywords become a match score, so the best roles are always at the top.</p>
                  <ul className="rank" aria-hidden="true">
                    <li><span className="gp-score">4.0</span>Data Analyst Placement<em>title match</em></li>
                    <li><span className="gp-score">3.0</span>Business Insights Intern<em>title match</em></li>
                    <li><span className="gp-score gp-score--mid">1.0</span>Operations Assistant<em>description only</em></li>
                  </ul>
                  <div className="kw" aria-hidden="true"><span>data analytics</span><span>mechanical engineering</span><span>business studies</span><span className="kw--add">+ add</span></div>
                </article>

                <article className="bcard">
                  <h3>Never miss a deadline</h3>
                  <p className="gp-muted">Closing dates and follow-ups, in date order.</p>
                  <ul className="due" aria-hidden="true">
                    <li><b>Tue</b> Data Analyst Placement <span className="due__tag due__tag--hot">3 days</span></li>
                    <li><b>Fri</b> Business Insights Intern <span className="due__tag">6 days</span></li>
                    <li><b>Mon</b> Engineer Apprentice <span className="due__tag">9 days</span></li>
                  </ul>
                </article>

                <article className="bcard">
                  <h3>Every source, one list</h3>
                  <p className="gp-muted">Adzuna, Reed and Find an Apprenticeship, with duplicates removed.</p>
                  <div className="orbit" aria-hidden="true"><span>Adzuna</span><span>Reed</span><span>Apprenticeships</span></div>
                </article>

                <article className="bcard bcard--wide">
                  <h3>Your pipeline at a glance</h3>
                  <p className="gp-muted">Move every role from saved to offer and see where each one stands.</p>
                  <div className="board" aria-hidden="true">
                    <div className="board__col"><h4>Saved <b>5</b></h4><i></i><i></i></div>
                    <div className="board__col"><h4>Applied <b>3</b></h4><i className="g"></i><i className="g"></i></div>
                    <div className="board__col"><h4>Interview <b>1</b></h4><i className="p"></i></div>
                    <div className="board__col"><h4>Offer <b>0</b></h4></div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
  );
}

export function HowItWorks() {
  return (
    <section className="section" id="how">
          <div className="wrap">
            <div className="section__head section__head--center">
              <p className="gp-eyebrow"><svg className="spk spk--inline" width="14" height="14" aria-hidden="true"><use href="#gp-sparkle"/></svg>How it works</p>
              <h2 className="h2">Up and running in three steps</h2>
            </div>
            <ol className="steps">
              <li className="step">
                <span className="step__num" aria-hidden="true">1</span>
                <h3>Tell us what you&apos;re after</h3>
                <p>Add the subjects, skills and locations you care about. It takes less than a minute.</p>
              </li>
              <li className="step">
                <span className="step__num" aria-hidden="true">2</span>
                <h3>Shortlist and apply</h3>
                <p>Browse your ranked matches, save the good ones, and apply on the employer&apos;s own listing.</p>
              </li>
              <li className="step">
                <span className="step__num" aria-hidden="true">3</span>
                <h3>Track every stage</h3>
                <p>Move roles from saved to applied to interview to offer, with deadlines kept in view.</p>
              </li>
            </ol>
          </div>
        </section>
  );
}

export function WhyGradPonto() {
  return (
    <section className="section" id="built">
          <div className="wrap">
            <div className="gp-panel gp-panel--ice built">
              <div className="built__intro">
                <p className="gp-eyebrow"><svg className="spk spk--inline" width="14" height="14" aria-hidden="true"><use href="#gp-sparkle"/></svg>Why GradPonto</p>
                <h2 className="h2">Built for UK graduates</h2>
                <p className="lede lede--dim">Honest by design: we help you find and organise. The decisions, and the applications, stay with you.</p>
              </div>
              <div className="built__grid">
                <article className="tile"><span className="gp-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg></span><h3>Placement years &amp; internships</h3><p>Industrial placements, summer internships and sandwich-year roles.</p></article>
                <article className="tile"><span className="gp-icon gp-icon--leaf" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></svg></span><h3>Apprenticeships too</h3><p>Includes listings from the official Find an Apprenticeship service.</p></article>
                <article className="tile"><span className="gp-icon gp-icon--sky" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></span><h3>Always the original source</h3><p>Every result links back to the employer&apos;s advert. We show short summaries, never a copy.</p></article>
                <article className="tile"><span className="gp-icon gp-icon--ink" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span><h3>Anywhere in the UK</h3><p>Search a city or leave it open. Your keywords do the rest.</p></article>
              </div>
            </div>
          </div>
        </section>
  );
}

export function Faq() {
  return (
    <section className="section" id="faq">
          <div className="wrap wrap--narrow">
            <div className="section__head section__head--center">
              <p className="gp-eyebrow"><svg className="spk spk--inline" width="14" height="14" aria-hidden="true"><use href="#gp-sparkle"/></svg>Questions</p>
              <h2 className="h2">Good to know</h2>
            </div>
            <div className="faq">
              <details><summary>Who is GradPonto for?</summary><p>UK graduates and final-year students looking for placements, internships and apprenticeships, and anyone who wants to keep an organised record of where they&apos;ve applied.</p></details>
              <details><summary>Where do the listings come from?</summary><p>GradPonto searches several established UK job sources together, currently Adzuna, Reed and the government&apos;s Find an Apprenticeship service, then removes duplicates and ranks what&apos;s left.</p></details>
              <details><summary>Do I apply through GradPonto?</summary><p>No. Each result links to the original advert and you apply on the employer&apos;s site. GradPonto helps you find the role and keep track of it afterwards.</p></details>
              <details><summary>How does the match score work?</summary><p>It compares the keywords you enter with each listing. A keyword in the job title counts for more than one in the description, so closer matches score higher.</p></details>
              <details><summary>How do I sign up?</summary><p>Choose Get started free, set an email and password, and confirm your email with a one-time code we send you. That&apos;s it &mdash; you&apos;re in.</p></details>
            </div>
          </div>
        </section>
  );
}
