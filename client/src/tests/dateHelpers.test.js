import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDDMMYYYY,
  formatDDMMYYYY,
  calculateAge,
  calculateYearsOfService,
  calculateMonthsToRetirement,
  getRetirementStatus,
} from '../utils/dateHelpers';

describe('dateHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parseDDMMYYYY', () => {
    it('should parse valid DD-MM-YYYY string to Date', () => {
      const result = parseDDMMYYYY('15-03-2024');
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    it('should return null for invalid format', () => {
      expect(parseDDMMYYYY('not-a-date')).toBeNull();
      expect(parseDDMMYYYY('')).toBeNull();
      expect(parseDDMMYYYY(null)).toBeNull();
    });

    it('should accept YYYY-MM-DD format', () => {
      const result = parseDDMMYYYY('2024-03-15');
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    it('should accept DD/MM/YYYY format', () => {
      const result = parseDDMMYYYY('15/03/2024');
      expect(result).toEqual(new Date(2024, 2, 15));
    });

    it('should return null for invalid dates like Feb 30', () => {
      expect(parseDDMMYYYY('30-02-2024')).toBeNull();
    });
  });

  describe('formatDDMMYYYY', () => {
    it('should format Date to DD-MM-YYYY string', () => {
      expect(formatDDMMYYYY(new Date(2024, 2, 15))).toBe('15-03-2024');
    });

    it('should handle ISO string without timezone shift', () => {
      const result = formatDDMMYYYY('2024-01-15');
      expect(result).toBe('15-01-2024');
    });

    it('should return empty string for invalid input', () => {
      expect(formatDDMMYYYY('')).toBe('');
      expect(formatDDMMYYYY(null)).toBe('');
      expect(formatDDMMYYYY('invalid')).toBe('');
    });
  });

  describe('calculateAge', () => {
    it('should calculate correct age', () => {
      expect(calculateAge('01-01-1990')).toBe(36);
    });

    it('should return 0 for someone born today', () => {
      expect(calculateAge('01-05-2026')).toBe(0);
    });

    it('should return 0 for future dates (negative age protection)', () => {
      expect(calculateAge('01-01-2030')).toBe(0);
    });

    it('should return null for invalid dates', () => {
      expect(calculateAge('')).toBeNull();
      expect(calculateAge(null)).toBeNull();
    });
  });

  describe('calculateYearsOfService', () => {
    it('should calculate correct years of service', () => {
      expect(calculateYearsOfService('01-01-2016')).toBe(10);
    });

    it('should return 0 for future start dates', () => {
      expect(calculateYearsOfService('01-01-2030')).toBe(0);
    });

    it('should return null for invalid dates', () => {
      expect(calculateYearsOfService('')).toBeNull();
    });
  });

  describe('calculateMonthsToRetirement', () => {
    it('should return positive months for future retirement', () => {
      const now = new Date();
      const future = new Date(now.getFullYear(), now.getMonth() + 6, 15).toISOString().split('T')[0];
      const result = calculateMonthsToRetirement(future);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should return negative months for past retirement', () => {
      const now = new Date();
      const past = new Date(now.getFullYear() - 1, now.getMonth(), 15).toISOString().split('T')[0];
      const result = calculateMonthsToRetirement(past);
      expect(result).toBeLessThan(0);
    });

    it('should return null for invalid dates', () => {
      expect(calculateMonthsToRetirement('')).toBeNull();
    });
  });

  describe('getRetirementStatus', () => {
    it('should return Active for no retirement date', () => {
      expect(getRetirementStatus(null)).toBe('Active');
    });

    it('should return Retired for past date', () => {
      const now = new Date();
      const past = new Date(now.getFullYear() - 1, now.getMonth(), 15).toISOString().split('T')[0];
      expect(getRetirementStatus(past)).toBe('Retired');
    });

    it('should return Approaching for retirement within 12 months', () => {
      const now = new Date();
      const nearFuture = new Date(now.getFullYear(), now.getMonth() + 6, 15).toISOString().split('T')[0];
      expect(getRetirementStatus(nearFuture)).toBe('Approaching');
    });

    it('should return Active for retirement beyond 12 months', () => {
      const now = new Date();
      const future = new Date(now.getFullYear() + 2, now.getMonth(), 15).toISOString().split('T')[0];
      expect(getRetirementStatus(future)).toBe('Active');
    });
  });
});
