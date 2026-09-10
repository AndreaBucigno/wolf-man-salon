# Wolf Man Salon

# THE WOLF MAN SALON — Brief Completo (Sito + Sistema Prenotazioni + Pannello Admin/Calendario)

Crea un sito web professionale, moderno e completamente responsive per una barberia italiana chiamata:

**THE WOLF MAN SALON**

Instagram: https://www.instagram.com/thewolfmansalon/

UTILIZZA IL LOGO ALLEGATO COME LOGO PRINCIPALE DEL SITO.
Il logo rappresenta un lupo e deve diventare l'elemento distintivo del brand.

---

## 1. CONCEPT E IDENTITÀ VISIVA

Il sito deve avere un'identità molto forte, elegante, maschile e premium.

**Palette principale:**
- Nero quasi assoluto `#080808`
- Nero carbone `#111111`
- Oro caldo/metallizzato `#C8A45D`
- Oro chiaro `#E0C078`
- Bianco caldo `#F5F2EA`
- Grigio scuro `#1B1B1B`

NON utilizzare colori vivaci, blu, viola o gradienti casuali.

L'obiettivo è creare l'atmosfera di una barberia premium: elegante, maschile, moderna, leggermente aggressiva, raffinata, ispirata al tema del lupo, con dettagli luxury in oro.

Utilizza bordi sottili color oro, micro-animazioni eleganti, ombre molto leggere e molto spazio negativo.

Il sito NON deve sembrare un template generico da parrucchiere. Deve sembrare un vero brand professionale.

---

## 2. TECNOLOGIE

- React
- TypeScript
- Tailwind CSS
- Vite
- Lucide React per le icone
- Supabase per database, autenticazione e backend
- Componenti modulari e riutilizzabili
- Design completamente responsive (mobile-first)

Ottimizzato per desktop, tablet e smartphone.

---

## 3. STRUTTURA DEL SITO PUBBLICO

1. Navbar
2. Hero
3. Chi siamo
4. Servizi
5. Galleria
6. Perché The Wolf Man
7. Prenotazione
8. Contatti
9. Footer

### 3.1 Navbar
Navbar scura, elegante e sticky.
- Sinistra: logo The Wolf Man Salon
- Menu: Home, Chi siamo, Servizi, Galleria, Prenota
- Destra: pulsante "PRENOTA ORA" (oro con testo nero)
- Mobile: hamburger menu elegante

### 3.2 Hero
Hero scenografica, sfondo nero/carbone con grande immagine professionale di barberia/barbiere al lavoro (placeholder sostituibili se non disponibili immagini reali). Overlay scuro per leggibilità testo.

- Titolo: **THE WOLF MAN SALON**
- Sottotitolo: "Il tuo stile. La nostra precisione."
- Testo: "Tagli, barba e stile. Un'esperienza da vero gentleman."
- CTA principale: PRENOTA IL TUO APPUNTAMENTO
- CTA secondaria: SCOPRI I SERVIZI
- Logo/lupo inserito elegantemente nella composizione
- Piccola animazione all'ingresso degli elementi

### 3.3 Chi Siamo
Due colonne. Sinistra: immagine barberia/barbiere. Destra: testo brand + piccolo elemento grafico con il simbolo del lupo.

Testo placeholder:
> "Una barberia nata dalla passione per lo stile, la precisione e la cura dell'uomo. Ogni taglio viene studiato per valorizzare il volto e lo stile personale del cliente. Da The Wolf Man Salon ogni appuntamento è un'esperienza, non semplicemente un taglio."

### 3.4 Servizi
Sezione "I NOSTRI SERVIZI". NON inventare prezzi definitivi — i servizi devono essere gestibili dal pannello admin.

Servizi iniziali (modificabili):
- Taglio capelli
- Taglio + barba
- Barba
- Rasatura
- Taglio bambini
- Styling

Ogni servizio ha: Nome, Descrizione, Durata, Prezzo, Immagine opzionale.

Esempio:
> **TAGLIO CAPELLI** — "Taglio personalizzato e styling finale." — Durata: 45 min — Prezzo: configurabile dall'admin

Ogni card ha un pulsante **PRENOTA** che porta al sistema di prenotazione con il servizio già selezionato.

