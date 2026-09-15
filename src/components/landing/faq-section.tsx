import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Does my data leave my computer?",
    answer:
      "No. PlacementPilot runs on your own machine with a local SQLite database. Nothing is uploaded anywhere, except when you explicitly use an AI feature (job analysis, CV matching, or document tailoring), which sends only the relevant text to Anthropic's API.",
  },
  {
    question: "Do I need to pay to use it?",
    answer:
      "The Free plan covers up to 10 active applications with the full kanban pipeline, deadline tracking, and document storage. Pro removes that limit and adds AI job analysis and CV matching.",
  },
  {
    question: "Do I need an AI API key?",
    answer:
      "Only if you want the AI features (job analysis, CV matching, tailored documents). Everything else, including the full pipeline and deadline tracking, works without one.",
  },
  {
    question: "Can I import applications I've already made elsewhere?",
    answer:
      "Not automatically yet. You can add them manually, or paste a job posting into Analyse a Job to speed up entering the details.",
  },
  {
    question: "What happens to my account if I stop using it?",
    answer:
      "Nothing happens automatically. Your data stays in the local database on your device until you delete it yourself.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-wide text-accent-foreground">FAQ</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Common questions</h2>

      <Accordion className="mt-8">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
