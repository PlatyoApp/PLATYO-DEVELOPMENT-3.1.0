# PLATYO - Especificación Técnica Completa

## 1. DESCRIPCIÓN GENERAL

PLATYO es una plataforma SaaS multi-tenant para gestión de restaurantes con sistema de pedidos en línea. Permite a restaurantes crear menús digitales públicos, recibir pedidos, gestionar clientes y analizar métricas de ventas, todo bajo un modelo de suscripción por niveles.

### Stack Tecnológico
- **Frontend**: React 18.3 + TypeScript + Vite
- **Estilos**: Tailwind CSS con sistema de diseño custom
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth (email/password)
- **Funciones serverless**: Supabase Edge Functions (Deno)
- **Íconos**: Lucide React
- **Enrutamiento**: React Router DOM v7
- **IA conversacional**: ElevenLabs Conversational AI

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Modelo Multi-Tenant
- Cada restaurante es un tenant independiente
- Separación de datos por `restaurant_id`
- Row Level Security (RLS) en todas las tablas
- Dominios únicos por restaurante (slug-based routing)

### 2.2 Estructura de Base de Datos

#### Tablas Principales

**users**
```sql
- id (uuid, PK)
- email (text, unique)
- full_name (text)
- role (enum: 'superadmin', 'restaurant_owner', 'restaurant_admin', 'restaurant_staff')
- restaurant_id (uuid, FK)
- phone (text)
- avatar_url (text)
- is_active (boolean, default: true)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**restaurants**
```sql
- id (uuid, PK)
- name (text)
- domain (text, unique) -- slug único
- email (text)
- phone (text)
- address (text)
- logo_url (text)
- owner_id (uuid, FK -> users)
- owner_name (text)
- primary_color (text, default: '#3B82F6')
- secondary_color (text, default: '#10B981')
- accent_color (text, default: '#F59E0B')
- background_color (text, default: '#F9FAFB')
- text_color (text, default: '#111827')
- elevenlabs_agent_id (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**subscription_plans**
```sql
- id (uuid, PK)
- name (text) -- "Gratis", "Básico", "Pro", "Business"
- slug (text, unique) -- "free", "basic", "pro", "business"
- price (numeric)
- max_products (integer)
- max_categories (integer)
- features (jsonb)
- display_order (integer)
- is_active (boolean)
- created_at (timestamptz)
```

**subscriptions**
```sql
- id (uuid, PK)
- restaurant_id (uuid, FK, unique)
- plan_name (text)
- duration (enum: 'monthly', 'annual')
- status (enum: 'active', 'expired', 'cancelled')
- start_date (timestamptz)
- end_date (timestamptz)
- monthly_price (numeric)
- max_products (integer)
- max_orders (integer)
- features (jsonb)
- auto_renew (boolean)
- created_at (timestamptz)
```

**categories**
```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- name (text)
- description (text)
- icon (text)
- display_order (integer)
- is_active (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**products**
```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- category_ids (uuid[]) -- array de categorías
- name (text)
- description (text)
- price (numeric)
- compare_at_price (numeric) -- precio tachado
- image_url (text)
- status (enum: 'active', 'archived', 'blocked')
- display_order (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**customers**
```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- name (text)
- email (text)
- phone (text)
- address (text)
- city (text)
- notes (text)
- total_orders (integer, default: 0)
- total_spent (numeric, default: 0)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**orders**
```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- customer_id (uuid, FK)
- order_number (text) -- único por restaurante
- customer_name (text)
- customer_phone (text)
- customer_email (text)
- delivery_address (text)
- delivery_city (text)
- items (jsonb) -- [{product_id, name, price, quantity}]
- subtotal (numeric)
- tax (numeric)
- total (numeric)
- status (enum: 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')
- payment_method (text)
- notes (text)
- estimated_time (text) -- "30 minutos", "1 hora"
- created_at (timestamptz)
- updated_at (timestamptz)
```

**support_tickets**
```sql
- id (uuid, PK)
- restaurant_id (uuid, FK)
- user_id (uuid, FK)
- subject (text)
- description (text)
- status (enum: 'open', 'in_progress', 'resolved', 'closed')
- priority (enum: 'low', 'medium', 'high', 'urgent')
- assigned_to (uuid, FK -> users)
- created_at (timestamptz)
- updated_at (timestamptz)
- resolved_at (timestamptz)
```

### 2.3 Row Level Security (RLS)

**Principios de Seguridad**
- Todas las tablas tienen RLS habilitado
- Políticas específicas por operación (SELECT, INSERT, UPDATE, DELETE)
- Autenticación obligatoria (`TO authenticated`)
- Validación de `restaurant_id` en todas las políticas
- Superadmin tiene acceso total

**Ejemplo de Políticas (products)**
```sql
-- SELECT
CREATE POLICY "Users can view own restaurant products"
  ON products FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Restaurant users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = auth.uid()
    )
  );

-- Superadmin bypass
CREATE POLICY "Superadmin full access to products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'superadmin'
    )
  );
