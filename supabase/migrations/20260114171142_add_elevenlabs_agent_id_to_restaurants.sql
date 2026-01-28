/*
  # Add ElevenLabs Agent ID to Restaurants

  1. Changes
    - Add elevenlabs_agent_id column to restaurants table
    - This allows restaurants to configure their own voice assistant agent
    - Optional field, only used if restaurant wants voice assistant feature

  2. Notes
    - Agent ID is obtained from ElevenLabs dashboard
    - When configured, enables the custom voice assistant widget on public menu
*/

-- Add elevenlabs_agent_id column to restaurants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'elevenlabs_agent_id'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN elevenlabs_agent_id text;
  END IF;
END $$;
