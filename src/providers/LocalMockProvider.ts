// Phase-3-Implementierung des TimeTrackingProvider-Interfaces auf Basis
// lokaler Mock-Daten. Die eigentliche Logik steckt in data/employeeStore.ts
// und data/timeTrackingStore.ts — dieser Provider bildet sie nur auf die
// (absichtlich asynchrone) Schnittstelle ab, die ein späterer BlinkProvider
// mit echten HTTP-Aufrufen genauso bedienen wird.

import { getEmployeeById, getEmployees, setEmployeePin } from '../data/employeeStore'
import {
  calculateWorkedMs,
  getAllowedPunchTypes as getAllowedPunchTypesForStatus,
  getShiftStatus as getShiftStatusFromStore,
  getTodaysPunches as getTodaysPunchesFromStore,
  recordPunch as recordPunchInStore,
} from '../data/timeTrackingStore'
import type {
  DailyEmployeeSummary,
  Employee,
  Punch,
  PunchType,
  ShiftStatus,
  TimeTrackingProvider,
} from './types'

export class LocalMockProvider implements TimeTrackingProvider {
  async getEmployees(): Promise<Employee[]> {
    return getEmployees()
  }

  async verifyPin(employeeId: string, pin: string): Promise<boolean> {
    const employee = getEmployeeById(employeeId)
    return employee?.pin === pin
  }

  async changePin(employeeId: string, newPin: string): Promise<void> {
    setEmployeePin(employeeId, newPin)
  }

  async getShiftStatus(employeeId: string): Promise<ShiftStatus> {
    return getShiftStatusFromStore(employeeId)
  }

  async getAllowedPunchTypes(employeeId: string): Promise<PunchType[]> {
    const status = getShiftStatusFromStore(employeeId)
    return getAllowedPunchTypesForStatus(status)
  }

  async getTodaysPunches(employeeId: string): Promise<Punch[]> {
    return getTodaysPunchesFromStore(employeeId)
  }

  async recordPunch(employeeId: string, type: PunchType): Promise<Punch> {
    return recordPunchInStore(employeeId, type)
  }

  async getDailyOverview(): Promise<DailyEmployeeSummary[]> {
    const now = new Date()
    return getEmployees().map((employee) => {
      const punches = getTodaysPunchesFromStore(employee.id, now)
      return {
        employee,
        status: getShiftStatusFromStore(employee.id, now),
        punches,
        workedMs: calculateWorkedMs(punches, now),
      }
    })
  }
}
