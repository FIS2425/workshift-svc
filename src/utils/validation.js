import Workshift from '../schemas/Workshift.js';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function getDoctorWeeklyHours(doctorId, date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  const workshifts = await Workshift.find({
    doctorId,
    startDate: { $gte: start, $lt: end },
  });

  return workshifts.reduce((total, shift) => total + shift.duration / 60, 0);
}

export async function checkForOverlappingShifts(doctorId, newShiftStartDate, duration) {
  const start = new Date(newShiftStartDate);
  const end = new Date(start);
  end.setMinutes(start.getMinutes() + duration);

  const query = {
    doctorId: doctorId,
    $or: [
      {
        // New workshift starts within an existing workshift
        startDate: { $lte: start },
        endDate: { $gt: start }
      },
      {
        // New workshift ends within an existing workshift
        startDate: { $lt: end },
        endDate: { $gte: end }
      },
      {
        // New workshift fully covers an existing workshift
        startDate: { $gte: start },
        endDate: { $lte: end }
      }
    ]
  };

  const overlappingWorkshifts = await Workshift.find(query);

  return overlappingWorkshifts.length !== 0; // Return true if no overlap
}
