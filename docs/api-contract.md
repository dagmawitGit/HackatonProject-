# API Contract

The versioned API base is `/api/v1`. Contracts belong in `backend/EkubCircle.Api/DTOs`; controllers must not expose EF Core entities. Angular feature services should consume typed models and the shared API base configuration.

This skeleton defines DTO placeholders but intentionally defines no working endpoints. Final HTTP methods, paths, validation errors, pagination, and response envelopes remain to be agreed by the team before implementation. Likely resource areas are authentication, circles, members, rounds, payments, payouts, and history.

The server must enforce all circle and round rules. In particular, the receiver for a round must come from the fixed order established at circle start, and payout must be impossible until every member has paid. Frontend route guards are not enforcement.
