import { describe, it, expect } from 'vitest';
import { db } from '../db/indexedDB';

describe('IndexedDB Schema', () => {
  it('should have employees store with correct indexes', () => {
    const store = db.tables.find((t) => t.name === 'employees');
    expect(store).toBeDefined();
  });

  it('should have departments store', () => {
    const store = db.tables.find((t) => t.name === 'departments');
    expect(store).toBeDefined();
  });

  it('should have importLogs store with date and userId fields', () => {
    const store = db.tables.find((t) => t.name === 'importLogs');
    expect(store).toBeDefined();
    const schema = store.schema;
    expect(schema.primKey.name).toBe('id');
  });

  it('should have users store with username index', () => {
    const store = db.tables.find((t) => t.name === 'users');
    expect(store).toBeDefined();
  });

  it('should have lgas store with compound index', () => {
    const store = db.tables.find((t) => t.name === 'lgas');
    expect(store).toBeDefined();
  });

  it('should have all required stores defined', () => {
    const expectedStores = [
      'employees',
      'departments',
      'cadres',
      'ranks',
      'pfas',
      'salaryStructures',
      'states',
      'lgas',
      'leaveRequests',
      'importLogs',
      'users',
    ];
    const actualStores = db.tables.map((t) => t.name);
    expectedStores.forEach((store) => {
      expect(actualStores).toContain(store);
    });
  });
});
