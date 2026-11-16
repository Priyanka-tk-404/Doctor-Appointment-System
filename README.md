



https://github.com/user-attachments/assets/f229726c-e30f-4bed-8c16-a40eba0d493a




# Doctor Appointment System

A full-stack app with three roles (**User, Doctor, Admin**).
Stack: **React (Vite) + Node.js + Express + Sequelize + PostgreSQL**. Theme: purple and white.

```
doctor-appointment-system/
├── backend/    Express API + Sequelize models + PostgreSQL connection
│   └── src/ config/ models/ middleware/ routes/ services/ utils/ seed.js server.js
└── frontend/   React app (pages, components, SVG illustrations, lucide icons)
```

How the pieces connect:

```
React (http://localhost:5173)  --axios-->  Express API (http://localhost:5000/api)  --Sequelize-->  PostgreSQL (port 5432)
```

---

## PART 1: Install the tools (one time)

### 1. Node.js
1. Go to https://nodejs.org and install the **LTS** version.
2. Open a new terminal (Command Prompt or PowerShell) and check:
   ```
   node -v
   npm -v
   ```
   Both should print a version number (Node 18 or newer).

### 2. PostgreSQL
1. Go to https://www.postgresql.org/download/ and download the installer for your system (Windows / macOS).
2. Run the installer. Keep everything ticked (PostgreSQL Server, **pgAdmin 4**, Command Line Tools).
3. When it asks for a **password for the superuser "postgres"**, type one and **write it down**. You need it later.
4. Keep the default **port 5432**. Finish the installation.

> Linux (Ubuntu): `sudo apt install postgresql postgresql-contrib`, then `sudo -u postgres psql` and run `ALTER USER postgres PASSWORD 'yourpassword';`

---

## PART 2: Create the database (step by step)

You only create an **empty database**. The app creates all tables for you when it starts.

### Option A: with pgAdmin (visual, easiest)
1. Open **pgAdmin 4** from the Start menu.
2. Left side: click **Servers**, then **PostgreSQL**. Enter the password you set during install.
3. Right-click **Databases** → **Create** → **Database...**
4. Database name: `doctor_appointment` → click **Save**.

### Option B: with the terminal (psql)
1. Open **SQL Shell (psql)** from the Start menu. Press Enter for Server, Database, Port, Username (defaults), then type your password.
2. Run:
   ```sql
   CREATE DATABASE doctor_appointment;
   \l
   ```
   You should see `doctor_appointment` in the list. Type `\q` to exit.

---

## PART 3: Run the backend

1. Open a terminal in the project and go to the backend folder:
   ```
   cd doctor-appointment-system/backend
   ```
2. Create your settings file from the example:
   - Windows: `copy .env.example .env`
   - macOS / Linux: `cp .env.example .env`
3. Open `.env` in any editor and change:
   - `DB_PASSWORD` → the PostgreSQL password from Part 1
   - `JWT_SECRET` → any long random text
   - (`DB_NAME` must stay `doctor_appointment` unless you used another name)
4. Install packages and start:
   ```
   npm install
   npm run dev
   ```
5. You should see:
   ```
   PostgreSQL connected
   Tables ready
   Admin account created: admin@example.com
   Reminder job running every minute
   API running on http://localhost:5000
   ```
   Keep this terminal open.

**Optional demo data** (3 approved doctors with slots + 1 patient). Open a second terminal in `backend` and run:
```
npm run seed
```
Demo logins (password `Demo@123`): `patient@example.com`, `asha@example.com`, `karthik@example.com`, `meena@example.com`.

### Check the tables in pgAdmin
pgAdmin → Servers → PostgreSQL → Databases → `doctor_appointment` → Schemas → public → **Tables** (right-click Tables → Refresh).
You will see: `Users`, `DoctorProfiles`, `Slots`, `Appointments`, `Prescriptions`, `Notifications`, `Settings`.
To view rows: right-click a table → View/Edit Data → All Rows.

---

## PART 4: Run the frontend

1. Open a **new** terminal:
   ```
   cd doctor-appointment-system/frontend
   ```
2. Create the settings file:
   - Windows: `copy .env.example .env`
   - macOS / Linux: `cp .env.example .env`
   (It contains `VITE_API_URL=http://localhost:5000`. Change it only if your backend uses another port.)
3. Install and start:
   ```
   npm install
   npm run dev
   ```
4. Open **http://localhost:5173** in your browser.

---

## PART 5: Try the whole flow

1. **Admin**: log in with `admin@example.com` / `Admin@123` (from your `.env`). Open *App settings* to set the commission % , app name and logo.
2. **Doctor**: click *I am a doctor* → register with a certificate (PDF/JPG/PNG). The dashboard shows "Waiting for approval".
3. **Admin**: *Doctors* tab → view the certificate → **Approve**. The doctor gets a notification.
4. **Doctor**: refresh status → *Availability* → pick a date (more than 24 hours ahead to test cancel/reschedule) → create slots.
5. **Patient**: register → *Find doctors* → see fee breakdown (doctor fee + commission = total) → pick a slot → confirm.
6. **Patient**: *My appointments* → Reschedule (preview of the next free slot, then confirm) or Cancel.
7. **Doctor**: after the appointment time starts → *Mark completed* and *Add prescription*. The patient sees it under *Prescriptions* and in the bell notifications.

