
# EARLY CARE — Updated Hospital Monitoring Platform

Early Care is a **clinical decision-support / college-project system** for continuous deterioration monitoring. It is not an autonomous diagnosis, treatment, or medication-prescribing system.

## What was added

### Separate portals
- Doctor portal: all patients, live vitals, alert priority queue, patient registry, camera, audit trail.
- Patient portal: only the logged-in patient's health, risk, alerts, and room-safety view.
- Login page with Doctor/Patient role selection.
- Sign-in and account creation.
- Doctors can register patients and create their patient login credentials.

### Deterioration intelligence
- Continuous risk score 0–100.
- Patient-specific digital baseline.
- Trend classification: Stable / Improving / Deteriorating.
- Multi-vital interaction detection.
- Risk levels: Low / Medium / High / Critical.
- Alert priority queue.
- Explainable alerts showing the contributing changes.
- Smart suppression logic for brief isolated excursions.
- "What changed?" view.
- Audit trail and alert acknowledgement.
- Alert threshold: risk >= 50.

### Real-time browser features
- Vitals update every few seconds to exercise the live monitoring pipeline.
- Laptop camera access with browser permission.
- Movement-detection signal from the live camera.
- Audible browser alarm for high-risk events.
- Browser notifications.
- Camera view requests microphone permission as well as camera permission; the system does not record or upload audio.

### Optional SMS / WhatsApp gateway
`notification-service/app.py` is an optional Twilio gateway. It is intentionally separated from the React application so Twilio secrets are never placed in browser code.

Set:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_SMS
- TWILIO_FROM_WHATSAPP

The React app will attempt to send an SMS notification to the local gateway when a risk alert is generated. If the gateway is not configured, browser notifications and the audible alarm still work.

## Run on localhost

### 1. Frontend

Requirements: Node.js 20+ recommended.

```powershell
cd .\hackthon\Frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally:

`http://localhost:5173`

The browser will ask for camera/microphone permission when Room Camera is started.

### 2. Optional SMS/WhatsApp service

Requirements: Python 3.10+.

```powershell
cd .\hackthon\notification-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:TWILIO_ACCOUNT_SID="YOUR_SID"
$env:TWILIO_AUTH_TOKEN="YOUR_TOKEN"
$env:TWILIO_FROM_SMS="+YOUR_TWILIO_NUMBER"
$env:TWILIO_FROM_WHATSAPP="whatsapp:+YOUR_TWILIO_WHATSAPP_NUMBER"

python app.py
```

The gateway runs at `http://127.0.0.1:5001`.

### 3. Existing Spring Boot backend

The original Java backend remains in:

`hackthon/care-triage`

If you want to continue extending the persistent MySQL API, run:

```powershell
cd .\hackthon\care-triage
.\mvnw.cmd spring-boot:run
```

The current upgraded React interface is deliberately able to run independently for the localhost presentation; it stores the working project state in browser localStorage. This avoids blocking the UI on a MySQL configuration during a college demo.

## Login

The project starts with these local accounts:

- Doctor: `doctor` / `doctor123`
- Patient: `patient` / `patient123`

These credentials are only for local development. For a real hospital deployment, replace them with a proper identity provider, hashed passwords, MFA, JWT/session authorization, audit logging, encrypted transport, and hospital-approved access controls.

## Hospital-safety boundaries

This project must be presented as a **clinical decision-support prototype**.

It does NOT:
- diagnose a disease;
- prescribe medication;
- select drug doses;
- replace a nurse/doctor;
- claim that camera motion alone proves a fall, seizure, or pressure injury;
- claim to predict an exact time-to-deterioration.

For an emergency, the UI recommends clinician assessment and escalation according to the hospital's approved protocol. Treatment and medication decisions remain with qualified healthcare professionals.

Camera movement detection is a prototype signal for human review. A production implementation would need validated computer-vision models, privacy controls, consent, secure storage, hospital policy approval, testing, and clinical validation.

## Suggested presentation architecture

Patient monitors/sensors
→ data ingestion
→ patient baseline
→ trend engine
→ multi-vital interaction
→ hybrid risk score
→ alarm suppression
→ alert priority queue
→ nurse/doctor dashboard
→ acknowledgement/escalation
→ audit trail

The signature question is:

**"What is wrong, how serious is it, how fast is it changing, and who should be attended to first?"**

## Reference material supplied for this project

- PMC article supplied by the project team: https://pmc.ncbi.nlm.nih.gov/articles/PMC11780298/
- VitalWatch repository supplied by the project team: https://github.com/roman-dusek/VitalWatch
- Medtronic Vital Sync page supplied by the project team:
  https://www.medtronic.com/en-us/healthcare-professionals/products/patient-monitoring/remote-patient-monitoring/intelligent-patient-monitors/healthcast-vital-sync-remote-patient-monitoring.html

The references are used as design inspiration. They are not a substitute for clinical validation or hospital policy.
