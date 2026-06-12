UPDATE "AffiliateProductInsight"
SET "sourceType" = CASE
  WHEN "sourceType" IN ('MANUAL', 'REAL_USER_INPUT') THEN 'MANUAL'
  WHEN "sourceType" = 'CSV_IMPORT' THEN 'CSV_IMPORT'
  WHEN "sourceType" IN ('REAL_API', 'REAL') THEN 'REAL_API'
  ELSE 'DEMO'
END;

UPDATE "AffiliateProductInsight"
SET "isDemo" = CASE WHEN "sourceType" = 'DEMO' THEN true ELSE false END;
