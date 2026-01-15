Barbershop Loyalty & Operations App

Modern React + TypeScript SPA for end-to-end barbershop ops: dashboard, walk-ins, appointments, clients, rewards, payments, notifications, and integrations (Google Sheets / Green API / Mercado Pago stubs).

Tech Stack & Structure
React 18 + TypeScript (currently a monolithic prototype in barber_loyalty_system.tsx).
Styling: Tailwind-style utility classes + CSS variables for light/dark.
State: Local state persisted to localStorage via a single writer (saveData/persistData) and versioned schema validation (Zod).
Icons: Lucide React.
Assets: public/barbershop_icon.ico (favicon) and public/barbershop_logo.png (logo/bookmark).
Accessibility: ARIA labels on inputs/buttons, readable status badges, keyboardable nav; minimized alert usage (replaced with toasts/notifications).

Key Features & Flows
Navigation & RBAC: Owner/Barber/Reception/Client with permission matrix (Owner-editable). Views hide when not permitted; notifications filtered per role.
Dashboard: KPIs for ventas/servicios/propinas/citas with date selector and scoped data (role/barber filters).
Walk-in & Checkout: Multi-step flow, QR/URL for Mercado Pago, creates a linked appointment + order, accrues stamps, receipts + tip prompts. Cancel disables checkout; simulate payment available for testing.
Appointments: Create/edit/cancel, conflict detection, status/payment badges, barber scoping, reminder stubs (24h/2h), client-side checkout. Client profile cards now have Reprogramar/Cancelar/Check-out actions wired.
Clients: Profile with phone/email sanitization, loyalty stats, history, rewards redemption, quick actions, Owner-only delete, notifications per role.
Rewards: CRUD with validation (name/type/stamp cost), tiers, status; toasts + notifications; persisted.
Notifications: Role-filtered list, badge counts, Owner can clear; blocking popups removed.
Settings: Business info, theme toggle, integrations config (Google Calendar, WhatsApp/Green API, SMS, Mercado Pago sandbox/webhook), reminder days, message templates, team management, permissions matrix, favicon/logo upload, public walk-in URL. Business name syncs the document title.
Reports: Date-range filters; KPIs for ingresos/servicios/propinas/loyalty and barber/service breakdown placeholders; honors paid orders and selected range.
Estilos: Hair/beard catalog pulling images from public/img_styles/<id>.jpg (hair lower-case ids, beard upper-case B-xx). Owner can swap via URL/file upload (persisted locally); fallback to logo.

Data Model (summary)
Customer: id, phone, name, email, opt_in_status, stamps_balance, credit_balance, tier, created_at, last_visit.
Appointment: id, customer_phone/name, barber_id, chair_id, services[], scheduled_at, status, payment_status, source, notes.
Order: id, appointment_id, customer_id/name, barber_id, services[], subtotal/discount/credit_applied/total_due/total_paid, status, mp_order_ref/url, paid_at.
Reward: id, type (CREDIT/SERVICE), value_cop/service_code, stamp_cost, tier_restriction, active.
Notification: id, role scope, title/message, timestamps, read flag.
Settings: business info, theme, integrations (Google/WhatsApp/SMS/Mercado Pago sandbox/webhook), reminder days, message templates, permissions matrix, assets (favicon/logo/public link).
Style: hair/beard catalog entries with id/name/desc/tag/img/pair.

Important Logic
Persistence: loadData/saveData (localStorage) with schema version (DATA_VERSION) and Zod validation; normalizeData fills defaults; redactSensitive strips keys before persistence/sync.
Sanitization: sanitizePhone/sanitizeEmail; regex validation on profile save; consent flag on customers.
Appointments & Orders: Walk-in creates appointment + order; cancel sets statuses; checkout disabled when cancelled; client cards wired to reprogram/cancel/checkout; payment simulation marks order/appointment PAID/COMPLETED and logs loyalty ledger.
Rewards: saveRewardsDirect updates with validation; notifications/toasts emitted.
Notifications: filteredNotifications per role; mark-read on open; Owner can clear all.
Theme: CSS variables applied across nav/panels/forms; toggle persists in state.
Error Boundary: Friendly fallback screen and console logging.

Running / Testing
npm install
Dev server: npm run dev (Vite on 5173)
Build: npm run build
Typecheck/Lint: npm run typecheck (alias npm run lint)

Security & Privacy (Prototype Caveats)
Data + PII stored client-side in localStorage; keys are redacted on persist but still in memory. For production: move to backend/Firebase, use env vars, JWT auth, encryption, consent/deletion endpoints.
Inputs are sanitized client-side; backend validation still required.
Integrations are stubs; no webhook validation or OAuth implemented.

Extending / Next Steps
Swap localStorage for real persistence (Postgres/Firebase/API) and add auth/RBAC enforcement server-side.
Replace stubs with real Green API, Google Calendar OAuth, Mercado Pago webhooks.
Add tests (unit/integration), stricter TS config, and modularize (split monolith into components/hooks/services).
Add CI for npm run typecheck and optional linting.

Assets
barbershop_icon.ico - favicon
barbershop_logo.png - logo/bookmark image
public/img_styles/*.jpg - style catalog images (hc-xx / B-xx)

Releases
No releases published
Create a new release

Packages
No packages published
Publish your first package

Languages
TypeScript
95.2%

CSS
2.5%

JavaScript
2.3%
