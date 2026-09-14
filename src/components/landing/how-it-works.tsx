const steps = [
  {
    number: "1",
    title: "Log an opportunity",
    description: "Paste a job link or description into Analyse a Job — we'll extract the role, company, and deadline.",
  },
  {
    number: "2",
    title: "Tailor your documents",
    description: "Duplicate your base CV and cover letter for this application, or let AI draft a tailored version.",
  },
  {
    number: "3",
    title: "Track it to the finish",
    description: "Drag it through the pipeline as it moves from Applied to Interview to Offer — deadlines and follow-ups included.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y bg-muted/30">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background font-semibold">
                {step.number}
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
