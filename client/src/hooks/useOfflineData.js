import { useState, useEffect } from 'react';
import { db } from '../db/indexedDB';
import { triggerFullSync, getOnlineStatus } from '../lib/syncEngine';

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(getOnlineStatus());
  
  useEffect(() => {
    loadEmployees();
    
    const unsub = window.addEventListener('online', () => setIsOnline(true));
    const unsub2 = window.addEventListener('offline', () => setIsOnline(false));
    
    return () => {
      unsub();
      unsub2();
    };
  }, []);
  
  async function loadEmployees() {
    try {
      const data = await db.employees.toArray();
      setEmployees(data);
    } catch (e) {
      console.error('Error loading employees:', e);
    } finally {
      setLoading(false);
    }
  }
  
  async function refresh() {
    setLoading(true);
    await triggerFullSync();
    await loadEmployees();
    setLoading(false);
  }
  
  return { employees, loading, isOnline, refresh };
}

export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadDepartments();
  }, []);
  
  async function loadDepartments() {
    try {
      const data = await db.departments.toArray();
      setDepartments(data);
    } catch (e) {
      console.error('Error loading departments:', e);
    } finally {
      setLoading(false);
    }
  }
  
  return { departments, loading, refresh: loadDepartments };
}

export function useRanks() {
  const [ranks, setRanks] = useState([]);
  
  useEffect(() => {
    db.ranks.toArray().then(setRanks);
  }, []);
  
  return ranks;
}

export function usePFAs() {
  const [pfas, setPfas] = useState([]);
  
  useEffect(() => {
    db.pfas.toArray().then(setPfas);
  }, []);
  
  return pfas;
}

export function useSalaryStructures() {
  const [structures, setStructures] = useState([]);
  
  useEffect(() => {
    db.salaryStructures.toArray().then(setStructures);
  }, []);
  
  return structures;
}

export function useStates() {
  const [states, setStates] = useState([]);
  
  useEffect(() => {
    db.states.toArray().then(setStates);
  }, []);
  
  return states;
}
