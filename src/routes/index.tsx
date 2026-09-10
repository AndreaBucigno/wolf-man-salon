import { createFileRoute } from "@tanstack/react-router";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { About, Contact, Gallery, Hero, Services, Why } from "@/components/site/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Wolf Man Salon — Barberia premium a Perugia" },
      {
        name: "description",
        content:
          "Barberia premium a Perugia: tagli, barba, rasatura e styling. Prenota online il tuo appuntamento in pochi secondi.",
      },
      { property: "og:title", content: "The Wolf Man Salon — Barberia premium a Perugia" },
      {
        property: "og:description",
        content: "Il tuo stile. La nostra precisione. Prenota online da The Wolf Man Salon.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Gallery />
        <Why />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
