# EkubCircle — QIYAS Hackathon 2026

Track every contribution. Protect every round.

EkubCircle is a digital ledger for a traditional Ethiopian Equb circle. It records members, contributions, rounds, and payouts. It does **not** move money. There is no Telebirr, bank transfer, wallet, or payment gateway. Amounts such as 25,000 ETB are recorded figures only.

## Problem

A paper Equb notebook is easy to misremember. People disagree about who has paid, who already received the pot, and whose turn is next. A member who already received must still pay in later rounds, and the pot should not be handed over until everyone has paid. Those rules are hard to defend from memory.

## Solution

EkubCircle turns those rules into a server-enforced ledger:

```text
Angular
   ↓
ASP.NET Core REST API
   ↓
Service layer and Equb rules
   ↓
EF Core
   ↓
PostgreSQL
```

The organizer never types the receiver at payout time. The API reads the fixed order created when the equb starts. If five of six members have paid, payout is rejected.

## Features

- Register and log in with JWT, as a member, organizer, or seeded platform admin
- Create an equb, add and reorder members, then start it
- Starting locks the member list, contribution, and payout order, and creates one round per member
- Record one payment per member per round
- Block payout until every member has paid
- Pay the recorded pot to the server-chosen receiver
- Keep previous receivers on the payment list for later rounds
- Open the next round only after the current one is paid out
- Complete the equb when every member has received exactly once
- Member, organizer, and admin dashboards
- Transparency summary and a server-side integrity checklist
- Audit log of important actions, including rejected payouts
- Language switcher for English, Afaan Oromo, and Amharic (English is the working language)

## User Roles

| Role | What they can do |
| --- | --- |
| Member | View their equb, current round, contribution history, payout history, profile, and activity |
| Organizer | Everything a member can do, plus create and run the equb. The organizer is also a member |
| Admin | Search users and equbs, suspend or reactivate them, read reports and audit logs. Admins cannot rewrite payouts |

## Tech Stack

- Frontend: Angular 22, TypeScript, reactive forms, HttpClient, route guards
- Backend: ASP.NET Core Web API on .NET 10, C#
- Data: EF Core 10, Npgsql, PostgreSQL
- Auth: JWT bearer tokens and BCrypt password hashes

## Architecture

Controllers stay thin. They call services. Services enforce the Equb rules and talk to EF Core.

```text
Controllers
    ↓
CircleService, MemberService, RoundService, PaymentService, PayoutService
    ↓
EqubRuleService and CircleAccess
    ↓
AppDbContext
    ↓
PostgreSQL
```

Angular never decides the receiver, the pot, or whether payout is allowed. It only displays what the API returns.

## Database Schema

- `Users` — account, role, status
- `Circles` — equb settings and lifecycle (`FORMING`, `ACTIVE`, `COMPLETED`) plus an `IsSuspended` flag
- `CircleMembers` — membership and payout order. Unique `(CircleId, UserId)` and `(CircleId, PayoutOrder)`
- `Rounds` — one row per member, with the receiver stored at start. Status `PENDING`, `OPEN`, or `PAID_OUT`
- `Payments` — one recorded contribution. Unique `(RoundId, CircleMemberId)`
- `AuditLogs` — who did what, and when

Future rounds stay `PENDING` until the organizer opens them. That is how "open next round" stays an explicit step.

## API Endpoints

See [API_CONTRACT.md](API_CONTRACT.md). The live demo path is:

```http
POST /api/auth/login
POST /api/circles
POST /api/circles/{id}/members
POST /api/circles/{id}/start
POST /api/rounds/{roundId}/payments
POST /api/rounds/{roundId}/payout
POST /api/circles/{id}/rounds/next
```

## Team Members & Responsibilities

Six people, one frontend, one backend, one database. See [TEAM_TASK_DIVISION.md](TEAM_TASK_DIVISION.md).

| Member | Area |
| --- | --- |
| 1 | Team lead, auth, JWT, Equb rules, payout validation |
| 2 | EF Core, entities, constraints, migrations, seed |
| 3 | Circle, member, round, and payment APIs |
| 4 | Angular shell, routing, guards, interceptor |
| 5 | Member and organizer screens |
| 6 | Admin, audit, tests, demo |

## How to Run Backend

Install the .NET 10 SDK first. Check with `dotnet --version` (it should be 10.x).

PostgreSQL must be running. The default local connection string is:

```text
Host=localhost;Port=5432;Database=ekubcircle;Username=postgres;Password=postgres
```

