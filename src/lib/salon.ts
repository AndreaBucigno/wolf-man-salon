export type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

export type Appointment = {
  id: string;
  customer_name: string;
  customer_surname: string;
  customer_email: string | null;
  customer_phone: string;
  service_id: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  price: number | null;
  created_at: string;
};

export type BusinessHour = {
  id: string;
  weekday: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
  break_start: string | null;
  break_end: string | null;
};

export type BlockedSlot = {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  reason: string;
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  cancelled: "Cancellato",
  completed: "Completato",
  no_show: "Non presentato",
};

export const STATUS_CLASS: Record<AppointmentStatus, string> = {
  pending: "border-gold/40 bg-graphite text-gold-light",
  confirmed: "border-gold bg-gold/15 text-gold-light",
  cancelled: "border-white/10 bg-carbon text-muted-foreground line-through",
  completed: "border-white/15 bg-white/5 text-foreground/70",
  no_show: "border-destructive/60 bg-destructive/15 text-foreground/80",
};

export const WEEKDAYS = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

export const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function hhmm(t: string): string {
  return t.slice(0, 5);
}

export function minutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${`${h}`.padStart(2, "0")}:${`${m}`.padStart(2, "0")}`;
}

export function longDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]?.slice(0, 3)}`;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** Monday-first week start */
export function startOfWeek(d: Date): Date {
  const c = new Date(d);
  const diff = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - diff);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function euro(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `€ ${Number(n).toFixed(2).replace(".00", "")}`;
}
