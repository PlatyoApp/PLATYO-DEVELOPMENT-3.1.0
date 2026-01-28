/*
  # Agregar columnas faltantes a support_tickets

  1. Cambios en support_tickets:
    - Agregar columna `category` (text) - categoría del ticket (general, technical, billing, etc.)
    - Agregar columna `message` (text) - mensaje principal del ticket
    - Agregar columna `contact_email` (text) - email de contacto del usuario
    - Agregar columna `contact_phone` (text) - teléfono de contacto del usuario
    - Agregar columna `response` (text) - respuesta del administrador
    - Agregar columna `response_date` (timestamptz) - fecha de respuesta
    - Agregar columna `admin_notes` (text) - notas administrativas internas

  2. Notas:
    - La columna `description` existente se mantiene para compatibilidad
    - Las nuevas columnas permiten que el frontend funcione correctamente
    - Se agregan valores por defecto cuando es apropiado
*/

-- Agregar columna category si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'category'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN category text NOT NULL DEFAULT 'general' 
    CHECK (category IN ('general', 'technical', 'billing', 'feature', 'account', 'other'));
  END IF;
END $$;

-- Agregar columna message si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'message'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN message text;
    
    -- Copiar datos de description a message para registros existentes
    UPDATE support_tickets SET message = description WHERE message IS NULL;
    
    -- Hacer message NOT NULL después de copiar los datos
    ALTER TABLE support_tickets ALTER COLUMN message SET NOT NULL;
  END IF;
END $$;

-- Agregar columna contact_email si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN contact_email text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Agregar columna contact_phone si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN contact_phone text;
  END IF;
END $$;

-- Agregar columna response si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'response'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN response text;
  END IF;
END $$;

-- Agregar columna response_date si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'response_date'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN response_date timestamptz;
  END IF;
END $$;

-- Agregar columna admin_notes si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_tickets' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE support_tickets ADD COLUMN admin_notes text;
  END IF;
END $$;
