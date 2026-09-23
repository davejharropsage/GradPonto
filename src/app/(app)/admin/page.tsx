import { PageHeader } from "@/components/shared/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";

// Placeholder for this step — the real dashboard (user list, counts, suspend/reinstate) lands in
// backlog Area 02 step 3. This step is just the role, the guard, and the route existing at all.
export default async function AdminPage() {
  return (
    <div>
      <PageHeader title="Admin" description="You're signed in as an admin." />
      <AdminTabs />
    </div>
  );
}
