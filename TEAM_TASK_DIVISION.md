# Team task division

EkubCircle is one frontend, one backend, and one PostgreSQL database. The six members own different folders of that same system. Nobody builds a separate app.

Suggested branches:

```text
main
develop
feature/auth
feature/database
feature/equb-api
feature/angular-core
feature/member-organizer-ui
feature/admin-qa
```

`develop` is the integration branch. Feature branches merge there after the owner runs the relevant tests. `main` is what the judges see.

## Member 1 — Team Lead + Backend/Architecture

Branch: `feature/auth`

Owns:

- `backend/Authentication`
- `backend/Authorization`
- `backend/Services/EqubRuleService.cs`
- `backend/Services/PayoutService.cs`
- `backend/Services/AuthService.cs`
- `backend/Middleware`
- `backend/Program.cs` composition
- API contract and demo script

Integration: agrees the DTO names with Member 3 and the token shape with Member 4. Payout must stay a server decision. Review every pull request that touches a business rule.

Testing: payout lock, fixed receiver, duplicate payout, suspended account.

## Member 2 — Database + Backend

Branch: `feature/database`

Owns:

- `backend/Data`
- `backend/Entities`
- `backend/Configurations`
- `backend/Migrations`
- `backend/Data/Seed/DbSeeder.cs`

Integration: do not change a column name without telling Member 3 and Member 5. Unique indexes are part of the rules, not an extra. Seed the six demo people plus the admin, with Hana as organizer and member.

Testing: migration applies on a clean database, duplicate member and duplicate payment fail at the database, seed is idempotent.

## Member 3 — Backend/API

Branch: `feature/equb-api`

Owns:

- `backend/Controllers` except the admin controller's behavior, which Member 6 shares
- `backend/DTOs`
- `backend/Services/CircleService.cs`
- `backend/Services/MemberService.cs`
- `backend/Services/RoundService.cs`
- `backend/Services/PaymentService.cs`

Integration: controllers stay thin and call the services. Status codes match `API_CONTRACT.md`. Do not accept a receiver id on payout. Payment amount comes from the circle, not the client.

Testing: create, add, start, rounds generated in order, payment on the open round only.

## Member 4 — Angular Lead

Branch: `feature/angular-core`

Owns:

- `frontend/src/app/core`
- `frontend/src/app/shared`
- `frontend/src/app/layout`
- `frontend/src/app/features/auth`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/styles.scss`

Integration: one `API_URL`, one auth interceptor, guards that read the role from the token payload stored at login. Do not hardcode equb arrays in the shell. Publish the TypeScript models before Member 5 builds screens.

Testing: logged-out users cannot open `/app`, a member cannot open organizer routes, the token is attached to API calls.

## Member 5 — Member + Organizer Frontend

Branch: `feature/member-organizer-ui`

Owns:

- `frontend/src/app/features/member`
- `frontend/src/app/features/organizer`
- `frontend/src/app/features/circle`
- `frontend/src/app/features/rounds`
- `frontend/src/app/features/payments`

Integration: every screen loads from `CircleService`. The payout screen posts an empty body. Show the locked state when `payoutReady` is false, and show "already received — still pays" from `hasReceived`. Empty, loading, and error text stay on each page.

Testing: the Unity Equb click-path with the seeded accounts, including 5/6 then 6/6.

## Member 6 — Admin + QA + Demo

Branch: `feature/admin-qa`

Owns:

- `frontend/src/app/features/admin`
- `backend/Controllers/AdminController.cs`
- `backend/Services/AdminService.cs`
- `backend/Services/AuditService.cs`
- `backend/tests`
- README and the live demo checklist

Integration: admin suspend must not include an endpoint that edits a payout amount or a receiver. Audit rows for `PAYOUT_ATTEMPTED` must remain visible. Keep the demo script in the README aligned with the screens.

Testing: `dotnet test` before every merge to `develop`. Walk the 12-step judge demo on a clean seed. Check laptop width and a narrow browser window.

## How the work fits together

1. Member 2 lands the schema.
2. Member 1 lands login and the rule service.
3. Member 3 lands the equb endpoints on top of those rules.
4. Member 4 lands the Angular shell against login.
5. Member 5 lands the organizer journey against the real API.
6. Member 6 lands admin, the test suite, and the demo data check.

No member should copy a service into a private folder to avoid a merge. If two people need the same DTO, they edit that one file on `develop` after talking.