```

### 2.4 Triggers y Funciones Automáticas

**Trigger: Crear usuario en users al registrarse**
```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Trigger: Auto-asignar suscripción Free al crear restaurante**
```sql
CREATE FUNCTION auto_create_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
  free_plan subscription_plans%ROWTYPE;
BEGIN
  SELECT * INTO free_plan FROM subscription_plans WHERE slug = 'free' AND is_active = true LIMIT 1;

  IF free_plan.id IS NOT NULL THEN
    INSERT INTO subscriptions (
      restaurant_id, plan_name, duration, status,
      start_date, end_date, monthly_price,
      max_products, max_orders, features, auto_renew
    ) VALUES (
      NEW.id, 'free', 'monthly', 'active',
      NOW(), NOW() + INTERVAL '100 years',
      0, free_plan.max_products, 999999,
      free_plan.features, false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger: Aplicar límites al cambiar de plan (downgrades)**
```sql
-- Al cambiar de plan, bloquea productos/categorías que excedan los nuevos límites
CREATE FUNCTION enforce_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
  total_products INTEGER;
  total_categories INTEGER;
  products_to_block INTEGER;
  categories_to_block INTEGER;
BEGIN
  -- Si cambia max_products o max_categories, aplicar bloqueos
  IF NEW.max_products < OLD.max_products OR NEW.max_categories < OLD.max_categories THEN

    -- Contar productos activos
    SELECT COUNT(*) INTO total_products
    FROM products
    WHERE restaurant_id = NEW.restaurant_id AND status = 'active';

    -- Bloquear los más antiguos si excede el límite
    IF total_products > NEW.max_products THEN
      UPDATE products
      SET status = 'blocked'
      WHERE id IN (
        SELECT id FROM products
        WHERE restaurant_id = NEW.restaurant_id AND status = 'active'
        ORDER BY created_at ASC
        LIMIT (total_products - NEW.max_products)
      );
    END IF;

    -- Similar para categorías...
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. SISTEMA DE ROLES Y PERMISOS

### 3.1 Roles Disponibles

#### **Superadmin** (`superadmin`)
- Acceso completo a toda la plataforma
- Gestión de todos los restaurantes
- Gestión de usuarios de cualquier restaurante
- Gestión de suscripciones
- Tickets de soporte
- Analytics globales
- Puede eliminar restaurantes y transferir propiedad

**Vistas del Superadmin:**
1. Dashboard General
2. Gestión de Restaurantes
3. Gestión de Usuarios
4. Gestión de Suscripciones
5. Tickets de Soporte
6. Analytics Globales

#### **Restaurant Owner** (`restaurant_owner`)
- Dueño del restaurante
- Acceso completo a su restaurante
- Gestión de menú (categorías, productos)
- Gestión de pedidos
- Gestión de clientes
- Configuración del restaurante
- Analytics del restaurante
- Gestión de suscripción
- Puede transferir propiedad a otro admin

**Vistas del Restaurant Owner:**
1. Dashboard del Restaurante
2. Gestión de Menú
3. Gestión de Categorías
4. Gestión de Pedidos
5. Gestión de Clientes
6. Analytics
7. Configuración
8. Planes de Suscripción

#### **Restaurant Admin** (`restaurant_admin`)
- Administrador del restaurante
- Similar al owner pero sin gestión de suscripción
- Puede gestionar menú y pedidos
- Acceso a analytics

#### **Restaurant Staff** (`restaurant_staff`)
- Personal del restaurante
- Acceso limitado a pedidos
- Solo visualización de menú
- Sin acceso a configuración

### 3.2 Matriz de Permisos

| Funcionalidad | Superadmin | Owner | Admin | Staff |
|--------------|-----------|-------|-------|-------|
| Ver todos los restaurantes | ✅ | ❌ | ❌ | ❌ |
| Gestionar restaurantes | ✅ | ❌ | ❌ | ❌ |
| Gestionar suscripciones | ✅ | ✅ | ❌ | ❌ |
| Ver analytics propios | ✅ | ✅ | ✅ | ❌ |
| Ver analytics globales | ✅ | ❌ | ❌ | ❌ |
| Crear/Editar productos | ✅ | ✅ | ✅ | ❌ |
| Eliminar productos | ✅ | ✅ | ✅ | ❌ |
| Crear/Editar categorías | ✅ | ✅ | ✅ | ❌ |
| Ver pedidos | ✅ | ✅ | ✅ | ✅ |
| Editar pedidos | ✅ | ✅ | ✅ | ✅ |
| Gestionar clientes | ✅ | ✅ | ✅ | ❌ |
| Configuración restaurante | ✅ | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ |
| Tickets de soporte | ✅ | ✅ | ✅ | ✅ |

---

## 4. PLANES DE SUSCRIPCIÓN

### 4.1 Niveles de Planes

#### **Gratis** (Free)
- **Precio**: $0/mes
- **Productos**: 10 productos
- **Categorías**: 3 categorías
- **Pedidos**: Ilimitados
- **Características**:
  - Menú público básico
  - Gestión de pedidos
  - Gestión de clientes
  - Soporte por email

#### **Básico** (Basic)
- **Precio**: $29.900/mes
- **Productos**: 50 productos
- **Categorías**: 10 categorías
- **Pedidos**: Ilimitados
- **Características**:
  - Todo lo de Free +
  - Personalización de colores
  - Analytics básicos
  - Soporte prioritario
  - Logo personalizado

#### **Pro** (Pro)
- **Precio**: $69.900/mes
- **Productos**: 200 productos
- **Categorías**: 30 categorías
- **Pedidos**: Ilimitados
- **Características**:
  - Todo lo de Básico +
  - Analytics avanzados
  - Múltiples administradores
  - Integración con WhatsApp
  - Reportes exportables
  - Asistente de voz IA (ElevenLabs)

