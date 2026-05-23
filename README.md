# Mechanic App v1.0

A full-stack application with an **Angular 21** frontend and a **.NET 10 Web API** backend, using **Dapper** and **PostgreSQL**.

## Prerequisites

- .NET 10.0 SDK
- Node.js (20+) and npm
- Angular CLI 21 (`npm install -g @angular/cli@21`)
- PostgreSQL 15+ (or Docker for containerized setup)

## Project Structure

- `backend/` — ASP.NET Core Web API (Dapper + Npgsql)
- `frontend/` — Angular 21 client application (standalone components)
- `init.sql` — Database initialization script (creates all tables)
- `docker-compose.yml` — Full-stack Docker orchestration

## Running with Docker (Recommended)

1. Ensure Docker and Docker Compose are installed.
2. Run from the project root:
   ```bash
   docker-compose up --build
   ```
3. Access the application:
   - **Frontend**: http://localhost:4200
   - **Backend API**: http://localhost:5000/api
   - **API Docs (Scalar)**: http://localhost:5000/scalar/v1
   - **Database**: PostgreSQL on port `5433`

## Running Locally (without Docker)

### 1. Database Setup

Ensure PostgreSQL is running locally, then:

- Create a database named `mechanic_db`
- Run the `init.sql` script to create all tables and seed data.
- Verify the connection string in `backend/appsettings.json` matches your setup.

### 2. Install Dependencies

```bash
cd backend && dotnet restore
cd ../frontend && npm install
```

### 3. Run the Application

**Backend** (terminal 1):

```bash
cd backend
dotnet run
```

Backend runs on `http://localhost:5236`.

**Frontend** (terminal 2):

```bash
cd frontend
ng serve
```

Frontend runs on `http://localhost:4200`. The Angular dev proxy forwards `/api/*` requests to the backend.

## API Endpoints

| Area           | Method | Endpoint                          | Description                    |
| -------------- | ------ | --------------------------------- | ------------------------------ |
| Auth           | POST   | /api/auth/login                   | Login and receive JWT token    |
| Auth           | GET    | /api/auth/me                      | Get current user info          |
| Users          | GET    | /api/user                         | List all users (admin)         |
| Users          | POST   | /api/user                         | Create user (admin)            |
| Users          | PUT    | /api/user/{id}                    | Update user (admin)            |
| Users          | DELETE | /api/user/{id}                    | Delete user (admin)            |
| Customers      | GET    | /api/customer                     | List customers                 |
| Customers      | POST   | /api/customer                     | Create customer                |
| Mechanics      | GET    | /api/mechanic                     | List mechanics                 |
| Mechanics      | POST   | /api/mechanic                     | Create mechanic                |
| Car Brands     | GET    | /api/carbrand                     | List car brands                |
| Car Models     | GET    | /api/carmodel                     | List car models                |
| Vehicles       | GET    | /api/detailcar                    | List vehicle details           |
| Vehicles       | POST   | /api/detailcar                    | Create vehicle detail          |
| Repair Orders  | GET    | /api/repairorder                  | List repair orders             |
| Repair Orders  | POST   | /api/repairorder                  | Create repair order            |
| Order Services | GET    | /api/repairorderservice/{orderId} | List services on an order      |
| Order Services | POST   | /api/repairorderservice           | Add service to order           |
| Order Parts    | GET    | /api/repairorderpart/{orderId}    | List parts on an order         |
| Order Parts    | POST   | /api/repairorderpart              | Add part to order              |
| Order Photos   | POST   | /api/repairorderphoto/{orderId}   | Upload photos to order         |
| Payments       | GET    | /api/payment                      | List payments                  |
| Payments       | POST   | /api/payment                      | Register payment (multi-order) |
| Services       | GET    | /api/service                      | List available services        |
| Parts          | GET    | /api/part                         | List inventory parts           |
| Products       | GET    | /api/product                      | List products                  |
| Currencies     | GET    | /api/currency                     | List currencies                |
| Dashboard      | GET    | /api/dashboard/stats              | Aggregated stats               |
| App Settings   | GET    | /api/appsettings                  | Get branding settings          |
| Cleanup        | POST   | /api/cleanup/photos               | Trigger photo cleanup          |
| Subscription   | GET    | /api/subscription/status          | Check subscription status      |
| Subscription   | POST   | /api/subscription/webhook/stripe  | Stripe webhook receiver        |

## VS Code Tasks

Use VS Code tasks (Terminal > Run Task) for convenience:

- **build backend** — Compiles the .NET backend
- **run backend** — Builds and runs the backend
- **serve frontend** — Starts Angular dev server with proxy

## Known Notes

- The `#` character in the workspace path (e.g. `C#\MechanicApp`) can cause Angular CLI warnings about "unused" files. These are cosmetic and do not affect the build output.
- Component-level `styleUrls` are avoided due to the `#` path issue; all styles are in `src/styles.css`.
