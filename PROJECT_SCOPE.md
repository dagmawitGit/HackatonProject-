# EkubCircle — Project Scope

QIYAS Full-Stack Development Hackathon 2026, Challenge 3.

## Problem

Traditional Equb circles depend on a notebook and the organizer's memory. Disputes happen when it is unclear who paid, whose turn it is, or whether someone who already received the pot must keep contributing. The product has to make those rules visible and enforce them on the server.

## Target users

- Equb members who want to see their own status
- Organizers who keep the ledger for one circle
- A platform admin who can suspend a bad account or equb without editing the money history

## MVP

One integrated application:

- Authentication with three roles
- Equb lifecycle: `FORMING` → `ACTIVE` → `COMPLETED`
- Member list and a fixed payout order locked at start
- One round per member
- Payment recording with a unique payment per member per round
- Payout blocked until every member has paid
- Receiver chosen by the server from the fixed order
- Previous receivers continue to pay
- Dashboards for member, organizer, and admin
- Audit log
- Seed data for a six-person demo

The recorded pot is `members × contribution`. For six people at 25,000 ETB, a full round is 150,000 ETB. That number is a ledger total. No money is transferred.

## Out of scope

- Telebirr, CBE, bank transfer, payment gateways, wallets, crypto
- Interest, loans, investment, bidding
- SMS, PDF statements, and a chatbot
- Multiple payout rules in one equb
- Real-time sockets

## Business rules

1. A member receives the pot at most once.
2. A member who already received still pays in later rounds.
3. Payout is refused unless paid count equals member count.
4. The receiver comes from the round row written at start. The request body cannot name someone else.
5. One payment per member per round, enforced by a unique index.
6. A round can be paid out once.
7. Only the current open round accepts payments and payout.
8. Members, contribution, and order cannot change after start.
9. The organizer must also be a member before start.
10. At least two members are required to start.
11. The equb completes only when every member has received exactly once.
12. A suspended user cannot log in. A suspended equb cannot be changed. History is kept.

## Database design

`User` is the login account. `CircleMember` is that person's seat in one equb, including payout order and whether they have received. `Round` is separate so each cycle has its own receiver, status, and payments. `Payment` stores the recorded contribution. Splitting these tables is what makes "already received, still pays" possible: `HasReceived` does not remove the member from the next round's payment list.

## Architecture

```text
Angular HttpClient
        ↓
Thin controllers and DTOs
        ↓
Services
        ↓
EqubRuleService
        ↓
EF Core
        ↓
PostgreSQL
```

Authorization is the JWT role plus an ownership check: only `Circle.OrganizerId` can record payments or pay out that equb.

## Demo journey

Log in as the organizer, create Unity Equb, add six members, start, show the locked order, record 5/6 payments, show the rejected payout, record the last payment, pay out, open the next round, and show that the previous receiver is still required to pay.

## Innovation

The summary screen shows contribution progress, payout progress, the current receiver, the next receivers, and an integrity checklist:

- members are active accounts
- payment rows are consistent
- each receiver matches payout order
- paid-out rounds and `HasReceived` flags agree
- at most one round is open

## Known limitations

Language coverage outside English is partial. There is no late fine, no draw, and no production-grade secret store. Admin tools observe and suspend; they do not repair a ledger by hand.