---

## Troubleshooting

| Message | Fix |
|---|---|
| `password authentication failed for user "postgres"` | `DB_PASSWORD` in `backend/.env` is wrong. Use the password from the PostgreSQL install. |
| `database "doctor_appointment" does not exist` | Do Part 2 again, or make `DB_NAME` match your database name. |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL is not running. Windows: Start menu → Services → *postgresql-x64-xx* → Start. |
| `JWT_SECRET is missing` | You did not create `.env` (copy `.env.example`) or left JWT_SECRET empty. |
| `Port 5000 already in use` | Change `PORT` in `backend/.env` and `VITE_API_URL` in `frontend/.env`, restart both. |
| Browser shows "Cannot reach the server" | Backend is not running, or `VITE_API_URL` is wrong. Open http://localhost:5000/api/health, it should show `{"ok":true}`. |
| CORS error in the browser console | `CLIENT_URL` in `backend/.env` must equal the frontend address (`http://localhost:5173`). Restart the backend. |
| Changed a model and the table did not update | `sync()` only creates missing tables. In development you can drop the database and recreate it, or use Sequelize migrations. |

---

## Database design (relationships)

```
Users 1 ──── 0..1 DoctorProfiles          (a doctor user has one profile: fee, speciality, certificate, status)
DoctorProfiles 1 ──── * Slots             (unique: doctorId + startAt)
Users 1 ──── * Appointments               (patient)
DoctorProfiles 1 ──── * Appointments
Slots 1 ──── 0..1 Appointments            (Appointments.slotId is UNIQUE: one booking per slot)
Appointments 1 ──── 0..1 Prescriptions
Users 1 ──── * Notifications
Settings                                  (name/value: appName, commissionPercent, logoPath)
```

## API overview (all under `/api`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/register-doctor` (multipart), `POST /auth/login`, `GET /auth/me` |
| Doctors | `GET /doctors?q=`, `GET /doctors/:id` (with free slots), `GET/PUT /doctors/me/profile` |
| Slots (doctor) | `GET /slots/mine`, `POST /slots` (range split into slots), `DELETE /slots/:id` |
| Appointments | `GET /appointments` (role aware), `POST /appointments`, `POST /:id/cancel`, `GET /:id/reschedule-preview`, `POST /:id/reschedule`, `PATCH /:id/complete` |
| Prescriptions | `POST /prescriptions` (doctor), `GET /prescriptions` |
| Notifications | `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read` |
| Admin | `GET /admin/stats`, `GET /admin/doctors`, `GET /admin/doctors/:id/certificate`, `PATCH /admin/doctors/:id/approve`, `PATCH /admin/doctors/:id/reject`, `GET /admin/users`, `PATCH /admin/users/:id/toggle` |
| Settings | `GET /settings/public`, `PUT /settings` (admin, multipart logo) |

## Edge cases handled

- **No double booking**: the slot row is locked inside a database transaction, and `Appointments.slotId` is unique. Two people clicking the same slot: one succeeds, the other gets a clear message.
- **Patient clash**: a patient cannot hold two appointments at overlapping times.
- **24-hour rule**: cancel and reschedule are blocked (server side, not only in the UI) within 24 hours of the start time.
- **Reschedule on confirmation**: the user first sees the next free slot, then confirms. If none is free, the appointment stays unchanged. Slots where the patient is already busy are skipped.
- **Cancelled slots are released** and can be booked again.
- **Fees are frozen at booking**: later changes to the commission or the doctor fee do not change existing appointments.
- **Reminders** (1 day, 1 hour, 15 minutes) run every minute and go to both patient and doctor. Each is sent once. A late booking does not trigger reminders that are already in the past, and after server downtime only the closest due reminder is sent.
- **Doctor approval**: unapproved doctors cannot create slots or prescriptions and are hidden from patients.
- **Slot creation**: no past times, max 12 hours per range, overlapping slots are skipped, booked slots cannot be deleted.
- **Prescriptions** only after the appointment starts; one per appointment (editing updates it).
- **Uploads**: only PDF/JPG/PNG/WebP, 5 MB max, random file names. Doctor certificates are **private** (only an admin can open them). A failed registration deletes the uploaded file.
- **Passwords** are hashed with bcrypt. Login tokens expire in 7 days. Deactivated users are locked out immediately.

## Next steps for a real launch
Use Sequelize migrations instead of `sync()`, send reminders by email or SMS (the notification service is the single place to extend), add payment handling, rate limiting and HTTPS, and store uploads in cloud storage.