### 3.5 Galleria
Gallery moderna in stile Instagram, layout masonry/grid, immagini placeholder sostituibili.

Categorie opzionali: Tagli, Barba, Stile, Salone.

Hover: zoom leggero + overlay nero/oro.

### 3.6 Perché The Wolf Man
4 elementi con icone minimal color oro:
- **Precisione** — "Ogni dettaglio conta."
- **Stile** — "Il taglio deve rappresentarti."
- **Qualità** — "Prodotti e tecniche professionali."
- **Esperienza** — "Un momento dedicato completamente a te."

### 3.7 Contatti
- The Wolf Man Salon — Perugia
- Instagram: @thewolfmansalon
- Pulsanti: INSTAGRAM, CHIAMA, PRENOTA ORA
- Mappa Google Maps incorporabile tramite configurazione (no coordinate hardcoded)

### 3.8 Footer
Footer completamente nero. Logo + "The Wolf Man Salon". Link: Home, Servizi, Prenota, Contatti, Instagram.
Copyright: "© 2026 The Wolf Man Salon. All rights reserved."

---

## 4. SISTEMA DI PRENOTAZIONE PUBBLICO (`/prenota`)

Funzionalità PRINCIPALE del progetto. Il cliente prenota senza necessariamente creare un account.

**Step 1 — Seleziona servizio** (Taglio capelli, Taglio + barba, Barba, Rasatura, ecc.)

**Step 2 — Seleziona giorno** tramite calendario moderno.

**Step 3 — Seleziona orario**: mostrare SOLO gli orari realmente disponibili, calcolati in base a:
- orari di apertura
- appuntamenti già prenotati
- durata del servizio
- giorni di chiusura
- blocchi inseriti dall'amministratore

**Step 4 — Dati cliente**: Nome, Cognome, Telefono, Email, Note opzionali

**Step 5 — Riepilogo**: Servizio, Data, Orario, Durata, Prezzo → pulsante **CONFERMA PRENOTAZIONE**

### Pagina di conferma
Dopo la prenotazione, schermata elegante con logo del lupo.
- Titolo: "APPUNTAMENTO PRENOTATO"
- Testo: "Il tuo appuntamento è stato registrato correttamente."
- Riepilogo appuntamento
- Pulsanti: TORNA ALLA HOME, AGGIUNGI AL CALENDARIO

---

## 5. DATABASE (SUPABASE)

Backend reale con database strutturato professionalmente.

**Tabelle principali:**
- `users`
- `services`
- `appointments`
- `business_hours`
- `blocked_slots`
- `gallery`
- `settings`

**Tabella `appointments`** deve contenere almeno:
`id, customer_name, customer_surname, customer_email, customer_phone, service_id, appointment_date, start_time, end_time, status, notes, created_at`

**Stati (`status`):** `pending`, `confirmed`, `cancelled`, `completed`, `no_show`

---

## 6. PANNELLO ADMIN (`/admin`)

Accessibile esclusivamente all'amministratore tramite autenticazione (Supabase Auth + Row Level Security).

### 6.1 Sidebar della dashboard
- 📅 Calendario (voce principale, selezionata di default dopo il login)
- 📋 Prenotazioni
- ✂️ Servizi
- 🕐 Orari di apertura
- 🚫 Blocca orari
- 🖼️ Galleria
- ⚙️ Impostazioni
- 🚪 Logout

### 6.2 Dashboard Home
Panoramica con statistiche:
- Appuntamenti oggi: 12
- In attesa: 3
- Confermati: 8
- Completati: 4
- Incasso previsto: € XXX

Sotto, elenco cronologico "APPUNTAMENTI DI OGGI":
```
09:00  Mario Rossi    Taglio        Confermato
10:00  Luca Bianchi   Barba         Confermato
11:00  Marco Verdi    Taglio+Barba  In attesa
```
Cliccando su un appuntamento si apre il dettaglio.

---

## 7. CALENDARIO ADMIN (`/admin/calendar`) — CENTRO DEL GESTIONALE

Il calendario è la funzionalità PRINCIPALE del pannello admin e la fonte principale per la gestione della disponibilità del barbiere.

### 7.1 Viste
- Vista giornaliera
- Vista settimanale (**default**)
- Vista mensile

