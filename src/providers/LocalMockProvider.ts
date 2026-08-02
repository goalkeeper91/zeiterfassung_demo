// Phase-3-Implementierung des TimeTrackingProvider-Interfaces auf Basis
// lokaler Mock-Daten. Die eigentliche Logik steckt in data/mockEmployees.ts
// und data/timeTrackingStore.ts — dieser Provider bildet sie nur auf die
// (absichtlich asynchrone) Schnittstelle ab, die ein späterer BlinkProvider
// mit echten HTTP-Aufrufen genauso bedienen wird.

import { findEmployeeByPin, mockEmployees } from '../data/mockEmployees'
import {
  calculateWorkedMs,
  getAllowedPunchTypes as getAllowedPunchTypesForStatus,
  getShiftStatus as getShiftStatusFromStore,
  getTodaysPunches,
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
  async findEmployeeByPin(pin: string): Promise<Employee | undefined> {
    return findEmployeeByPin(pin)
  }

  async getShiftStatus(employeePin: string): Promise<ShiftStatus> {
    return getShiftStatusFromStore(employeePin)
  }

  async getAllowedPunchTypes(employeePin: string): Promise<PunchType[]> {
    const status = getShiftStatusFromStore(employeePin)
    return getAllowedPunchTypesForStatus(status)
  }

  async recordPunch(employeePin: string, type: PunchType): Promise<Punch> {
    return recordPunchInStore(employeePin, type)
  }

  async getDailyOverview(): Promise<DailyEmployeeSummary[]> {
    const now = new Date()
    return mockEmployees.map((employee) => {
      const punches = getTodaysPunches(employee.pin, now)
      return {
        employee,
        status: getShiftStatusFromStore(employee.pin, now),
        punches,
        workedMs: calculateWorkedMs(punches, now),
      }
    })
  }
}
