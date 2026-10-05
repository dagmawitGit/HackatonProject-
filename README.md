# EkubCircle

EkubCircle is a web-based ledger for organizing Ethiopian Ekub circles. It records circles, membership, rounds, contribution entries, payouts, and history. It does not move or process money.

## Technology

- Frontend: Angular, TypeScript, Angular Router, Reactive Forms, and HttpClient
- Backend: ASP.NET Core Web API, Entity Framework Core, PostgreSQL, and JWT bearer authentication
- API prefix: `/api/v1`

Authentication and circle workflows are intentionally placeholders. The server-side rule service is not implemented, and no real payment processing is included.

## Prerequisites

- Node.js and npm
- .NET 10 SDK
- PostgreSQL

## Database setup

Create a local PostgreSQL database named `ekubcircle`. Set `ConnectionStrings__DefaultConnection` in your local environment to a connection string for that database. Do not commit credentials.

No EF Core migrations are included yet. From the repository root, create the first migration and apply it after reviewing the model:

```powershell
dotnet tool install --global dotnet-ef --version 10.0.0
dotnet ef migrations add InitialCreate --project backend/EkubCircle.Api --startup-project backend/EkubCircle.Api
dotnet ef database update --project backend/EkubCircle.Api --startup-project backend/EkubCircle.Api
```

## Run the backend

```powershell
dotnet restore backend/EkubCircle.Api/EkubCircle.Api.csproj
dotnet run --project backend/EkubCircle.Api -- --urls http://localhost:5000
```

The API has no implemented endpoints yet. Configure JWT issuer/signing-key validation before adding protected endpoints or relying on authentication.

## Run the frontend

```powershell
cd frontend/ekub-circle-web
npm install
npm start
```

The Angular development server is available at `http://localhost:4200`; its API base URL is configured in `src/environments/environment.ts`.

## Git workflow

Use `main` for stable work and integrate completed work through `develop`. Create focused branches using the names in [docs/team-workflow.md](docs/team-workflow.md). Keep feature ownership boundaries, review changes before merging, and do not commit local credentials.

## Documentation

- [Architecture](docs/architecture.md)
- [API contract](docs/api-contract.md)
- [Database](docs/database.md)
- [Team workflow](docs/team-workflow.md)
