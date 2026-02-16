/*
  # Limpieza de usuarios huérfanos y sincronización Auth <-> Public

  Este script:
  1. Elimina usuarios de auth.users que no existen en public.users
  2. Crea trigger para sincronizar eliminaciones automáticamente
  3. Proporciona función de utilidad para verificar huérfanos

  IMPORTANTE: Ejecuta este script en tu panel de Supabase -> SQL Editor
*/

-- =====================================================
-- PASO 1: Función para eliminar usuarios huérfanos
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_users()
RETURNS TABLE(deleted_user_id uuid, deleted_email text)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  orphan_record RECORD;
  deleted_count INT := 0;
BEGIN
  FOR orphan_record IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    DELETE FROM auth.users WHERE id = orphan_record.id;
    deleted_user_id := orphan_record.id;
    deleted_email := orphan_record.email;
    deleted_count := deleted_count + 1;
    RETURN NEXT;
    RAISE NOTICE 'Deleted orphaned auth user: % (%)', orphan_record.email, orphan_record.id;
  END LOOP;
  RAISE NOTICE 'Total orphaned users deleted: %', deleted_count;
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_orphaned_auth_users() TO service_role;

-- =====================================================
-- PASO 2: Ejecutar limpieza inicial
-- =====================================================

DO $$
DECLARE
  cleanup_result RECORD;
  total_deleted INT := 0;
BEGIN
  RAISE NOTICE 'Iniciando limpieza de usuarios huérfanos...';
  FOR cleanup_result IN SELECT * FROM cleanup_orphaned_auth_users() LOOP
    total_deleted := total_deleted + 1;
  END LOOP;
  RAISE NOTICE 'Limpieza completada. Total usuarios eliminados: %', total_deleted;
END;
$$;

-- =====================================================
-- PASO 3: Trigger para sincronizar eliminaciones
-- =====================================================

CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RAISE NOTICE 'Deleted auth user % after public.users deletion', OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_user_deleted ON public.users;
CREATE TRIGGER on_user_deleted
  AFTER DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- =====================================================
-- PASO 4: Función de utilidad para reportar huérfanos
-- =====================================================

CREATE OR REPLACE FUNCTION check_orphaned_auth_users()
RETURNS TABLE(
  orphaned_user_id uuid,
  orphaned_email text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email, au.created_at
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION check_orphaned_auth_users() TO service_role;

-- =====================================================
-- PASO 5: Verificación final
-- =====================================================

DO $$
DECLARE
  auth_count INT;
  public_count INT;
  orphaned_count INT;
BEGIN
  SELECT COUNT(*) INTO auth_count FROM auth.users;
  SELECT COUNT(*) INTO public_count FROM public.users;
  SELECT COUNT(*) INTO orphaned_count FROM check_orphaned_auth_users();
  RAISE NOTICE '=== Resumen de usuarios ===';
  RAISE NOTICE 'Usuarios en auth.users: %', auth_count;
  RAISE NOTICE 'Usuarios en public.users: %', public_count;
  RAISE NOTICE 'Usuarios huérfanos restantes: %', orphaned_count;
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Aún hay % usuarios huérfanos.', orphaned_count;
  ELSE
    RAISE NOTICE 'Sistema sincronizado correctamente.';
  END IF;
END;
$$;
