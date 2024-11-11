import Workshift from '../schemas/Workshift.js';
import logger from '../config/logger.js';

export const createWorkshift = async (req, res) => {
  try {
    const { doctorId, clinicId, startDate, duration } = req.body;
    const workshift = new Workshift({
      doctorId,
      clinicId,
      startDate,
      duration
    }
    );
    await workshift.save();
    logger.info(`Workshift ${workshift._id} created`);
    res.status(201).json(workshift);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createWorkshiftsBulk = async (req, res) => {
  try {
    const { doctorId, clinicId, duration, weekStartDate, weekEndDate } = req.body;

    // Parsear las fechas para evitar mutaciones no intencionadas
    const startDate = new Date(weekStartDate);
    const endDate = new Date(weekEndDate);

    if (startDate.getDay() !== 1 || endDate.getDay() !== 0 || (endDate - startDate) / (1000 * 60 * 60 * 24) !== 6) {
      return res.status(400).json({ message: 'weekStartDate must be a Monday and weekEndDate a Sunday of the same week' });
    }

    const workshifts = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      workshifts.push(new Workshift({
        doctorId,
        clinicId,
        startDate: new Date(d),
        duration
      }));
    }

    // todo validate bussiness rules

    await Workshift.insertMany(workshifts);
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
    const workshift = await Workshift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!workshift) {
      return res.status(404).json({ message: 'Workshift not found' });
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
    logger.info(`Workshift ${workshift._id} deleted`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailability = async (req, res) => {
  const { clinicId, date } = req.query;
  try {
    logger.debug(`Checking availability for clinic ${clinicId} at ${date}`);
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);// Suponiendo que la duración es de 30 minutos

    const workshifts = await Workshift.find({
      clinicId,
      startDate: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    //TODO: Cache de apointments



    //TODO: Comprobar la especialidad del doctor además de la disponibilidad

    //TODO: Comprobar si el doctor tiene una cita en ese horario

    if (workshifts.length === 1) {
      logger.debug(`Workshift available for clinic ${clinicId} at ${date}`);
      return res.status(200).json({ available: true, doctorId: workshifts[0].doctorId });
    } else if(workshifts.length > 1){
      logger.debug(`Workshift available for clinic ${clinicId} at ${date}`);
      const doctorIds = workshifts.map(workshift => workshift.doctorId);
      return res.status(200).json({ available: true, doctorIds: doctorIds });
    } else {
      logger.debug(`Workshift not available for clinic ${clinicId} at ${date}`);
      return res.status(200).json({ available: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkshiftsByDoctorId = async (req, res) => {
  try {
    const workshifts = await Workshift.find({ doctorId: req.params.doctorId });
    logger.debug(`Returning ${workshifts.length} workshifts`);
    res.status(200).json(workshifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
