# Architecture

## Request flow

```text
Angular feature -> REST controller -> application service -> EF Core DbContext -> PostgreSQL
```

Controllers will accept and return DTOs; EF Core entities are not API contracts. Business validation belongs in backend services, with `IEkubRuleService` reserved for circle and round rules. Angular guards improve navigation but are not security boundaries.

## Backend

`backend/EkubCircle.Api` is a single ASP.NET Core API project with separate folders for controllers, DTO contracts, entities, EF Core data/configuration, services, middleware, and dependency-injection extensions. The API route prefix is centralized in `Constants/ApiRoutes.cs` as `/api/v1`.

## Frontend

`frontend/ekub-circle-web/src/app` separates application-wide concerns in `core`, independently routed capabilities in `features`, and generic reusable UI in `shared`. Feature-specific rules and models should remain in their feature. Standalone components are used throughout.

## Security boundary

The API is authoritative for authentication, authorization, and business rules. JWT bearer registration is only a starting point: configure and test issuer, audience, signing-key, and token-lifetime validation before exposing protected functionality. Never store secrets in source control.
