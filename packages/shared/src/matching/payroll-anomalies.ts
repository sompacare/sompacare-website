export type PayrollAnomaly = {
  type: "missing_clock_out" | "excessive_hours" | "short_shift" | "overtime_spike";
  severity: "low" | "medium" | "high";
  message: string;
  timecardId: string;
  workerId: string;
  workerName?: string;
};

export type TimecardAnomalyInput = {
  id: string;
  workerId: string;
  workerName?: string;
  regularHours: number;
  overtimeHours: number;
  breakMinutes: number;
  scheduledHours: number;
  hasClockOut: boolean;
  shiftEndTime?: string | null;
};

export function detectPayrollAnomalies(timecards: TimecardAnomalyInput[]): PayrollAnomaly[] {
  const anomalies: PayrollAnomaly[] = [];

  for (const tc of timecards) {
    const totalHours = tc.regularHours + tc.overtimeHours;

    if (!tc.hasClockOut && tc.shiftEndTime) {
      const ended = new Date(tc.shiftEndTime).getTime();
      if (Date.now() > ended + 3600000) {
        anomalies.push({
          type: "missing_clock_out",
          severity: "high",
          message: "Shift ended over 1 hour ago with no clock-out recorded",
          timecardId: tc.id,
          workerId: tc.workerId,
          workerName: tc.workerName,
        });
      }
    }

    if (totalHours > tc.scheduledHours * 1.5) {
      anomalies.push({
        type: "excessive_hours",
        severity: "medium",
        message: `Worked ${totalHours.toFixed(1)}h vs ${tc.scheduledHours.toFixed(1)}h scheduled`,
        timecardId: tc.id,
        workerId: tc.workerId,
        workerName: tc.workerName,
      });
    }

    if (totalHours > 0 && totalHours < tc.scheduledHours * 0.5) {
      anomalies.push({
        type: "short_shift",
        severity: "low",
        message: `Only ${totalHours.toFixed(1)}h recorded for a ${tc.scheduledHours.toFixed(1)}h shift`,
        timecardId: tc.id,
        workerId: tc.workerId,
        workerName: tc.workerName,
      });
    }

    if (tc.overtimeHours > tc.regularHours && tc.overtimeHours > 2) {
      anomalies.push({
        type: "overtime_spike",
        severity: "medium",
        message: `Unusual OT: ${tc.overtimeHours.toFixed(1)}h overtime on this shift`,
        timecardId: tc.id,
        workerId: tc.workerId,
        workerName: tc.workerName,
      });
    }
  }

  return anomalies.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}
