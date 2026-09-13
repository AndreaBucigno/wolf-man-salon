import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

import logo from "@/assets/wolf-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-14">
      <div className="container-x flex flex-col items-center gap-8 text-center">
        <img
          src={logo.url}
          alt="The Wolf Man Salon"
          width={72}
          height={72}
          loading="lazy"
          className="h-16 w-16 object-contain"
        />
        <p className="font-display text-lg tracking-[0.25em]">THE WOLF MAN SALON</p>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <li>
            <Link to="/" className="transition-colors hover:text-gold">
              Home
            </Link>
          </li>
          <li>
            <Link to="/" hash="servizi" className="transition-colors hover:text-gold">
              Servizi
            </Link>
          </li>
          <li>
            <Link to="/prenota" className="transition-colors hover:text-gold">
              Prenota
            </Link>
          </li>
          <li>
            <Link to="/" hash="contatti" className="transition-colors hover:text-gold">
              Contatti
            </Link>
          </li>
          <li>
            <a
              href="https://www.instagram.com/thewolfmansalon/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-gold"
            >
              <Instagram size={14} /> Instagram
            </a>
          </li>
        </ul>
        <p className="text-[0.7rem] tracking-[0.15em] text-muted-foreground/70">
          © 2026 The Wolf Man Salon. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