#### **Business** (Business)
- **Precio**: $129.900/mes
- **Productos**: Ilimitados
- **Categorías**: Ilimitadas
- **Pedidos**: Ilimitados
- **Características**:
  - Todo lo de Pro +
  - API personalizada
  - Soporte 24/7
  - Capacitación personalizada
  - Integración con POS
  - Multi-sucursal

### 4.2 Sistema de Bloqueo por Límites

**Comportamiento al exceder límites:**
1. Al hacer downgrade, los productos/categorías que excedan el límite se marcan como `blocked`
2. Los items bloqueados NO aparecen en el menú público
3. No se pueden activar más items hasta que se libere espacio o se mejore el plan
4. Los items bloqueados se seleccionan por antigüedad (FIFO: First In, First Out)

**Modal de Activación:**
- Cuando el límite está al máximo, aparece un modal al intentar activar un producto
- Opciones:
  1. Desactivar otro producto para activar el nuevo
  2. Mejorar el plan de suscripción

---

## 5. INTERFAZ DE USUARIO Y DISEÑO

### 5.1 Sistema de Diseño

**Paleta de Colores Personalizable por Restaurante**
```typescript
interface ThemeColors {
  primary: string;      // Color principal (botones, enlaces)
  secondary: string;    // Color secundario (badges, highlights)
  accent: string;       // Color de acento (alertas, notificaciones)
  background: string;   // Fondo general
  text: string;         // Texto principal
}
```

**Colores por Defecto:**
- Primary: `#3B82F6` (Azul)
- Secondary: `#10B981` (Verde)
- Accent: `#F59E0B` (Naranja)
- Background: `#F9FAFB` (Gris claro)
- Text: `#111827` (Negro casi puro)

**Tipografía:**
- Font family: System fonts (sans-serif)
- Tamaños:
  - h1: 2xl (24px)
  - h2: xl (20px)
  - h3: lg (18px)
  - Body: base (16px)
  - Small: sm (14px)
  - Tiny: xs (12px)

**Espaciado:**
- Sistema de 4px base
- Gaps comunes: 2, 3, 4, 6, 8, 12, 16, 24

**Componentes Reutilizables:**

**Button.tsx**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Badge.tsx**
```typescript
interface BadgeProps {
  variant: 'success' | 'error' | 'warning' | 'info' | 'gray';
  children: React.ReactNode;
}
```

**Modal.tsx**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}
```

**Input.tsx**
```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}
```

### 5.2 Navegación y Estructura

**Estructura de Rutas:**
```
/                           → Landing Page (pública)
/login                      → Login/Registro
/reset-password             → Resetear contraseña
/dashboard                  → Dashboard (redirige según rol)

/* Superadmin */
/dashboard/superadmin       → Dashboard Superadmin
/dashboard/restaurants      → Gestión de Restaurantes
/dashboard/users            → Gestión de Usuarios
/dashboard/subscriptions    → Gestión de Suscripciones
/dashboard/support          → Tickets de Soporte
/dashboard/analytics        → Analytics Globales

/* Restaurant Owner/Admin/Staff */
/dashboard/restaurant       → Dashboard del Restaurante
/dashboard/menu             → Gestión de Menú (productos)
/dashboard/categories       → Gestión de Categorías
/dashboard/orders           → Gestión de Pedidos
/dashboard/customers        → Gestión de Clientes
/dashboard/analytics        → Analytics del Restaurante
/dashboard/settings         → Configuración
/dashboard/subscription     → Planes de Suscripción

