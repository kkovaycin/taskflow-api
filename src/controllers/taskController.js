import * as taskService from '../services/taskService.js';

// Keep HTTP handling here and delegate task operations to the service.
export function getTasks(req, res) {
  res.status(200).json(taskService.getAllTasks());
}

export function getTask(req, res) {
  res.status(200).json(taskService.getTaskById(req.params.id));
}

export function createTask(req, res) {
  const task = taskService.createTask(req.body);

  // Provide the new resource URL so clients can locate the created task.
  res.status(201).location(`/tasks/${task.id}`).json(task);
}

export function updateTask(req, res) {
  const task = taskService.updateTask(req.params.id, req.body);

  res.status(200).json(task);
}

export function deleteTask(req, res) {
  taskService.deleteTask(req.params.id);

  // Send an empty response body as required by the 204 status.
  res.status(204).end();
}
