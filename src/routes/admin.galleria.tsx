import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/galleria")({
  component: GalleryAdmin,
});

type Item = {
  id: string;
  image_url: string;
  title: string | null;
  category: string;
  sort_order: number;
  media_type: "image" | "video";
};

function GalleryAdmin() {
  const [form, setForm] = useState({
    image_url: "",
    title: "",
    category: "Stile",
    sort_order: 0,
    media_type: "image" as "image" | "video",
  });

  const list = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery").select("*").order("sort_order");
      return (data ?? []) as Item[];
    },
  });

  async function add() {
    if (!/^https?:\/\//.test(form.image_url.trim())) {
      toast.error(
        form.media_type === "video"
          ? "Inserisci un indirizzo video valido (https://…, file .mp4)."
          : "Inserisci un indirizzo immagine valido (https://…).",
      );
      return;
    }
    const { error } = await supabase.from("gallery").insert({
      image_url: form.image_url.trim(),
      title: form.title.trim() || null,
      category: form.category.trim() || "Stile",
      sort_order: Number(form.sort_order),
      media_type: form.media_type,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(form.media_type === "video" ? "Video aggiunto." : "Foto aggiunta.");
    setForm({ image_url: "", title: "", category: "Stile", sort_order: 0, media_type: "image" });
    void list.refetch();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void list.refetch();
  }

  return (
    <div>
      <p className="eyebrow">Galleria</p>
      <h1 className="mt-1 font-display text-2xl sm:text-3xl">Foto del salone</h1>

      <div className="panel mt-6 grid gap-3 p-5 sm:grid-cols-4">
        <div className="flex gap-2 sm:col-span-4">
          <button
            type="button"
            onClick={() => setForm({ ...form, media_type: "image" })}
            className={`rounded-sm border px-4 py-2 text-xs uppercase tracking-[0.15em] ${
              form.media_type === "image" ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"
            }`}
          >
            Foto
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, media_type: "video" })}
            className={`rounded-sm border px-4 py-2 text-xs uppercase tracking-[0.15em] ${
              form.media_type === "video" ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground"
            }`}
          >
            Video
          </button>
        </div>
        <input
          className="field sm:col-span-2"
          placeholder={
            form.media_type === "video"
              ? "Indirizzo video (https://…, file .mp4)"
              : "Indirizzo immagine (https://…)"
          }
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <input
          className="field"
          placeholder="Titolo"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="field"
          placeholder="Categoria"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <button className="btn-gold sm:col-span-4 sm:w-fit" onClick={add}>
          <Plus size={15} /> {form.media_type === "video" ? "Aggiungi video" : "Aggiungi foto"}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(list.data ?? []).map((g) => (
          <div key={g.id} className="panel overflow-hidden p-0">
            {g.media_type === "video" ? (
              <video
                src={g.image_url}
                muted
                loop
                playsInline
                autoPlay
                className="h-40 w-full object-cover"
              />
            ) : (
              <img
                src={g.image_url}
                alt={g.title ?? "Foto salone"}
                loading="lazy"
                className="h-40 w-full object-cover"
              />
            )}
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{g.title ?? "—"}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {g.category} {g.media_type === "video" && "· Video"}
                </p>
              </div>
              <button className="btn-ghost-gold" onClick={() => remove(g.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
