import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CalendarCheck, Check, ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/wolf-logo.png.asset.json";
import {
  addDays,
  euro,
  hhmm,
  longDate,
  MONTHS,
  parseISODate,
  type Service,
  startOfWeek,
  toISODate,
  WEEKDAYS,
} from "@/lib/salon";

type Search = { servizio?: string };

export const Route = createFileRoute("/prenota")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    servizio: typeof search["servizio"] === "string" ? search["servizio"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Prenota — The Wolf Man Salon" },
      {
        name: "description",
        content:
          "Prenota online il tuo appuntamento da The Wolf Man Salon a Perugia: scegli servizio, giorno e orario disponibile.",
      },
      { property: "og:title", content: "Prenota — The Wolf Man Salon" },
      {
        property: "og:description",
        content: "Scegli servizio, giorno e orario. Conferma in meno di un minuto.",
      },
    ],
  }),
  component: Prenota,
});

type Confirmed = {
  service: Service;
  date: string;
  start: string;
  end: string;
};

function Prenota() {
  const { servizio } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(servizio ? 2 : 1);
  const [serviceId, setServiceId] = useState<string | undefined>(servizio);
  const [date, setDate] = useState<string | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [form, setForm] = useState({ name: "", surname: "", phone: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

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

  const service = services.find((s) => s.id === serviceId);

  const { data: slots = [], isFetching: loadingSlots } = useQuery({
    queryKey: ["slots", serviceId, date],
    enabled: Boolean(serviceId && date),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("available_slots", {
        p_service_id: serviceId!,
        p_date: date!,
      });
      if (error) throw error;
      return (data as { slot: string }[] | string[]).map((r) =>
        typeof r === "string" ? r : r.slot,
      );
    },
  });

  async function submit() {
    if (!service || !date || !time) return;
    if (form.name.trim().length < 2 || form.phone.trim().length < 5) {
      toast.error("Inserisci nome e telefono validi.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc("book_appointment", {
      p_service_id: service.id,
      p_date: date,
      p_start: time,
      p_name: form.name,
      p_surname: form.surname,
      p_phone: form.phone,
      p_email: form.email,
      p_notes: form.notes,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("disponibile") ? error.message : "Prenotazione fallita.");
      return;
    }
    const row = data as { start_time: string; end_time: string };
    setConfirmed({
      service,
      date,
      start: hhmm(row.start_time),
      end: hhmm(row.end_time),
    });
  }

  if (confirmed) {
    return <Confirmation data={confirmed} />;
  }

  const steps = ["Servizio", "Giorno", "Orario", "Dati", "Conferma"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-x pt-32 pb-24">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
        >
          <ArrowLeft size={14} /> Torna al sito
        </button>

        <p className="eyebrow">Prenotazione</p>
        <h1 className="mt-3 font-display text-4xl">Prenota il tuo appuntamento</h1>

        <ol className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[0.65rem] uppercase tracking-[0.2em]">
          {steps.map((s, i) => (
            <li
              key={s}
              className={i + 1 === step ? "text-gold" : i + 1 < step ? "text-foreground/60" : "text-muted-foreground/50"}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        <div className="mt-8 panel p-6 sm:p-9">
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServiceId(s.id);
                    setTime(undefined);
                    setStep(2);
                  }}
                  className={`rounded-sm border p-5 text-left transition-colors ${
                    serviceId === s.id ? "border-gold bg-gold/10" : "border-border hover:border-gold"
                  }`}
                >
                  <p className="font-display text-lg uppercase">{s.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                  <p className="mt-4 flex items-center gap-4 text-xs text-gold">
                    <span className="inline-flex items-center gap-1">
                      <Timer size={12} /> {s.duration_minutes} min
                    </span>
                    <span>{euro(s.price)}</span>
                  </p>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <MonthCalendar
              cursor={monthCursor}
              onCursor={setMonthCursor}
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setTime(undefined);
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <div>
              <p className="font-display text-xl">{date && longDate(parseISODate(date))}</p>
              {loadingSlots && <p className="mt-6 text-sm text-muted-foreground">Caricamento…</p>}
              {!loadingSlots && slots.length === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">
                  Nessun orario disponibile in questa giornata. Scegli un altro giorno.
                </p>
              )}
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setTime(hhmm(s));
                      setStep(4);
                    }}
                    className={`rounded-sm border py-3 text-sm transition-colors ${
                      time === hhmm(s)
                        ? "border-gold bg-gold/15 text-gold-light"
                        : "border-border hover:border-gold"
                    }`}
                  >
                    {hhmm(s)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="field"
                placeholder="Nome *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="field"
                placeholder="Cognome"
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
              />
              <input
                className="field"
                placeholder="Telefono *"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                className="field"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <textarea
                className="field sm:col-span-2"
                rows={3}
                placeholder="Note (opzionale)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <div className="sm:col-span-2">
                <button className="btn-gold w-full sm:w-auto" onClick={() => setStep(5)}>
                  Vai al riepilogo
                </button>
              </div>
            </div>
          )}

          {step === 5 && service && date && time && (
            <div className="max-w-md">
              <p className="eyebrow">Riepilogo</p>
              <dl className="mt-6 space-y-3 text-sm">
                <Row label="Servizio" value={service.name} />
                <Row label="Data" value={longDate(parseISODate(date))} />
                <Row label="Orario" value={time} />
                <Row label="Durata" value={`${service.duration_minutes} min`} />
                <Row label="Prezzo" value={euro(service.price)} />
                <Row label="Cliente" value={`${form.name} ${form.surname}`.trim()} />
                <Row label="Telefono" value={form.phone} />
              </dl>
              <button className="btn-gold mt-8 w-full" disabled={saving} onClick={submit}>
                {saving ? "Attendi…" : "Conferma prenotazione"}
              </button>
            </div>
          )}

          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
            >
              <ChevronLeft size={14} /> Indietro
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

function MonthCalendar({
  cursor,
  onCursor,
  selected,
  onSelect,
}: {
  cursor: Date;
  onCursor: (d: Date) => void;
  selected?: string;
  onSelect: (iso: string) => void;
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          className="rounded-sm border border-border p-2 text-gold hover:bg-accent"
          onClick={() => onCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          aria-label="Mese precedente"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-display text-lg uppercase tracking-[0.2em]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <button
          className="rounded-sm border border-border p-2 text-gold hover:bg-accent"
          onClick={() => onCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          aria-label="Mese successivo"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
        {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
          <div key={wd}>{WEEKDAYS[wd]?.slice(0, 3)}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = toISODate(d);
          const past = d < today;
          const other = d.getMonth() !== cursor.getMonth();
          return (
            <button
              key={iso}
              disabled={past}
              onClick={() => onSelect(iso)}
              className={`aspect-square rounded-sm border text-sm transition-colors ${
                selected === iso
                  ? "border-gold bg-gold/15 text-gold-light"
                  : past
                    ? "border-transparent text-muted-foreground/30"
                    : other
                      ? "border-transparent text-muted-foreground/60 hover:border-gold"
                      : "border-border hover:border-gold"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Confirmation({ data }: { data: Confirmed }) {
  const d = parseISODate(data.date);
  const ics = buildIcs(data);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-x flex min-h-[80svh] flex-col items-center justify-center py-32 text-center">
        <img
          src={logo.url}
          alt="The Wolf Man Salon"
          width={110}
          height={110}
          className="h-24 w-24 object-contain invert"
        />
        <Check size={28} className="mt-8 text-gold" />
        <h1 className="mt-4 font-display text-3xl uppercase tracking-[0.15em] sm:text-4xl">
          Appuntamento prenotato
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Il tuo appuntamento è stato registrato correttamente.
        </p>

        <div className="panel mt-10 w-full max-w-md p-7 text-left">
          <dl className="space-y-3 text-sm">
            <Row label="Servizio" value={data.service.name} />
            <Row label="Data" value={longDate(d)} />
            <Row label="Orario" value={`${data.start} - ${data.end}`} />
            <Row label="Prezzo" value={euro(data.service.price)} />
          </dl>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="btn-ghost-gold">
            Torna alla home
          </Link>
          <a href={ics} download="appuntamento.ics" className="btn-gold">
            <CalendarCheck size={14} /> Aggiungi al calendario
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function buildIcs(data: Confirmed): string {
  const fmt = (t: string) => `${data.date.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${data.service.name} — The Wolf Man Salon`,
    `DTSTART:${fmt(data.start)}`,
    `DTEND:${fmt(data.end)}`,
    "LOCATION:The Wolf Man Salon, Perugia",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}
