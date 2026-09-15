import { Mail } from "lucide-react";

// TODO before launch: point this at a real, monitored inbox (see the launch
// checklist — this placeholder address isn't connected to anything yet).
const CONTACT_EMAIL = "hello@placementpilot.example";

export function FloatingContactButton() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      aria-label="Contact us by email"
      className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-lg bg-foreground text-background shadow-lg transition-transform hover:scale-105 print:hidden"
    >
      <Mail className="h-5 w-5" />
    </a>
  );
}
