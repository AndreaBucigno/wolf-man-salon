ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS manage_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS appointments_manage_token_key ON public.appointments (manage_token);

CREATE OR REPLACE FUNCTION public.get_appointment_by_token(p_token text)
RETURNS TABLE(
  id uuid,
  appointment_date date,
  start_time time,
  end_time time,
  status appointment_status,
  customer_name text,
  customer_surname text,
  customer_email text,
  customer_phone text,
  price numeric,
  service_id uuid,
  service_name text,
  duration_minutes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.appointment_date, a.start_time, a.end_time, a.status,
         a.customer_name, a.customer_surname, a.customer_email, a.customer_phone,
         a.price, a.service_id, s.name, s.duration_minutes
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  WHERE a.manage_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE manage_token = p_token;
  IF a IS NULL THEN RAISE EXCEPTION 'Prenotazione non trovata'; END IF;
  IF a.status IN ('cancelled','completed','no_show') THEN RETURN false; END IF;
  IF (a.appointment_date + a.start_time) < (now() AT TIME ZONE 'Europe/Rome') THEN
    RAISE EXCEPTION 'Appuntamento gia passato';
  END IF;
  UPDATE public.appointments SET status = 'cancelled' WHERE id = a.id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reschedule_appointment_by_token(p_token text, p_date date, p_start time)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a record;
  svc record;
  fin time;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE manage_token = p_token;
  IF a IS NULL THEN RAISE EXCEPTION 'Prenotazione non trovata'; END IF;
  IF a.status IN ('cancelled','completed','no_show') THEN
    RAISE EXCEPTION 'Prenotazione non modificabile';
  END IF;
  SELECT * INTO svc FROM public.services WHERE id = a.service_id AND is_active;
  IF svc IS NULL THEN RAISE EXCEPTION 'Servizio non disponibile'; END IF;
  fin := p_start + (svc.duration_minutes || ' minutes')::interval;

  IF NOT EXISTS (
    SELECT 1 FROM public.available_slots(a.service_id, p_date) s WHERE s.slot = p_start
  ) THEN
    RAISE EXCEPTION 'Orario non piu disponibile';
  END IF;

  UPDATE public.appointments
     SET appointment_date = p_date,
         start_time = p_start,
         end_time = fin,
         status = 'pending'
   WHERE id = a.id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.get_appointment_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_appointment_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reschedule_appointment_by_token(text, date, time) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_appointment_by_token(text, date, time) TO anon, authenticated;