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

const today = new Date();
const tomorrow = new Date(today.setDate(today.getDate() + 1));
// const inTwoDays = new Date(today.setDate(today.getDate() + 2));
const inThreeDays = new Date(today.setDate(today.getDate() + 3));
const inFourDays = new Date(today.setDate(today.getDate() + 4));

const doctor2 = {
  id: '27163ac7-4f4d-4669-a0c1-4b8538405475',
  name: 'Alvaro',
  surname: 'Flores',
  specialty: 'cardiology',
  dni: '10000004H',
  userId: '27163ac7-4f4d-4669-a0c1-4b8538405475',
  clinicId: '27163ac7-4f4d-4669-a0c1-4b8538405475'
}

const doctor3 = {
  id: 'a1ac971e-7188-4eaa-859c-7b2249e3c46b',
  name: 'Adrian',
  surname: 'Bernal',
  specialty: 'neurology',
  dni: '20060493P',
  userId: '679f55e3-a3cd-4a47-aebd-13038c1528a0',
  clinicId: '5b431574-d2ab-41d3-b1dd-84b06f2bd1a0'
}

const workshiftsSample = [
  {
    _id: uuidv4(),
    doctorId: doctor3.id,
    clinicId: doctor2.clinicId,
    startDate: new Date(today.setHours(8, 0, 0, 0)),
    duration: 120
  },
  {
    _id: uuidv4(),
    doctorId: doctor2.id,
    clinicId: doctor2.clinicId,
    startDate: new Date(today.setHours(18, 0, 0, 0)),
    duration: 120
  },
  {
    _id: uuidv4(),
    doctorId: doctor3.id,
    clinicId: doctor3.clinicId,
    startDate: new Date(tomorrow.setHours(9, 0, 0, 0)),
    duration: 240
  },
  {
    _id: uuidv4(),
    doctorId: doctor2.id,
    clinicId: doctor2.clinicId,
    startDate: new Date(inThreeDays.setHours(10, 0, 0, 0)),
    duration: 240
  },
  {
    _id: uuidv4(),
    doctorId: doctor3.id,
    clinicId: doctor3.clinicId,
    startDate: new Date(inThreeDays.setHours(12, 0, 0, 0)),
    duration: 120
  },
  {
    _id: uuidv4(),
    doctorId: doctor2.id,
    clinicId: doctor2.clinicId,
    startDate: new Date(inFourDays.setHours(13, 0, 0, 0)),
    duration: 240
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
