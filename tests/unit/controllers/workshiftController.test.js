import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import Workshift from '../../../src/schemas/Workshift.js';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../../setup/database';
import { request } from '../../setup/setup';

let clinic1Id = uuidv4();
let clinic2Id = uuidv4();

let doctor1Id = uuidv4();
let doctor2Id = uuidv4();
let doctor3Id = uuidv4();
let doctor4Id = uuidv4();

let today = new Date();
let dayOfWeek = today.getUTCDay(); // 0 (sunday) - 6 (saturday)
let offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
let thisWeeksMonday = new Date(today);
thisWeeksMonday.setUTCDate(today.getUTCDate() + offsetToMonday);
thisWeeksMonday.setUTCHours(0, 0, 0, 0);

let thisWeeksFriday = new Date(thisWeeksMonday);
thisWeeksFriday.setUTCDate(thisWeeksMonday.getUTCDate() + 4);

const generateWorkshiftsForWeek = () => {
  const workshifts = [];
  const duration = 240;

  for (let day = 0; day < 7; day++) {
    const currentDay = new Date(thisWeeksMonday);
    currentDay.setUTCDate(thisWeeksMonday.getUTCDate() + day);

    // morning shift (8 - 12)
    workshifts.push(new Workshift({
      _id: uuidv4(),
      doctorId: [doctor1Id, doctor2Id, doctor3Id, doctor4Id][day % 4],
      clinicId: day % 2 === 0 ? clinic1Id : clinic2Id,
      startDate: new Date(currentDay.setUTCHours(8, 0, 0, 0)),
      duration: duration,
    }));

    // afternoon shift (13 - 17)
    workshifts.push(new Workshift({
      _id: uuidv4(),
      doctorId: [doctor1Id, doctor2Id, doctor3Id, doctor4Id][(day + 1) % 4],
      clinicId: day % 2 === 0 ? clinic2Id : clinic1Id,
      startDate: new Date(currentDay.setUTCHours(13, 0, 0, 0)),
      duration: duration,
    }));
  }

  return workshifts;
};

const sampleWorkshifts = generateWorkshiftsForWeek()

beforeAll(async () => {
  await db.clearDatabase();
  await Workshift.insertMany(sampleWorkshifts);
});

afterAll(async () => {
  await db.clearDatabase();
});

