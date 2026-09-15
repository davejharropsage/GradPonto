import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmployerForm } from "@/components/employers/employer-form";
import { getEmployer, getEmployerOptions } from "@/lib/data/employers";
import { updateEmployer } from "@/lib/actions/employers";

export default async function EditEmployerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [employer, existingEmployers] = await Promise.all([getEmployer(id), getEmployerOptions()]);
  if (!employer) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${employer.name}`} />
      <EmployerForm action={updateEmployer.bind(null, id)} employer={employer} existingEmployers={existingEmployers} />
    </div>
  );
}