Navigazione:
- `< Giorno precedente` — `OGGI` — `Giorno successivo >`
- `< Settimana precedente` — `OGGI` — `Settimana successiva >`

### 7.2 Vista settimanale
Griglia oraria con colonne Lun–Dom e righe a intervalli di 30 min (es. 08:00–19:00).

Ogni prenotazione appare nella posizione corrispondente all'orario, con altezza proporzionale alla durata del servizio (es. 30 min → blocco piccolo, 60 min → blocco doppio).

Esempio visuale:
```
┌───────────────────────────────┐
│ 10:00 - 10:45                 │
│ Mario Rossi                   │
│ Taglio capelli                │
│ ✓ Confermato                  │
└───────────────────────────────┘
```

### 7.3 Colori stati prenotazione
Palette coerente nero/oro, tonalità scure con variazioni discrete (nessun colore vivace):
- `pending` — in attesa
- `confirmed` — confermata
- `cancelled` — cancellata
- `completed` — completata
- `no_show` — cliente non presentato

### 7.4 Dettaglio prenotazione
Click su una prenotazione → modal/pannello laterale con: Nome, Cognome, Telefono, Email, Servizio, Data, Orario inizio/fine, Durata, Prezzo, Note, Stato.

Esempio:
```
--------------------------------
APPUNTAMENTO
--------------------------------
Mario Rossi
TAGLIO + BARBA
18 Settembre 2026
16:30 - 17:30
Telefono: 333 XXX XXXX
Email: cliente@email.it
Note: "Preferisce sfumatura bassa"
STATO: CONFERMATO

[ MODIFICA ]  [ CANCELLA ]  [ COMPLETATO ]
--------------------------------
```

### 7.5 Modifica prenotazione
Il barbiere può modificare: giorno, orario, servizio, cliente, telefono, email, note, stato.

Alla modifica di giorno/orario, verificare automaticamente che non esista un altro appuntamento sovrapposto. NON permettere due prenotazioni nello stesso intervallo.

### 7.6 Creazione manuale prenotazione
Click su uno slot libero (es. 16:30) → form "NUOVO APPUNTAMENTO":
```
Cliente:  [________________]
Telefono: [________________]
Servizio: [ Taglio capelli ▼ ]
Data:     [18/09/2026]
Ora:      [16:30]
Note:     [________________]

[ CREA APPUNTAMENTO ]
```
La prenotazione viene immediatamente inserita nel calendario.

### 7.7 Drag & drop
Il barbiere deve poter trascinare una prenotazione da un orario all'altro (es. 16:00 → 17:00). Prima di salvare, verificare automaticamente conflitti e mostrare conferma:
> "Spostare l'appuntamento alle 17:00?" — [ ANNULLA ] [ CONFERMA ]

### 7.8 Blocco orari dal calendario
Click/tasto destro su un intervallo (es. 14:00–15:00) → "BLOCCA ORARIO" con motivo: Pausa, Impegno personale, Chiusura, Altro. Lo slot diventa NON DISPONIBILE e il cliente non potrà prenotarlo.

### 7.9 Testata giornata di lavoro
In cima al calendario:
```
LUNEDÌ 14 SETTEMBRE 2026
5 APPUNTAMENTI  •  2 IN ATTESA  •  3 CONFERMATI
```
Pulsante: **+ NUOVO APPUNTAMENTO**

---

## 8. GESTIONE SERVIZI (`/admin/services`)

L'amministratore può: creare, modificare, eliminare servizio; modificare prezzo e durata; attivare/disattivare servizio.

---

## 9. ORARI DI APERTURA (`/admin/settings`)

Configurazione per ogni giorno (Lunedì–Domenica): aperto/chiuso, orario apertura, orario chiusura. Supportare pausa (es. 09:00–13:00 / 15:00–19:00).

---

## 10. BLOCCO ORARI (globale, `/admin` → Blocca orari)

L'amministratore può bloccare manualmente: un singolo orario, una fascia oraria, una giornata intera.

Esempio: "Venerdì 18 settembre — 15:00-17:00 — NON DISPONIBILE"

Questi orari spariscono automaticamente dalla pagina di prenotazione cliente.

---

## 11. SINCRONIZZAZIONE CLIENTE ↔ ADMIN (IMPORTANTISSIMO)

