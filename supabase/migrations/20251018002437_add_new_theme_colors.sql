/*
  # Agregar nuevos campos de color al tema

  1. Cambios
    - Agrega campos de color adicionales al tema del restaurante
    - Campos nuevos:
      - menu_background_color: Color de fondo del menú público
      - card_background_color: Color de fondo de las tarjetas de producto
      - primary_text_color: Color principal del texto (títulos)
      - secondary_text_color: Color secundario del texto (descripciones)
    
  2. Notas
    - Los campos existentes (primary_color, secondary_color, accent_color, text_color) se mantienen para compatibilidad
    - Los nuevos campos permiten mayor control sobre la apariencia del menú público
*/

-- No se requieren cambios en la base de datos ya que settings es JSONB
-- Los nuevos campos se agregarán automáticamente cuando los restaurantes actualicen su configuración
-- Esta migración es solo para documentar los nuevos campos del tema

DO $$
BEGIN
  -- Agregar comentario a la columna settings para documentar la estructura actualizada
  COMMENT ON COLUMN restaurants.settings IS 'Configuración del restaurante en formato JSONB. Theme incluye: primary_color, secondary_color, menu_background_color, card_background_color, primary_text_color, secondary_text_color, accent_color, text_color, fuentes y estilos.';
END $$;
