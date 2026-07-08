"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  buildSavingsReportText,
  calculateStaffingRoi,
  DEFAULT_STAFFING_INPUTS,
  formatCurrency,
  ROLE_COLORS,
  ROLE_LABELS,
  shiftsFromHours,
  type StaffingInputs,
  type StaffingRole,
} from "@/lib/staffing-roi-calculator";

const ROLES: StaffingRole[] = ["cna", "lpn", "rn"];

function RoleCard({
  role,
  inputs,
  onChange,
}: {
  role: StaffingRole;
  inputs: StaffingInputs[StaffingRole];
  onChange: (field: keyof StaffingInputs[StaffingRole], value: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3
        className="text-lg font-bold"
        style={{ color: ROLE_COLORS[role] }}
      >
        {ROLE_LABELS[role]}
      </h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Bill Rate
          </span>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              $
            </span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={inputs.billRate}
              onChange={(e) => onChange("billRate", parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-7 text-sm font-medium text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Monthly Hours
          </span>
          <input
            type="number"
            min={0}
            step={1}
            value={inputs.monthlyHours}
            onChange={(e) => onChange("monthlyHours", parseFloat(e.target.value) || 0)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Monthly Shifts
          </span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={inputs.monthlyShifts}
            onChange={(e) => onChange("monthlyShifts", parseFloat(e.target.value) || 0)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
        </label>
      </div>
    </div>
  );
}

export function StaffingRoiCalculator() {
  const [inputs, setInputs] = useState<StaffingInputs>(DEFAULT_STAFFING_INPUTS);

  const result = useMemo(() => calculateStaffingRoi(inputs), [inputs]);

  function updateRole(role: StaffingRole, field: keyof StaffingInputs[StaffingRole], value: number) {
    setInputs((prev) => {
      const next = { ...prev[role], [field]: value };
      if (field === "monthlyHours") {
        next.monthlyShifts = shiftsFromHours(value);
      }
      return { ...prev, [role]: next };
    });
  }

  function downloadReport() {
    const text = buildSavingsReportText(inputs, result);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sompacare-roi-report-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div id="roi-calculator" className="scroll-mt-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
          Sompacare ROI Calculator
        </h1>
        <p className="mt-4 text-base leading-relaxed text-brand-slate">
          Enter your current staffing metrics below. The calculator will automatically update to
          show your potential savings.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5 lg:items-start">
        {/* Inputs — left column */}
        <div className="space-y-5 lg:col-span-3">
          <h2 className="text-xl font-bold text-brand-navy">Your staffing needs</h2>
          {ROLES.map((role) => (
            <RoleCard
              key={role}
              role={role}
              inputs={inputs[role]}
              onChange={(field, value) => updateRole(role, field, value)}
            />
          ))}
        </div>

        {/* Results — right sticky card */}
        <div className="lg:col-span-2 lg:sticky lg:top-28">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
            <h2 className="text-xl font-bold text-brand-navy">Your estimated savings</h2>

            <p className="mt-6 text-4xl font-bold text-brand-green sm:text-[2.75rem] sm:leading-none">
              {formatCurrency(result.annualSavings)}
            </p>
            <p className="mt-2 text-sm font-medium text-brand-slate">annual savings</p>

            <dl className="mt-8 space-y-4 border-t border-slate-100 pt-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-brand-slate">Total labor cost</dt>
                <dd className="font-semibold text-brand-navy">
                  {formatCurrency(result.totalLaborCost)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-brand-slate">
                  Average market markup ({result.agencyMarkupRate * 100}%)
                </dt>
                <dd className="font-semibold text-brand-navy">
                  {formatCurrency(result.agencyMarkupCost)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-brand-slate">
                  Platform fee
                  <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-blue uppercase">
                    {result.platformTier}
                  </span>
                </dt>
                <dd className="font-semibold text-brand-navy">
                  {formatCurrency(result.platformFee)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <dt className="font-bold text-brand-navy">Total monthly savings</dt>
                <dd className="text-lg font-bold text-brand-green">
                  {formatCurrency(result.monthlySavings)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={downloadReport}
              className="mt-8 w-full rounded-lg bg-brand-blue py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
            >
              Download savings report
            </button>
          </div>

          <p className="mt-6 text-center text-sm leading-relaxed text-brand-slate">
            Schedule a quick demo with our team to see how our pricing works and learn how you can
            save on monthly staffing costs.{" "}
            <Link href="/contact" className="font-semibold text-brand-blue hover:underline">
              Book demo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
