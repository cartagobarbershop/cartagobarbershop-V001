# Google Sheets + Apps Script Integration (code.gs)

This app ships with a sample Apps Script (`code.gs`) to bridge Google Sheets and GREEN-API (WhatsApp) and to exchange snapshots with the web app.

## Prerequisites
- A Google Sheet with these tabs (case-sensitive): `Clients`, `Appointments`, `Loyalty`, `Notifications`.
- GREEN-API credentials (`ID_INSTANCE`, `API_TOKEN`).
- (Optional) A published Web App URL to let the React app load/save snapshot data.

## Setup Steps
1) Open your Google Sheet -> Extensions -> Apps Script.
2) Paste the contents of `code.gs` into the script editor.
3) Replace `YOUR_ID_INSTANCE` and `YOUR_API_TOKEN` at the top with your Green API credentials. For production, store them in Script Properties instead of hardcoding.
4) Click Deploy -> New deployment -> Select type "Web app".
   - Execute as: Me
   - Who has access: Anyone
   - Copy the Web App URL.
5) In the React app settings, set `settings.sheets_web_app_url` to that Web App URL if you want snapshot sync.

## Column Expectations (Appointments sheet)
Assumed columns: Date | Time | Phone | Barber | ? | Status
- Confirmations: status moves from `Pending` -> `Confirmed` when client replies "1"/"confirm".
- Reminders: time-driven trigger looks for status `Confirmed` and sends at ~24h and ~2h before.

## Triggers to Add in Apps Script
- Time-driven: hourly -> `sendReminders`
- Webhook: publish as Web App (step 4) to handle incoming WhatsApp (GREEN-API webhook URL)

## Snapshot Exchange (React app <-> Sheets)
- `doPost` with `{ snapshot }` stores the JSON in Script Properties (version-checked against `DATA_VERSION=2`).
- `doGet` returns `{ snapshot }` JSON for the React app to load.

## Manual Helpers
- `sendFromSheet()`: reads A2 (phone) and B2 (message), sends via GREEN-API, and logs result in C2.

## Safety & Production Notes
- Move credentials to Script Properties (do not hardcode).
- Validate the spreadsheet tab names and column order before going live.
- Keep `DATA_VERSION` in sync with the React app to avoid loading incompatible snapshots.
