# Team Workflow

## Branches

- `main`: stable demo/release branch
- `develop`: shared integration branch
- `feature/auth`: Member 1, backend authentication architecture; Member 4, frontend authentication
- `feature/database`: Member 2, EF Core schema, migrations, and seed data
- `feature/equb-api`: Member 3, circle, member, round, payment, and payout API work
- `feature/angular-core`: Member 4, Angular routing, guards, interceptors, and shared UI
- `feature/member-organizer-ui`: Member 5, member and organizer dashboards and workflows
- `feature/admin-qa`: Member 6, admin, tests, audit, README, and demo preparation

## Ownership

- Member 1: architecture, backend authentication, integration, and critical server-side rules
- Member 2: EF Core, schema, migrations, seed data, and database constraints
- Member 3: backend circle, member, round, payment, and payout modules
- Member 4: Angular architecture, routing, frontend authentication, guards, interceptors, shared UI, and layouts
- Member 5: member/organizer dashboards and circle/round workflows
- Member 6: platform admin, QA, audit, documentation, and demo preparation

Keep changes inside the assigned module when practical. Agree on DTOs and route contracts before parallel implementation. Merge feature branches into `develop` through review; promote only verified work to `main`. Do not commit secrets or generated local configuration.
