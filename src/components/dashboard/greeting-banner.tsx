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
    <div className="relative overflow-hidden rounded-3xl bg-[#202128] p-6 text-white md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#5e84e2]/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-[#43a8b2]/30 blur-3xl" />
      <div className="relative">
        <h1 className="text-3xl md:text-4xl">
          {greeting}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 text-white/70">
          {applicationsThisWeek > 0
            ? `You've made ${applicationsThisWeek} application${applicationsThisWeek === 1 ? "" : "s"} this week. Keep it up!`
            : "No applications yet this week. Browse Analyse a Job to find your next one."}
        </p>
      </div>
    </div>
  );
}