Il calendario admin deve essere collegato direttamente al sistema di prenotazione pubblico:

```
CLIENTE
 ↓ seleziona servizio
 ↓ seleziona giorno
 ↓ seleziona orario
 ↓ conferma
 ↓ PRENOTAZIONE SALVATA NEL DATABASE
 ↓ APPUNTAMENTO APPARE AUTOMATICAMENTE NEL CALENDARIO DEL BARBIERE
```

Quando il barbiere modifica/cancella un appuntamento:
```
DATABASE → CALENDARIO ADMIN → SISTEMA DI PRENOTAZIONE CLIENTE
```
deve aggiornarsi automaticamente. Se un orario viene occupato, deve diventare immediatamente non disponibile per gli altri clienti.

### Aggiornamento in tempo reale
Utilizzare **Supabase Realtime** per aggiornare il calendario senza ricaricare la pagina. Se arriva una nuova prenotazione mentre il barbiere guarda il calendario, mostrarla automaticamente con un toast/notifica:
```
🔔 NUOVA PRENOTAZIONE
Mario Rossi — Taglio capelli — Oggi - 17:30
[ VISUALIZZA ]
```

---

## 12. NOTIFICHE

Prevedere struttura predisposta per invio email (SMTP/Resend/Supabase Edge Functions):
- nuova prenotazione al proprietario
- conferma al cliente
- cancellazione al cliente
- modifica appuntamento

---

## 13. RESPONSIVE

### 13.1 Sito pubblico (mobile)
Navbar compatta, hero verticale, CTA molto evidenti, servizi in singola colonna, galleria responsive, calendario prenotazione facile da usare con una mano, pulsanti grandi, form ottimizzato mobile. La prenotazione deve essere estremamente semplice da completare da smartphone.

### 13.2 Admin/Calendario (mobile)
Su desktop: calendario settimanale completo.
Su smartphone: vista giornaliera con scroll tra i giorni:
```
< 10 SET >
11 SET  12 SET  13 SET  14 SET  15 SET  16 SET
```
sotto, elenco appuntamenti della giornata. L'interfaccia deve restare utilizzabile anche mentre il barbiere lavora in negozio.

---

## 14. UX / UI

- animazioni fade-in leggere
- hover eleganti, transizioni 200-300ms
- card con bordi sottili e dettagli oro
- typography elegante, titoli e immagini grandi
- sezioni con molto spazio negativo
- NON esagerare con le animazioni — il sito deve essere veloce e professionale

**Font:**
- Titoli: serif elegante (es. Playfair Display o Cormorant Garamond)
- Testi: Inter o Montserrat
- Il logo NON va ricreato con testo: utilizzare il logo allegato

---

## 15. SICUREZZA E REGOLE DI BUSINESS

- Supabase Auth + Row Level Security
- I clienti NON possono accedere al pannello admin
- Solo utenti con ruolo admin possono: vedere prenotazioni, modificarle, modificare servizi, modificare orari, bloccare appuntamenti, modificare contenuti
- Non esporre mai le credenziali Supabase nel frontend

Il sistema deve impedire sempre:
- doppie prenotazioni
- sovrapposizione di appuntamenti
- prenotazioni fuori dagli orari di apertura
- prenotazioni durante slot bloccati
- prenotazioni per servizi disattivati

---

## 16. IMPORTANTISSIMO

NON creare solamente un mockup grafico. Creare una vera applicazione funzionante con: Frontend, Backend, Database, Autenticazione admin, Sistema prenotazioni, Calendario disponibilità (collegato in tempo reale tra cliente e admin), Gestione servizi, Gestione orari, Gestione appuntamenti.

Tutte le funzionalità devono essere realmente collegate tra loro.

**Ordine di sviluppo consigliato:**
1. Costruire prima una UI completa e premium (sito pubblico + admin/calendario)
2. Implementare il database Supabase (tabelle, RLS, Auth)
3. Collegare tutte le funzionalità (prenotazione pubblica ↔ calendario admin, Realtime, notifiche)

Il risultato finale deve sembrare il sito ufficiale di una barberia premium italiana, non un progetto demo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d69f4056-1391-440e-b8e6-b10f634153e8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
