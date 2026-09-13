import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/wolf-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Area riservata — The Wolf Man Salon" },
      { name: "description", content: "Accesso al pannello di gestione di The Wolf Man Salon." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Area riservata — The Wolf Man Salon" },
      { property: "og:description", content: "Accesso riservato allo staff." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("Credenziali non valide."); return; }
      navigate({ to: "/admin" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (data.session) navigate({ to: "/admin" });
      else toast.success("Controlla la tua email per confermare l'account.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <form onSubmit={submit} className="panel w-full max-w-sm p-8">
        <img
          src={logo.url}
          alt="The Wolf Man Salon"
          width={72}
          height={72}
          className="mx-auto h-16 w-16 object-contain invert"
        />
        <h1 className="mt-6 text-center font-display text-2xl uppercase tracking-[0.15em]">
          Area riservata
        </h1>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "Accedi al pannello di gestione" : "Crea l'account amministratore"}
        </p>

        <div className="mt-8 space-y-3">
          <input
            className="field"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="field"
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn-gold mt-6 w-full" disabled={busy}>
          {busy ? "Attendi…" : mode === "signin" ? "Accedi" : "Registrati"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-gold"
        >
          {mode === "signin" ? "Primo accesso? Registrati" : "Hai già un account? Accedi"}
        </button>
      </form>
    </div>
  );
}
