import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Workshift from '../../../src/schemas/Workshift.js';
import { v4 as uuidv4 } from 'uuid';

describe('WORKSHIFT VALIDATION TEST', () => {
  beforeEach(async () => {
    await mongoose.connection.collections['workshifts']?.deleteMany({});
  });
  describe('all fields are required', () => {
    it('should not create a workshift without doctorId', async () => {
      const workshift = new Workshift({
        clinicId: uuidv4(),
        startDate: new Date('2024-01-15T08:00:00Z'),
      });
      await expect(workshift.save()).rejects.toThrowError(/doctorId.*required/);
    });

    it('should not create a workshift without clinicId', async () => {
      const workshift = new Workshift({
        doctorId: uuidv4(),
        startDate: new Date('2024-01-15T08:00:00Z'),
      });
      await expect(workshift.save()).rejects.toThrowError(/clinicId.*required/);
    });

    it('should not create a workshift without startDate', async () => {
      const workshift = new Workshift({
        doctorId: uuidv4(),
        clinicId: uuidv4(),
      });
      await expect(workshift.save()).rejects.toThrowError(/startDate.*required/);
    });
  });
  describe('ids should be uuidv4', () => {
    it('should create a workshift with valid UUIDs', async () => {
      let validDoctorId = uuidv4();
      let validClinicId = uuidv4();
      const validWorkshift = new Workshift({
        doctorId: validDoctorId,
        clinicId: validClinicId,
        startDate: new Date('2024-01-15T08:00:00Z'),
      });
      await validWorkshift.save();

      expect(validWorkshift.doctorId).toBe(validDoctorId)
      expect(validWorkshift.clinicId).toBe(validClinicId)
    });

    it('should not create a workshift with invalid UUIDs', async () => {
      const invalidWorkshift = new Workshift({
        doctorId: 'invalidDoctorId',
        clinicId: 'invalidClinicId',
        startDate: new Date('2024-01-15T08:00:00Z'),
      });
      await expect(invalidWorkshift.save()).rejects.toThrowError(/not a valid UUID!/);
    });
  });

  describe('end date calculation', () => {
    it('should calculate endDate based on startDate and duration', async () => {
      const startDate = new Date('2024-01-15T08:00:00Z');
      const duration = 480; // 8 hours
      const workshift = new Workshift({
        doctorId: uuidv4(),
        clinicId: uuidv4(),
        startDate: startDate,
        duration: duration,
      });
      await workshift.save();

      const expectedEndDate = new Date(startDate);
      expectedEndDate.setMinutes(startDate.getMinutes() + duration);

      expect(workshift.endDate.toISOString()).toBe(expectedEndDate.toISOString());
    });

    it('should update endDate if startDate or duration is changed in update', async () => {
      const workshift = await Workshift.create({
        doctorId: uuidv4(),
        clinicId: uuidv4(),
        startDate: new Date('2024-01-15T08:00:00Z'),
        duration: 480,
      });

      const newStartDate = new Date('2024-01-16T09:00:00Z');
      const newDuration = 300; // 5 hours

      await Workshift.findOneAndUpdate(
        { _id: workshift._id },
        { startDate: newStartDate, duration: newDuration }
      );

      const updatedWorkshift = await Workshift.findById(workshift._id);
      const expectedEndDate = new Date(newStartDate);
      expectedEndDate.setMinutes(newStartDate.getMinutes() + newDuration);

      expect(updatedWorkshift.endDate.toISOString()).toBe(expectedEndDate.toISOString());
    });
  });

  describe('duration validation', () => {
    it('should not create a workshift with duration less than 60', async () => {
      const workshift = new Workshift({
        doctorId: uuidv4(),
        clinicId: uuidv4(),
        startDate: new Date('2024-01-15T08:00:00Z'),
        duration: 59,
      });
      await expect(workshift.save()).rejects.toThrowError("Workshift validation failed: duration: Path `duration` (59) is less than minimum allowed value (60).");
    });
    it('should default to 480 minutes if duration is not provided', async () => {
      const workshift = new Workshift({
        doctorId: uuidv4(),
        clinicId: uuidv4(),
        startDate: new Date('2024-01-15T08:00:00Z'),
      });
      await workshift.save();

      expect(workshift.duration).toBe(480);
    });
  });

  describe('bulk insertion', () => {
    it('should calculate endDate for each document in insertMany', async () => {
      const workshifts = [
        {
          doctorId: uuidv4(),
          clinicId: uuidv4(),
          startDate: new Date('2024-01-15T08:00:00Z'),
          duration: 480,
        },
        {
          doctorId: uuidv4(),
          clinicId: uuidv4(),
          startDate: new Date('2024-01-15T16:00:00Z'),
          duration: 240,
        },
      ];

      await Workshift.insertMany(workshifts);

      const insertedWorkshifts = await Workshift.find();
      expect(insertedWorkshifts).toHaveLength(2);

      insertedWorkshifts.forEach((workshift, index) => {
        const expectedEndDate = new Date(workshifts[index].startDate);
        expectedEndDate.setMinutes(expectedEndDate.getMinutes() + workshifts[index].duration);
        expect(workshift.endDate.toISOString()).toBe(expectedEndDate.toISOString());
      });
    });
  });
});
