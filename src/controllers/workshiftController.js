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
    if (workshifts.length === 0) {
      logger.debug(`Workshift available for clinic ${clinicId} at ${date}`);
      return res.status(200).json({ available: true });
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