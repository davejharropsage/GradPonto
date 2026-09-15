import { PageHeader } from "@/components/shared/page-header";
import { CsvImportWizard } from "@/components/applications/csv-import-wizard";
import { getActiveApplicationSummaries } from "@/lib/data/applications";

export default async function ImportApplicationsPage() {
  const existingApplications = await getActiveApplicationSummaries();

  return (
    <div>
      <PageHeader
        title="Import applications"
        description="Bring in historical applications from a spreadsheet."
      />
      <CsvImportWizard
        existingApplications={existingApplications.map((a) => ({ title: a.title, employerName: a.employerName }))}
      />
    </div>
  );
}
