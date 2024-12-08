import { describe, expect, it, afterEach,beforeEach, vi } from 'vitest';
import Workshift from '../../../src/schemas/Workshift.js';
import { request } from '../../setup/setup';
import jwt from 'jsonwebtoken';

beforeEach(() => {
  vi.spyOn(jwt, 'verify').mockReturnValueOnce({
    userId: 'userId',
    roles: ['doctor'],
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

let nextWeekMonday = new Date();
nextWeekMonday.setDate(nextWeekMonday.getDate() + (1 + 7 - nextWeekMonday.getDay()) % 7);

let nextWeekWednesday = new Date();
nextWeekWednesday.setDate(nextWeekWednesday.getDate() + (3 + 7 - nextWeekWednesday.getDay()) % 7);


describe('Workshift Controller Unit', () => {
  describe('GET /workshifts', () => {
    it('should return all workshifts', async () => {
      const workshifts = [
        {
          doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
          clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
          startDate: new Date(),
          duration: 60,
        },
      ];
      vi.spyOn(Workshift, 'find').mockResolvedValueOnce(workshifts);
      const res = await request.get('/workshifts').set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(200);
      expect(res.body.length).toEqual(workshifts.length);
    });
  });
  describe('POST /workshifts', () => {
    it('should create a new workshift', async () => {
      const workshift = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        startDate: new Date(),
        duration: 60,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([]);
      vi.spyOn(Workshift, 'create').mockResolvedValueOnce(workshift);
      const res = await request.post('/workshifts').send(workshift).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(201);
      expect(res.body.length).toEqual(workshift.length);
    });
    it('should return 400 with missing doctorId', async () => {
      const workshift = {
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        startDate: new Date(),
        duration: 60,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([]);
      const res = await request.post('/workshifts').send(workshift).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Workshift validation failed: doctorId: Path `doctorId` is required.');
    });
    it('should return 400 with overlapping workshifts', async () => {
      const workshift = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        startDate: new Date(),
        duration: 60,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([workshift]);
      const res = await request.post('/workshifts').send(workshift).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Doctor already has a shift during this period');
    });
  });
  describe('POST bulk /workshifts/week', () => {
    it('should create a new workshift for the week', async () => {
      const workshiftBulk = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        periodStartDate: nextWeekMonday,
        duration: 240,
        periodEndDate: nextWeekWednesday,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([]);
      const res = await request.post('/workshifts/week').send(workshiftBulk).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(201);
      expect(res.body.length).toEqual(3);
    });
    it('should return 400 cannot exceed 40 hours', async () => {
      const workshiftBulk = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        periodStartDate: nextWeekMonday,
        duration: 900,
        periodEndDate: nextWeekWednesday,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([]);
      const res = await request.post('/workshifts/week').send(workshiftBulk).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Doctor bbc3fe0c-2748-4c3a-b451-b59308b8aa31 cannot exceed 40 hours per week. Current hours: 30');
    });
    it('should return 400 with overlapping workshifts', async () => {
      const workshift = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        startDate: new Date(),
        duration: 60,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([workshift]);
      const res = await request.post('/workshifts').send(workshift).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Doctor already has a shift during this period');
    });
    it('should return 400 the work period must be within the same week', async () => {
      const workshiftBulk = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        periodStartDate: new Date(),
        duration: 240,
        periodEndDate: nextWeekWednesday,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([]);
      const res = await request.post('/workshifts/week').send(workshiftBulk).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('The work period must be within the same week');
    });
    it('should return 400 the work period must be at least one day long', async () => {
      const workshiftBulk = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        periodStartDate: nextWeekMonday,
        duration: 240,
        periodEndDate: new Date(),
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([]);
      const res = await request.post('/workshifts/week').send(workshiftBulk).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('The work period must be at least one day long');
    });
    it('should return 400 doctorId, clinicId, periodStartDate, and periodEndDate are required', async () => {
      const workshiftBulk = {
        duration: 240,
      };
      vi.spyOn(Workshift, 'find').mockResolvedValue([]);
      const res = await request.post('/workshifts/week').send(workshiftBulk).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('doctorId, clinicId, periodStartDate, and periodEndDate are required');
    });
  });
  describe('GET /workshifts/:id', () => {
    it('should return a workshift by id', async () => {
      const workshift = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        startDate: new Date(),
        duration: 60,
      };
      vi.spyOn(Workshift, 'findById').mockResolvedValueOnce(workshift);
      const res = await request.get('/workshifts/1').set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(200);
      expect(res.body.length).toEqual(workshift.length);
    });
    it('should return 404 if workshift not found', async () => {
      vi.spyOn(Workshift, 'findById').mockResolvedValueOnce(null);
      const res = await request.get('/workshifts/1').set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Workshift not found');
    });
  });
  describe('PUT /workshifts/:id', () => {
    it('should update a workshift by id', async () => {
      const workshift = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        startDate: new Date(),
        duration: 60,
      };
      vi.spyOn(Workshift, 'findByIdAndUpdate').mockResolvedValueOnce(workshift);
      const res = await request.put('/workshifts/1').send(workshift).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(200);
      expect(res.body.duration).toEqual(60);
    });
    it('should return 400 start date and duration are required', async () => {
      const workshift = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
      };
      vi.spyOn(Workshift, 'findByIdAndUpdate').mockResolvedValueOnce(null);
      const res = await request.put('/workshifts/1').send(workshift).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Start date and duration are required');
    });
    it('should return 404 if workshift not found', async () => {
      const workshift = {
        doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
        clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
        startDate: new Date(),
        duration: 60,
      };
      vi.spyOn(Workshift, 'findByIdAndUpdate').mockResolvedValueOnce(null);
      const res = await request.put('/workshifts/1').send(workshift).set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Workshift not found');
    });
  });
  describe('DELETE /workshifts/:id', () => {
    it('should delete a workshift by id', async () => {
      vi.spyOn(Workshift, 'findByIdAndDelete').mockResolvedValueOnce({});
      const res = await request.delete('/workshifts/1').set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(204);
    });
    it('should return 404 if workshift not found', async () => {
      vi.spyOn(Workshift, 'findByIdAndDelete').mockResolvedValueOnce(null);
      const res = await request.delete('/workshifts/1').set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Workshift not found');
    });
  });
  describe('GET /workshifts/doctor/:doctorId', () => {
    it('should return all workshifts for a doctor', async () => {
      const workshifts = [
        {
          doctorId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa31',
          clinicId: 'bbc3fe0c-2748-4c3a-b451-b59308b8aa32',
          startDate: new Date(),
          duration: 60,
        },
      ];
      vi.spyOn(Workshift, 'find').mockResolvedValueOnce(workshifts);
      const res = await request.get('/workshifts/doctor/bbc3fe0c-2748-4c3a-b451-b59308b8aa31').set('Cookie', 'token=valid.token.value');
      expect(res.status).toBe(200);
      expect(res.body.length).toEqual(workshifts.length);
    });
    it('should return 404 if doctor not found', async () => {
      vi.spyOn(Workshift, 'find').mockResolvedValueOnce([]);
      const res = await request.get('/workshifts/doctor/bbc3fe0c-2748-4c3a-b451-b59308b8aa31').set('Cookie', 'token=valid.token.value');
      console.log(res.body);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Doctor not found');
    });
  });
});