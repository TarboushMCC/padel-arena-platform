# Padel Arena Platform

Production-ready fullstack implementation aligned to `padel_arena_website_spec_v2.txt`.

## Stack
- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- Auth.js (NextAuth credentials)
- Stripe checkout/webhook support

## Key Features
- Public pages: home, about, courts, booking, pricing, events, contact, FAQ
- Authentication: register, login, profile update
- Booking engine: availability, hold creation, transactional booking creation
- User account: overview, bookings, profile
- Admin dashboard: bookings, courts, pricing, events, FAQ, contacts, settings
- REST APIs for all spec-defined resources
- SEO metadata routes (`/robots.txt`, `/sitemap.xml`)

## Project Structure
- `src/app`: pages + API routes
- `src/components`: shared/public/account/admin UI components
- `src/lib`: domain logic (booking, pricing, auth, settings, rate limit)
- `prisma/schema.prisma`: full relational schema
- `prisma/seed.ts`: starter content and admin user

## Setup
1. Copy env file:
   - `copy .env.example .env`
2. Install dependencies:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations:
   - `npm run prisma:migrate`
5. Seed starter data:
   - `npm run prisma:seed`
6. Start app:
   - `npm run dev`

## Default Seed Admin
- Email: `admin@padelarena.com`
- Password: `Admin@12345`

## Stripe
Configure the following in `.env`:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Webhook endpoint:
- `POST /api/payments/stripe/webhook`

## Test Commands
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`

## Notes
- Node/npm are required locally to run build/tests.
- Payment mode and booking policies are configurable via `site_settings`.
- Guest checkout is enabled by default via seeded setting.
