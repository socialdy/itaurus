    ALTER TABLE "maintenance"
    ALTER COLUMN "technician_ids" SET DATA TYPE text[]
    USING CASE
      WHEN "technician_ids" IS NULL THEN NULL
      ELSE ARRAY["technician_ids"]::text[]
    END;

    ALTER TABLE "maintenance" ADD COLUMN "instructions" text;