/* Menú Público */
/:domain                    → Menú público del restaurante
```

**Sidebar Navigation (Autenticado):**
- Logo del restaurante (o PLATYO para superadmin)
- Navegación principal según rol
- Indicador de plan actual (badge)
- Avatar y menú de usuario
  - Cambiar contraseña
  - Cerrar sesión

**Header (Menú Público):**
- Logo del restaurante
- Carrito de compras (badge con cantidad)
- Botón de asistente de voz (si está disponible)

---

## 6. FUNCIONALIDADES PRINCIPALES

### 6.1 Autenticación y Registro

**Flujo de Registro:**
1. Usuario completa formulario:
   - Nombre completo
   - Email
   - Contraseña
   - Nombre del restaurante
   - Dominio único (slug)
   - Teléfono
   - Aceptar términos y condiciones
2. Sistema valida que el dominio no exista
3. Supabase Auth crea usuario
4. Trigger crea registro en `users`
5. Sistema crea el restaurante
6. Sistema asigna `restaurant_id` al usuario
7. Sistema actualiza rol a `restaurant_owner`
8. Trigger auto-crea suscripción Free
9. Redirección a dashboard

**Flujo de Login:**
1. Usuario ingresa email y contraseña
2. Supabase Auth valida credenciales
3. Sistema obtiene rol del usuario
4. Redirección según rol:
   - Superadmin → `/dashboard/superadmin`
   - Restaurant Owner/Admin/Staff → `/dashboard/restaurant`

**Recuperación de Contraseña:**
1. Usuario ingresa email
2. Sistema envía email con link de reset
3. Usuario hace clic en link
4. Formulario para nueva contraseña
5. Actualización en Supabase Auth

### 6.2 Gestión de Menú (Productos)

**Crear/Editar Producto:**
```typescript
interface Product {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;  // Precio tachado
  category_ids: string[];     // Múltiples categorías
  image_url?: string;
  status: 'active' | 'archived' | 'blocked';
  display_order: number;
}
```

**Características:**
- Subir imagen (URL o file upload)
- Asignar a múltiples categorías
- Precio tachado para ofertas
- Orden de visualización (drag & drop ideal)
- Estados:
  - `active`: Visible en menú público
  - `archived`: No visible, puede reactivarse
  - `blocked`: Bloqueado por límite de plan

**Vista de Lista:**
- Tabla con filtros:
  - Búsqueda por nombre
  - Filtro por categoría
  - Filtro por estado
  - Ordenar por: nombre, precio, fecha
- Paginación (10 items por página)
- Acciones rápidas:
  - Editar
  - Archivar/Activar
  - Eliminar (confirmación)

**Modal de Activación de Productos:**
- Aparece cuando se alcanza el límite del plan
- Muestra plan actual y límite
- Lista de productos activos
- Opciones:
  1. Archivar otro producto
  2. Ver planes superiores

### 6.3 Gestión de Categorías

**Crear/Editar Categoría:**
```typescript
interface Category {
  name: string;
  description: string;
  icon: string;           // Lucide icon name
  display_order: number;
  is_active: boolean;
}
```

**Características:**
- Selector de ícono (Lucide React)
- Activar/Desactivar
- Orden de visualización
- Contador de productos asociados

**Categorías Predeterminadas (Sugerencias):**
- Entradas (Aperitif)
- Platos Principales (ChefHat)
- Bebidas (Coffee)
- Postres (IceCream)
- Especiales (Star)

### 6.4 Gestión de Pedidos

**Estados del Pedido:**
1. `pending` - Pendiente (amarillo)
2. `confirmed` - Confirmado (azul)
3. `preparing` - Preparando (naranja)
4. `ready` - Listo (verde)
5. `delivered` - Entregado (gris)
6. `cancelled` - Cancelado (rojo)

**Crear Pedido (Admin):**
```typescript
interface Order {
  customer_id?: string;      // Cliente existente
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_city: string;
  items: OrderItem[];
  payment_method: string;    // 'cash', 'card', 'transfer'
  notes?: string;
  estimated_time?: string;   // "30 minutos"
}

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}
```

**Crear Pedido (Público):**
- Cliente navega menú público
- Agrega productos al carrito
- Completa formulario de checkout:
  - Nombre completo
  - Teléfono
  - Email (opcional)
  - Dirección de entrega
  - Ciudad (selector de ciudades colombianas)
  - Método de pago
  - Notas adicionales
- Sistema calcula subtotal, impuestos (0% por defecto), total
- Sistema crea pedido con estado `pending`
- Sistema crea/actualiza cliente automáticamente

**Vista de Pedidos:**
- Tabs por estado
- Tarjetas de pedido:
  - Número de pedido
  - Cliente
  - Items
  - Total
  - Tiempo estimado
  - Acciones:
    - Ver detalle
    - Cambiar estado
    - Cancelar
    - Imprimir (futuro)

**Actualización en Tiempo Real:**
- Suscripción a cambios en la tabla `orders`
- Notificación cuando llega nuevo pedido
- Actualización automática de la lista

### 6.5 Gestión de Clientes

**Información del Cliente:**
```typescript
interface Customer {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  notes?: string;
  total_orders: number;      // Auto-calculado
  total_spent: number;       // Auto-calculado
}
```

**Características:**
- Auto-creación al hacer pedido
- Historial de pedidos
- Métricas:
  - Total gastado
  - Cantidad de pedidos
  - Promedio por pedido
  - Último pedido
- Editar información
- Agregar notas internas

**Vista de Lista:**
- Búsqueda por nombre/teléfono/email
- Ordenar por: nombre, total gastado, total pedidos
- Filtros: ciudad, rango de gasto
- Paginación

### 6.6 Analytics

**Métricas Principales (Restaurant Owner):**
- Total de ventas (hoy, semana, mes, año)
- Total de pedidos (hoy, semana, mes, año)
- Ticket promedio
- Productos más vendidos (top 10)
- Categorías más vendidas
- Clientes frecuentes (top 10)
- Gráfico de ventas por día (últimos 30 días)
- Gráfico de pedidos por estado
- Gráfico de métodos de pago

**Métricas Globales (Superadmin):**
- Total de restaurantes
- Restaurantes activos/inactivos
- Total de usuarios
- Distribución de roles
- Distribución de planes
- Revenue total
- Revenue por plan
- Crecimiento mensual
- Tickets de soporte abiertos/resueltos

**Visualización:**
- Cards con números grandes y tendencias
- Gráficos de barras (Chart.js o Recharts ideal)
- Gráficos de líneas para tendencias
- Tablas para top productos/clientes
- Filtros por fecha personalizada

### 6.7 Configuración del Restaurante

**Información General:**
- Nombre del restaurante
- Email de contacto
- Teléfono
- Dirección física
- Ciudad
- Logo (upload)
- Dominio (no editable después de creado)

**Personalización de Tema:**
- Color primario (picker)
- Color secundario (picker)
- Color de acento (picker)
- Color de fondo (picker)
- Color de texto (picker)
- Vista previa en tiempo real

**Integraciones:**
- ElevenLabs Agent ID (asistente de voz)
- WhatsApp API (futuro)
- Stripe/PayU (futuro)

**Gestión de Usuarios:**
- Lista de usuarios del restaurante
- Invitar nuevos usuarios (envío de email)
- Cambiar roles
- Desactivar usuarios

### 6.8 Menú Público

**Características:**
- URL única: `platyo.com/:domain`
- Diseño responsivo (mobile-first)
- Categorías como tabs o acordeón
- Productos en grid con:
  - Imagen
  - Nombre
  - Descripción corta
  - Precio
  - Precio tachado (si existe)
  - Botón "Agregar al carrito"
- Carrito flotante (badge con cantidad)
- Modal de detalle de producto
- Checkout modal

**Carrito de Compras:**
```typescript
interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}
```

**Componentes:**
- `CartPreview`: Badge flotante con cantidad
- `CartSidebar`: Sidebar deslizable con items
- `CheckoutModal`: Formulario de checkout

**Flujo de Compra:**
1. Cliente navega menú
2. Agrega productos al carrito (estado local)
3. Abre carrito
4. Modifica cantidades o elimina items
5. Clic en "Finalizar Pedido"
6. Completa formulario
7. Confirma pedido
8. Sistema crea pedido
9. Mensaje de confirmación con número de pedido
10. Carrito se vacía

### 6.9 Asistente de Voz IA (ElevenLabs)

**Integración:**
- Widget flotante en menú público
- Conversación por voz para hacer pedidos
- Configuración del Agent ID en settings

**Flujo:**
1. Cliente hace clic en botón de micrófono
2. Se inicia conversación con ElevenLabs
3. IA pregunta qué desea ordenar
4. Cliente describe su pedido por voz
5. IA confirma productos y cantidades
6. Cliente proporciona datos de entrega
7. IA crea el pedido
8. Confirmación por voz y en pantalla

**Componente:**
```typescript
const VoiceAssistantWidget = () => {
  const { startConversation, endConversation, status } = useElevenLabsConversation();

  // UI: botón flotante con animación de ondas cuando está activo
}
```

---

## 7. EDGE FUNCTIONS (SUPABASE)

### 7.1 create-user

**Propósito:** Crear usuarios desde el panel de superadmin

**Endpoint:** `POST /functions/v1/create-user`

**Payload:**
```typescript
{
  email: string;
  password: string;
  full_name: string;
  role: 'superadmin' | 'restaurant_owner' | 'restaurant_admin' | 'restaurant_staff';
  restaurant_id?: string;
}
```

**Lógica:**
1. Valida que el usuario autenticado sea superadmin
2. Crea usuario en Supabase Auth
3. Actualiza `users` con role y restaurant_id
4. Retorna usuario creado

### 7.2 delete-user

**Propósito:** Eliminar usuarios

**Endpoint:** `POST /functions/v1/delete-user`

**Payload:**
```typescript
{
  userId: string;
  forceDelete?: boolean;
}
```

**Lógica:**
1. Valida permisos (superadmin o owner del restaurante)
2. Verifica si el usuario es owner de un restaurante
3. Si es owner y !forceDelete, retorna `requiresConfirmation`
4. Si forceDelete, elimina de Auth y users
5. Retorna resultado

### 7.3 delete-restaurant

**Propósito:** Eliminar restaurante completo

**Endpoint:** `POST /functions/v1/delete-restaurant`

**Payload:**
```typescript
{
  restaurantId: string;
  forceDelete?: boolean;
}
```

**Lógica:**
1. Valida que sea superadmin
2. Verifica si tiene usuarios asignados
3. Si tiene usuarios y !forceDelete, retorna `requiresConfirmation`
4. Si forceDelete:
   - Elimina todos los pedidos
   - Elimina todos los productos
   - Elimina todas las categorías
   - Elimina todos los clientes
   - Elimina suscripción
   - Desasigna usuarios (restaurant_id = NULL)
   - Elimina restaurante
5. Retorna resultado

### 7.4 transfer-restaurant-ownership

**Propósito:** Transferir propiedad del restaurante

**Endpoint:** `POST /functions/v1/transfer-restaurant-ownership`

**Payload:**
```typescript
{
  restaurantId: string;
  newOwnerId: string;
}
```

**Lógica:**
1. Valida que sea superadmin o owner actual
2. Valida que nuevo owner exista y pertenezca al restaurante
3. Actualiza `restaurants.owner_id`
4. Actualiza role del anterior owner a `restaurant_admin`
5. Actualiza role del nuevo owner a `restaurant_owner`
6. Retorna resultado

---

## 8. CONTEXTOS Y HOOKS PERSONALIZADOS

### 8.1 AuthContext

**Propósito:** Gestión global del estado de autenticación

```typescript
interface AuthContextType {
  user: User | null;
  userRole: Role | null;
  restaurant: Restaurant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}