describe('WORKSHIFT ENDPOINTS TEST', () => {
  describe('test GET /workshifts', () => {
    it('should return 200 and same number of elements as sample', async () => {
      const response = await request.get('/api/v1/workshifts');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(sampleWorkshifts.length);
    });
  });
  describe('test GET /workshifts/:id', () => {
    it('should return 200 and the correct workshift', async () => {
      const response = await request.get(`/api/v1/workshifts/${sampleWorkshifts[0]._id}`);

      const expectedWorkshift = {
        ...sampleWorkshifts[0].toObject(), // Convert to a plain JS object if it's a Mongoose document
        createdAt: sampleWorkshifts[0].createdAt.toISOString(),
        updatedAt: sampleWorkshifts[0].updatedAt.toISOString(),
        startDate: sampleWorkshifts[0].startDate.toISOString(),
        endDate: sampleWorkshifts[0].endDate.toISOString(),
      };

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedWorkshift);
    });
  });
  describe('test GET /workshifts/doctor/:doctorId', () => {
    it('should return 200 and the correct workshifts', async () => {
      const response = await request.get(`/api/v1/workshifts/doctor/${doctor1Id}`);

      const expectedWorkshifts = sampleWorkshifts.filter(workshift => workshift.doctorId === doctor1Id)
        .map(workshift => ({
          ...workshift.toObject(),
          createdAt: workshift.createdAt.toISOString(),
          updatedAt: workshift.updatedAt.toISOString(),
          startDate: workshift.startDate.toISOString(),
          endDate: workshift.endDate.toISOString(),
        }));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedWorkshifts);
    });
  });
  describe('test negative no id GET /workshifts/doctor/:doctorId', () => {
    it('should return 404', async () => {
      const response = await request.get(`/api/v1/workshifts/doctor/${uuidv4()}`);
      expect(response.status).toBe(404);
    })
  });
  describe('test negative no id GET /workshifts/:id', () => {
    it('should return 404', async () => {
      const response = await request.get(`/api/v1/workshifts/${uuidv4()}`);
      expect(response.status).toBe(404);
    });
  });
  describe('test POST /workshifts', () => {
    it('should return 201 and should add a workshift', async () => {
      const previousWorkshifts = await Workshift.find();

      let nextWeek = new Date(today);
      nextWeek.setUTCDate(today.getUTCDate() + 7);

      console.log("hereee")
      console.log(nextWeek.toISOString());
      console.log(await Workshift.find(
        {
          doctorId: doctor1Id,
        }
      ));

      const newWorkshift = {
        doctorId: doctor1Id,
        clinicId: clinic1Id,
        startDate: nextWeek.toISOString(),
        duration: 240,
      };

      const response = await request.post('/api/v1/workshifts').send(newWorkshift);
      const currentWorkshifts = await Workshift.find();
      console.log(response.body)
      expect(response.status).toBe(201);
      expect(currentWorkshifts.length).toBe(previousWorkshifts.length + 1);
    });
  });
  describe('test negative no body POST /workshifts', () => {
    it('should return 400', async () => {
      const response = await request.post('/api/v1/workshifts');
      expect(response.status).toBe(400);
    });
  });
  describe('test PUT /workshifts/:id', () => {
    it('should return 200 and should update a workshift', async () => {
      const newStartDate = new Date(sampleWorkshifts[0].startDate);
      newStartDate.setMinutes(newStartDate.getMinutes() + 60); // add 60 minutes
      const newEndDate = new Date(newStartDate);
      newEndDate.setMinutes(newEndDate.getMinutes() + 240); // add duration (240 minutes)

      const response = await request.put(`/api/v1/workshifts/${sampleWorkshifts[0]._id}`)
        .send({
          startDate: newStartDate,
          duration: 240,
        });

      const updatedWorkshiftFromDb = await Workshift.findById(sampleWorkshifts[0]._id);

      expect(response.status).toBe(200);
      expect(updatedWorkshiftFromDb.startDate.toISOString()).toBe(newStartDate.toISOString());
      expect(updatedWorkshiftFromDb.endDate.toISOString()).toBe(newEndDate.toISOString()); // Ensure the updated endDate is correct
    });
  });
  describe('test POST /workshifts/week', () => {

    let doctorId = uuidv4();
    let clinicId = uuidv4();

    let todayAt8 = new Date(today);
    todayAt8.setUTCHours(8, 0, 0, 0);

    let todayPlus3 = new Date(today);
    todayPlus3.setDate(todayPlus3.getDate() + 3);
    todayPlus3 = todayPlus3.toISOString().split('T')[0];

    let nextWeek = new Date(today);
    nextWeek.setUTCDate(today.getUTCDate() + 8);
    nextWeek = nextWeek.toISOString().split('T')[0];

    it('should return 201 and create workshifts when provided with valid data', async () => {
      const response = await request.post('/api/v1/workshifts/week')
        .send({
          doctorId,
          clinicId,
          duration: 240,
          periodStartDate: todayAt8,
          periodEndDate: todayPlus3,
        });

      expect(response.status).toBe(201);
      expect(response.body).to.be.an('array');
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('doctorId', doctorId);
      expect(response.body[0]).toHaveProperty('clinicId', clinicId);
      expect(response.body[0]).toHaveProperty('startDate');
      expect(response.body[0]).toHaveProperty('duration', 240);
    });

    it('should return 400 if the periodEndDate is earlier than periodStartDate', async () => {
      const response = await request.post('/api/v1/workshifts/week')
        .send({
          doctorId,
          clinicId,
          duration: 240,
          periodStartDate: todayPlus3,
          periodEndDate: todayAt8,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('The work period must be at least one day long');
    });

    it('should return 400 if the period spans different weeks', async () => {
      const response = await request.post('/api/v1/workshifts/week')
        .send({
          doctorId,
          clinicId,
          duration: 240,
          periodStartDate: todayAt8,
          periodEndDate: nextWeek,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('The work period must be within the same week');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request.post('/api/v1/workshifts/week')
        .send({
          doctorId,
          duration: 240,  // Missing clinicId and periodStartDate
          periodEndDate: todayPlus3,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('doctorId, clinicId, periodStartDate, and periodEndDate are required');
    });
  });
  describe('test negative no body PUT /workshifts/:id', () => {
    it('should return 400', async () => {
      const response = await request.put(`/api/v1/workshifts/${sampleWorkshifts[0]._id}`);
      expect(response.status).toBe(400);
    });
  });
  describe('test negative no id PUT /workshifts/:id', () => {
    it('should return 404', async () => {
      const response = await request.put(`/api/v1/workshifts/${uuidv4()}`);
      expect(response.status).toBe(400);
    });
  });
  describe('test DELETE /workshifts/:id', () => {
    it('should return 204 and should delete a workshift', async () => {
      const previousWorkshifts = await Workshift.find();
      const response = await request.delete(`/api/v1/workshifts/${sampleWorkshifts[0]._id}`);
      const currentWorkshifts = await Workshift.find();
      expect(response.status).toBe(204);
      expect(currentWorkshifts.length).toBe(previousWorkshifts.length - 1);
    });
  });
});
describe('WORKSHIFT BUSINESS LOGIC TEST', () => {
  describe('test POST /workshifts with weekly hours limit', () => {
    it('should return 400 if creating shifts exceeds the weekly hour limit for the doctor', async () => {
      const doctorId = doctor2Id;
      const clinicId = clinic2Id;

      const thisWeeksSunday = new Date(today);
      thisWeeksSunday.setUTCDate(today.getUTCDate() + 7);
      thisWeeksSunday.setUTCHours(0, 0, 0, 0);

      const newWorkshift = {
        doctorId,
        clinicId,
        duration: 2880,
        startDate: thisWeeksSunday,
      };

      const response = await request.post('/api/v1/workshifts').send(newWorkshift);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot exceed 40 hours per week');
    });
  });
  describe('test POST /workshifts/week with weekly hours limit', () => {
    it('should return 400 if creating shifts exceeds the weekly hour limit for the doctor', async () => {
      const doctorId = doctor1Id;
      const clinicId = clinic1Id;

      const newWorkshift = {
        doctorId,
        clinicId,
        duration: 480,
        periodStartDate: thisWeeksMonday,
        periodEndDate: thisWeeksFriday,
      };

      const response = await request.post('/api/v1/workshifts/week').send(newWorkshift);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot exceed 40 hours per week');
    });
  });
  describe('test POST /workshifts with overlapping times', () => {
    it('should return 400 if creating shifts overlaps with existing shifts', async () => {
      const doctorId = uuidv4();
      const clinicId = clinic1Id;

      const overlappingShiftStart = new Date(today);
      overlappingShiftStart.setUTCHours(8, 0, 0, 0);

      await Workshift.create({
        _id: uuidv4(),
        doctorId,
        clinicId,
        startDate: overlappingShiftStart,
        duration: 240,
      });

      console.log('workshift created')
      console.log(Workshift.find(
        {
          doctorId,
          clinicId,
        }
      )
      );

      const overlappingWorkshift = {
        doctorId,
        clinicId,
        startDate: overlappingShiftStart,
        duration: 240,
      };

      const response = await request.post('/api/v1/workshifts').send(overlappingWorkshift);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Doctor already has a shift during this period');
    });
  });
  describe('test POST /workshifts/week with overlapping times', () => {
    it('should return 400 if creating shifts overlaps with existing shifts', async () => {
      const doctorId = uuidv4();
      const clinicId = clinic1Id;

      const overlappingShiftStart = new Date(today);
      overlappingShiftStart.setUTCHours(8, 0, 0, 0);

      const todayPlus3 = new Date(today);
      todayPlus3.setUTCDate(today.getUTCDate() + 3);

      await Workshift.create({
        _id: uuidv4(),
        doctorId,
        clinicId,
        startDate: overlappingShiftStart,
        duration: 240,
      });

      const overlappingWorkshift = {
        doctorId,
        clinicId,
        duration: 240,
        periodStartDate: overlappingShiftStart,
        periodEndDate: todayPlus3,
      };

      const response = await request.post('/api/v1/workshifts/week').send(overlappingWorkshift);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Doctor already has a shift during this period');
    });
  });
});