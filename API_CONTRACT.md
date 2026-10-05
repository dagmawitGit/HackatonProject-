# EkubCircle API Contract

Base URL: `http://localhost:5080`

Authenticated requests send `Authorization: Bearer <token>`.

Error body:

```json
{ "message": "Why the request was rejected." }
```

Validation errors use the same shape and `400`.

Amounts are recorded ETB figures. The API never transfers money.

Roles in tokens are `Member`, `Organizer`, or `Admin`. Circle status values are `FORMING`, `ACTIVE`, and `COMPLETED`. Round status values are `PENDING`, `OPEN`, and `PAID_OUT`.

---

## POST /api/auth/register

- Authentication: none
- Body: `{ "fullName": "Sara Bekele", "email": "sara@ekubcircle.et", "password": "Member@123", "role": "Member" }`
- `role` is `Member` or `Organizer`. Admin cannot self-register.
- Success: `201` with `{ "token", "user" }`
- `400` missing or invalid fields, password shorter than 8 characters, bad role
- `409` email already exists

## POST /api/auth/login

- Authentication: none
- Body: `{ "email": "hana@ekubcircle.et", "password": "Organizer@123" }`
- Success: `200` `{ "token", "user" }`
- `401` wrong email or password
- `403` account suspended

## GET /api/auth/me

- Authentication: any logged-in user
- Success: `200` user profile without the password hash
- `401` missing or invalid token
- `403` suspended

---

## GET /api/circles

- Authentication: any role
- Success: `200` array of equbs the user organizes or belongs to

## POST /api/circles

- Authentication: `Organizer`
- Body: `{ "name": "Unity Equb", "contributionAmount": 25000, "meetingLabel": "Monthly" }`
- Success: `201` circle, status `FORMING`
- `400` name or meeting missing, contribution not greater than 0
- `403` not an organizer

## GET /api/circles/{id}

- Authentication: member of the equb, its organizer, or admin
- Success: `200` circle
- `403` someone else's equb
- `404` missing

## PUT /api/circles/{id}

- Authentication: `Organizer` and owner
- Body: same fields as create
- Success: `200`
- `409` equb already started (`Equb settings is locked after the equb starts.`)
- `403` not the owner, or equb suspended

## POST /api/circles/{id}/start

- Authentication: `Organizer` and owner
- Body: none
- Success: `200`. Status becomes `ACTIVE`. One round is created per member. Round 1 is `OPEN`. The receiver of round N is the member whose payout order is N.
- `400` fewer than 2 members, organizer is not a member, or payout order is broken
- `409` already started
- `403` not the owner

## POST /api/circles/{id}/complete

- Authentication: `Organizer` and owner
- Success: `200` when every member has `HasReceived` and every round is `PAID_OUT`
- The last payout already completes the equb. This endpoint is the same rule, not a shortcut.
- `409` if someone has not received

## GET /api/circles/{id}/summary

- Authentication: member, organizer, or admin
- Success: `200`

```json
{
  "memberCount": 6,
  "contributionAmount": 25000,
  "paidCount": 6,
  "currentPot": 150000,
  "expectedPot": 150000,
  "currentRound": 1,
  "totalRounds": 6,
  "receivedCount": 0,
  "remainingReceivers": 6,
  "paymentPercentage": 100,
  "completionPercentage": 0,
  "currentReceiver": "Hana Bekele",
  "currentReceiverMemberId": "guid",
  "circleStatus": "ACTIVE",
  "roundStatus": "OPEN",
  "payoutReady": true,
  "isSuspended": false,
  "waitingFor": [],
  "nextReceivers": ["Abel Tesfaye"],
  "integrity": {
    "allMembersVerified": true,
    "paymentRecordsComplete": true,
    "receiverFromFixedOrder": true,
    "noDuplicatePayout": true,
    "currentRoundValid": true
  }
}
```

`currentPot` is paid members times contribution. `expectedPot` is all members times contribution. `payoutReady` is true only when the open round is fully paid and the fixed receiver has not already received.

---

## GET /api/circles/{id}/members

- Authentication: member, organizer, or admin
- Success: `200` members ordered by payout order, including `paidCurrentRound` and `hasReceived`

## POST /api/circles/{id}/members

- Authentication: `Organizer` and owner
- Body: `{ "email": "abel@ekubcircle.et" }`
- The user must already be registered. Payout order is the next number.
- Success: `201`
- `404` unknown email
- `409` already a member, account suspended, or equb already started

