import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  type Appointment,
  type AppointmentStatus,
  euro,
  fromMinutes,
  hhmm,
  longDate,
  minutes,
  parseISODate,
  type Service,
  STATUS_LABEL,
} from "@/lib/salon";

type Props = {
  appointment: Appointment | null;
  defaults?: { date: string; start: string };
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
};

const STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export async function hasOverlap(
  date: string,
  start: string,
  end: string,
  ignoreId?: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("appointments")
    .select("id,start_time,end_time,status")
    .eq("appointment_date", date)
    .neq("status", "cancelled");
  return (data ?? []).some(
    (a) =>
      a.id !== ignoreId && minutes(start) < minutes(a.end_time) && minutes(end) > minutes(a.start_time),
  );
}

export function AppointmentDialog({ appointment, defaults, services, onClose, onSaved }: Props) {
  const creating = !appointment;
  const [edit, setEdit] = useState(creating);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    customer_name: appointment?.customer_name ?? "",
    customer_surname: appointment?.customer_surname ?? "",
    customer_phone: appointment?.customer_phone ?? "",
    customer_email: appointment?.customer_email ?? "",
    service_id: appointment?.service_id ?? services[0]?.id ?? "",
    appointment_date: appointment?.appointment_date ?? defaults?.date ?? "",
    start_time: hhmm(appointment?.start_time ?? defaults?.start ?? "09:00"),
    notes: appointment?.notes ?? "",
    status: (appointment?.status ?? "confirmed") as AppointmentStatus,
  });

  const service = services.find((s) => s.id === form.service_id);

  async function save() {
    if (form.customer_name.trim().length < 2 || form.customer_phone.trim().length < 5) {
      toast.error("Nome e telefono obbligatori.");
      return;
    }
    if (!service || !form.appointment_date) {
      toast.error("Servizio e data obbligatori.");
      return;
    }
    setBusy(true);
    const end = fromMinutes(minutes(form.start_time) + service.duration_minutes);
    if (
      form.status !== "cancelled" &&
      (await hasOverlap(form.appointment_date, form.start_time, end, appointment?.id))
    ) {
      setBusy(false);
      toast.error("Esiste già un appuntamento in questo intervallo.");
      return;
    }
    const payload = {
      customer_name: form.customer_name.trim(),
      customer_surname: form.customer_surname.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_email: form.customer_email.trim() || null,
      service_id: form.service_id,
      appointment_date: form.appointment_date,
      start_time: form.start_time,
      end_time: end,
      notes: form.notes.trim() || null,
      status: form.status,
      price: service.price,
    };
    const { error } = appointment
      ? await supabase.from("appointments").update(payload).eq("id", appointment.id)
      : await supabase.from("appointments").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(appointment ? "Appuntamento aggiornato." : "Appuntamento creato.");
    onSaved();
    onClose();
  }

  async function setStatus(status: AppointmentStatus) {
    if (!appointment) return;
    const { error } = await supabase.from("appointments").update({ status }).eq("id", appointment.id);
    if (error) return toast.error(error.message);
    toast.success(`Stato: ${STATUS_LABEL[status]}`);
    onSaved();
    onClose();
  }

  async function remove() {
    if (!appointment) return;
    const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);
    if (error) return toast.error(error.message);
    toast.success("Appuntamento eliminato.");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="panel max-h-[92svh] w-full max-w-lg overflow-y-auto p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{creating ? "Nuovo appuntamento" : "Appuntamento"}</p>
            {!creating && !edit && (
              <h2 className="mt-2 font-display text-2xl">
                {appointment.customer_name} {appointment.customer_surname}
              </h2>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-gold">
            <X size={18} />
          </button>
        </div>

        {!creating && !edit ? (
          <div className="mt-6 space-y-3 text-sm">
            <Line label="Servizio" value={services.find((s) => s.id === appointment.service_id)?.name ?? "—"} />
            <Line label="Data" value={longDate(parseISODate(appointment.appointment_date))} />
            <Line
              label="Orario"
              value={`${hhmm(appointment.start_time)} - ${hhmm(appointment.end_time)}`}
            />
            <Line label="Telefono" value={appointment.customer_phone} />
            <Line label="Email" value={appointment.customer_email ?? "—"} />
            <Line label="Prezzo" value={euro(appointment.price)} />
            <Line label="Note" value={appointment.notes ?? "—"} />
            <Line label="Stato" value={STATUS_LABEL[appointment.status]} />

            <div className="flex flex-wrap gap-2 pt-4">
              <button className="btn-ghost-gold" onClick={() => setEdit(true)}>
                Modifica
              </button>
              <button className="btn-ghost-gold" onClick={() => setStatus("confirmed")}>
                Conferma
              </button>
              <button className="btn-ghost-gold" onClick={() => setStatus("completed")}>
                Completato
              </button>
              <button className="btn-ghost-gold" onClick={() => setStatus("cancelled")}>
                Cancella
              </button>
              <button
                className="btn-ghost-gold border-destructive/60 text-foreground/80"
                onClick={remove}
              >
                Elimina
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <input
              className="field"
              placeholder="Nome *"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />
            <input
              className="field"
              placeholder="Cognome"
              value={form.customer_surname}
              onChange={(e) => setForm({ ...form, customer_surname: e.target.value })}
            />
            <input
              className="field"
              placeholder="Telefono *"
              value={form.customer_phone}
              onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
            />
            <input
              className="field"
              placeholder="Email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
            />
            <select
              className="field"
              value={form.service_id}
              onChange={(e) => setForm({ ...form, service_id: e.target.value })}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_minutes} min
                </option>
              ))}
            </select>
            <select
              className="field"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <input
              className="field"
              type="date"
              value={form.appointment_date}
              onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
            />
            <input
              className="field"
              type="time"
              step={900}
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <textarea
              className="field sm:col-span-2"
              rows={3}
              placeholder="Note"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="sm:col-span-2 flex gap-2">
              <button className="btn-gold" disabled={busy} onClick={save}>
                {busy ? "Attendi…" : creating ? "Crea appuntamento" : "Salva modifiche"}
              </button>
              <button className="btn-ghost-gold" onClick={onClose}>
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-border pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
