import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { AppointmentDialog } from "@/components/admin/AppointmentDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  addDays,
  type Appointment,
  type BlockedSlot,
  type BusinessHour,
  euro,
  fromMinutes,
  hhmm,
  longDate,
  minutes,
  type Service,
  shortDate,
  startOfWeek,
  STATUS_CLASS,
  STATUS_LABEL,
  toISODate,
  WEEKDAYS,
} from "@/lib/salon";

export const Route = createFileRoute("/admin/")({
  component: AdminCalendar,
});

const SLOT = 15;

function AdminCalendar() {
  const [mode, setMode] = useState<"week" | "day">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState<{ date: string; start: string } | null>(null);

  const days = useMemo(() => {
    if (mode === "day") return [new Date(anchor)];
    const s = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [anchor, mode]);

  const from = toISODate(days[0]!);
  const to = toISODate(days[days.length - 1]!);

  const services = useQuery({
    queryKey: ["services", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").order("sort_order");
      return (data ?? []) as Service[];
    },
  });

  const hours = useQuery({
    queryKey: ["business_hours"],
    queryFn: async () => {
      const { data } = await supabase.from("business_hours").select("*").order("weekday");
      return (data ?? []) as BusinessHour[];
    },
  });

  const appointments = useQuery({
    queryKey: ["appointments", from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .gte("appointment_date", from)
        .lte("appointment_date", to)
        .order("start_time");
      return (data ?? []) as Appointment[];
    },
  });

  const blocks = useQuery({
    queryKey: ["blocked_slots", from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("blocked_slots")
        .select("*")
        .gte("block_date", from)
        .lte("block_date", to);
      return (data ?? []) as BlockedSlot[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        void appointments.refetch();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [appointments]);

  const open = Math.min(
    ...(hours.data?.filter((h) => !h.is_closed).map((h) => minutes(h.open_time)) ?? [540]),
  );
  const close = Math.max(
    ...(hours.data?.filter((h) => !h.is_closed).map((h) => minutes(h.close_time)) ?? [1140]),
  );
  const rows = Math.max(1, Math.round((close - open) / SLOT));

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Calendario</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl">
            {mode === "day" ? longDate(days[0]!) : `${shortDate(days[0]!)} — ${shortDate(days[6]!)}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-ghost-gold"
            onClick={() => setAnchor(addDays(anchor, mode === "day" ? -1 : -7))}
          >
            <ChevronLeft size={15} />
          </button>
          <button className="btn-ghost-gold" onClick={() => setAnchor(new Date())}>
            Oggi
          </button>
          <button
            className="btn-ghost-gold"
            onClick={() => setAnchor(addDays(anchor, mode === "day" ? 1 : 7))}
          >
            <ChevronRight size={15} />
          </button>
          <button
            className="btn-ghost-gold"
            onClick={() => setMode(mode === "week" ? "day" : "week")}
          >
            {mode === "week" ? "Giorno" : "Settimana"}
          </button>
          <button
            className="btn-gold"
            onClick={() => setCreating({ date: toISODate(days[0]!), start: fromMinutes(open) })}
          >
            <Plus size={15} /> Nuovo
          </button>
        </div>
      </header>

      <div className="panel mt-6 overflow-x-auto p-0">
        <div
          className="min-w-[720px]"
          style={{ display: "grid", gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}
        >
          <div className="border-b border-border bg-carbon" />
          {days.map((d) => (
            <div
              key={d.toISOString()}
              className="border-b border-l border-border bg-carbon px-2 py-3 text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {WEEKDAYS[d.getDay()]?.slice(0, 3)}
              </p>
              <p className="font-display text-lg">{d.getDate()}</p>
            </div>
          ))}

          {Array.from({ length: rows }, (_, r) => {
            const t = open + r * SLOT;
            const label = fromMinutes(t);
            return (
              <div key={t} className="contents">
                <div className="border-b border-border/60 px-2 py-1 text-right text-[10px] text-muted-foreground">
                  {t % 60 === 0 ? label : ""}
                </div>
                {days.map((d) => {
                  const iso = toISODate(d);
                  const bh = hours.data?.find((h) => h.weekday === d.getDay());
                  const closed =
                    !bh ||
                    bh.is_closed ||
                    t < minutes(bh.open_time) ||
                    t >= minutes(bh.close_time) ||
                    (bh.break_start &&
                      bh.break_end &&
                      t >= minutes(bh.break_start) &&
                      t < minutes(bh.break_end)) ||
                    (blocks.data ?? []).some(
                      (b) =>
                        b.block_date === iso &&
                        (b.all_day || (t >= minutes(b.start_time) && t < minutes(b.end_time))),
                    );
                  const appt = (appointments.data ?? []).find(
                    (a) => a.appointment_date === iso && minutes(a.start_time) === t,
                  );
                  return (
                    <button
                      key={iso + t}
                      onClick={() => (appt ? setSelected(appt) : setCreating({ date: iso, start: label }))}
                      className={`min-h-[26px] border-b border-l border-border/60 px-1 text-left text-[11px] ${
                        closed ? "bg-carbon/60" : "hover:bg-gold/10"
                      }`}
                    >
                      {appt && (
                        <span
                          className={`block truncate rounded-sm border px-1 py-0.5 ${STATUS_CLASS[appt.status]}`}
                        >
                          {hhmm(appt.start_time)} {appt.customer_name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Appuntamenti nel periodo"
          value={`${(appointments.data ?? []).filter((a) => a.status !== "cancelled").length}`}
        />
        <Stat
          label="In attesa"
          value={`${(appointments.data ?? []).filter((a) => a.status === "pending").length}`}
        />
        <Stat
          label="Incasso previsto"
          value={euro(
            (appointments.data ?? [])
              .filter((a) => a.status !== "cancelled")
              .reduce((s, a) => s + Number(a.price ?? 0), 0),
          )}
        />
      </div>

      {(selected || creating) && (
        <AppointmentDialog
          appointment={selected}
          {...(creating ? { defaults: creating } : {})}
          services={services.data ?? []}
          onClose={() => {
            setSelected(null);
            setCreating(null);
          }}
          onSaved={() => void appointments.refetch()}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl text-gold">{value}</p>
    </div>
  );
}

export { STATUS_LABEL };
