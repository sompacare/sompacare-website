-- Bill/pay rate split: facilities billed at bill_rate, workers paid at pay_rate

ALTER TABLE "shifts" ADD COLUMN "pay_rate" DECIMAL(10,2);
ALTER TABLE "shifts" ADD COLUMN "bill_rate" DECIMAL(10,2);

UPDATE "shifts" SET
  "pay_rate" = "hourly_rate",
  "bill_rate" = ROUND("hourly_rate" * 1.27, 2);

ALTER TABLE "shifts" ALTER COLUMN "pay_rate" SET NOT NULL;
ALTER TABLE "shifts" ALTER COLUMN "bill_rate" SET NOT NULL;

ALTER TABLE "timecards" ADD COLUMN "pay_rate" DECIMAL(10,2);
ALTER TABLE "timecards" ADD COLUMN "bill_rate" DECIMAL(10,2);
ALTER TABLE "timecards" ADD COLUMN "bill_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "timecards" ADD COLUMN "invoice_id" TEXT;

UPDATE "timecards" SET
  "pay_rate" = "hourly_rate",
  "bill_rate" = ROUND("hourly_rate" * 1.27, 2),
  "bill_amount" = "gross_amount";

ALTER TABLE "timecards" ALTER COLUMN "pay_rate" SET NOT NULL;
ALTER TABLE "timecards" ALTER COLUMN "bill_rate" SET NOT NULL;

ALTER TABLE "invoice_line_items" ADD COLUMN "timecard_id" TEXT;
CREATE UNIQUE INDEX "invoice_line_items_timecard_id_key" ON "invoice_line_items"("timecard_id");

ALTER TABLE "timecards" ADD CONSTRAINT "timecards_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "timecards_invoice_id_idx" ON "timecards"("invoice_id");
