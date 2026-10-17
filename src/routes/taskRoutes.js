import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';

const router = Router();

// Keep paths relative to the /tasks prefix configured in app.js.
router.get('/', getTasks);
router.post('/', createTask);

router.get('/:id', getTask);

// Use PATCH so clients can update only the fields they want to change.
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
