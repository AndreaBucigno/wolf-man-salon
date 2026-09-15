import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Trophy } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  type Appointment,
  euro,
  longDate,
  parseISODate,
  type Service,
} from "@/lib/salon";

export const Route = createFileRoute("/admin/clienti")({
  component: Clients,
});

type Client = {
  key: string;
  name: string;
  phone: string;
  count: number;
  total: number;
  last: string;
  history: Appointment[];
};

function Clients() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const services = useQuery({
    queryKey: ["services", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").order("sort_order");
      return (data ?? []) as Service[];
    },
  });

  const done = useQuery({
    queryKey: ["appointments", "completed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("status", "completed")
        .order("appointment_date", { ascending: false });
      return (data ?? []) as Appointment[];
    },
  });

  const threshold = useQuery({
    queryKey: ["settings", "loyalty"],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "loyalty_threshold")
        .maybeSingle();
      return Number(data?.value ?? 10) || 10;
    },
  });

  const goal = threshold.data ?? 10;
  const [draft, setDraft] = useState<string>("");

  async function saveGoal() {
    const n = Math.max(1, Number(draft) || goal);
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "loyalty_threshold", value: String(n) }, { onConflict: "key" });
    if (error) {
      toast.error("Impossibile salvare");
      return;
    }
    setDraft("");
    await qc.invalidateQueries({ queryKey: ["settings", "loyalty"] });
    toast.success("Obiettivo aggiornato");
  }

  const clients = useMemo<Client[]>(() => {
    const map = new Map<string, Client>();
    for (const a of done.data ?? []) {
      const key = a.customer_phone.replace(/\s+/g, "");
      const c = map.get(key) ?? {
        key,
        name: `${a.customer_name} ${a.customer_surname}`.trim(),
        phone: a.customer_phone,
        count: 0,
        total: 0,
        last: a.appointment_date,
        history: [],
      };
      c.count += 1;
      c.total += Number(a.price ?? 0);
      if (a.appointment_date > c.last) c.last = a.appointment_date;
      c.history.push(a);
      map.set(key, c);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [done.data]);

  const term = q.toLowerCase().trim();
  const rows = clients.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(term));
  const totalCuts = clients.reduce((s, c) => s + c.count, 0);
  const eligible = clients.filter((c) => c.count >= goal).length;

  return (
    <div>
      <header>
        <p className="eyebrow">Storico</p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl">Clienti e tagli completati</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Solo gli appuntamenti segnati come completati. Al raggiungimento dell&apos;obiettivo il
          cliente ha diritto allo sconto.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tagli completati</p>
          <p className="mt-1 font-display text-2xl text-gold">{totalCuts}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Clienti</p>
          <p className="mt-1 font-display text-2xl text-gold">{clients.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Premiabili</p>
          <p className="mt-1 font-display text-2xl text-gold">{eligible}</p>
        </div>
      </div>

      <div className="panel mt-4 flex flex-wrap items-end gap-3 p-4">
        <label className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
          <input
            className="field pl-9"
            placeholder="Cerca cliente o telefono"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Tagli per lo sconto
          </p>
          <div className="flex gap-2">
            <input
              className="field w-24"
              type="number"
              min={1}
              value={draft === "" ? goal : draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="btn-gold" onClick={() => void saveGoal()}>
              Salva
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {rows.length === 0 && (
          <p className="panel p-6 text-sm text-muted-foreground">
            Nessun appuntamento completato per ora.
          </p>
        )}
        {rows.map((c) => {
          const ready = c.count >= goal;
          const progress = Math.min(100, Math.round(((c.count % goal || (ready ? goal : c.count)) / goal) * 100));
          return (
            <div key={c.key} className="panel p-4">
              <button
                className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                onClick={() => setOpen(open === c.key ? null : c.key)}
              >
                <div>
                  <p className="font-display text-lg">
                    {c.name}
                    {ready && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-sm border border-gold bg-gold/15 px-2 py-0.5 align-middle text-[10px] uppercase text-gold-light">
                        <Trophy size={11} /> Sconto
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.phone} · ultimo {longDate(parseISODate(c.last))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gold">
                    {c.count} {c.count === 1 ? "taglio" : "tagli"}
                  </p>
                  <p className="text-xs text-muted-foreground">{euro(c.total)} spesi</p>
                </div>
              </button>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-white/10">
                <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
              </div>
              {open === c.key && (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  {c.history.map((a) => (
                    <li key={a.id} className="flex justify-between gap-3">
                      <span>
                        {longDate(parseISODate(a.appointment_date))} ·{" "}
                        {services.data?.find((s) => s.id === a.service_id)?.name ?? "—"}
                      </span>
                      <span className="text-gold">{euro(a.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
