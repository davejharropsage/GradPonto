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
    <div className="rounded-lg bg-slate-900 p-6 text-white dark:bg-slate-800">
      <h1 className="text-2xl font-semibold">
        {greeting}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="mt-1 text-slate-300">
        {applicationsThisWeek > 0
          ? `You've made ${applicationsThisWeek} application${applicationsThisWeek === 1 ? "" : "s"} this week. Keep it up!`
          : "No applications yet this week — browse Analyse a Job to find your next one."}
      </p>
    </div>
  );
}
