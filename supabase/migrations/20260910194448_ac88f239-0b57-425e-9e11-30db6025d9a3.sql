
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 30,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active services" ON public.services FOR SELECT TO anon USING (is_active);
CREATE POLICY "auth read services" ON public.services FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BUSINESS HOURS
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday smallint NOT NULL UNIQUE CHECK (weekday BETWEEN 0 AND 6),
  is_closed boolean NOT NULL DEFAULT false,
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '19:00',
  break_start time,
  break_end time,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read hours" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage hours" ON public.business_hours FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- BLOCKED SLOTS
CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  start_time time NOT NULL DEFAULT '00:00',
  end_time time NOT NULL DEFAULT '23:59',
  all_day boolean NOT NULL DEFAULT false,
  reason text NOT NULL DEFAULT 'Altro',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage blocks" ON public.blocked_slots FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- APPOINTMENTS
CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','cancelled','completed','no_show');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_surname text NOT NULL DEFAULT '',
  customer_email text,
  customer_phone text NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  notes text,
  price numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appointments_date_idx ON public.appointments (appointment_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- GALLERY
CREATE TABLE public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  category text NOT NULL DEFAULT 'Stile',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery TO authenticated;
GRANT ALL ON public.gallery TO service_role;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read gallery" ON public.gallery FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage gallery" ON public.gallery FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SETTINGS
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- AVAILABILITY FUNCTION
CREATE OR REPLACE FUNCTION public.available_slots(p_service_id uuid, p_date date)
RETURNS TABLE (slot time)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  dur integer;
  bh record;
  cur time;
  fin time;
BEGIN
  SELECT duration_minutes INTO dur FROM public.services WHERE id = p_service_id AND is_active;
  IF dur IS NULL THEN RETURN; END IF;
  IF p_date < current_date THEN RETURN; END IF;
  SELECT * INTO bh FROM public.business_hours WHERE weekday = EXTRACT(DOW FROM p_date)::smallint;
  IF bh IS NULL OR bh.is_closed THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.blocked_slots b WHERE b.block_date = p_date AND b.all_day) THEN RETURN; END IF;

  cur := bh.open_time;
  WHILE cur + (dur || ' minutes')::interval <= bh.close_time LOOP
    fin := cur + (dur || ' minutes')::interval;
    IF NOT (bh.break_start IS NOT NULL AND bh.break_end IS NOT NULL AND cur < bh.break_end AND fin > bh.break_start)
      AND NOT EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.appointment_date = p_date AND a.status <> 'cancelled'
          AND cur < a.end_time AND fin > a.start_time)
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_slots b
        WHERE b.block_date = p_date AND cur < b.end_time AND fin > b.start_time)
      AND (p_date > current_date OR cur > (now() AT TIME ZONE 'Europe/Rome')::time)
    THEN
      slot := cur;
      RETURN NEXT;
    END IF;
    cur := cur + interval '15 minutes';
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.available_slots(uuid, date) TO anon, authenticated;

-- BOOKING FUNCTION
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_service_id uuid, p_date date, p_start time,
  p_name text, p_surname text, p_phone text, p_email text, p_notes text
) RETURNS public.appointments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  svc record;
  fin time;
  res public.appointments;
BEGIN
  IF length(trim(p_name)) < 2 OR length(trim(p_phone)) < 5 THEN
    RAISE EXCEPTION 'Dati cliente non validi';
  END IF;
  SELECT * INTO svc FROM public.services WHERE id = p_service_id AND is_active;
  IF svc IS NULL THEN RAISE EXCEPTION 'Servizio non disponibile'; END IF;
  fin := p_start + (svc.duration_minutes || ' minutes')::interval;

  IF NOT EXISTS (SELECT 1 FROM public.available_slots(p_service_id, p_date) s WHERE s.slot = p_start) THEN
    RAISE EXCEPTION 'Orario non piu disponibile';
  END IF;

  INSERT INTO public.appointments (customer_name, customer_surname, customer_email, customer_phone,
    service_id, appointment_date, start_time, end_time, status, notes, price)
  VALUES (trim(p_name), trim(coalesce(p_surname,'')), nullif(trim(coalesce(p_email,'')),''), trim(p_phone),
    p_service_id, p_date, p_start, fin, 'pending', nullif(trim(coalesce(p_notes,'')),''), svc.price)
  RETURNING * INTO res;
  RETURN res;
END;
$$;
GRANT EXECUTE ON FUNCTION public.book_appointment(uuid, date, time, text, text, text, text, text) TO anon, authenticated;

-- REALTIME
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- SEED
INSERT INTO public.services (name, description, duration_minutes, price, sort_order) VALUES
 ('Taglio Capelli','Taglio personalizzato e styling finale.',45,20,1),
 ('Taglio + Barba','Il rituale completo del gentleman.',60,30,2),
 ('Barba','Rifinitura e cura della barba con panno caldo.',30,12,3),
 ('Rasatura','Rasatura tradizionale a mano libera.',30,15,4),
 ('Taglio Bambini','Taglio dedicato ai piu piccoli.',30,15,5),
 ('Styling','Piega e styling con prodotti professionali.',20,10,6);

INSERT INTO public.business_hours (weekday, is_closed, open_time, close_time, break_start, break_end) VALUES
 (0, true, '09:00','19:00', NULL, NULL),
 (1, true, '09:00','19:00', NULL, NULL),
 (2, false,'09:00','19:00','13:00','15:00'),
 (3, false,'09:00','19:00','13:00','15:00'),
 (4, false,'09:00','19:30','13:00','15:00'),
 (5, false,'09:00','19:30','13:00','15:00'),
 (6, false,'09:00','18:00', NULL, NULL);

INSERT INTO public.settings (key, value) VALUES
 ('phone','+39 000 000 0000'),
 ('address','Perugia, Italia'),
 ('instagram','https://www.instagram.com/thewolfmansalon/'),
 ('maps_query','The Wolf Man Salon, Perugia'),
 ('email','info@thewolfmansalon.it');
