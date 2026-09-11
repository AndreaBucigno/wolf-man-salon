import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { AppointmentDialog } from "@/components/admin/AppointmentDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  type Appointment,
  type AppointmentStatus,
  euro,
  hhmm,
  longDate,
  parseISODate,
  type Service,
  STATUS_CLASS,
  STATUS_LABEL,
  toISODate,
} from "@/lib/salon";

export const Route = createFileRoute("/admin/prenotazioni")({
  component: Bookings,
});

const FILTERS: (AppointmentStatus | "all")[] = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

function Bookings() {
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(toISODate(new Date()));
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);

  const services = useQuery({
    queryKey: ["services", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").order("sort_order");
      return (data ?? []) as Service[];
    },
  });

  const list = useQuery({
    queryKey: ["appointments", "list", from],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .gte("appointment_date", from)
        .order("appointment_date")
        .order("start_time");
      return (data ?? []) as Appointment[];
    },
  });

  const rows = (list.data ?? []).filter((a) => {
    if (status !== "all" && a.status !== status) return false;
    const t = `${a.customer_name} ${a.customer_surname} ${a.customer_phone}`.toLowerCase();
    return t.includes(q.toLowerCase().trim());
  });

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Prenotazioni</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl">Elenco appuntamenti</h1>
        </div>
        <button className="btn-gold" onClick={() => setCreating(true)}>
          <Plus size={15} /> Nuovo
        </button>
      </header>

      <div className="panel mt-6 grid gap-3 p-4 sm:grid-cols-3">
        <label className="relative">
          <Search size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
          <input
            className="field pl-9"
            placeholder="Cerca nome o telefono"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <input className="field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <select
          className="field"
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus | "all")}
        >
          {FILTERS.map((f) => (
            <option key={f} value={f}>
              {f === "all" ? "Tutti gli stati" : STATUS_LABEL[f]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-2">
        {rows.length === 0 && (
          <p className="panel p-6 text-sm text-muted-foreground">Nessuna prenotazione trovata.</p>
        )}
        {rows.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a)}
            className="panel flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:border-gold/50"
          >
            <div>
              <p className="font-display text-lg">
                {a.customer_name} {a.customer_surname}
              </p>
              <p className="text-xs text-muted-foreground">
                {longDate(parseISODate(a.appointment_date))} · {hhmm(a.start_time)}–
                {hhmm(a.end_time)} · {services.data?.find((s) => s.id === a.service_id)?.name ?? "—"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gold">{euro(a.price)}</span>
              <span className={`rounded-sm border px-2 py-1 text-[10px] uppercase ${STATUS_CLASS[a.status]}`}>
                {STATUS_LABEL[a.status]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {(selected || creating) && (
        <AppointmentDialog
          appointment={selected}
          {...(creating ? { defaults: { date: from, start: "09:00" } } : {})}
          services={services.data ?? []}
          onClose={() => {
            setSelected(null);
            setCreating(false);
          }}
          onSaved={() => void list.refetch()}
        />
      )}
    </div>
  );
}