```

**Características:**
- Suscripción a cambios de auth state
- Carga de datos de usuario y restaurante
- Manejo de errores traducidos
- Redirección automática según rol

### 8.2 CartContext

**Propósito:** Gestión del carrito de compras (menú público)

```typescript
interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}
```

**Características:**
- Estado persistente en localStorage
- Cálculos automáticos de totales
- Validación de cantidades

### 8.3 LanguageContext

**Propósito:** Multi-idioma (Español/Inglés)

```typescript
interface LanguageContextType {
  language: 'es' | 'en';
  setLanguage: (lang: 'es' | 'en') => void;
  t: (key: string) => string;
}
```

**Características:**
- Traducciones en `utils/translations.ts`
- Persistencia en localStorage
- Switch de idioma en header

### 8.4 useToast Hook

**Propósito:** Notificaciones toast

```typescript
const { showToast } = useToast();

showToast(
  'success' | 'error' | 'warning' | 'info',
  'Título',
  'Mensaje'
);
```

**Características:**
- Auto-dismiss después de 5 segundos
- Animación de entrada/salida
- Stack de múltiples toasts
- Cierre manual

### 8.5 useSubscriptionLimits Hook

**Propósito:** Validar límites del plan actual

```typescript
const {
  canAddProduct,
  canAddCategory,
  currentProductCount,
  currentCategoryCount,
  maxProducts,
  maxCategories,
  checkLimits
} = useSubscriptionLimits();
```

**Uso:**
- Deshabilitar botones cuando se alcanza el límite
- Mostrar modal de upgrade
- Mostrar progreso (ej: "8/10 productos")

### 8.6 useElevenLabsConversation Hook

**Propósito:** Integración con ElevenLabs AI

```typescript
const {
  startConversation,
  endConversation,
  status,
  error
} = useElevenLabsConversation(agentId);
```

**Estados:**
- `idle`: No iniciado
- `connecting`: Conectando
- `connected`: En conversación
- `error`: Error de conexión

---

## 9. UTILIDADES Y HELPERS

### 9.1 Traducciones de Errores

**Archivo:** `utils/errorTranslations.ts`

```typescript
const errorTranslations: Record<string, string> = {
  'Invalid login credentials': 'Credenciales incorrectas',
  'User already registered': 'El usuario ya está registrado',
  'Email not confirmed': 'Email no confirmado',
  // ... más errores
};

