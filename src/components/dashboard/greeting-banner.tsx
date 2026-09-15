export function GreetingBanner({
  greeting,
  name,
  applicationsThisWeek,
}: {
  greeting: string;
  name?: string | null;
  applicationsThisWeek: number;
}) {
  return (
    <div className="rounded-2xl bg-[#0a1f14] p-6 text-white">
      <h1 className="text-2xl font-extrabold tracking-tight">
        {greeting}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1 text-white/70">
        {applicationsThisWeek > 0
          ? `You've made ${applicationsThisWeek} application${applicationsThisWeek === 1 ? "" : "s"} this week. Keep it up!`
          : "No applications yet this week. Browse Analyse a Job to find your next one."}
      </p>
    </div>
  );
}
