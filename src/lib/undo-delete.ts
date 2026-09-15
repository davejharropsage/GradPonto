import { toast } from "sonner";

const GRACE_PERIOD_MS = 5000;

// Delete buttons pass a verb-phrase label ("Delete this application") used for
// both the dialog title and the button's aria-label. This turns that into a
// clean toast subject ("Application deleted") instead of doubling up the verb.
export function deletedMessage(label: string) {
  const subject = label.replace(/^Delete\s+(this\s+|an?\s+)?/i, "");
  return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} deleted`;
}

// Shows an "Undo" toast and only actually runs the delete after the grace
// period elapses with no undo. The item stays in the database (and keeps
// showing up anywhere still rendering from a stale cache) until then — the
// caller should refresh/navigate after `onSettled` fires, once it's real.
export function deleteWithUndo({
  action,
  message,
  onSettled,
}: {
  action: () => Promise<void>;
  message: string;
  onSettled?: () => void;
}) {
  let cancelled = false;

  const timer = setTimeout(async () => {
    if (cancelled) return;
    try {
      await action();
      onSettled?.();
    } catch {
      toast.error("Failed to delete");
    }
  }, GRACE_PERIOD_MS);

  toast(message, {
    duration: GRACE_PERIOD_MS,
    action: {
      label: "Undo",
      onClick: () => {
        cancelled = true;
        clearTimeout(timer);
        toast.success("Deletion cancelled");
      },
    },
  });
}