export const translateError = (error: string) => {
  return errorTranslations[error] || error;
};
```

### 9.2 Utilidades de Moneda

**Archivo:** `utils/currencyUtils.ts`

```typescript
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Resultado: "$29.900"
```

### 9.3 Ciudades Colombianas

**Archivo:** `utils/colombianCities.ts`

```typescript
export const colombianCities = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  // ... todas las ciudades
];
```

### 9.4 Utilidades de Tema

**Archivo:** `utils/themeUtils.ts`

```typescript
export const applyTheme = (colors: ThemeColors) => {
  document.documentElement.style.setProperty('--color-primary', colors.primary);
  document.documentElement.style.setProperty('--color-secondary', colors.secondary);
  // ... más colores
};

export const getContrastColor = (hexColor: string): 'light' | 'dark' => {
  // Calcular luminosidad y retornar color de texto apropiado
};
```

---

## 10. OPTIMIZACIONES Y MEJORES PRÁCTICAS

### 10.1 Performance

**Carga de Imágenes:**
- Atributo `loading="lazy"` en todas las imágenes
- Placeholders mientras cargan
- Optimización de tamaño (WebP ideal)

**Queries:**
- Paginación en todas las listas grandes
- `select` específico de columnas necesarias
- Índices en columnas frecuentemente consultadas:
  - `restaurants.domain`
  - `products.restaurant_id`
  - `orders.restaurant_id`
  - `customers.restaurant_id`

**React:**
- `useMemo` para cálculos costosos
- `useCallback` para funciones que se pasan como props
- Lazy loading de rutas (React.lazy)
- Debounce en búsquedas (350ms)

### 10.2 Seguridad

**Validaciones:**
- Validación en cliente Y servidor
- Sanitización de inputs
- Protección CSRF (Supabase lo maneja)
- Rate limiting en Edge Functions

**Secrets:**
- Variables de entorno para API keys
- NUNCA exponer `SUPABASE_SERVICE_ROLE_KEY` en cliente
- Usar `anon key` en frontend

**RLS:**
- Todas las tablas con RLS habilitado
- Políticas restrictivas por defecto
- Testing de políticas con diferentes roles

### 10.3 UX/UI

**Feedback Visual:**
- Loading states en todas las acciones
- Skeleton loaders para tablas
- Mensajes de éxito/error claros
- Confirmaciones antes de eliminar

**Responsive:**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Menú hamburguesa en móvil
- Tablas con scroll horizontal en móvil

**Accesibilidad:**
- Labels en todos los inputs
- Contraste de colores adecuado
- Navegación por teclado
- Aria labels en iconos

---

## 11. FLUJOS CRÍTICOS DE USUARIO

### 11.1 Flujo: Registro de Restaurante

```
1. Landing Page
   ↓ Clic en "Comenzar Gratis"
2. Formulario de Registro
   - Nombre completo
   - Email
   - Contraseña
   - Nombre del restaurante
   - Dominio (slug único)
   - Teléfono
   - Aceptar TyC
   ↓ Submit
3. Backend Validations
   - Email único
   - Dominio único
   - Contraseña fuerte
   ↓ OK
4. Supabase Auth crea usuario
   ↓ Trigger
5. Tabla users se auto-puebla
   ↓
6. Sistema crea restaurante
   ↓
7. Sistema asigna restaurant_id a usuario
   ↓
8. Sistema actualiza role a restaurant_owner
   ↓ Trigger
9. Auto-creación de suscripción Free
   ↓
10. Redirección a /dashboard/restaurant
    ↓
11. Tutorial Modal (opcional)
    - Bienvenida
    - Guía rápida de primeros pasos
```

### 11.2 Flujo: Cliente Hace Pedido

```
1. Cliente navega a platyo.com/mi-restaurante
   ↓
2. Ve menú público con productos activos
   ↓
