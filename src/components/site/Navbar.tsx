import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import logo from "@/assets/wolf-logo.png.asset.json";

const links = [
  { label: "Home", to: "/", hash: undefined as string | undefined },
  { label: "Chi siamo", to: "/", hash: "chi-siamo" },
  { label: "Servizi", to: "/", hash: "servizi" },
  { label: "Galleria", to: "/", hash: "galleria" },
  { label: "Contatti", to: "/", hash: "contatti" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border bg-background/92 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="container-x flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="rounded-full border border-border bg-background p-2">
            <img
              src={logo.url}
              alt="The Wolf Man Salon"
              width={48}
              height={48}
              className="h-11 w-11 object-contain"
            />
          </div>
          <span className="hidden font-display text-sm tracking-[0.3em] text-foreground sm:block">
            THE WOLF MAN
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.label}>
              <Link
                to={l.to}
                {...(l.hash ? { hash: l.hash } : {})}
                className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-gold"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link to="/prenota" className="btn-gold hidden sm:inline-flex">
            Prenota ora
          </Link>
          <button
            aria-label="Menu"
            className="rounded-sm border border-border p-2 text-gold lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/98 backdrop-blur lg:hidden">
          <ul className="container-x flex flex-col py-4">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  {...(l.hash ? { hash: l.hash } : {})}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-sm uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
              <Link to="/prenota" className="btn-gold w-full" onClick={() => setOpen(false)}>
                Prenota ora
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
