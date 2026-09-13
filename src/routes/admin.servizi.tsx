import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { euro, type Service } from "@/lib/salon";

export const Route = createFileRoute("/admin/servizi")({
  component: ServicesAdmin,
});

const EMPTY = {
  name: "",
  description: "",
  duration_minutes: 30,
  price: 0,
  is_active: true,
  sort_order: 0,
};

function ServicesAdmin() {
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["services", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").order("sort_order");
      return (data ?? []) as Service[];
    },
  });

  async function save() {
    if (form.name.trim().length < 2) { toast.error("Inserisci il nome del servizio."); return; }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };
    const { error } = editing
      ? await supabase.from("services").update(payload).eq("id", editing)
      : await supabase.from("services").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Servizio aggiornato." : "Servizio creato.");
    setForm({ ...EMPTY });
    setEditing(null);
    void list.refetch();
  }

  async function toggle(s: Service) {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    void list.refetch();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Servizio eliminato.");
    void list.refetch();
  }

  return (
    <div>
      <p className="eyebrow">Servizi</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl">Listino e durate</h1>

      <div className="panel mt-6 grid gap-3 p-5 sm:grid-cols-2">
        <input
          className="field"
          placeholder="Nome servizio"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="field"
          placeholder="Descrizione"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          className="field"
          type="number"
          min={5}
          step={5}
          placeholder="Durata (minuti)"
          value={form.duration_minutes}
          onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
        />
        <input
          className="field"
          type="number"
          min={0}
          step={1}
          placeholder="Prezzo €"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
        <input
          className="field"
          type="number"
          placeholder="Ordine"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
        />
        <div className="flex items-center gap-3">
          <button className="btn-gold" onClick={save}>
            <Plus size={15} /> {editing ? "Salva" : "Aggiungi"}
          </button>
          {editing && (
            <button
              className="btn-ghost-gold"
              onClick={() => {
                setEditing(null);
                setForm({ ...EMPTY });
              }}
            >
              Annulla
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {(list.data ?? []).map((s) => (
          <div key={s.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-display text-lg">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.duration_minutes} min · {euro(s.price)} · {s.description || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost-gold" onClick={() => toggle(s)}>
                {s.is_active ? "Attivo" : "Nascosto"}
              </button>
              <button
                className="btn-ghost-gold"
                onClick={() => {
                  setEditing(s.id);
                  setForm({
                    name: s.name,
                    description: s.description,
                    duration_minutes: s.duration_minutes,
                    price: Number(s.price),
                    is_active: s.is_active,
                    sort_order: s.sort_order,
                  });
                }}
              >
                Modifica
              </button>
              <button className="btn-ghost-gold" onClick={() => remove(s.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
