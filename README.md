# BillEase Pro

Production-oriented billing and inventory SaaS scaffold for universal buy-sell businesses.

## Stack

- ASP.NET Core 8 Web API, SQL Server, EF Core
- Clean Architecture: Domain, Application, Infrastructure, API
- MediatR CQRS, FluentValidation, AutoMapper, repository + unit of work
- JWT bearer auth, refresh token rotation, role policies, TOTP 2FA
- Angular 20 standalone app with signals, Angular Material, PrimeNG

## Demo Users

All seeded users use password `Password@123`.

- `superadmin@billeasepro.local`
- `admin@billeasepro.local`
- `operator@billeasepro.local`

## Run

Backend:

```powershell
dotnet build BillEasePro.slnx
dotnet ef database update --project src\BillEasePro.Infrastructure --startup-project src\BillEasePro.Api --context BillEasePro.Infrastructure.Persistence.BillEaseDbContext
dotnet run --project src\BillEasePro.Api
```

Frontend:

```powershell
cd web\billease-pro-web
npm install
npm run start
```

## Notes

- SQL schema documentation is in `docs/database/schema.sql`.
- API version prefix is `/api/v1/`.
- Swagger is available at `/swagger`.
- POS shortcuts: `F2` focus search, `F4` apply quick discount, `F8` pay, `Ctrl+P` print A4.