3. Navega por categorías
   ↓
4. Clic en producto para ver detalle
   ↓ Modal abre
5. Selecciona cantidad
   ↓ Clic "Agregar"
6. Producto se agrega al carrito (localStorage)
   ↓ Badge actualiza
7. Cliente continúa navegando
   ↓
8. Repite pasos 3-7 para más productos
   ↓
9. Clic en carrito flotante
   ↓ CartSidebar abre
10. Revisa items, ajusta cantidades
    ↓ Clic "Finalizar Pedido"
11. CheckoutModal abre
    - Formulario de datos
    - Resumen de pedido
    ↓ Submit
12. Validaciones frontend
    ↓ OK
13. POST a Supabase
    - Crea/actualiza customer
    - Crea order con items
    ↓ Success
14. Modal de confirmación
    - Número de pedido
    - Tiempo estimado
    - Datos de contacto
    ↓
15. Carrito se vacía
    ↓
16. Cliente recibe notificación (futuro: WhatsApp/Email)
```

### 11.3 Flujo: Owner Gestiona Pedido

```
1. Owner en /dashboard/orders
   ↓ Realtime subscription
2. Nuevo pedido llega → Toast notification
   ↓
3. Lista se actualiza automáticamente
   ↓
4. Owner ve tarjeta de pedido con estado "Pendiente"
   ↓ Clic en pedido
5. Modal de detalle abre
   - Datos del cliente
   - Items del pedido
   - Total
   - Notas
   ↓
6. Owner revisa y confirma
   ↓ Clic "Confirmar"
7. Estado cambia a "Confirmado"
   ↓ Realtime update
8. Cliente ve cambio (si está en la página)
   ↓
9. Owner actualiza a "Preparando"
   ↓
10. Owner actualiza a "Listo"
    ↓
11. Delivery recoge (o cliente pasa)
    ↓
12. Owner actualiza a "Entregado"
    ↓
13. Pedido se mueve a tab "Entregados"
    ↓
14. Métricas se actualizan
    - Total de ventas +
    - Ticket promedio recalculado
    - Cliente.total_orders +
    - Cliente.total_spent +
```

### 11.4 Flujo: Downgrade de Plan

```
1. Owner en /dashboard/subscription
   ↓
2. Plan actual: Pro (200 productos)
   ↓
3. Owner selecciona plan Basic (50 productos)
   ↓ Modal de confirmación
4. "Tienes 120 productos activos, el plan Basic permite 50"
   ↓
5. Owner confirma
   ↓
6. UPDATE subscriptions
   ↓ Trigger: enforce_subscription_limits()
7. Sistema cuenta productos activos (120)
   ↓
8. Excede límite (50)
   ↓
9. Sistema bloquea los 70 más antiguos
   - Status → 'blocked'
   ↓
10. Suscripción actualizada
    ↓
11. Owner ve mensaje de éxito
    - "Plan actualizado"
    - "70 productos fueron bloqueados"
    ↓
12. Owner va a /dashboard/menu
    ↓
13. Ve 50 productos activos + 70 bloqueados
    ↓
14. Opciones:
    - Archivar algunos activos para liberar espacio
    - Activar algunos bloqueados (limitado a 50 total)
    - Upgrade para recuperar todos
```

---

## 12. VARIABLES DE ENTORNO

**Archivo:** `.env`

```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# ElevenLabs (opcional)
VITE_ELEVENLABS_API_KEY=tu-api-key

# App Config
VITE_APP_NAME=PLATYO
VITE_APP_URL=https://platyo.com
```

**Nota:** Las Edge Functions tienen acceso automático a:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 13. COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Deploy Edge Function (manual - usar tool mcp__supabase__deploy_edge_function)
# NO disponible vía CLI en este entorno
```

---

## 14. ROADMAP Y MEJORAS FUTURAS

### Corto Plazo (1-3 meses)
- [ ] Notificaciones push para nuevos pedidos
- [ ] Integración con WhatsApp para confirmación de pedidos
- [ ] Exportar reportes a PDF/Excel
- [ ] Modo oscuro
- [ ] Galería de imágenes por producto (múltiples fotos)

### Mediano Plazo (3-6 meses)
- [ ] Sistema de propinas
- [ ] Programa de fidelidad (puntos)
- [ ] Cupones de descuento
- [ ] Integración con pasarelas de pago (Stripe, PayU, Mercado Pago)
- [ ] Multi-sucursal
- [ ] Inventario de productos
- [ ] Impresión de tickets (integración con impresoras térmicas)

### Largo Plazo (6-12 meses)
- [ ] App móvil (React Native)
- [ ] Integración con sistemas POS
- [ ] Marketplace (directory de todos los restaurantes)
- [ ] Reservas de mesas
- [ ] Sistema de reseñas
- [ ] Marketing por email/SMS
- [ ] Dashboard de driver para deliveries
- [ ] API pública para integraciones

---

## 15. CASOS DE USO ESPECÍFICOS

### 15.1 Restaurante de Comida Rápida
- Plan: Basic o Pro
- Necesidades:
  - Muchos pedidos diarios
  - Menú simple (10-30 productos)
  - Entrega a domicilio
  - Pago en efectivo/transferencia
- Features clave:
  - Gestión rápida de estados de pedido
  - Notificaciones en tiempo real
  - Asistente de voz para ordenar

