import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { euro, hhmm, longDate, MONTHS, parseISODate, toISODate, WEEKDAYS } from "@/lib/salon";

type Search = { c?: string };

export const Route = createFileRoute("/appuntamento")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): Search =>
    typeof search["c"] === "string" ? { c: search["c"] } : {},
  head: () => ({
    meta: [
      { title: "Il tuo appuntamento — The Wolf Man Salon" },
      {
        name: "description",
        content:
          "Consulta, disdici o sposta il tuo appuntamento da The Wolf Man Salon con il link personale ricevuto alla prenotazione.",
      },
      { property: "og:title", content: "Il tuo appuntamento — The Wolf Man Salon" },
      {
        property: "og:description",
        content: "Disdici o sposta il tuo appuntamento in pochi secondi.",
      },
    ],
  }),
  component: ManageAppointment,
});

type Appt = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_name: string;
  customer_surname: string | null;
  price: number | null;
  service_id: string | null;
  service_name: string | null;
  duration_minutes: number | null;
};

function ManageAppointment() {
  const { c } = Route.useSearch();
  const [mode, setMode] = useState<"view" | "move">("view");
  const [date, setDate] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const appt = useQuery({
    queryKey: ["appt-token", c],
    enabled: Boolean(c),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_appointment_by_token", { p_token: c! });
      if (error) throw error;
      const rows = (data ?? []) as Appt[];
      return rows[0] ?? null;
    },
  });

  const slots = useQuery({
    queryKey: ["appt-slots", appt.data?.service_id, date],
    enabled: Boolean(appt.data?.service_id && date),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("available_slots", {
        p_service_id: appt.data!.service_id!,
        p_date: date!,
      });
      if (error) throw error;
      return ((data ?? []) as ({ slot: string } | string)[]).map((r) =>
        typeof r === "string" ? r : r.slot,
      );
    },
  });

  async function cancel() {
    if (!c) return;
    if (!window.confirm("Vuoi davvero disdire l'appuntamento?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("cancel_appointment_by_token", { p_token: c });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Appuntamento disdetto.");
    void appt.refetch();
  }

  async function move(start: string) {
    if (!c || !date) return;
    setBusy(true);
    const { error } = await supabase.rpc("reschedule_appointment_by_token", {
      p_token: c,
      p_date: date,
      p_start: start,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Appuntamento spostato.");
    setMode("view");
    setDate(undefined);
    void appt.refetch();
  }

  const a = appt.data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-x pt-32 pb-24">
        <p className="eyebrow">Il tuo appuntamento</p>
        <h1 className="mt-3 font-display text-4xl">Gestisci la prenotazione</h1>

        {!c && (
          <p className="mt-8 text-sm text-muted-foreground">
            Link non valido. Usa il link che hai ricevuto al momento della prenotazione.
          </p>
        )}
        {c && appt.isLoading && <p className="mt-8 text-sm text-muted-foreground">Caricamento…</p>}
        {c && !appt.isLoading && !a && (
          <p className="mt-8 text-sm text-muted-foreground">
            Prenotazione non trovata. Potrebbe essere stata rimossa.
          </p>
        )}

        {a && (
          <div className="mt-8 max-w-xl">
            <div className="panel p-6 sm:p-8">
              <dl className="space-y-3 text-sm">
                <Row label="Servizio" value={a.service_name ?? "—"} />
                <Row label="Data" value={longDate(parseISODate(a.appointment_date))} />
                <Row label="Orario" value={`${hhmm(a.start_time)} - ${hhmm(a.end_time)}`} />
                <Row label="Cliente" value={`${a.customer_name} ${a.customer_surname ?? ""}`.trim()} />
                <Row label="Prezzo" value={a.price != null ? euro(a.price) : "—"} />
                <Row label="Stato" value={statusLabel(a.status)} />
              </dl>
            </div>

            {a.status === "cancelled" ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Questo appuntamento è stato disdetto.{" "}
                <Link to="/prenota" className="text-gold underline">
                  Prenota di nuovo
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="btn-gold"
                    disabled={busy}
                    onClick={() => setMode(mode === "move" ? "view" : "move")}
                  >
                    <CalendarCheck size={14} /> {mode === "move" ? "Annulla spostamento" : "Sposta appuntamento"}
                  </button>
                  <button className="btn-ghost-gold" disabled={busy} onClick={cancel}>
                    <XCircle size={14} /> Disdici
                  </button>
                </div>

                {mode === "move" && (
                  <div className="panel mt-6 p-6">
                    <MonthCalendar cursor={cursor} onCursor={setCursor} selected={date} onSelect={setDate} />
                    {date && (
                      <div className="mt-6 border-t border-border pt-6">
                        <p className="text-sm text-muted-foreground">
                          Orari disponibili per {longDate(parseISODate(date))}
                        </p>
                        {slots.isFetching && (
                          <p className="mt-4 text-sm text-muted-foreground">Caricamento…</p>
                        )}
                        {!slots.isFetching && (slots.data ?? []).length === 0 && (
                          <p className="mt-4 text-sm text-muted-foreground">
                            Nessun orario disponibile in questa giornata.
                          </p>
                        )}
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {(slots.data ?? []).map((s) => (
                            <button
                              key={s}
                              disabled={busy}
                              onClick={() => void move(hhmm(s))}
                              className="rounded-sm border border-border py-3 text-sm transition-colors hover:border-gold"
                            >
                              {hhmm(s)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function statusLabel(s: string): string {
  switch (s) {
    case "pending":
      return "In attesa di conferma";
    case "confirmed":
      return "Confermato";
    case "cancelled":
      return "Disdetto";
    case "completed":
      return "Completato";
    default:
      return "Non presentato";
  }
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
  selected: string | undefined;
  onSelect: (d: string) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let i = 1; i <= days; i += 1) {
      out.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    }
    return out;
  }, [cursor]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          className="btn-ghost-gold"
          onClick={() => onCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <ChevronLeft size={15} />
        </button>
        <p className="font-display text-lg uppercase tracking-[0.15em]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <button
          className="btn-ghost-gold"
          onClick={() => onCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w.slice(0, 3)}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const iso = toISODate(d);
          const past = d < today;
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
