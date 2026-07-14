-- Employee numbers for HR-issued portal access
ALTER TABLE "users" ADD COLUMN "employee_number" TEXT;
ALTER TABLE "candidates" ADD COLUMN "employee_number" TEXT;

CREATE UNIQUE INDEX "users_employee_number_key" ON "users"("employee_number");
CREATE UNIQUE INDEX "candidates_employee_number_key" ON "candidates"("employee_number");
