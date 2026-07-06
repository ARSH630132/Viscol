import { AppLayout } from "@/components/college/layout";
import { Card } from "@/components/ui/card";

export default function AboutUsPage() {
  return (
    <AppLayout>
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">About Us</h1>
        <Card className="premium-card p-6">
          <p className="text-muted-foreground">
            College Visitor helps students and families discover the best-fit colleges with transparent fees,
            placement data, scholarships, and guided admission support.
          </p>
        </Card>
      </section>
    </AppLayout>
  );
}
