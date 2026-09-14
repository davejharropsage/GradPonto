import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
              <Label htmlFor="name">Display name</Label>
              <Input id="name" name="name" defaultValue={profile.name ?? ""} placeholder="e.g. Lucas" />
              <p className="text-xs text-muted-foreground">Used for the dashboard greeting.</p>
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
              ? "You're on PlacementPilot Pro — unlimited applications and advanced analytics."
              : "You're on the Free plan. Upgrade to Pro for unlimited applications and advanced analytics."}
          </p>
          <p className="text-xs text-muted-foreground">
            This app runs entirely on your own machine — there is no real payment processor connected. Choosing
            Pro here just flips a local flag; see the landing page for the pricing this mirrors.
          </p>
          <form action={async () => { "use server"; await setPlan(profile.plan === "PRO" ? "FREE" : "PRO"); }}>
            <Button type="submit" variant={profile.plan === "PRO" ? "outline" : "default"}>
              {profile.plan === "PRO" ? "Switch to Free" : "Upgrade to Pro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
