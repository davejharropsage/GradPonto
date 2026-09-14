const steps = [
  {
    number: "1",
    title: "Log an opportunity",
    description: "Paste a job link or description into Analyse a Job — we'll extract the role, company, and deadline.",
  },
  {
    number: "2",
    title: "Let it check your CV",
    description: "Pick an application and get a match score with the specific lines to rewrite, plus a tailored cover letter.",
  },
  {
    number: "3",
    title: "Track it to offer",
    description: "Drag it through the pipeline as it moves from Applied to Interview to Offer — deadlines included.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-wide text-accent-foreground">How it works</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Three steps. One afternoon.</h2>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.number} className="rounded-2xl border border-border bg-muted p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-extrabold text-primary-foreground">
              {step.number}
            </div>
            <h3 className="font-bold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