### 15.2 Restaurante Gourmet
- Plan: Pro o Business
- Necesidades:
  - Menú extenso con descripciones detalladas
  - Múltiples categorías
  - Fotos de alta calidad
  - Personalización de tema acorde a branding
- Features clave:
  - Precios comparativos (ofertas especiales)
  - Analytics avanzados
  - Múltiples administradores

### 15.3 Cafetería
- Plan: Free o Basic
- Necesidades:
  - Menú simple (cafés, postres)
  - Pocas categorías
  - Pedidos para recoger en tienda
- Features clave:
  - Menú público limpio
  - Gestión de pedidos básica
  - Bajo costo de operación

### 15.4 Cadena de Restaurantes (Multi-sucursal)
- Plan: Business
- Necesidades:
  - Múltiples restaurantes bajo misma marca
  - Gestión centralizada
  - Reportes consolidados
- Features clave (futuras):
  - Dashboard multi-restaurante
  - Transferencia de productos entre sucursales
  - Analytics consolidados

---

## 16. TESTING Y QA

### 16.1 Testing Manual

**Checklist de Registro:**
- [ ] Validación de email único
- [ ] Validación de dominio único
- [ ] Validación de contraseña fuerte
- [ ] Auto-asignación de rol restaurant_owner
- [ ] Auto-creación de suscripción Free
- [ ] Redirección correcta a dashboard

**Checklist de RLS:**
- [ ] Usuario solo ve datos de su restaurante
- [ ] Usuario no puede acceder a datos de otro restaurante
- [ ] Superadmin ve todos los datos
- [ ] Políticas de INSERT validan restaurant_id
- [ ] Políticas de UPDATE validan ownership

**Checklist de Límites:**
- [ ] Bloqueo al exceder productos
- [ ] Bloqueo al exceder categorías
- [ ] Modal de activación funciona
- [ ] Downgrade bloquea items antiguos
- [ ] Upgrade desbloquea items

### 16.2 Testing de Edge Functions

**create-user:**
```bash
curl -X POST https://tu-proyecto.supabase.co/functions/v1/create-user \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","full_name":"Test User","role":"restaurant_admin","restaurant_id":"uuid"}'
```

**delete-restaurant:**
```bash
curl -X POST https://tu-proyecto.supabase.co/functions/v1/delete-restaurant \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"restaurantId":"uuid","forceDelete":false}'
```

---

## 17. TROUBLESHOOTING COMÚN

### 17.1 "Usuario no puede ver sus productos"
- Verificar que `restaurant_id` esté asignado en `users`
- Verificar que RLS policies en `products` incluyan la validación correcta
- Verificar que el usuario esté autenticado

### 17.2 "Error al crear pedido público"
- Verificar que exista política pública de INSERT en `orders`
- Verificar que `customers` permita INSERT público
- Verificar que los productos existan y estén activos

### 17.3 "Límites de plan no se aplican"
- Verificar que trigger `enforce_subscription_limits` esté activo
- Verificar que `subscriptions` tenga valores correctos de `max_products` y `max_categories`
- Verificar que función `force_apply_subscription_limits()` funcione

### 17.4 "Menú público no carga"
- Verificar que dominio exista en tabla `restaurants`
- Verificar que productos tengan `status = 'active'`
- Verificar que categorías tengan `is_active = true`
- Verificar RLS policies permitan lectura pública

---

## 18. DOCUMENTACIÓN DE APIs

### 18.1 Supabase Client SDK

**Autenticación:**
```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign Out
await supabase.auth.signOut();

// Get Session
const { data: { session } } = await supabase.auth.getSession();

// Reset Password
await supabase.auth.resetPasswordForEmail('user@example.com');
```

**Queries:**
```typescript
// Select
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('restaurant_id', restaurantId)
  .eq('status', 'active')
  .order('display_order');

// Insert
const { data, error } = await supabase
  .from('products')
  .insert([{ name: 'Pizza', price: 25000, restaurant_id: restaurantId }]);

// Update
const { data, error } = await supabase
  .from('products')
  .update({ price: 30000 })
  .eq('id', productId);

// Delete
const { data, error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId);

// Realtime Subscription
const subscription = supabase
  .channel('orders-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, (payload) => {
    console.log('New order:', payload.new);
  })
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

**Paginación:**
```typescript
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .range(from, to);

const totalPages = Math.ceil((count || 0) / pageSize);
```

**Búsqueda:**
```typescript
// Case-insensitive search
const { data, error } = await supabase
  .from('products')
  .select('*')
  .ilike('name', `%${searchTerm}%`);

// OR search
const { data, error } = await supabase
  .from('restaurants')
  .select('*')
  .or(`name.ilike.%${term}%,email.ilike.%${term}%`);
```

---

## CONCLUSIÓN

Esta especificación técnica completa describe PLATYO como una plataforma SaaS multi-tenant robusta, escalable y segura para la gestión de restaurantes. La arquitectura está diseñada para:

1. **Seguridad:** RLS en todas las tablas, validación en cliente y servidor
2. **Escalabilidad:** Multi-tenant, paginación, índices optimizados
3. **UX:** Interfaces intuitivas, feedback visual, responsive design
4. **Flexibilidad:** Sistema de planes escalonados, personalización de tema
5. **Modernidad:** React, TypeScript, Supabase, Edge Functions, IA conversacional

El sistema está listo para producción y preparado para crecer con funcionalidades adicionales como multi-sucursal, integraciones de pago, y app móvil.
