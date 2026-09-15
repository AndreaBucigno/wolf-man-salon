import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
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

function guessVideoMime(url: string): string {
  const ext = (url.split("?")[0] ?? "").split(".").pop()?.toLowerCase();
  switch (ext) {
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    case "ogg":
    case "ogv":
      return "video/ogg";
    default:
      return "video/mp4";
  }
}

function GalleryThumb({ item }: { item: Item }) {
  const [videoFailed, setVideoFailed] = useState(false);

  if (item.media_type !== "video") {
    return (
      <img
        src={item.image_url}
        alt={item.title ?? "Foto salone"}
        loading="lazy"
        className="h-40 w-full object-cover"
      />
    );
  }

  if (videoFailed) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center gap-1 bg-carbon px-3 text-center text-[11px] text-muted-foreground">
        Anteprima non disponibile in questo browser
        <a href={item.image_url} target="_blank" rel="noreferrer" className="text-gold underline">
          Apri il file
        </a>
      </div>
    );
  }

  return (
    <video muted loop playsInline autoPlay onError={() => setVideoFailed(true)} className="h-40 w-full object-cover">
      <source src={item.image_url} type={guessVideoMime(item.image_url)} />
    </video>
  );
}

function GalleryAdmin() {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [ordered, setOrdered] = useState<Item[] | null>(null);
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
      return (data ?? []).map((row) => ({
        ...row,
        media_type: row.media_type === "video" ? "video" : "image",
      })) as Item[];
    },
  });

  const items = ordered ?? list.data ?? [];

  async function add() {
    if (!/^https?:\/\//.test(form.image_url.trim())) {
      toast.error(
        form.media_type === "video"
          ? "Inserisci un indirizzo video valido (https://…, file .mp4 o .mov)."
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

  async function persistOrder() {
    setDragIndex(null);
    if (!ordered) return;
    const updates = ordered.map((it, i) => ({ id: it.id, sort_order: i }));
    for (const u of updates) {
      const { error } = await supabase.from("gallery").update({ sort_order: u.sort_order }).eq("id", u.id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Ordine aggiornato.");
    setOrdered(null);
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
              ? "Indirizzo video (https://…, file .mp4 o .mov)"
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

      <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Trascina gli elementi per cambiare l'ordine
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g, i) => (
          <div
            key={g.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIndex === null || dragIndex === i) return;
              const next = [...items];
              const [moved] = next.splice(dragIndex, 1);
              if (!moved) return;
              next.splice(i, 0, moved);
              setOrdered(next);
              setDragIndex(i);
            }}
            onDragEnd={() => void persistOrder()}
            className={`panel cursor-grab overflow-hidden p-0 active:cursor-grabbing ${
              dragIndex === i ? "opacity-60" : ""
            }`}
          >
            <GalleryThumb item={g} />
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <GripVertical size={14} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm">{g.title ?? "—"}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {g.category} {g.media_type === "video" && "· Video"}
                  </p>
                </div>
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
