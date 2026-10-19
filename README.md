# TaskFlow API

A Node.js and Express REST API for creating, assigning, updating, and tracking team tasks. Tasks are persisted in PostgreSQL.

## Requirements

- Node.js and npm. The project was developed with Node.js 24 and npm 11.
- Git.
- A PostgreSQL database, running locally or provided by a hosted PostgreSQL service.

## Setup

### 1. Install the project

In Windows PowerShell:

```powershell
git clone https://github.com/kkovaycin/taskflow-api.git
Set-Location taskflow-api
npm.cmd ci
```

For an existing checkout, run the commands from the project root.

### 2. Prepare a PostgreSQL database

For a local installation, create a database named `taskflow` in pgAdmin. Alternatively, if PostgreSQL's `psql` command is available in your terminal, run:

```powershell
psql -U postgres -d postgres -c "CREATE DATABASE taskflow;"
```

For a hosted database, use the PostgreSQL connection URL supplied by the provider. The database user must be able to create and access the task table. The setup command below creates the table inside an existing database; it does not create the database itself.

### 3. Configure the environment

Create `.env` from the example if it does not already exist:

```powershell
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
}
```

Edit `.env` and replace the example connection URL with your own:

```dotenv
DATABASE_URL=postgresql://postgres:replace_with_your_password@localhost:5432/taskflow
PORT=3000
FRONTEND_URL=http://localhost:4200
```

`DATABASE_URL` is required. Its username, password, host, port, and database name must match your PostgreSQL installation. URL-encode special characters in the username or password. For hosted PostgreSQL, retain any SSL options supplied in the provider's URL.

`PORT` defaults to `3000`. `FRONTEND_URL` adds an allowed browser origin; `http://localhost:4200` is also allowed. Environment changes take effect after restarting the server. Keep `.env` local; `.env.example` contains placeholders for sharing the setup.

### 4. Create the task table

```powershell
npm.cmd run db:setup
```

Expected output:

```text
Task database is ready. Existing tasks have been preserved.
```

The command executes `database/schema.sql`, which creates `tasks` if it does not exist. Running it again preserves existing tasks. It does not alter an existing table's structure.

### 5. Start the API

```powershell
npm.cmd run dev
```

With the example configuration, the server listens on `http://localhost:3000`. Keep its terminal open while using Postman or the frontend. Stop it with **Ctrl + C**.

To start without file watching:

```powershell
npm.cmd start
```

Check `GET http://localhost:3000/health`:

```json
{
  "status": "ok",
  "message": "TaskFlow API is running."
}
```

`/health` checks that the HTTP application is responding. Verify `GET /tasks` as well to check database access.

## API endpoints

Base URL with the example configuration: `http://localhost:3000`

| Method | Path         | Operation          | Successful response                   |
| ------ | ------------ | ------------------ | ------------------------------------- |
| GET    | `/health`    | Check the HTTP API | 200, health object                    |
| POST   | `/tasks`     | Create a task      | 201, created task and Location header |
| GET    | `/tasks`     | List all tasks     | 200, JSON array                       |
| GET    | `/tasks/:id` | Get one task       | 200, task object                      |
| PATCH  | `/tasks/:id` | Update task fields | 200, updated task                     |
| DELETE | `/tasks/:id` | Delete a task      | 204, empty response body              |

Replace `:id` with an actual `id` returned by a creation or listing request. For POST and PATCH, use `Content-Type: application/json`; in Postman, select **Body > raw > JSON**.

### Create a task

`POST /tasks`

```json
{
  "title": "Review task endpoints",
  "description": "Check task creation and update responses.",
  "assignee": "Kubra",
  "status": "pending",
  "priority": "high"
}
```

The response includes a generated UUID, `createdAt`, and `updatedAt`.

### Update a task

`PATCH /tasks/:id`

```json
{
  "status": "completed",
  "priority": "medium"
}
```

Omitted fields retain their previous values. The database refreshes `updated_at`, which the API returns as `updatedAt`.

## Task data model

