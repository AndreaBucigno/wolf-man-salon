import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Instagram, MapPin, Phone, Scissors, Sparkles, Star, Timer } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { euro, type Service, WEEKDAYS, hhmm, type BusinessHour } from "@/lib/salon";
import logo from "@/assets/wolf-logo.png.asset.json";
import heroImg from "@/assets/hero.jpg";
import aboutImg from "@/assets/about.jpg";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      <img
        src={heroImg}
        alt="Barbiere al lavoro da The Wolf Man Salon"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background" />
      <div className="container-x relative pt-28 pb-16">
        <div className="fade-up max-w-3xl">
          <img
            src={logo.url}
            alt="Logo lupo The Wolf Man Salon"
            width={110}
            height={110}
            className="mb-8 h-24 w-24 object-contain invert"
          />
          <p className="eyebrow">Barberia · Perugia</p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-6xl lg:text-7xl">
            THE WOLF MAN
            <span className="block text-gold">SALON</span>
          </h1>
          <p className="mt-6 font-display text-xl text-gold-light sm:text-2xl">
            Il tuo stile. La nostra precisione.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tagli, barba e stile. Un'esperienza da vero gentleman.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/prenota" className="btn-gold">
              Prenota il tuo appuntamento
            </Link>
            <Link to="/" hash="servizi" className="btn-ghost-gold">
              Scopri i servizi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="chi-siamo" className="scroll-mt-24 border-t border-border py-24">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <div className="relative">
          <img
            src={aboutImg}
            alt="Interni della barberia"
            width={1200}
            height={1408}
            loading="lazy"
            className="w-full rounded-sm border border-border object-cover"
          />
          <div className="absolute -bottom-6 -right-4 hidden rounded-sm border border-border bg-background p-4 sm:block">
            <img
              src={logo.url}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              className="h-14 w-14 object-contain invert"
            />
          </div>
        </div>
        <div>
          <p className="eyebrow">Chi siamo</p>
          <div className="gold-rule my-5" />
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">
            Una barberia nata dalla passione per lo stile
          </h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            Una barberia nata dalla passione per lo stile, la precisione e la cura dell'uomo. Ogni
            taglio viene studiato per valorizzare il volto e lo stile personale del cliente. Da The
            Wolf Man Salon ogni appuntamento è un'esperienza, non semplicemente un taglio.
          </p>
          <Link to="/prenota" className="btn-ghost-gold mt-8">
            Prenota ora
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Services() {
  const { data: services = [] } = useQuery({
    queryKey: ["public-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Service[];
    },
  });

  return (
    <section id="servizi" className="scroll-mt-24 border-t border-border bg-carbon py-24">
      <div className="container-x">
        <p className="eyebrow">I nostri servizi</p>
        <div className="gold-rule my-5" />
        <h2 className="max-w-xl font-display text-3xl sm:text-4xl">
          Ogni dettaglio è studiato per te
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article
              key={s.id}
              className="group flex flex-col justify-between rounded-sm border border-border bg-background p-7 transition-all duration-300 hover:border-gold"
            >
              <div>
                <Scissors size={20} className="text-gold" />
                <h3 className="mt-5 font-display text-xl uppercase tracking-wide">{s.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
              <div className="mt-7 flex items-end justify-between border-t border-border pt-5">
                <div>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Timer size={13} /> {s.duration_minutes} min
                  </p>
                  <p className="mt-1 font-display text-2xl text-gold">{euro(s.price)}</p>
                </div>
                <Link
                  to="/prenota"
                  search={{ servizio: s.id }}
                  className="btn-ghost-gold px-4 py-2 text-[0.65rem]"
                >
                  Prenota
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const gallery = [
  { src: g1, alt: "Taglio sfumato", cat: "Tagli", tall: true },
  { src: g2, alt: "Rasatura della barba", cat: "Barba", tall: false },
  { src: g3, alt: "Strumenti del barbiere", cat: "Stile", tall: false },
  { src: g4, alt: "Il salone", cat: "Salone", tall: true },
];

export function Gallery() {
  return (
    <section id="galleria" className="scroll-mt-24 border-t border-border py-24">
      <div className="container-x">
        <p className="eyebrow">Galleria</p>
        <div className="gold-rule my-5" />
        <h2 className="font-display text-3xl sm:text-4xl">Il nostro lavoro</h2>

        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {gallery.map((img) => (
            <figure
              key={img.alt}
              className={`group relative overflow-hidden rounded-sm border border-border ${
                img.tall ? "row-span-2 aspect-[3/4]" : "aspect-square"
              }`}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-background via-background/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-xs uppercase tracking-[0.25em] text-gold">{img.cat}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const values = [
  { icon: Scissors, title: "Precisione", text: "Ogni dettaglio conta." },
  { icon: Star, title: "Stile", text: "Il taglio deve rappresentarti." },
  { icon: Sparkles, title: "Qualità", text: "Prodotti e tecniche professionali." },
  { icon: Clock, title: "Esperienza", text: "Un momento dedicato completamente a te." },
];

export function Why() {
  return (
    <section className="border-t border-border bg-carbon py-24">
      <div className="container-x">
        <p className="eyebrow">Perché The Wolf Man</p>
        <div className="gold-rule my-5" />
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title}>
              <v.icon size={26} className="text-gold" />
              <h3 className="mt-5 font-display text-xl uppercase tracking-wide">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const { data } = useQuery({
    queryKey: ["public-contact"],
    queryFn: async () => {
      const [settings, hours] = await Promise.all([
        supabase.from("settings").select("key,value"),
        supabase.from("business_hours").select("*").order("weekday"),
      ]);
      const map: Record<string, string> = {};
      (settings.data ?? []).forEach((r) => (map[r.key] = r.value));
      return { map, hours: (hours.data ?? []) as BusinessHour[] };
    },
  });

  const phone = data?.map["phone"] ?? "";
  const address = data?.map["address"] ?? "Perugia, Italia";
  const instagram = data?.map["instagram"] ?? "https://www.instagram.com/thewolfmansalon/";
  const mapsQuery = data?.map["maps_query"] ?? address;
  const ordered = [1, 2, 3, 4, 5, 6, 0];

  return (
    <section id="contatti" className="scroll-mt-24 border-t border-border py-24">
      <div className="container-x grid gap-14 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Contatti</p>
          <div className="gold-rule my-5" />
          <h2 className="font-display text-3xl sm:text-4xl">The Wolf Man Salon — Perugia</h2>

          <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <MapPin size={16} className="text-gold" /> {address}
            </li>
            {phone && (
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-gold" /> {phone}
              </li>
            )}
            <li className="flex items-center gap-3">
              <Instagram size={16} className="text-gold" /> @thewolfmansalon
            </li>
          </ul>

          <div className="mt-8 rounded-sm border border-border p-6">
            <p className="eyebrow">Orari</p>
            <ul className="mt-4 space-y-2 text-sm">
              {ordered.map((wd) => {
                const h = data?.hours.find((x) => x.weekday === wd);
                return (
                  <li key={wd} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{WEEKDAYS[wd]}</span>
                    <span className="text-foreground/90">
                      {!h || h.is_closed
                        ? "Chiuso"
                        : h.break_start && h.break_end
                          ? `${hhmm(h.open_time)}–${hhmm(h.break_start)} · ${hhmm(h.break_end)}–${hhmm(h.close_time)}`
                          : `${hhmm(h.open_time)}–${hhmm(h.close_time)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={instagram} target="_blank" rel="noreferrer" className="btn-ghost-gold">
              <Instagram size={14} /> Instagram
            </a>
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn-ghost-gold">
                <Phone size={14} /> Chiama
              </a>
            )}
            <Link to="/prenota" className="btn-gold">
              Prenota ora
            </Link>
          </div>
        </div>

        <div className="min-h-[320px] overflow-hidden rounded-sm border border-border">
          <iframe
            title="Mappa The Wolf Man Salon"
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`}
            className="h-full min-h-[320px] w-full grayscale"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
