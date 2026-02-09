
-- Add is_active column
ALTER TABLE public.license_templates ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Update type check to include sound_kit
ALTER TABLE public.license_templates DROP CONSTRAINT license_templates_type_check;
ALTER TABLE public.license_templates ADD CONSTRAINT license_templates_type_check 
  CHECK (type = ANY (ARRAY['mp3'::text, 'wav'::text, 'stems'::text, 'exclusive'::text, 'sound_kit'::text]));

-- Insert sound_kit template
INSERT INTO public.license_templates (type, name, is_active)
VALUES ('sound_kit', 'Sound Kit License', true);
