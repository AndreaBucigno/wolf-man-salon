import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { type BlockedSlot, hhmm, longDate, parseISODate, toISODate } from "@/lib/salon";

export const Route = createFileRoute("/admin/blocchi")({
  component: BlocksAdmin,
});

function BlocksAdmin() {
  const [form, setForm] = useState({
    block_date: toISODate(new Date()),
    start_time: "09:00",
    end_time: "13:00",
    all_day: false,
    reason: "Ferie",
  });

  const list = useQuery({
    queryKey: ["blocked_slots", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blocked_slots")
        .select("*")
        .gte("block_date", toISODate(new Date()))
        .order("block_date");
      return (data ?? []) as BlockedSlot[];
    },
  });

  async function add() {
    if (!form.block_date) { toast.error("Scegli una data."); return; }
    const { error } = await supabase.from("blocked_slots").insert({
      block_date: form.block_date,
      start_time: form.all_day ? "00:00" : form.start_time,
      end_time: form.all_day ? "23:59" : form.end_time,
      all_day: form.all_day,
      reason: form.reason.trim() || "Altro",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Blocco aggiunto.");
    void list.refetch();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void list.refetch();
  }

  return (
    <div>
      <p className="eyebrow">Blocchi</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl">Chiusure e orari bloccati</h1>

      <div className="panel mt-6 grid gap-3 p-5 sm:grid-cols-3">
        <input
          className="field"
          type="date"
          value={form.block_date}
          onChange={(e) => setForm({ ...form, block_date: e.target.value })}
        />
        <input
          className="field"
          type="time"
          disabled={form.all_day}
          value={form.start_time}
          onChange={(e) => setForm({ ...form, start_time: e.target.value })}
        />
        <input
          className="field"
          type="time"
          disabled={form.all_day}
          value={form.end_time}
          onChange={(e) => setForm({ ...form, end_time: e.target.value })}
        />
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">
          <input
            type="checkbox"
            checked={form.all_day}
            onChange={(e) => setForm({ ...form, all_day: e.target.checked })}
          />
          Tutto il giorno
        </label>
        <input
          className="field"
          placeholder="Motivo"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <button className="btn-gold" onClick={add}>
          <Plus size={15} /> Blocca
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {(list.data ?? []).length === 0 && (
          <p className="panel p-6 text-sm text-muted-foreground">Nessun blocco programmato.</p>
        )}
        {(list.data ?? []).map((b) => (
          <div key={b.id} className="panel flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-display text-lg">{longDate(parseISODate(b.block_date))}</p>
              <p className="text-xs text-muted-foreground">
                {b.all_day ? "Tutto il giorno" : `${hhmm(b.start_time)} – ${hhmm(b.end_time)}`} ·{" "}
                {b.reason}
              </p>
            </div>
            <button className="btn-ghost-gold" onClick={() => remove(b.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
