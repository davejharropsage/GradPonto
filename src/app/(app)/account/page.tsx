import { Download } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/shared/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RestoreBackupForm } from "@/components/settings/restore-backup-form";
import { getProfile } from "@/lib/data/profile";
import { updateProfile, setPlan } from "@/lib/actions/profile";

export default async function AccountPage() {
  const profile = await getProfile();

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Account" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} readOnly disabled />
              <p className="text-xs text-muted-foreground">You sign in with a one-time code sent to this address.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={profile.name ?? ""} required maxLength={80} autoComplete="name" />
              <p className="text-xs text-muted-foreground">Used for the dashboard greeting.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="university">University</Label>
              <Input id="university" name="university" defaultValue={profile.university ?? ""} required maxLength={120} autoComplete="organization" />
            </div>
            <div>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Plan</CardTitle>
          <Badge variant={profile.plan === "PRO" ? "default" : "outline"}>{profile.plan}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {profile.plan === "PRO"
              ? "You're on GradPonto Pro: unlimited applications and advanced analytics."
              : "You're on the Free plan. Upgrade to Pro for unlimited applications and advanced analytics."}
          </p>
          <p className="text-xs text-muted-foreground">
            No payment processor is connected yet, so choosing Pro here just switches a setting on your account.
          </p>
          <form action={async () => { "use server"; await setPlan(profile.plan === "PRO" ? "FREE" : "PRO"); }}>
            <Button type="submit" variant={profile.plan === "PRO" ? "outline" : "default"}>
              {profile.plan === "PRO" ? "Switch to Free" : "Upgrade to Pro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your applications, employers, documents, notes, activity history and goals are stored in your GradPonto
            account. A backup is a complete, portable copy of them that you can keep or restore later.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/api/backup/export" variant="outline">
              <Download className="h-4 w-4" />
              Download full backup
            </LinkButton>
            <RestoreBackupForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
