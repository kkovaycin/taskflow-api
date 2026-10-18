# TaskFlow API

A Node.js and Express REST API for creating, assigning, updating, and tracking team tasks. Tasks are persisted in a local JSON file.

## Setup

The project was developed with Node.js **24.14.1** and npm **11.11.0**. Install Node.js and Git before cloning the repository.

In Windows PowerShell:

```powershell
git clone https://github.com/kkovaycin/taskflow-api.git
Set-Location taskflow-api
npm.cmd ci
npm.cmd run dev
```

The server listens on `http://localhost:3000`. Keep its terminal open while using Postman. Stop it with **Ctrl + C**.

To start without file watching:

```powershell
npm.cmd start
```

Check the server with `GET http://localhost:3000/health`:

```json
{
  "status": "ok",
  "message": "TaskFlow API is running."
}
```

## API endpoints

Base URL: `http://localhost:3000`

| Method | Path         | Operation                   | Successful response                   |
| ------ | ------------ | --------------------------- | ------------------------------------- |
| GET    | `/health`    | Check server availability   | 200, health object                    |
| POST   | `/tasks`     | Create a task               | 201, created task and Location header |
| GET    | `/tasks`     | List all tasks              | 200, JSON array                       |
| GET    | `/tasks/:id` | Get one task                | 200, task object                      |
| PATCH  | `/tasks/:id` | Update selected task fields | 200, updated task                     |
| DELETE | `/tasks/:id` | Delete a task               | 204, empty response body              |

Replace `:id` with the actual `id` returned by a creation or listing request. Use `Content-Type: application/json` for POST and PATCH requests; in Postman, select **Body > raw > JSON**.

### Create a task

`POST /tasks`

```json
{
  "title": "Review task endpoints",
  "description": "Check the task creation and update responses.",
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

Omitted fields retain their previous values. The server refreshes `updatedAt`.

## Task data model

| Field         | Type   | Rules                                                           |
| ------------- | ------ | --------------------------------------------------------------- |
| `id`          | string | Server-generated UUID; read-only                                |
| `title`       | string | Required on creation; must contain non-whitespace text          |
| `description` | string | Optional; defaults to an empty string                           |
| `assignee`    | string | Required on creation; must contain non-whitespace text          |
| `status`      | string | `pending`, `in_progress`, or `completed`; defaults to `pending` |
| `priority`    | string | `low`, `medium`, or `high`; defaults to `medium`                |
| `createdAt`   | string | Server-managed ISO timestamp; read-only                         |
| `updatedAt`   | string | Server-managed ISO timestamp; read-only                         |

Both POST and PATCH require a non-empty JSON object containing supported editable fields only. Supplied values are validated. Title and assignee values are trimmed before storage.

## Errors

Error responses have the shape `{ "message": "..." }`.

| Status | Meaning                                                  |
| ------ | -------------------------------------------------------- |
| 400    | Invalid JSON, unsupported fields, or invalid task values |
| 404    | Task not found, or no matching endpoint                  |
| 500    | Internal error; details are logged on the server         |

`Task not found.` means the route matched but the requested task does not exist. `Endpoint not found.` means the request did not match a defined route. Once a task has been deleted, another DELETE request for that ID returns 404.

## Project organization

| File                                | Responsibility                                                      |
| ----------------------------------- | ------------------------------------------------------------------- |
| `src/app.js`                        | Configure middleware, routes, health check, and error responses     |
| `src/server.js`                     | Start the server on port 3000                                       |
| `src/routes/taskRoutes.js`          | Map task endpoints to controllers                                   |
| `src/controllers/taskController.js` | Handle HTTP input and responses                                     |
| `src/services/taskService.js`       | Validate data, perform CRUD operations, and read/write task storage |
| `src/middleware/logger.js`          | Log the timestamp, HTTP method, and request URL                     |
| `data/tasks.json`                   | Persist tasks as a JSON array                                       |

The logger runs before JSON parsing so malformed JSON requests are also recorded. Logs use UTC timestamps and the format `[timestamp] METHOD URL`.

The storage file must contain a valid JSON array. An empty collection is `[]`. The application uses synchronous file reads and writes for this small local project; persisted tasks remain after a server restart.

## Formatting

```powershell
npm.cmd run format
npm.cmd run format:check
```

## Postman verification

Capture evidence for all five operations below. Each screenshot should show the method, complete URL, response status, and response body. For deletion, the empty response body is expected.

| Required operation | Request             | Expected result                      |
| ------------------ | ------------------- | ------------------------------------ |
| Create             | POST `/tasks`       | 201 and the new task                 |
| List               | GET `/tasks`        | 200 and an array containing the task |
| Detail             | GET `/tasks/:id`    | 200 and the selected task            |
| Update             | PATCH `/tasks/:id`  | 200 and the changed field values     |
| Delete             | DELETE `/tasks/:id` | 204 and an empty response            |

Save the screenshots in `docs/postman/`. A GET request for a deleted task should return 404 with `Task not found.`; this is an additional check, separate from the five successful CRUD operations.

Place the short project introduction at `docs/project-overview.pdf`.
