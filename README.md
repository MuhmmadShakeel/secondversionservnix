# Servnix

Servnix is a local services marketplace with customer, service provider, and platform admin accounts.

## Development

Use Node.js and PostgreSQL. In `backend/.env.local`, set `DATABASE_URL`, `JWT_SECRET`, and optionally `PORT`, `CLIENT_URL`, and `JWT_EXPIRES_IN` (default `7d`). Do not commit the environment file.

For password recovery, also set `SMTP_HOST`, `SMTP_PORT` (usually `587` or `465`), `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` (a verified sender address) in `backend/.env.local`. The user receives an 8-digit email verification code, then enters it with a new password on the recovery page. Codes expire after 20 minutes or five incorrect attempts. Run the database migration after updating the backend. Without SMTP configuration, password recovery remains unavailable; signed-in password changes still work.

```text
cd backend
npm install
npm run migrate
npm run dev

cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/v1` requests to the backend on port 3000. If you change the backend port, update `frontend/vite.config.js` too.

## Main flow

1. A new account starts as a customer. An existing platform admin can grant the `service_provider` role in the admin Users section.
2. The provider creates an organization with services and opening hours. An admin approves the organization before it appears publicly.
3. A customer selects an available start time. The booking starts as `pending`.
4. The provider approves or rejects the request. Rejection requires a reason. Both parties see status updates in their dashboards.
5. A customer can cancel or request a new time for an upcoming booking. A changed time returns to `pending` for provider review.
6. After a confirmed appointment finishes, the provider marks it completed. The customer can then leave one review and book the same service again.
7. A pending request expires when its appointment start time passes without a provider decision. The expiry is recorded in appointment history, both parties receive an in-app notification, and the customer can request that service again.

Customer cancellations and reschedules are recorded in `appointment_history` with the previous status and time, new status and time, acting user, and any employee assignment removed by a reschedule. Existing bookings from before this migration have no retroactive history.
Provider rejections are also recorded there with the rejection reason. The API applies pending database migrations before it starts the booking expiry task.
Provider approvals and completions are recorded in the same history. Customers and providers can open each booking's timeline in their dashboards. Older actions are not backfilled; the original request time comes from the booking record.

Booking times are entered and displayed in Pakistan Standard Time. Customers can select a suggested start time or enter one manually, and request 15 to 480 minutes. The server checks the complete requested interval against opening hours and other bookings. Service price is prorated from the provider's price and base duration (for example, Rs. 1,000 per 60 minutes becomes Rs. 1,166.67 for 70 minutes). The requested minutes, calculated amount, and provider rate snapshot are stored with the appointment. Displayed amounts are informational; online collection is not configured.

## Verification

```text
cd backend
npm test

cd frontend
npm run lint
npm run build
```

API routes are documented in `backend/swagger.yml`. Booking updates use in-app notifications. Online payment collection and email delivery are not configured; displayed prices are informational.