With Docker:

```bash
docker compose up -d
```

If your local PostgreSQL password is different, set it before the commands below:

```bash
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=ekubcircle;Username=postgres;Password=YOUR_PASSWORD"
```

Create the database if it does not exist:

```bash
psql -h localhost -U postgres -c "CREATE DATABASE ekubcircle"
```

Then:

```bash
cd backend
dotnet tool restore
dotnet restore
dotnet ef database update
dotnet run
```

The API listens on `http://localhost:5080`. In Development it also applies migrations and seeds demo data on startup. Swagger is at `http://localhost:5080/swagger`.

## How to Run Frontend

```bash
cd frontend
npm install
ng serve
```

Open `http://localhost:4200`. The API base URL is `API_URL` in `frontend/src/app/shared/models/models.ts`.

## Database Setup

1. Start PostgreSQL (local install or `docker compose up -d` from the project root).
2. Create the `ekubcircle` database.
3. From `backend`, run `dotnet tool restore` and `dotnet ef database update`.

The migration is `Migrations/20261005100737_InitialCreate.cs`.

## Seed Data

On an empty database the API seeds:

- 1 platform admin
- 6 people
- 1 active equb, **Bole Family Equb**, 25,000 ETB, monthly
- 6 members and 6 rounds
- Round 1 is open and nobody has paid yet, so payout is locked at 0/6

Fixed order for the seeded equb:

| Round | Receiver |
| --- | --- |
| 1 | Hana Bekele |
| 2 | Abel Tesfaye |
| 3 | Ruth Alemu |
| 4 | Samuel Desta |
| 5 | Meron Girma |
| 6 | Dawit Kebede |

Hana is the organizer and also member 1. The live demo should create a second equb named **Unity Equb** so the judges see the full journey. Bole Family Equb is there so dashboards are not empty.

## Demo Credentials

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Organizer | Hana Bekele | hana@ekubcircle.et | Organizer@123 |
| Member | Abel Tesfaye | abel@ekubcircle.et | Member@123 |
| Member | Ruth Alemu | ruth@ekubcircle.et | Member@123 |
| Member | Samuel Desta | samuel@ekubcircle.et | Member@123 |
| Member | Meron Girma | meron@ekubcircle.et | Member@123 |
| Member | Dawit Kebede | dawit@ekubcircle.et | Member@123 |
| Admin | Platform Admin | admin@ekubcircle.et | Admin@12345 |

The login screen can fill these in. They are local demo accounts.

## Working Features

The judge demo:

1. Log in as Hana.
2. Create **Unity Equb**, contribution **25000**, meeting **Monthly**.
3. Add Hana, Abel, Ruth, Samuel, Meron, and Dawit, in that order.
4. Show the payout order.
5. Start the equb. Members, contribution, and order lock. Six rounds appear.
6. On round 1, mark five members paid.
7. Open payout. The API rejects it: payout locked, 5/6 paid.
8. Mark the sixth member paid. Current pot becomes 150,000 ETB.
9. Pay out. The server selects Hana. Do not type a receiver.
10. Round 1 is paid out.
11. Open round 2. Hana is still on the payment list, marked as already received.
12. Paying round 1 again is rejected.

Tests covering these rules are in `backend/tests/EqubEngineTests.cs`.

```bash
cd backend
dotnet test
```

## Known Limitations

- English is the only fully translated language. The selector also has Afaan Oromo and Amharic for the shell.
- Notifications are an activity feed from the audit log, not SMS or push.
- One organizer owns each equb. There is no co-organizer.
- Admin suspension blocks changes. It does not edit payment history.
- The app does not send reminders, print PDFs, or calculate fines.
- Demo passwords and the JWT signing key in `appsettings.json` are for local use only.

## Future Improvements

- Late-payment flag and a fixed late fine that still cannot bypass the payout lock
- A draw among members who have not received, if a circle wants that instead of a fixed order
- Completed-circle analytics over many equbs
- Fuller Oromo and Amharic translations
- Stronger production secrets, outside the demo `appsettings.json`

## Five-minute pitch

- 0:00 — A paper Equb is a memory problem. EkubCircle is the rule book, not a bank.
- 0:30 — Show Angular → API → EF Core → PostgreSQL.
- 1:00 — Live demo from create, through the locked 5/6 payout, to round 2 where the receiver still pays.
- 4:00 — Open the summary page: progress, next receivers, integrity checks.
- 4:30 — Limitations: no real payments, no SMS. The value is a ledger people can trust.
