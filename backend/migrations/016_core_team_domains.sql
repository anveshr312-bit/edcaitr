-- Migration 016: Core Team Domains
-- Adds domain column to profiles with CHECK constraint for the 3 official operating domains

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS domain VARCHAR(50);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_domain_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_domain_check
    CHECK (domain IN ('research_digital', 'programs_experiences', 'partnerships_ecosystem') OR domain IS NULL);
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.domain IS 'Core team member operating domain: research_digital, programs_experiences, partnerships_ecosystem, or NULL if unassigned';
