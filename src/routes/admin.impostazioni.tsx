import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/impostazioni")({
  component: SettingsAdmin,
});

const FIELDS: { key: string; label: string }[] = [
  { key: "salon_name", label: "Nome salone" },
  { key: "phone", label: "Telefono" },
  { key: "email", label: "Email" },
  { key: "address", label: "Indirizzo" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "hero_tagline", label: "Frase in home" },
];

function SettingsAdmin() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const query = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("*");
      return (data ?? []) as { key: string; value: string }[];
    },
  });

  useEffect(() => {
    if (query.data) {
      setValues(Object.fromEntries(query.data.map((r) => [r.key, r.value])));
    }
  }, [query.data]);

  async function save() {
    setBusy(true);
    const rows = FIELDS.map((f) => ({ key: f.key, value: values[f.key] ?? "" }));
    const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Impostazioni salvate.");
    void query.refetch();
  }

  return (
    <div>
      <p className="eyebrow">Impostazioni</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl">Dati del salone</h1>

      <div className="panel mt-6 grid gap-4 p-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {f.label}
            </span>
            <input
              className="field mt-2"
              value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </label>
        ))}
      </div>

      <button className="btn-gold mt-6" disabled={busy} onClick={save}>
        {busy ? "Salvataggio…" : "Salva impostazioni"}
      </button>
    </div>
  );
}
