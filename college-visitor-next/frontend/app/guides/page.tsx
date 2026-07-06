import { AppLayout } from "@/components/college/layout";
import { Card } from "@/components/ui/card";

export default function GuidesPage() {
  return (
    <AppLayout>
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Guides</h1>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            "How to choose a college by budget",
            "Placement-focused college shortlisting",
            "Scholarship strategy for middle-class families",
          ].map((title) => (
            <Card key={title} className="premium-card p-5">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Actionable framework and checklist for students and parents.
              </p>
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