## PUT /api/circles/{id}/members/order

- Authentication: `Organizer` and owner, forming only
- Body: `{ "orderedMemberIds": ["guid-1", "guid-2"] }`
- The list must contain every current member exactly once.
- Success: `200` the reordered members
- `409` equb already started

## DELETE /api/circles/{id}/members/{memberId}

- Authentication: `Organizer` and owner, forming only
- Success: `204`
- Remaining members are renumbered from 1
- `404` member not in this equb
- `409` equb already started

---

## GET /api/circles/{id}/rounds

- Authentication: member, organizer, or admin
- Success: `200` rounds with receiver name, status, and payout amount

## GET /api/circles/{id}/rounds/current

- Authentication: member, organizer, or admin
- Success: `200` the open round
- If none is open: `200` `{ "round": null, "message": "There is no open round right now." }`

## POST /api/circles/{id}/rounds/next

- Authentication: `Organizer` and owner
- Body: none
- Opens the next `PENDING` round. Refuses if a round is still open or the equb is not active.
- Success: `200` the newly open round
- `409` current round not paid out, or equb is not active

---

## POST /api/rounds/{roundId}/payments

- Authentication: `Organizer` and owner of that round's equb
- Body: `{ "circleMemberId": "guid" }`
- The amount is copied from the equb contribution. A client-supplied amount is ignored because the body has no amount field.
- Only the open round accepts payments. A member who already received is still allowed.
- Success: `201` payment
- `409` duplicate payment, or round already closed
- `400` round is not the open one, or the person is not a member

## GET /api/rounds/{roundId}/payments

- Authentication: member, organizer, or admin of that equb
- Success: `200` payments for that round

## GET /api/circles/{id}/payments

- Authentication: member, organizer, or admin
- Success: `200` every payment in the equb, for the ledger and history screens

---

## POST /api/rounds/{roundId}/payout

- Authentication: `Organizer` and owner
- Body: none. A receiver id in the body is ignored. The receiver is `Round.ReceiverMemberId`.
- Rules, in order:
  - equb is active and not suspended
  - round is `OPEN` (already paid out returns `409`, a future round returns `400`)
  - paid count equals member count, otherwise `409` with `Payout is locked. All members must pay before payout.`
  - receiver has not already received
  - receiver payout order equals the round number
- Amount stored is `memberCount × contribution`
- Success: `200`

```json
{
  "roundNumber": 1,
  "receiverName": "Hana Bekele",
  "amount": 150000,
  "status": "PAID_OUT",
  "circleCompleted": false,
  "message": "Round 1 was paid to Hana Bekele. The receiver still pays in future rounds."
}
```

Rejected attempts are written to the audit log as `PAYOUT_ATTEMPTED`. Success is `PAYOUT_COMPLETED`.

---

## GET /api/notifications

- Authentication: any logged-in user
- Success: `200` recent audit events for the user's equbs

## GET /api/health

- Authentication: none
- Success: `200` `{ "status": "ok", "service": "EkubCircle", "database": "connected", "moneyMovement": "none" }`

---

## GET /api/admin/overview

- Authentication: `Admin`
- Success: `200` user, equb, contribution, payout, and audit counts

## GET /api/admin/users?search=

- Authentication: `Admin`
- Success: `200` users matching name or email

## PATCH /api/admin/users/{id}/status

- Authentication: `Admin`
- Body: `{ "status": "SUSPENDED" }` or `{ "status": "ACTIVE" }`
- `400` an admin cannot change their own status, or the status value is invalid
- `409` cannot suspend the last active admin
- Does not change equb payments

## GET /api/admin/circles?search=

- Authentication: `Admin`
- Success: `200` equbs matching name or organizer

## PATCH /api/admin/circles/{id}/suspension

- Authentication: `Admin`
- Body: `{ "suspended": true }`
- Sets `IsSuspended`. Does not change `FORMING` / `ACTIVE` / `COMPLETED` and does not edit payouts.
- While suspended, organizer mutations return `403`.

## GET /api/admin/reports

- Authentication: `Admin`
- Success: `200` per-equb recorded contribution and payout totals

## GET /api/admin/audit-logs?search=&action=

- Authentication: `Admin`
- Success: `200` newest audit rows, optional filter on action code such as `PAYOUT_ATTEMPTED`

Admin routes return `403` for members and organizers.
