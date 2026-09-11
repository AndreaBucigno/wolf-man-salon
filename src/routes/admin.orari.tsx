import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { type BusinessHour, hhmm, WEEKDAYS } from "@/lib/salon";

export const Route = createFileRoute("/admin/orari")({
  component: HoursAdmin,
});

const ORDER = [1, 2, 3, 4, 5, 6, 0];

function HoursAdmin() {
  const [rows, setRows] = useState<BusinessHour[]>([]);
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["business_hours"],
    queryFn: async () => {
      const { data } = await supabase.from("business_hours").select("*").order("weekday");
      return (data ?? []) as BusinessHour[];
    },
  });

  useEffect(() => {
    if (query.data) setRows(query.data);
  }, [query.data]);

  function patch(id: string, p: Partial<BusinessHour>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  async function save() {
    setBusy(true);
    for (const r of rows) {
      const { error } = await supabase
        .from("business_hours")
        .update({
          is_closed: r.is_closed,
          open_time: r.open_time,
          close_time: r.close_time,
          break_start: r.break_start || null,
          break_end: r.break_end || null,
        })
        .eq("id", r.id);
      if (error) {
        setBusy(false);
        return toast.error(error.message);
      }
    }
    setBusy(false);
    toast.success("Orari aggiornati.");
    void query.refetch();
  }

  const sorted = ORDER.map((w) => rows.find((r) => r.weekday === w)).filter(Boolean) as BusinessHour[];

  return (
    <div>
      <p className="eyebrow">Orari</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl">Orari di apertura</h1>

      <div className="mt-6 space-y-2">
        {sorted.map((r) => (
          <div key={r.id} className="panel grid gap-3 p-4 sm:grid-cols-6 sm:items-center">
            <p className="font-display text-lg">{WEEKDAYS[r.weekday]}</p>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              <input
                type="checkbox"
                checked={r.is_closed}
                onChange={(e) => patch(r.id, { is_closed: e.target.checked })}
              />
              Chiuso
            </label>
            <input
              className="field"
              type="time"
              disabled={r.is_closed}
              value={hhmm(r.open_time)}
              onChange={(e) => patch(r.id, { open_time: e.target.value })}
            />
            <input
              className="field"
              type="time"
              disabled={r.is_closed}
              value={hhmm(r.close_time)}
              onChange={(e) => patch(r.id, { close_time: e.target.value })}
            />
            <input
              className="field"
              type="time"
              disabled={r.is_closed}
              value={r.break_start ? hhmm(r.break_start) : ""}
              onChange={(e) => patch(r.id, { break_start: e.target.value || null })}
            />
            <input
              className="field"
              type="time"
              disabled={r.is_closed}
              value={r.break_end ? hhmm(r.break_end) : ""}
              onChange={(e) => patch(r.id, { break_end: e.target.value || null })}
            />
          </div>
        ))}
      </div>

      <button className="btn-gold mt-6" disabled={busy} onClick={save}>
        {busy ? "Salvataggio…" : "Salva orari"}
      </button>
    </div>
  );
}
