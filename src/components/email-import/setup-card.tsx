"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/shared/copy-button";
import { addKnownAddress, removeKnownAddress, resetInboxAddress } from "@/lib/actions/email-import";
import { formatRelativeTime } from "@/lib/format";

export interface SetupView {
  address: string;
  userEmail: string;
  knownAddresses: string[];
  filterQuery: string;
  forwarding: { code: string | null; url: string | null; from: string | null; requestedAt: string } | null;
  lastReceivedAt: string | null;
  received: number;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[1.75rem_1fr] gap-x-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">{n}</span>
      <div className="space-y-1.5">
        <p className="font-medium">{title}</p>
        <div className="space-y-2 text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

function CodeLine({ value }: { value: string }) {
  return (
    <div className="flex items-start gap-2">
      <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs text-foreground">{value}</code>
      <CopyButton value={value} />
    </div>
  );
}

export function SetupCard({ setup }: { setup: SetupView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newAddress, setNewAddress] = useState("");

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }
      if (success) toast.success(success);
      router.refresh();
    });
  }

  function reset() {
    if (!window.confirm("Get a new forwarding address? The current one stops working straight away, so you'll need to update your Gmail forwarding.")) return;
    run(resetInboxAddress, "New address created");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Your forwarding address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="space-y-2">
          <CodeLine value={setup.address} />
          <p className="text-muted-foreground">
            Private to you: anything sent here can create suggestions on your account (you still approve each one).
            {setup.lastReceivedAt ? ` Last email ${formatRelativeTime(setup.lastReceivedAt)}; ${setup.received} so far.` : " Nothing received yet."}{" "}
            <button type="button" onClick={reset} disabled={pending} className="inline-flex items-center gap-1 underline hover:text-foreground">
              <RotateCcw className="h-3 w-3" />
              Get a new address
            </button>
          </p>
        </div>

        <ol className="space-y-4">
          <Step n={1} title="Add it as a forwarding address in Gmail">
            <p>
              Gmail → ⚙ <span className="text-foreground">See all settings</span> →{" "}
              <span className="text-foreground">Forwarding and POP/IMAP</span> →{" "}
              <span className="text-foreground">Add a forwarding address</span>, and paste the address above.
            </p>
          </Step>

          <Step n={2} title="Confirm it">
            {setup.forwarding ? (
              <div className="space-y-2 rounded-md border border-emerald-300 p-3 text-foreground dark:border-emerald-800">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Gmail&apos;s confirmation arrived {formatRelativeTime(setup.forwarding.requestedAt)}
                  {setup.forwarding.from ? ` (for ${setup.forwarding.from})` : ""}.
                </p>
                {setup.forwarding.url && (
                  <p>
                    <a href={setup.forwarding.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                      Click here to confirm forwarding
                    </a>{" "}
                    <span className="text-muted-foreground">or</span>
                  </p>
                )}
                {setup.forwarding.code && (
                  <p>
                    enter this code in Gmail&apos;s settings: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{setup.forwarding.code}</code>
                  </p>
                )}
              </div>
            ) : (
              <p>Gmail emails a confirmation to the new address. It&apos;ll appear here within a minute — refresh this page.</p>
            )}
            <p>
              You don&apos;t need to turn on &ldquo;Forward a copy of incoming mail&rdquo;: leave that on &ldquo;Disable forwarding&rdquo;. The filter
              in the next step does the forwarding, so only application emails are sent.
            </p>
          </Step>

          <Step n={3} title="Create a filter that forwards application emails">
            <p>
              In Gmail&apos;s search bar, open the search options (the sliders icon), paste this into{" "}
              <span className="text-foreground">Has the words</span>, then <span className="text-foreground">Create filter</span>:
            </p>
            <CodeLine value={setup.filterQuery} />
            <p>
              Tick <span className="text-foreground">Forward it to</span>, choose your GradPonto address, and{" "}
              <span className="text-foreground">Create filter</span>. Job alerts, newsletters and anything not addressed to you are ignored
              when they arrive.
            </p>
          </Step>

          <Step n={4} title="Add your older emails (optional)">
            <p>Filters only forward new mail. To bring in the last few months, search Gmail for:</p>
            <CodeLine value={`newer_than:90d ${setup.filterQuery}`} />
            <p>
              Tick the select-all box, then ⋮ → <span className="text-foreground">Forward as attachment</span>, and send it to your
              GradPonto address. Do about 25 at a time (there&apos;s a size limit per email); sending the same email twice is harmless.
            </p>
          </Step>
        </ol>

        <div className="space-y-2 border-t pt-4">
          <p className="font-medium">Your email addresses</p>
          <p className="text-muted-foreground">
            Forwarded mail is only read if it was sent to one of these. Gmail&apos;s confirmation and anything you forward by hand add your
            address automatically; add others you apply from.
          </p>
          <ul className="flex flex-wrap gap-2">
            <li className="rounded-4xl border px-2.5 py-0.5 text-xs">{setup.userEmail}</li>
            {setup.knownAddresses.map((address) => (
              <li key={address} className="inline-flex items-center gap-1 rounded-4xl border px-2.5 py-0.5 text-xs">
                {address}
                <button
                  type="button"
                  aria-label={`Remove ${address}`}
                  onClick={() => run(() => removeKnownAddress(address))}
                  disabled={pending}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const result = await addKnownAddress(newAddress);
                if (result.ok) setNewAddress("");
                return result;
              });
            }}
          >
            <Input
              type="email"
              placeholder="you@gmail.com"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              aria-label="Add an email address"
              disabled={pending}
            />
            <Button type="submit" variant="outline" disabled={pending || !newAddress.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
