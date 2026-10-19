import { randomUUID } from 'node:crypto';
import { pool } from '../config/database.js';

const allowedFields = [
  'title',
  'description',
  'assignee',
  'status',
  'priority',
];

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function validateTask(data, partial = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    fail(400, 'Request body must be a JSON object.');
  }

  const keys = Object.keys(data);

  if (keys.length === 0 || keys.some((key) => !allowedFields.includes(key))) {
    fail(400, 'Provide supported task fields only.');
  }

  for (const field of ['title', 'assignee']) {
    if (
      (!partial || field in data) &&
      (typeof data[field] !== 'string' || !data[field].trim())
    ) {
      fail(400, `${field} must be a non-empty string.`);
    }
  }

  if ('description' in data && typeof data.description !== 'string') {
    fail(400, 'description must be a string.');
  }

  if (
    'status' in data &&
    !['pending', 'in_progress', 'completed'].includes(data.status)
  ) {
    fail(400, 'status must be pending, in_progress, or completed.');
  }

  if (
    'priority' in data &&
    !['low', 'medium', 'high'].includes(data.priority)
  ) {
    fail(400, 'priority must be low, medium, or high.');
  }
}

function validateId(id) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    fail(404, 'Task not found.');
  }
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignee: row.assignee,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getAllTasks() {
  const result = await pool.query(
    'SELECT * FROM tasks ORDER BY created_at DESC, id DESC',
  );

  return result.rows.map(mapTask);
}

export async function getTaskById(id) {
  validateId(id);

  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    fail(404, 'Task not found.');
  }

  return mapTask(result.rows[0]);
}

export async function createTask(data) {
  validateTask(data);

  const result = await pool.query(
    `INSERT INTO tasks
      (id, title, description, assignee, status, priority)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      randomUUID(),
      data.title.trim(),
      data.description ?? '',
      data.assignee.trim(),
      data.status ?? 'pending',
      data.priority ?? 'medium',
    ],
  );

  return mapTask(result.rows[0]);
}

export async function updateTask(id, data) {
  validateId(id);
  validateTask(data, true);

  const fields = Object.keys(data);
  const values = fields.map((field) => {
    if (['title', 'assignee'].includes(field)) {
      return data[field].trim();
    }
    return data[field];
  });

  const updates = fields.map((field, index) => `${field} = $${index + 1}`);

  const result = await pool.query(
    `UPDATE tasks
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length + 1}
     RETURNING *`,
    [...values, id],
  );

  if (result.rowCount === 0) {
    fail(404, 'Task not found.');
  }

  return mapTask(result.rows[0]);
}

export async function deleteTask(id) {
  validateId(id);

  const result = await pool.query(
    'DELETE FROM tasks WHERE id = $1 RETURNING id',
    [id],
  );

  if (result.rowCount === 0) {
    fail(404, 'Task not found.');
  }
}
