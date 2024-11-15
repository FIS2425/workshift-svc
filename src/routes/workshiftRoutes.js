import express from 'express';
import {
  createWorkshift,
  createWorkshiftsBulk,
  getAllWorkshifts,
  getWorkshiftById,
  getWorkshiftsByDoctorId,
  updateWorkshift,
  deleteWorkshift
} from '../controllers/workshiftController.js';
import { verifyAuth } from '../middleware/verifyAuth.js';

const router = express.Router();

router.use(verifyAuth);
router.get('/', getAllWorkshifts);
router.post('/', createWorkshift);
router.post('/week', createWorkshiftsBulk);
router.get('/:id', getWorkshiftById);
router.get(
  '/doctor/:doctorId',
  getWorkshiftsByDoctorId
);
router.put('/:id', updateWorkshift);
router.delete('/:id', deleteWorkshift);

export default router;
