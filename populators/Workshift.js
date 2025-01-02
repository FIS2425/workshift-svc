import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid'; 
import Workshift from '../src/schemas/Workshift.js';

const MONGO_URI = process.env.MONGOURL;

const connectToDatabase = async () => {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB successfully');
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error.message);
    });
};

const workshiftsSample = [
  {
    _id: uuidv4(),
    doctorId: uuidv4(),
    clinicId: uuidv4(),
    startDate: new Date('2025-01-10T09:00:00Z'),
    duration: 60
  },
  {
    _id: uuidv4(),
    doctorId: uuidv4(),
    clinicId: uuidv4(),
    startDate: new Date('2025-01-11T10:00:00Z'),
    duration: 120
  },
  {
    _id: uuidv4(),
    doctorId: uuidv4(),
    clinicId: uuidv4(),
    startDate: new Date('2025-01-12T11:00:00Z'),
    duration: 60
  },
  {
    _id: uuidv4(),
    doctorId: uuidv4(),
    clinicId: uuidv4(),
    startDate: new Date('2025-01-13T13:00:00Z'),
    duration: 90
  },
  {
    _id: uuidv4(),
    doctorId: uuidv4(),
    clinicId: uuidv4(),
    startDate: new Date('2025-01-14T14:00:00Z'),
    duration: 120
  }
];

async function populateWorkshifts() {
  try {
    await Workshift.deleteMany({
      doctorId: { $in: workshiftsSample.map((appt) => appt.doctorId) },
      clinicId: { $in: workshiftsSample.map((appt) => appt.clinicId) }
    });
    
    for (const apptData of workshiftsSample) {
      const template = new Workshift(apptData);
      await template.save();
      console.log('Workshift created successfully');
    }

    console.log('All sample workshifts have been created');
  } catch (error) {
    console.error('Error populating workshifts:', error);
  } finally {
    mongoose.disconnect();
  }
}

(async () => {
  await connectToDatabase();
  await populateWorkshifts();
})();
