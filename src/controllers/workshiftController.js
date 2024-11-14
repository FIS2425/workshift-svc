import Workshift from '../schemas/Workshift.js';
import { getWeek } from '../utils/dateutils.js';
import logger from '../config/logger.js';
import { getDoctorWeeklyHours, checkForOverlappingShifts } from '../utils/validation.js';
import { connectRabbitMQ } from '../config/rabbitmq.js';

let channel;
let exchangeName;
if (process.env.NODE_ENV !== 'test') {
  channel = await connectRabbitMQ();
  exchangeName = 'workshiftExchange';
  channel.assertExchange(exchangeName, 'fanout', { durable: false });
}


export const createWorkshift = async (req, res) => {
  try {
    const { doctorId, clinicId, startDate, duration } = req.body;

    const overlapping = await checkForOverlappingShifts(doctorId, new Date(startDate), duration);
    if (overlapping) {
      return res.status(400).json({ message: 'Doctor already has a shift during this period' });
    }

    const totalHours = await getDoctorWeeklyHours(doctorId, new Date(startDate));
    const newShiftHours = duration / 60;

    if (totalHours + newShiftHours > 40) {
      return res.status(400).json({
        message: `Doctor ${doctorId} cannot exceed 40 hours per week. Current hours: ${totalHours}`
      });
    }

    const workshift = new Workshift({
      doctorId,
      clinicId,
      startDate,
      duration
    }
    );
    await workshift.save();
    logger.info(`Workshift ${workshift._id} created`);

    // Publish message to RabbitMQ
    if (process.env.NODE_ENV !== 'test') {
      const msg = {
        event: 'workshift-created',
        workshift: workshift
      };
      channel.publish(exchangeName, '', Buffer.from(JSON.stringify(msg)));
    }

    res.status(201).json(workshift);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createWorkshiftsBulk = async (req, res) => {
  try {
    const { doctorId, clinicId, duration, periodStartDate, periodEndDate } = req.body;

    if (!doctorId || !clinicId || !periodStartDate || !periodEndDate) {
      return res.status(400).json({ message: 'doctorId, clinicId, periodStartDate, and periodEndDate are required' });
    }

    const startDate = new Date(periodStartDate);
    let endDate = new Date(periodEndDate);

    endDate.setHours(startDate.getHours());
    endDate.setMinutes(startDate.getMinutes());
    endDate.setSeconds(startDate.getSeconds());
    endDate.setMilliseconds(startDate.getMilliseconds());

    if (endDate < startDate && endDate.getDate() !== startDate.getDate()) {
      return res.status(400).json({ message: 'The work period must be at least one day long' });
    }

    const startWeek = await getWeek(startDate);
    const endWeek = await getWeek(endDate);

    if (startWeek !== endWeek) {
      return res.status(400).json({ message: 'The work period must be within the same week' });
    }

    const workshifts = [];
    let weeklyHours = await getDoctorWeeklyHours(doctorId, startDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const overlapping = await checkForOverlappingShifts(doctorId, new Date(startDate), duration);
      if (overlapping) {
        console.log('hola!')
        return res.status(400).json({ message: 'Doctor already has a shift during this period' });
      }

      if (weeklyHours + duration / 60 > 40) {
        return res.status(400).json({
          message: `Doctor ${doctorId} cannot exceed 40 hours per week. Current hours: ${weeklyHours}`
        });
      }

      workshifts.push(new Workshift({
        doctorId,
        clinicId,
        startDate: new Date(d),
        duration
      }));

      weeklyHours += duration / 60;
    }

    await Workshift.insertMany(workshifts);

    // Publish message to RabbitMQ
    if (process.env.NODE_ENV !== 'test') {
      const msg = {
        event: 'workshifts-many',
        workshifts: workshifts
      };
      channel.publish(exchangeName, '', Buffer.from(JSON.stringify(msg)));
    }

    logger.info(`Created ${workshifts.length} workshifts for doctor ${doctorId} at clinic ${clinicId}`);
    res.status(201).json(workshifts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllWorkshifts = async (req, res) => {
  try {
    const workshifts = await Workshift.find();
    logger.debug(`Returning ${workshifts.length} workshifts`);
    res.status(200).json(workshifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkshiftById = async (req, res) => {
  try {
    const workshift = await Workshift.findById(req.params.id);
    if (!workshift) {
      return res.status(404).json({ message: 'Workshift not found' });
    }
    logger.debug(`Returning workshift ${workshift._id}`);
    res.status(200).json(workshift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWorkshift = async (req, res) => {
  try {
    if (!req.body.startDate || !req.body.duration) {
      return res.status(400).json({ message: 'Start date and duration are required' });
    }
    const workshift = await Workshift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!workshift) {
      return res.status(404).json({ message: 'Workshift not found' });
    }

    // Publish message to RabbitMQ
    if (process.env.NODE_ENV !== 'test') {
      const msg = {
        event: 'workshift-updated',
        workshift: workshift
      };
      channel.publish(exchangeName, '', Buffer.from(JSON.stringify(msg)));
    }

    logger.info(`Workshift ${workshift._id} updated`);
    res.status(200).json(workshift);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteWorkshift = async (req, res) => {
  try {
    const workshift = await Workshift.findByIdAndDelete(req.params.id);
    if (!workshift) {
      return res.status(404).json({ message: 'Workshift not found' });
    }

    // Publish message to RabbitMQ
    if (process.env.NODE_ENV !== 'test') {
      const msg = {
        event: 'workshift-deleted',
        workshift: workshift
      };
      channel.publish(exchangeName, '', Buffer.from(JSON.stringify(msg)));
    }

    logger.info(`Workshift ${workshift._id} deleted`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkshiftsByDoctorId = async (req, res) => {
  try {
    const workshifts = await Workshift.find({ doctorId: req.params.doctorId });
    if (workshifts.length === 0) {
      logger.error(`Workshifts not found for doctor ${req.params.doctorId}`);
      return res.status(404).json({ message: 'Workshifts not found' });
    }    logger.debug(`Returning ${workshifts.length} workshifts`);
    res.status(200).json(workshifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
