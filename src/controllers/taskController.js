
import * as taskService from '../services/taskService.js';

export async function getTasks(req, res) {
  const tasks = await taskService.getAllTasks();
  res.status(200).json(tasks);
}

export async function getTask(req, res) {
  const task = await taskService.getTaskById(req.params.id);
  res.status(200).json(task);
}

export async function createTask(req, res) {
  const task = await taskService.createTask(req.body);

  res.status(201).location(`/tasks/${task.id}`).json(task);
}

export async function updateTask(req, res) {
  const task = await taskService.updateTask(
      req.params.id,
      req.body
  );

  res.status(200).json(task);
}

export async function deleteTask(req, res) {
  await taskService.deleteTask(req.params.id);
  res.status(204).end();
}
