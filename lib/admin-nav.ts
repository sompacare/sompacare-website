export type AdminNavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const adminNav: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Contracts", href: "/admin/contracts" },
  { label: "Employees", href: "/admin/employees" },
  { label: "Job Orders", href: "/admin/job-orders" },
  { label: "Invoices", href: "/admin/invoices" },
  {
    label: "Payments",
    href: "/admin/payments",
    children: [
      { label: "Overview", href: "/admin/payments" },
      { label: "Invoices", href: "/admin/payments/invoices" },
      { label: "Outstanding Balance", href: "/admin/payments/outstanding" },
      { label: "Paid", href: "/admin/payments/paid" },
      { label: "ACH Payments", href: "/admin/payments/ach" },
      { label: "Credit Card", href: "/admin/payments/credit-card" },
      { label: "Wire Transfers", href: "/admin/payments/wire" },
      { label: "Payment History", href: "/admin/payments/history" },
    ],
  },
  { label: "Documents", href: "/admin/documents" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Applications", href: "/admin/applications" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Setup", href: "/admin/setup" },
];

export function isPaymentsSection(pathname: string): boolean {
  return pathname.startsWith("/admin/payments");
}
