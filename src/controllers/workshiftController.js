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
      logger.error('Error creating workshift: Doctor already has a shift during this period', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

      return res.status(400).json({ message: 'Doctor already has a shift during this period' });
    }

    const totalHours = await getDoctorWeeklyHours(doctorId, new Date(startDate));
    const newShiftHours = duration / 60;

    if (totalHours + newShiftHours > 40) {
      logger.warn('Error creating workshift: Doctor cannot exceed 40 hours per week', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

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
    logger.info('Received request to create workshift', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });

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
    logger.error('Error creating workshift', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message,
    });
    res.status(400).json({ message: error.message });
  }
};

export const createWorkshiftsBulk = async (req, res) => {
  try {
    const { doctorId, clinicId, duration, periodStartDate, periodEndDate } = req.body;

    if (!doctorId || !clinicId || !periodStartDate || !periodEndDate) {
      logger.error('Error creating workshifts: doctorId, clinicId, periodStartDate, and periodEndDate are required', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

      return res.status(400).json({ message: 'doctorId, clinicId, periodStartDate, and periodEndDate are required' });
    }

    const startDate = new Date(periodStartDate);
    let endDate = new Date(periodEndDate);

    endDate.setHours(startDate.getHours());
    endDate.setMinutes(startDate.getMinutes());
    endDate.setSeconds(startDate.getSeconds());
    endDate.setMilliseconds(startDate.getMilliseconds());

    if (endDate < startDate && endDate.getDate() !== startDate.getDate()) {
      logger.error('Error creating workshifts: The work period must be at least one day long', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

      return res.status(400).json({ message: 'The work period must be at least one day long' });
    }

    const startWeek = await getWeek(startDate);
    const endWeek = await getWeek(endDate);

    if (startWeek !== endWeek) {
      logger.error('Error creating workshifts: The work period must be within the same week', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

      return res.status(400).json({ message: 'The work period must be within the same week' });
    }

    const workshifts = [];
    let weeklyHours = await getDoctorWeeklyHours(doctorId, startDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const overlapping = await checkForOverlappingShifts(doctorId, new Date(startDate), duration);
      if (overlapping) {
        logger.error('Error creating workshifts: Doctor already has a shift during this period', {
          method: req.method,
          url: req.originalUrl,
          ip: req.headers['x-forwarded-for'] || req.ip,
          requestId: req.headers && req.headers['x-request-id'] || null,
        });

        return res.status(400).json({ message: 'Doctor already has a shift during this period' });
      }

      if (weeklyHours + duration / 60 > 40) {
        logger.error('Error creating workshifts: Doctor cannot exceed 40 hours per week', {
          method: req.method,
          url: req.originalUrl,
          ip: req.headers['x-forwarded-for'] || req.ip,
          requestId: req.headers && req.headers['x-request-id'] || null,
        });
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

    logger.info( `Created ${workshifts.length} workshifts for doctor ${doctorId} at clinic ${clinicId}`, {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });

    res.status(201).json(workshifts);
  } catch (error) {
    logger.error('Error creating workshifts', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message,
    });

    res.status(400).json({ message: error.message });
  }
};

export const getAllWorkshifts = async (req, res) => {
  try {
    const workshifts = await Workshift.find();
    res.status(200).json(workshifts);
  } catch (error) {
    logger.error('Error getting all workshifts', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message,
    });

    res.status(500).json({ message: error.message });
  }
};

export const getWorkshiftById = async (req, res) => {
  try {
    const workshift = await Workshift.findById(req.params.id);
    if (!workshift) {
      logger.error(`Workshift ${req.params.id} not found`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

      return res.status(404).json({ message: 'Workshift not found' });
    }
    res.status(200).json(workshift);
  } catch (error) {
    logger.error('Error getting workshift by id', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message,
    });
    res.status(500).json({ message: error.message });
  }
};

export const updateWorkshift = async (req, res) => {
  try {
    if (!req.body.startDate || !req.body.duration) {
      logger.error('Error updating workshift: Start date and duration are required', {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

      return res.status(400).json({ message: 'Start date and duration are required' });
    }
    const workshift = await Workshift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!workshift) {
      logger.error(`Workshift ${req.params.id} not found`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

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

    logger.info(`Workshift ${workshift._id} updated`, {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });

    res.status(200).json(workshift);
  } catch (error) {
    logger.error('Error updating workshift', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message,
    });

    res.status(400).json({ message: error.message });
  }
};

export const deleteWorkshift = async (req, res) => {
  try {
    const workshift = await Workshift.findByIdAndDelete(req.params.id);
    if (!workshift) {
      logger.error(`Workshift ${req.params.id} not found`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

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

    logger.info(`Workshift ${workshift._id} deleted`, {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting workshift', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message,
    });

    res.status(500).json({ message: error.message });
  }
};

export const getWorkshiftsByDoctorId = async (req, res) => {
  try {
    const workshifts = await Workshift.find({ doctorId: req.params.doctorId });
    if (workshifts.length === 0) {
      logger.error(`Workshifts not found for doctor ${req.params.doctorId}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.headers['x-forwarded-for'] || req.ip,
        requestId: req.headers && req.headers['x-request-id'] || null,
      });

      return res.status(404).json({ message: 'Workshifts not found' });
    }
    res.status(200).json(workshifts);
  } catch (error) {
    logger.error('Error getting workshifts by doctor id', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      ip: req.headers['x-forwarded-for'] || req.ip,
      requestId: req.headers && req.headers['x-request-id'] || null,
      error: error.message,
    });

    res.status(500).json({ message: error.message });
  }
};
