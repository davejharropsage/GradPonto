import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Employer } from "@/generated/prisma/client";

export function EmployerForm({
  action,
  employer,
}: {
  action: (formData: FormData) => void;
  employer?: Employer | null;
}) {
  return (
    <form action={action} className="grid max-w-2xl gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Employer name *</Label>
        <Input id="name" name="name" defaultValue={employer?.name} required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={employer?.website ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" defaultValue={employer?.industry ?? ""} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={employer?.notes ?? ""} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit">{employer ? "Save Changes" : "Create Employer"}</Button>
      </div>
    </form>
  );
}
