import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const tasksFile = new URL('../../data/tasks.json', import.meta.url);
const allowedFields = ['title', 'description', 'assignee', 'status', 'priority'];

function fail(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
}

function readTasks() {
    const tasks = JSON.parse(readFileSync(tasksFile, 'utf8'));

    if (!Array.isArray(tasks)) {
        throw new Error('Task storage must contain a JSON array.');
    }

    return tasks;
}

function saveTasks(tasks) {
    writeFileSync(tasksFile, JSON.stringify(tasks, null, 2), 'utf8');
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

    if ('priority' in data && !['low', 'medium', 'high'].includes(data.priority)) {
        fail(400, 'priority must be low, medium, or high.');
    }
}

function findTask(tasks, id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) {
        fail(404, 'Task not found.');
    }

    return task;
}

export function getAllTasks() {
    return readTasks();
}

export function getTaskById(id) {
    return findTask(readTasks(), id);
}

export function createTask(data) {
    validateTask(data);

    const tasks = readTasks();
    const now = new Date().toISOString();

    const task = {
        id: randomUUID(),
        title: data.title.trim(),
        description: data.description ?? '',
        assignee: data.assignee.trim(),
        status: data.status ?? 'pending',
        priority: data.priority ?? 'medium',
        createdAt: now,
        updatedAt: now,
    };

    tasks.push(task);
    saveTasks(tasks);

    return task;
}

export function updateTask(id, data) {
    const tasks = readTasks();
    const task = findTask(tasks, id);

    validateTask(data, true);

    Object.assign(task, data, {
        updatedAt: new Date().toISOString(),
    });

    task.title = task.title.trim();
    task.assignee = task.assignee.trim();

    saveTasks(tasks);

    return task;
}

export function deleteTask(id) {
    const tasks = readTasks();

    findTask(tasks, id);

    saveTasks(tasks.filter((task) => task.id !== id));
}