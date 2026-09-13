import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Ban,
  CalendarDays,
  ClipboardList,
  Clock,
  Image as ImageIcon,
  LogOut,
  Menu,
  Scissors,
  Settings,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/wolf-logo.png.asset.json";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Gestionale — The Wolf Man Salon" },
      { name: "description", content: "Pannello di gestione appuntamenti di The Wolf Man Salon." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Gestionale — The Wolf Man Salon" },
      { property: "og:description", content: "Pannello riservato allo staff." },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Calendario", icon: CalendarDays, exact: true },
  { to: "/admin/prenotazioni", label: "Prenotazioni", icon: ClipboardList },
  { to: "/admin/servizi", label: "Servizi", icon: Scissors },
  { to: "/admin/orari", label: "Orari di apertura", icon: Clock },
  { to: "/admin/blocchi", label: "Blocca orari", icon: Ban },
  { to: "/admin/galleria", label: "Galleria", icon: ImageIcon },
  { to: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-b border-border bg-carbon lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <img
              src={logo.url}
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
            />
            <span className="font-display text-xs tracking-[0.25em]">THE WOLF MAN</span>
          </div>
          <button
            aria-label="Menu"
            aria-expanded={open}
            className="rounded-sm border border-border p-2 text-gold lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav
          className={`${
            open ? "flex" : "hidden"
          } flex-col gap-1 border-t border-border px-3 pb-3 pt-3 lg:flex lg:overflow-visible lg:border-t-0 lg:pb-6 lg:pt-0`}
        >
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: "exact" in n ? n.exact : false }}
              activeProps={{ className: "!text-gold !border-gold bg-gold/10" }}
              onClick={() => setOpen(false)}
              className="flex shrink-0 items-center gap-3 rounded-sm border border-transparent px-3 py-2.5 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-gold"
            >
              <n.icon size={15} />
              {n.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-left text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-gold"
          >
            <LogOut size={15} /> Logout
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-7">
        <Outlet />
      </main>
    </div>
  );
}
