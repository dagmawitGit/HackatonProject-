# Database

The EF Core model is in `backend/EkubCircle.Api/Entities`; entity-specific constraints and relationships are in `Data/Configurations`. PostgreSQL is configured through `ConnectionStrings:DefaultConnection`.

The initial model covers users, circles, circle members, rounds, and payments. It includes primary keys, foreign keys, unique user email, unique membership per circle, unique payout-order slots per circle, unique round numbers per circle, and a unique payment per round/member pair. Composite foreign keys keep a payment's round and member in the same circle. A member can be assigned as a receiver at most once in a circle at the database level.

Migrations and seed data are intentionally not included. Review the initial schema, then generate and inspect the first migration before applying it. Authentication credential storage, audit/history persistence, and any additional invariants need design before implementation.
