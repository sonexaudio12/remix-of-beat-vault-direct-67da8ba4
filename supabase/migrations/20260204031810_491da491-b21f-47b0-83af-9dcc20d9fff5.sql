-- Drop the existing foreign key constraint
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_sound_kit_id_fkey;

-- Add a new foreign key constraint with ON DELETE CASCADE
ALTER TABLE order_items
  ADD CONSTRAINT order_items_sound_kit_id_fkey
  FOREIGN KEY (sound_kit_id) REFERENCES sound_kits(id) ON DELETE CASCADE;