| API field     | PostgreSQL column | Rules                                                           |
| ------------- | ----------------- | --------------------------------------------------------------- |
| `id`          | `id`              | Server-generated UUID; read-only                                |
| `title`       | `title`           | Required on creation; non-empty after trimming                  |
| `description` | `description`     | Optional string; defaults to an empty string                    |
| `assignee`    | `assignee`        | Required on creation; non-empty after trimming                  |
| `status`      | `status`          | `pending`, `in_progress`, or `completed`; defaults to `pending` |
| `priority`    | `priority`        | `low`, `medium`, or `high`; defaults to `medium`                |
| `createdAt`   | `created_at`      | Server-managed timestamp returned as an ISO string; read-only   |
| `updatedAt`   | `updated_at`      | Server-managed timestamp returned as an ISO string; read-only   |

POST and PATCH require a non-empty JSON object containing supported editable fields only. Title and assignee are trimmed before storage. Listing returns the newest tasks first.

PostgreSQL persists tasks across API restarts. `data/tasks.json` is retained from the earlier implementation and is not used by the PostgreSQL service. Database setup does not import that file automatically.

## Errors

Error responses have the shape `{ "message": "..." }`.

| Status | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| 400    | Invalid JSON, unsupported fields, or invalid task values |
| 404    | Task not found, invalid task ID, or unmatched endpoint   |
| 500    | Internal error; details are logged on the server         |

`Task not found.` means the task could not be found or the ID is invalid. `Endpoint not found.` means no route matched the request. Repeating DELETE for a deleted task returns 404.

## Project organization

| File                                | Responsibility                                         |
| ----------------------------------- | ------------------------------------------------------ |
| `src/app.js`                        | Configure middleware, routes, and error responses      |
| `src/server.js`                     | Start the HTTP server                                  |
| `src/config/database.js`            | Load environment settings and create the database pool |
| `src/routes/taskRoutes.js`          | Map task endpoints to controllers                      |
| `src/controllers/taskController.js` | Await service operations and send HTTP responses       |
| `src/services/taskService.js`       | Validate inputs, execute SQL, and map task responses   |
| `src/middleware/logger.js`          | Log timestamp, method, and request URL                 |
| `database/schema.sql`               | Define the PostgreSQL task table                       |
| `scripts/setupDatabase.js`          | Run the schema using `DATABASE_URL`                    |
| `.env.example`                      | Show the required configuration using placeholders     |

The logger runs before CORS and JSON parsing. It records ordinary requests, CORS preflight requests, and malformed JSON requests as `[timestamp] METHOD URL`, using UTC timestamps.

## Formatting

```powershell
npm.cmd run format
npm.cmd run format:check
```

Both commands include `src` and `scripts`.

## Postman verification

Start the API with a working database connection, then verify the operations below. Use the task ID returned by POST for the detail, update, and delete requests. Each screenshot should show the method, complete URL, status, and response. Deletion correctly returns an empty body.

| Operation | Request                   | Expected result            | Evidence file                  |
| --------- | ------------------------- | -------------------------- | ------------------------------ |
| Create    | POST `/tasks`             | 201 and the new task       | `01-create-task.jpg`           |
| List      | GET `/tasks`              | 200 and the task array     | `02-list-tasks.jpg`            |
| Detail    | GET `/tasks/:id`          | 200 and the selected task  | `03-get-task.jpg`              |
| Update    | PATCH `/tasks/:id`        | 200 and changed values     | `04-update-task.jpg`           |
| Delete    | DELETE `/tasks/:id`       | 204 and an empty body      | `05-delete-task.jpg`           |
| Missing   | Repeat DELETE for that ID | 404 with `Task not found.` | `06-delete-task-not-found.jpg` |

Screenshots are stored in `docs/postman/`. The missing-task case is an additional error-handling check. The short project introduction is `docs/project-overview.pdf`.

## Troubleshooting

- **`DATABASE_URL environment variable is missing.`** Create `.env` from `.env.example`, set your connection URL, and restart the process.
- **Connection refused or authentication failed.** Check that PostgreSQL is available and that the connection URL matches your server, credentials, and database name.
- **`relation "tasks" does not exist`.** Run `npm.cmd run db:setup` against the same `DATABASE_URL` used by the API.
- **`/health` succeeds but `/tasks` fails.** Check database access and the server's error log; the health endpoint does not query PostgreSQL.
