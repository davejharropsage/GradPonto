import { PageHeader } from "@/components/shared/page-header";
import { EmployerForm } from "@/components/employers/employer-form";
import { createEmployer } from "@/lib/actions/employers";
import { getEmployerOptions } from "@/lib/data/employers";

export default async function NewEmployerPage() {
  const existingEmployers = await getEmployerOptions();

  return (
    <div>
      <PageHeader title="New Employer" />
      <EmployerForm action={createEmployer} existingEmployers={existingEmployers} />
    </div>
  );
}
