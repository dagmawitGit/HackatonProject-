# Technical defense notes

Each person should be able to open the folder they own and explain it without reading a script. These are the questions judges tend to ask, answered against this codebase.

## Backend

### Why did you use services?

Controllers only read the HTTP request and return a status code. `CircleService`, `PaymentService`, and `PayoutService` own the steps. That keeps the Equb rules in one place, so a second screen cannot bypass them by calling a different controller.

### Why should controllers remain thin?

If payout math lived in `PayoutsController`, a future endpoint could forget a check. The controller calls `PayoutService.PayOutAsync` and returns `200` or lets `ExceptionMiddleware` turn an `ApiException` into `409` with a message. The tests call the service directly, so the rules do not depend on HTTP.

### How is JWT authentication implemented?

`AuthService` checks the email and BCrypt hash, then `JwtTokenService` signs a token with the user's id, email, name, and role. `Program.cs` validates the issuer, audience, signing key, and expiry. The Angular interceptor stores the token and sends `Authorization: Bearer`.

### How is authorization enforced?

`[Authorize(Roles = "Organizer")]` is the first gate. It uses the role inside the token, not a role sent in the body. `CircleAccess` is the second gate: the caller's id must equal `Circle.OrganizerId`. An organizer cannot record a payment on someone else's equb. Admin routes use `[Authorize(Roles = "Admin")]`.

### How does the payout validation work?

`PayoutService` loads the round and its payments. `EqubRuleService.EnsureCanPayOut` rejects a round that is already paid out, a round that is not open, a round where `paidCount != memberCount`, a receiver who already has `HasReceived`, and a receiver whose payout order is not the round number. The amount is `memberCount * contributionAmount`.

### Where is the receiver determined?

In `CircleService.StartAsync`. Each member's payout order becomes a round number, and `ReceiverMemberId` is that member's id. `PayoutService` reads that column. `PayoutsController` has no receiver field.

## Database

### Why is CircleMember separate from User?

A user is an account. A circle member is a seat: payout order, join date, and whether this person has received the pot in this equb. The same user could be in more than one equb. Unique `(CircleId, UserId)` stops duplicate seats.

### Why is Round separate from Circle?

A circle has many cycles. Each cycle has its own receiver, open time, payout time, and payments. That is what lets round 2 still charge the person who received round 1.

### How do you prevent duplicate payments?

`PaymentConfiguration` creates a unique index on `(RoundId, CircleMemberId)`. The service also checks before insert and returns `409` with a clear message. If two requests race, the database still rejects the second.

### How do you prevent duplicate payout?

`EnsureCanPayOut` returns `409` when `Round.Status` is already `PaidOut`. The status is updated in the same save as `HasReceived` and the payout amount. There is no second payout endpoint.

## Angular

### How does Angular communicate with the API?

`CircleService` and `AuthService` use `HttpClient`. Pages subscribe and store the result in signals. There is no mock array of members or rounds. The base URL is `API_URL` in `shared/models/models.ts`.

### Where is the authentication token stored?

`SessionStore` writes `ekub-token` and `ekub-user` to `localStorage`, and keeps them in signals so the navbar can show the name. The interceptor reads the signal. Logout clears both.

### How do route guards work?

`authGuard` blocks `/app` when there is no token. `roleGuard` reads `data.roles` on the route and compares it to the stored user role. A member who types an organizer URL is sent back to the member dashboard.

### How do reactive forms validate input?

Login, register, and create-equb use `FormBuilder` with `Validators.required`, `Validators.email`, `Validators.minLength`, and `Validators.min`. The template shows the message after the control is touched. The API validates again.

## Business rules

### What happens if only 5/6 members pay?

`POST /api/rounds/{id}/payout` returns `409` and the message `Payout is locked. All members must pay before payout.` The summary shows `paidCount: 5`, `currentPot` of 125,000 when the contribution is 25,000, and `waitingFor` with the missing name. The audit log stores `PAYOUT_ATTEMPTED`.

### What happens if the organizer tries to choose a different receiver?

They cannot. The payout request has no receiver field. Extra JSON is ignored. The name on the success response is the member stored on the round at start.

### What happens if the receiver already received?

`EnsureCanPayOut` returns `409`: `This member has already received the pot.` The normal flow also avoids this, because each round was given a different member at start.

### Why does a previous receiver continue paying?

`HasReceived` is only a flag on the membership. `PaymentService` does not filter those members out. Round 2's payment list is still every `CircleMember`. The screen labels them "Already received — still pays."

## What each person should demo if asked

- Member 1: open `EqubRuleService.EnsureCanPayOut` and the payout test.
- Member 2: show the unique indexes in `PaymentConfiguration` and `CircleMemberConfiguration`.
- Member 3: show `CirclesController.Start` calling `CircleService`, and the summary math.
- Member 4: show `auth.interceptor.ts`, `auth.guard.ts`, and `app.routes.ts`.
- Member 5: show the payout screen reading `payoutReady` and posting `payout(roundId)` with no receiver.
- Member 6: run `dotnet test` and open an audit row for a rejected payout.
