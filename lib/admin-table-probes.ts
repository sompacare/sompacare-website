export const ADMIN_TABLES = [
  "clients",
  "contracts",
  "employees",
  "job_orders",
  "invoices",
  "payments",
  "documents",
  "admin_settings",
] as const;

/** Primary-key column used to probe whether a table exists via PostgREST */
export const ADMIN_TABLE_PROBE_COLUMN: Record<(typeof ADMIN_TABLES)[number], string> = {
  clients: "id",
  contracts: "id",
  employees: "id",
  job_orders: "id",
  invoices: "id",
  payments: "id",
  documents: "id",
  admin_settings: "key",
};

export function isMissingTableError(message: string, code?: string) {
  // Wrong column on an existing table — not a missing table
  if (code === "PGRST204" || code === "42703") return false;

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /relation .* does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message)
  );
}
