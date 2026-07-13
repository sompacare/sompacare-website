-- Add GNA, CMA, and Med Tech platform and clinical roles

ALTER TYPE "PlatformRole" ADD VALUE 'GNA';
ALTER TYPE "PlatformRole" ADD VALUE 'CMA';
ALTER TYPE "PlatformRole" ADD VALUE 'MED_TECH';

ALTER TYPE "ClinicalRole" ADD VALUE 'GNA';
ALTER TYPE "ClinicalRole" ADD VALUE 'CMA';
ALTER TYPE "ClinicalRole" ADD VALUE 'MED_TECH';
