import * as taskService from '../services/taskService.js';

export function getTasks(req, res) {
  res.status(200).json(taskService.getAllTasks());
}

export function getTask(req, res) {
  res.status(200).json(taskService.getTaskById(req.params.id));
}

export function createTask(req, res) {
  const task = taskService.createTask(req.body);

  res.status(201).location(`/tasks/${task.id}`).json(task);
}

export function updateTask(req, res) {
  const task = taskService.updateTask(req.params.id, req.body);

  res.status(200).json(task);
}

export function deleteTask(req, res) {
  taskService.deleteTask(req.params.id);

  res.status(204).end();
}
