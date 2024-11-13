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

const router = express.Router();

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
