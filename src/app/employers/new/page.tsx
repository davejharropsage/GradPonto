import { PageHeader } from "@/components/shared/page-header";
import { EmployerForm } from "@/components/employers/employer-form";
import { createEmployer } from "@/lib/actions/employers";

export default function NewEmployerPage() {
  return (
    <div>
      <PageHeader title="New Employer" />
      <EmployerForm action={createEmployer} />
    </div>
  );
}
