# Documentación Técnica - Sistema de Gestión de Restaurantes (PLATYO)

## Índice
1. [¿Qué es esta Aplicación?](#qué-es-esta-aplicación)
2. [Descripción General](#descripción-general)
3. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
4. [Estructura de Carpetas](#estructura-de-carpetas)
5. [Sistema de Base de Datos](#sistema-de-base-de-datos)
6. [Contextos y Estado Global](#contextos-y-estado-global)
7. [Rutas y Navegación](#rutas-y-navegación)
8. [Componentes Principales](#componentes-principales)
9. [Tipos de Datos](#tipos-de-datos)
10. [Sistema de Facturación POS](#sistema-de-facturación-pos)
11. [Sistema de Notificaciones](#sistema-de-notificaciones)
12. [Guía de Edición](#guía-de-edición)
13. [Flujos de Usuario](#flujos-de-usuario)

---

## ¿Qué es esta Aplicación?

**PLATYO** es una plataforma SaaS (Software as a Service) completa para la gestión de restaurantes que permite crear menús digitales, procesar pedidos, generar facturas POS, gestionar clientes y analizar el rendimiento del negocio. Es una solución todo-en-uno que elimina la necesidad de múltiples sistemas, integrando menús digitales, punto de venta, gestión de pedidos y análisis de datos en una sola plataforma.

### ¿Qué Incluye?

#### Para Restaurantes (Restaurant Owners):

**Gestión de Menú Digital**
- Crear y organizar productos en categorías personalizadas
- Agregar múltiples imágenes por producto (hasta 5 imágenes)
- Definir variaciones de productos (tamaños, opciones, precios diferentes)
- Configurar ingredientes opcionales con cargos adicionales
- Marcar restricciones dietéticas y nivel de picante
- Activar/desactivar productos según disponibilidad
- Destacar productos especiales en el menú
- Reordenar productos con drag & drop o controles
- Búsqueda y filtrado avanzado de productos

**Gestión de Categorías**
- Crear categorías ilimitadas para organizar el menú
- Ordenar categorías con drag & drop o controles de orden
- Activar/desactivar categorías completas
- Agregar descripciones detalladas a cada categoría
- Contador de productos por categoría
- Iconos personalizados para cada categoría

**Sistema de Pedidos en Tiempo Real**
- Recibir y visualizar pedidos en tiempo real
- Panel de control con vista tipo kanban
- Estados de pedidos: pendiente, confirmado, preparando, listo, entregado, cancelado
- Ver detalles completos de cada pedido (productos, variaciones, ingredientes, notas)
- Filtrar pedidos por estado, fecha, tipo y búsqueda
- Información completa del cliente (nombre, teléfono, dirección)
- Integración con WhatsApp para comunicación directa
- Cálculo automático de tiempos de entrega
- Historial completo de pedidos
- Generación automática de números de orden

**Sistema de Facturación POS Completo**
- Generación de facturas tipo recibo POS
- Impresión optimizada para impresoras térmicas de 80mm
- Diseño responsive que se adapta a cualquier tamaño de papel
- Información detallada del restaurante con logo
- Configuración de facturación completa:
  - Datos comerciales (NIT, razón social, dirección fiscal)
  - Régimen tributario configurable
  - Soporte para IVA (19%) con toggle activable
  - Soporte para IPC (Impuesto al Consumo) con porcentaje personalizable (por defecto 8%)
  - Resolución DIAN configurable
  - Propinas opcionales (10%)
  - Logo personalizable en ticket
  - Mensaje final personalizable
- Desglose completo de productos con variaciones
- Información del cliente y tipo de pedido
- Cálculo automático de subtotal, IVA, IPC, delivery y total
- Número de orden y fecha/hora de emisión
- Notas especiales del pedido
- Vista previa antes de imprimir
- Impresión directa desde el navegador

**Gestión de Clientes**
- Base de datos de clientes automática
- Historial completo de pedidos por cliente
- Información de contacto y direcciones guardadas
- Estadísticas de frecuencia de pedidos
- Total gastado por cliente
- Búsqueda y filtrado avanzado de clientes
- Fecha de último pedido
- Productos favoritos por cliente

**Panel de Analíticas Avanzadas** (Planes de Pago)
- Dashboard visual con gráficos interactivos
- Estadísticas de ventas en tiempo real
- Productos más vendidos con ranking
- Ingresos totales y tendencias por período
- Análisis detallado por categoría
- Comparativas entre períodos
- Métricas clave: ticket promedio, pedidos por hora, tasa de conversión
- Gráficos de barras, líneas y donas
- Exportación de datos
- Filtros por fecha personalizable

**Configuración Avanzada del Restaurante**
- Personalizar información básica (nombre, descripción, contacto)
- Subir y gestionar logo del restaurante
- Configurar URL única del menú (slug personalizado)
- Sistema de temas completo:
  - 8 colores predefinidos profesionales
  - Color primario personalizable con selector visual
  - Color secundario personalizable
  - Colores de texto personalizables
  - Vista previa en tiempo real de los cambios
  - Reset a valores por defecto
- Seleccionar idioma (español/inglés) con traducciones completas
- Configurar horarios de atención por día
- Definir métodos de pedido (recogida, delivery, mesa)
- Establecer costos de delivery por zona/ciudad
- Configurar ciudades de Colombia para delivery
- Mensajes personalizados para el menú público
- Configuración de moneda (COP, USD, EUR, etc.)

**Gestión de Suscripciones**
- Ver plan actual y features disponibles
- Comparar planes disponibles (Free, Basic, Pro, Business)
- Upgrade/downgrade de planes con validación
- Renovación automática opcional
- Historial completo de suscripciones
- Límites claros por plan (productos, categorías, analytics)
- Notificaciones de vencimiento
- Sistema de pagos simulado (preparado para integración real)

**Asistente de Voz con IA (ElevenLabs)**
- Widget flotante en el menú público
- Conversación por voz en tiempo real con los clientes
- Agente inteligente que puede:
  - Responder preguntas sobre el menú
  - Recomendar productos
  - Tomar pedidos completos
  - Explicar ingredientes y variaciones
  - Informar sobre tiempos de entrega y costos
- Integración directa con ElevenLabs Conversational AI
- ID de agente configurable por restaurante
- Experiencia de voz natural y fluida
- Mejora la conversión de ventas y experiencia del cliente

**Sistema de Tutoriales Integrado**
- Tutorial interactivo paso a paso para nuevos usuarios
- Guías contextuales en cada sección
- Videos y capturas de pantalla
- Progress tracking del tutorial
- Skip y volver a ver opciones

#### Para Clientes (Menú Público):

**Experiencia de Compra Optimizada**
- Acceso al menú mediante URL única personalizable
- Diseño moderno y atractivo adaptado al tema del restaurante
- Navegación intuitiva por categorías con smooth scroll
- Búsqueda en tiempo real de productos
- Vista de cuadrícula con imágenes atractivas
- Badges visuales (featured, picante, dietético)
- Ver imágenes en galería full-screen
- Información nutricional y de ingredientes
- Precios claramente visibles
- Tiempo de preparación estimado

**Carrito de Compras Inteligente**
- Sidebar flotante con vista del carrito
- Agregar productos con variaciones y cantidades
- Seleccionar ingredientes opcionales con cargos
- Agregar notas especiales a cada producto
- Ver subtotal en tiempo real
- Editar cantidades directamente en el carrito
- Eliminar productos con un clic
- Cálculo automático de totales
- Persistencia del carrito entre sesiones

**Proceso de Checkout Simplificado**
- Modal de checkout elegante y moderno
- Formulario optimizado para móviles
- Seleccionar tipo de pedido (recogida, delivery, mesa)
- Autocompletado de direcciones
- Selector de ciudad con ciudades colombianas
- Cálculo automático de costo de delivery
- Campo de instrucciones especiales
- Validación de datos en tiempo real
- Envío directo por WhatsApp al restaurante
- Confirmación visual del pedido enviado
- Redirección automática a WhatsApp

**Experiencia Responsive Premium**
- Diseño mobile-first optimizado
- Interfaz táctil intuitiva
- Lazy loading de imágenes
- Animaciones suaves y microinteracciones
- Navegación gestual en móviles
- Toast notifications personalizadas con colores del tema
- Feedback visual en todas las acciones
- Skeleton loaders durante carga
- Optimización de rendimiento

#### Para Super Administradores:

**Gestión Completa de Restaurantes**
- Vista de todos los restaurantes registrados
- Activar/desactivar restaurantes
- Editar información completa de cualquier restaurante
- Ver estadísticas detalladas por restaurante
- Panel de métricas globales
- Eliminar restaurantes con confirmación
- Búsqueda y filtrado avanzado

**Gestión de Usuarios del Sistema**
- Lista completa de usuarios registrados
- Ver rol y restaurante asociado
- Editar información de usuarios
- Cambiar roles y permisos
- Desactivar/activar cuentas
- Resetear contraseñas
- Historial de actividad

**Gestión Avanzada de Suscripciones**
- Ver todas las suscripciones activas/inactivas
- Cambiar planes manualmente
- Extender fechas de expiración
- Cancelar o reactivar suscripciones
- Configurar renovación automática
- Ver historial completo de pagos
- Generar reportes de ingresos
- Métricas de conversión por plan

**Sistema de Soporte y Tickets**
- Panel de tickets integrado
- Clasificar por prioridad (baja, media, alta, urgente)
- Categorías de tickets (técnico, billing, feature request, general)
- Filtrar por estado, categoría, prioridad y fechas
- Responder a tickets con historial
- Agregar notas internas
- Estados: pendiente, en progreso, resuelto, cerrado
- Ordenar por fecha (más nuevos/antiguos primero)
- Asignación de tickets a staff
- SLA tracking

**Analíticas Globales del Sistema**
- Dashboard ejecutivo completo
- Estadísticas del sistema en tiempo real
- Número de restaurantes activos vs inactivos
- Total de usuarios por rol
- Ingresos mensuales y anuales por suscripciones
- Gráficos de tendencias y crecimiento
- Restaurantes más exitosos (por pedidos e ingresos)
- Tasa de retención y churn
- Métricas de conversión
- Exportación de reportes

### Planes de Suscripción

**Free Plan** (Gratuito - 30 días)
- Hasta 15 productos
- Hasta 5 categorías
- Menú público básico con todas las características
- Gestión de pedidos ilimitados
- Gestión de clientes completa
- Sistema de facturación POS con IVA e IPC
- Personalización de temas
- Soporte por email y tickets
- Asistente de voz con IA (ElevenLabs)
- Notificaciones por WhatsApp

**Business Plan** ($29.990 COP/mes o $9 USD/mes)
- Hasta 100 productos
- Hasta 15 categorías
- Todo de Free +
- Analytics avanzadas con gráficos y reportes
- Panel de estadísticas detalladas
- Múltiples imágenes por producto (hasta 5)
- Soporte prioritario 24/7
- Renovación automática opcional
- Historial completo de pedidos
- Reportes de productos más vendidos

**Enterprise Plan** ($299.990 COP/año o $90 USD/año)
- Productos ilimitados
- Categorías ilimitadas
- Todo de Business +
- Analytics completas con tendencias
- Reportes exportables avanzados
- Soporte dedicado con prioridad máxima
- Personalización completa de la plataforma
- Configuración de múltiples sucursales (preparado)
- API access para integraciones (preparado)
- Capacitación personalizada
- 2 meses gratis (pago anual)

---

## Descripción General

PLATYO es una aplicación web multi-tenant construida con tecnologías modernas que permite a restaurantes gestionar completamente su operación digital. La aplicación tiene una arquitectura robusta que separa roles y responsabilidades de manera clara.

### Roles del Sistema

- **Super Admin**: Control total del sistema, gestión de restaurantes, usuarios, suscripciones y soporte
- **Restaurant Owner**: Gestión completa de su restaurante, menú, pedidos, clientes y configuraciones
- **Cliente (Público)**: Acceso al menú digital, carrito de compras y checkout

### Tecnologías Principales

**Frontend**
- React 18.3.1 - Framework principal
- TypeScript 5.5.3 - Tipado estático robusto
- React Router DOM 7.8.2 - Navegación SPA
- Tailwind CSS 3.4.1 - Sistema de diseño utility-first
- Lucide React 0.344.0 - Biblioteca de iconos moderna

**Backend y Base de Datos**
- Supabase 2.89.0 - Backend as a Service
- PostgreSQL - Base de datos relacional
- Row Level Security (RLS) - Seguridad a nivel de fila
- Real-time subscriptions - Actualizaciones en tiempo real
- Supabase Edge Functions - Funciones serverless

**Integraciones**
- ElevenLabs Client 0.13.0 - Asistente de voz con IA conversacional
- WhatsApp Business - Notificaciones y comunicación con clientes

**Herramientas de Desarrollo**
- Vite 5.4.2 - Build tool ultra rápido
- ESLint 9.9.1 - Linting de código
- PostCSS 8.4.35 - Procesamiento de CSS
- Autoprefixer 10.4.18 - Prefijos CSS automáticos

---

## Arquitectura de la Aplicación

### Flujo de Datos

```
Supabase PostgreSQL (persistencia)
    ↓
Supabase Client (src/lib/supabase.ts)
    ↓
Contexts (AuthContext, CartContext, LanguageContext)
    ↓
Components/Pages (UI Layer)
    ↓
User Interface
```

### Patrones de Diseño Implementados

- **Context API Pattern**: Estado global compartido sin prop drilling
- **Component Composition Pattern**: Componentes pequeños y reutilizables
- **Custom Hooks Pattern**: Lógica reutilizable encapsulada (useToast, useAuth)
- **Container/Presentational Pattern**: Separación de lógica y UI
- **Higher Order Components**: Componentes de protección de rutas
- **Observer Pattern**: Subscripciones en tiempo real de Supabase
- **Repository Pattern**: Capa de abstracción para acceso a datos

### Arquitectura de Seguridad

```
Frontend (React)
    ↓
Supabase Auth (JWT Tokens)
    ↓
Row Level Security Policies
    ↓
PostgreSQL Database
```

Cada tabla tiene políticas RLS específicas que garantizan:
- Los restaurant owners solo ven/modifican sus propios datos
- Los super admins tienen acceso completo
- Los datos públicos (menú) son accesibles sin autenticación
- Las operaciones están auditadas

---

## Estructura de Carpetas

```
project/
├── src/
│   ├── components/              # Componentes reutilizables
│   │   ├── auth/               # Autenticación
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordModal.tsx
│   │   │   ├── ChangePasswordModal.tsx
│   │   │   └── TermsAndConditions.tsx
│   │   ├── layout/             # Layout principal
│   │   │   ├── Header.tsx      # Header con perfil y logout
│   │   │   └── Sidebar.tsx     # Navegación lateral
│   │   ├── public/             # Menú público
│   │   │   ├── AnimatedCarousel.tsx    # Carrusel animado
│   │   │   ├── CartPreview.tsx         # Vista previa del carrito
│   │   │   ├── CartSidebar.tsx         # Carrito flotante
│   │   │   ├── CheckoutModal.tsx       # Modal de checkout
│   │   │   ├── FloatingFooter.tsx      # Footer flotante
│   │   │   ├── ProductCard.tsx         # Tarjeta de producto
│   │   │   ├── ProductCardSkeleton.tsx # Skeleton loader
│   │   │   ├── ProductDetail.tsx       # Detalle de producto
│   │   │   ├── VoiceAssistantWidget.tsx # Asistente de voz IA
│   │   │   ├── Pathformbottom.tsx      # Decoración SVG
│   │   │   ├── Pathformleft.tsx        # Decoración SVG
│   │   │   └── Pathformtop.tsx         # Decoración SVG
│   │   ├── restaurant/         # Componentes del restaurante
│   │   │   ├── ProductForm.tsx         # Formulario de productos
│   │   │   ├── OrderProductSelector.tsx # Selector de productos
│   │   │   └── TutorialModal.tsx       # Tutorial interactivo
│   │   └── ui/                 # UI Components genéricos
│   │       ├── Badge.tsx       # Etiquetas de estado
│   │       ├── Button.tsx      # Botones reutilizables
│   │       ├── ConfirmDialog.tsx # Diálogos de confirmación
│   │       ├── Input.tsx       # Inputs de formulario
│   │       ├── Modal.tsx       # Modal genérico
│   │       └── Toast.tsx       # Sistema de notificaciones
│   │
│   ├── contexts/               # Estado global
│   │   ├── AuthContext.tsx     # Autenticación y usuario actual
│   │   ├── CartContext.tsx     # Carrito de compras
│   │   └── LanguageContext.tsx # Internacionalización
│   │
│   ├── data/
│   │   └── mockData.ts         # Datos iniciales y helpers legacy
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useToast.tsx        # Sistema de notificaciones toast
│   │   └── useElevenLabsConversation.ts # Hook para asistente de voz IA
│   │
│   ├── lib/
│   │   └── supabase.ts         # Cliente de Supabase configurado
│   │
│   ├── pages/                  # Páginas principales
│   │   ├── public/
│   │   │   └── PublicMenu.tsx  # Menú público del restaurante
│   │   │
│   │   ├── restaurant/         # Páginas del restaurante
│   │   │   ├── CategoriesManagement.tsx    # Gestión de categorías
│   │   │   ├── CustomersManagement.tsx     # Gestión de clientes
│   │   │   ├── MenuManagement.tsx          # Gestión de productos
│   │   │   ├── OrdersManagement.tsx        # Gestión de pedidos
│   │   │   ├── RestaurantAnalytics.tsx     # Analytics avanzadas
│   │   │   ├── RestaurantDashboard.tsx     # Dashboard principal
│   │   │   ├── RestaurantSettings.tsx      # Configuración
│   │   │   └── SubscriptionPlans.tsx       # Planes y suscripción
│   │   │
│   │   ├── superadmin/         # Páginas del super admin
│   │   │   ├── RestaurantsManagement.tsx   # Gestión de restaurantes
│   │   │   ├── SubscriptionsManagement.tsx # Gestión de suscripciones
│   │   │   ├── SuperAdminAnalytics.tsx     # Analytics globales
│   │   │   ├── SuperAdminDashboard.tsx     # Dashboard ejecutivo
│   │   │   ├── SupportTicketsManagement.tsx # Sistema de tickets
│   │   │   └── UsersManagement.tsx         # Gestión de usuarios
│   │   │
│   │   ├── AuthPage.tsx        # Login y registro
│   │   └── DashboardPage.tsx   # Router del dashboard
│   │
│   ├── types/
│   │   └── index.ts            # Todas las interfaces TypeScript
│   │
│   ├── utils/                  # Funciones utilitarias
│   │   ├── colombianCities.ts  # Lista de ciudades de Colombia
│   │   ├── currencyUtils.ts    # Formateo de moneda
│   │   ├── themeUtils.ts       # Gestión de temas y colores
│   │   └── translations.ts     # Sistema de traducciones i18n
│   │
│   ├── App.tsx                 # Componente raíz
│   ├── main.tsx                # Punto de entrada
│   ├── index.css               # Estilos globales y Tailwind
│   └── vite-env.d.ts           # Tipos de Vite
│
├── supabase/
│   ├── functions/              # Edge Functions (serverless)
│   │   ├── create-user/        # Creación de usuarios por admin
│   │   ├── delete-user/        # Eliminación de usuarios
│   │   ├── delete-restaurant/  # Eliminación de restaurantes
│   │   └── transfer-restaurant-ownership/ # Transferir propiedad
│   │
│   └── migrations/             # Migraciones de base de datos (80+ migraciones)
│       ├── 20251002185927_create_restaurant_management_tables.sql
│       ├── 20251218210004_create_platyo_database_schema.sql
│       ├── 20260113173642_fix_rls_performance_and_security_issues.sql
│       ├── 20260113193631_add_display_order_to_products.sql
│       ├── 20260114171142_add_elevenlabs_agent_id_to_restaurants.sql
│       ├── 20260127155605_add_auto_create_free_subscription_trigger.sql
│       └── ... (múltiples migraciones de optimización y features)
│
├── public/
│   └── PLATYO FAVICON BLANCO.svg # Logo de la aplicación
│
├── .env                        # Variables de entorno (Supabase)
├── .gitignore                  # Archivos ignorados por Git
├── package.json                # Dependencias del proyecto
├── tsconfig.json               # Configuración TypeScript
├── vite.config.ts              # Configuración Vite
├── tailwind.config.js          # Configuración Tailwind CSS
├── postcss.config.js           # Configuración PostCSS
└── ESTRUCTURA_DEL_PROYECTO.md  # Este archivo

```

---

## Sistema de Base de Datos

### Arquitectura Supabase

PLATYO utiliza Supabase como backend, que proporciona:
- PostgreSQL database con extensiones
- Autenticación integrada
- Row Level Security (RLS)
- Real-time subscriptions
- Storage para archivos
- Edge Functions (preparado)

### Esquema de Base de Datos

#### Tabla: `users`
```sql
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE NOT NULL,
  role: text NOT NULL, -- 'restaurant_owner' | 'super_admin'
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

#### Tabla: `restaurants`
```sql
restaurants (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  slug: text UNIQUE NOT NULL,
  email: text,
  phone: text,
  address: text,
  description: text,
  logo: text,
  owner_name: text,
  owner_id: uuid REFERENCES users(id),
  is_active: boolean DEFAULT true,
  settings: jsonb DEFAULT '{}'::jsonb,
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

**Settings JSONB incluye**:
- theme (color_scheme, primary_color, secondary_color, text_color, secondary_text_color)
- language (es | en)
- currency (COP, USD, EUR, etc.)
- business_hours (horarios por día de la semana)
- order_types (pickup, delivery, table)
- delivery_zones con costos por ciudad
- billing (configuración de facturación):
  - nombreComercial, razonSocial, NIT
  - direccion, departamento, ciudad
  - telefono, correo
  - regimenTributario (simple, comun, no_responsable_iva)
  - responsableIVA (boolean)
  - aplicaIPC (boolean)
  - porcentajeIPC (número, default 8)
  - tieneResolucionDIAN (boolean)
  - numeroResolucionDIAN, fechaResolucion
  - rangoNumeracionDesde, rangoNumeracionHasta
  - aplicaPropina (boolean)
  - mostrarLogoEnTicket (boolean)
  - logoTicket, mensajeFinalTicket
- elevenlabs_agent_id (ID del agente de voz IA)

#### Tabla: `categories`
```sql
categories (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  description: text,
  restaurant_id: uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  order_index: integer DEFAULT 0,
  is_active: boolean DEFAULT true,
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

#### Tabla: `products`
```sql
products (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id: uuid REFERENCES categories(id) ON DELETE SET NULL,
  name: text NOT NULL,
  description: text,
  images: text[] DEFAULT '{}',
  variations: jsonb DEFAULT '[]'::jsonb,
  ingredients: jsonb DEFAULT '[]'::jsonb,
  dietary_restrictions: text[] DEFAULT '{}',
  spice_level: integer DEFAULT 0,
  preparation_time: text,
  status: text DEFAULT 'active',
  sku: text,
  compare_at_price: numeric,  -- Precio de comparación (precio tachado)
  is_available: boolean DEFAULT true,
  is_featured: boolean DEFAULT false,
  order_index: integer DEFAULT 0,
  display_order: integer DEFAULT 0,  -- Orden de visualización
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

**Variations JSONB**:
```json
[
  {
    "id": "uuid",
    "name": "Grande",
    "price": 15000,
    "is_default": true
  }
]
```

**Ingredients JSONB**:
```json
[
  {
    "id": "uuid",
    "name": "Extra queso",
    "price": 2000,
    "is_available": true
  }
]
```

#### Tabla: `orders`
```sql
orders (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  order_number: text UNIQUE NOT NULL,
  customer: jsonb NOT NULL,
  items: jsonb NOT NULL,
  order_type: text NOT NULL,
  delivery_address: text,
  table_number: text,
  delivery_cost: numeric DEFAULT 0,
  subtotal: numeric NOT NULL,
  total: numeric NOT NULL,
  status: text DEFAULT 'pending',
  estimated_time: text,
  special_instructions: text,
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

**Customer JSONB**:
```json
{
  "name": "Juan Pérez",
  "phone": "3001234567",
  "email": "juan@email.com"
}
```

**Items JSONB**:
```json
[
  {
    "product_id": "uuid",
    "product_name": "Pizza",
    "variation": {...},
    "ingredients": [...],
    "quantity": 2,
    "unit_price": 15000,
    "total_price": 30000,
    "notes": "Sin cebolla"
  }
]
```

#### Tabla: `subscriptions`
```sql
subscriptions (
  id: uuid PRIMARY KEY,
  restaurant_id: uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  plan_type: text NOT NULL,
  status: text DEFAULT 'active',
  start_date: timestamptz DEFAULT now(),
  end_date: timestamptz,
  auto_renew: boolean DEFAULT false,
  created_at: timestamptz DEFAULT now(),
  updated_at: timestamptz DEFAULT now()
)
```

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas:

**Políticas de `restaurants`**:
- Owners pueden ver solo su restaurante
- Owners pueden actualizar solo su restaurante
- Super admins tienen acceso completo
- Público puede leer restaurantes activos (para menú público)

**Políticas de `products`**:
- Owners pueden gestionar productos de su restaurante
- Público puede leer productos activos
- Super admins tienen acceso completo

**Políticas de `orders`**:
- Owners pueden ver/gestionar pedidos de su restaurante
- Público puede crear pedidos (sin autenticación)
- Super admins tienen acceso completo

**Políticas de `subscriptions`**:
- Owners pueden ver su suscripción
- Solo super admins pueden modificar suscripciones

### Funciones de Base de Datos

**Función: `check_subscription_limits`**
Verifica si un restaurante ha alcanzado los límites de su plan actual.

**Función: `auto_expire_subscriptions`**
Trigger que marca suscripciones como expiradas automáticamente.

**Función: `auto_renew_subscriptions`**
Trigger que renueva suscripciones automáticamente si `auto_renew` está activado.

### Migraciones

Las migraciones están en `supabase/migrations/` y se ejecutan en orden cronológico. Cada migración incluye:
- Comentarios descriptivos detallados
- Creación de tablas con `IF NOT EXISTS`
- Índices para optimización
- Políticas RLS
- Triggers y funciones
- Datos semilla si es necesario

---

## Contextos y Estado Global

### AuthContext

**Ubicación**: `src/contexts/AuthContext.tsx`

**Responsabilidades**:
- Gestión de autenticación con Supabase Auth
- Sesión del usuario actual
- Información del restaurante asociado
- Estado de carga y errores
- Verificación de suscripción activa
- Logout y limpieza de sesión

**API del Context**:
```typescript
interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshRestaurant: () => Promise<void>;
}
```

**Uso**:
```typescript
import { useAuth } from '../contexts/AuthContext';

const { user, restaurant, subscription, login, logout } = useAuth();

if (subscription?.status !== 'active') {
  // Mostrar mensaje de suscripción expirada
}
```

### CartContext

**Ubicación**: `src/contexts/CartContext.tsx`

**Responsabilidades**:
- Gestión del carrito de compras
- Persistencia en localStorage
- Cálculo de totales con variaciones e ingredientes
- Gestión de cantidades
- Validación de stock y disponibilidad

**API del Context**:
```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    variation: ProductVariation,
    quantity?: number,
    notes?: string,
    selectedIngredients?: ProductIngredient[]
  ) => void;
  removeItem: (productId: string, variationId: string) => void;
  updateQuantity: (productId: string, variationId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}
```

**Ejemplo de uso**:
```typescript
const { items, addItem, getTotal, clearCart } = useCart();

addItem(product, variation, 2, "Sin cebolla", selectedIngredients);
const total = getTotal();
```

### LanguageContext

**Ubicación**: `src/contexts/LanguageContext.tsx`

**Responsabilidades**:
- Gestión de idioma de la interfaz
- Sistema de traducciones completo
- Persistencia en configuración del restaurante
- Fallback a español por defecto

**API del Context**:
```typescript
interface LanguageContextType {
  language: Language; // 'es' | 'en'
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}
```

**Uso**:
```typescript
const { language, setLanguage, t } = useLanguage();

<h1>{t('welcome')}</h1>
<button onClick={() => setLanguage('en')}>
  {t('switchLanguage')}
</button>
```

---

## Rutas y Navegación

### Estructura de Rutas

```typescript
// Rutas públicas (no requieren autenticación)
'/'                     // Redirect a /login
'/login'                // Autenticación (login/registro)
'/menu/:slug'           // Menú público
'/:slug'                // Alias del menú público

// Rutas privadas (requieren autenticación)
'/dashboard'            // Dashboard principal (renderiza según rol)

// Wildcard
'*'                     // 404 - Redirect a /login
```

### PrivateRoute Component

**Ubicación**: `src/App.tsx`

**Funcionalidad**:
```typescript
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, subscription } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (subscription?.status === 'expired') {
    return <SubscriptionExpiredMessage />;
  }

  return children;
};
```

### Navegación del Dashboard

El componente `DashboardPage` actúa como router interno basado en tabs:

**Para Super Admin**:
```typescript
const tabs = [
  'dashboard',      // SuperAdminDashboard
  'restaurants',    // RestaurantsManagement
  'users',          // UsersManagement
  'subscriptions',  // SubscriptionsManagement
  'support',        // SupportTicketsManagement
  'analytics',      // SuperAdminAnalytics
];
```

**Para Restaurant Owner**:
```typescript
const tabs = [
  'dashboard',      // RestaurantDashboard
  'menu',           // MenuManagement
  'categories',     // CategoriesManagement
  'orders',         // OrdersManagement
  'customers',      // CustomersManagement
  'analytics',      // RestaurantAnalytics (solo con plan de pago)
  'subscription',   // SubscriptionPlans
  'settings',       // RestaurantSettings
];
```

---

## Componentes Principales

### Layout Components

#### Header (`components/layout/Header.tsx`)

**Funcionalidad**:
- Logo y nombre del restaurante
- Información del usuario (email, rol)
- Badge de plan actual
- Botón de configuración (restaurant owner)
- Menú de perfil con dropdown
- Botón de logout

**Props**:
```typescript
interface HeaderProps {
  onNavigateToSettings?: () => void;
}
```

#### Sidebar (`components/layout/Sidebar.tsx`)

**Funcionalidad**:
- Navegación principal por tabs
- Iconos de Lucide React
- Badges para features premium
- Contador de notificaciones
- Indicador de tab activo
- Responsive (collapsible en móvil)

**Props**:
```typescript
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```

### Public Menu Components

#### PublicMenu (`pages/public/PublicMenu.tsx`)

**Funcionalidad completa**:
- Carga del restaurante por slug
- Sistema de temas dinámico del restaurante
- Navegación por categorías con smooth scroll
- Búsqueda en tiempo real de productos
- Filtrado por categoría
- Grid de productos responsive
- Lazy loading de imágenes
- Modal de detalle de producto
- Integración con CartContext
- Botón de WhatsApp flotante
- Footer con información del restaurante

#### CartSidebar (`components/public/CartSidebar.tsx`)

**Funcionalidad**:
- Sidebar flotante del lado derecho
- Lista de productos en el carrito
- Mostrar variaciones e ingredientes
- Editar cantidades inline
- Eliminar productos
- Cálculo de subtotal y total
- Botón de checkout
- Animaciones de entrada/salida
- Badge con contador de items

#### CheckoutModal (`components/public/CheckoutModal.tsx`)

**Funcionalidad avanzada**:
- Modal elegante y moderno
- Formulario de datos del cliente
- Selector de tipo de pedido
- Autocompletado de dirección
- Selector de ciudades colombianas
- Cálculo automático de delivery
- Validación de formulario en tiempo real
- Preview del pedido
- Cálculo de totales
- Generación de mensaje de WhatsApp formateado
- Toast notifications personalizadas con colores del tema
- Redirección a WhatsApp
- Guardar pedido en Supabase

**Toast Personalizado**:
El componente ahora utiliza los colores del tema del restaurante para las notificaciones:
- `primaryColor` como fondo
- `secondaryTextColor` para iconos y texto
- Diseño responsive optimizado para móvil
- Cierre automático configurable

#### ProductDetail (`components/public/ProductDetail.tsx`)

**Funcionalidad**:
- Modal de detalle completo
- Galería de imágenes con navegación
- Descripción detallada
- Selector de variaciones
- Selector de ingredientes opcionales
- Campo de notas especiales
- Selector de cantidad
- Cálculo de precio total
- Badges de featured, dietético, picante
- Tiempo de preparación
- Botón "Agregar al carrito"

### Restaurant Management Components

#### ProductForm (`components/restaurant/ProductForm.tsx`)

**Funcionalidad completa**:
- Formulario multi-step
- Información básica (nombre, descripción, categoría)
- Gestión de imágenes (hasta 5 URLs)
- Preview de imágenes
- Gestión de variaciones (nombre, precio, default)
- Gestión de ingredientes opcionales
- Restricciones dietéticas (checkbox múltiple)
- Nivel de picante (selector visual)
- Tiempo de preparación
- SKU opcional
- Estado (activo/inactivo)
- Destacado (featured)
- Disponibilidad
- Validación completa
- Modo creación/edición

#### OrderProductSelector (`components/restaurant/OrderProductSelector.tsx`)

**Funcionalidad**:
- Modal de selección de productos para pedidos
- Búsqueda y filtrado
- Vista de productos con imágenes
- Selector de variaciones
- Selector de cantidad
- Agregar múltiples productos
- Vista previa del pedido
- Cálculo de totales

#### TutorialModal (`components/restaurant/TutorialModal.tsx`)

**Funcionalidad**:
- Tutorial paso a paso
- Navegación entre pasos
- Progreso visual
- Imágenes y videos
- Marcar como completado
- Skip tutorial
- Volver a ver

### UI Components

#### Toast (`components/ui/Toast.tsx`)

**Funcionalidad mejorada**:
- Sistema de notificaciones temporales
- 4 tipos: success, warning, error, info
- Colores personalizables por tema
- Diseño responsive para móvil
- Auto-close configurable
- Animaciones de entrada/salida
- Iconos contextuales
- Botón de cierre manual

**Props**:
```typescript
interface ToastProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  customColors?: {
    primary?: string;
    secondary?: string;
  };
  onClose: () => void;
}
```

**Características responsive**:
- Texto más pequeño en móvil (text-xs)
- Iconos adaptados (w-4 h-4 en móvil, w-5 h-5 en desktop)
- Padding reducido en móvil
- Ancho completo en móvil con márgenes laterales
- Botón de cierre más pequeño en móvil

#### ConfirmDialog (`components/ui/ConfirmDialog.tsx`)

**Funcionalidad**:
- Diálogo de confirmación
- Título y mensaje personalizables
- Botones de confirmar/cancelar
- Variantes (danger, warning, info)
- Callback de confirmación

#### Badge (`components/ui/Badge.tsx`)

**Variantes**:
- success (verde)
- warning (amarillo)
- error (rojo)
- info (azul)
- gray (gris neutral)

#### Button (`components/ui/Button.tsx`)

**Variantes**:
- primary
- secondary
- outline
- ghost
- danger

**Tamaños**:
- sm
- md
- lg

#### Modal (`components/ui/Modal.tsx`)

**Funcionalidad**:
- Modal genérico responsive
- Overlay con click-outside
- Botón de cierre
- Tamaños configurables
- Animaciones

#### Input (`components/ui/Input.tsx`)

**Funcionalidad**:
- Input de formulario estilizado
- Label opcional
- Error message
- Disabled state
- Variantes de tipo (text, email, password, number, etc.)

---

## Tipos de Datos

### Interfaces Principales

**Usuario**:
```typescript
interface User {
  id: string;
  email: string;
  role: 'restaurant_owner' | 'super_admin';
  created_at: string;
  updated_at: string;
}
```

**Restaurante**:
```typescript
interface Restaurant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
  owner_name?: string;
  owner_id: string;
  is_active: boolean;
  settings: RestaurantSettings;
  created_at: string;
  updated_at: string;
}

interface RestaurantSettings {
  theme: {
    color_scheme: 'light' | 'dark';
    primary_color: string;
    secondary_color: string;
    text_color: string;
    secondary_text_color: string;
  };
  language: 'es' | 'en';
  currency: string;
  business_hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  order_types: {
    pickup: boolean;
    delivery: boolean;
    table: boolean;
  };
  delivery_zones?: {
    city: string;
    cost: number;
  }[];
}
```

**Producto**:
```typescript
interface Product {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string;
  images: string[];
  variations: ProductVariation[];
  ingredients?: ProductIngredient[];
  dietary_restrictions?: string[];
  spice_level?: number;
  preparation_time?: string;
  status: 'active' | 'inactive';
  sku?: string;
  is_available: boolean;
  is_featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface ProductVariation {
  id: string;
  name: string;
  price: number;
  is_default?: boolean;
}

interface ProductIngredient {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}
```

**Categoría**:
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  restaurant_id: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**Pedido**:
```typescript
interface Order {
  id: string;
  restaurant_id: string;
  order_number: string;
  customer: Customer;
  items: OrderItem[];
  order_type: 'pickup' | 'delivery' | 'table';
  delivery_address?: string;
  table_number?: string;
  delivery_cost?: number;
  subtotal: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  estimated_time?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  variation: ProductVariation;
  ingredients?: ProductIngredient[];
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}
```

**Suscripción**:
```typescript
interface Subscription {
  id: string;
  restaurant_id: string;
  plan_type: 'free' | 'basic' | 'pro' | 'business';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  features: {
    max_products: number; // -1 = ilimitado
    max_categories: number;
    analytics: boolean;
    custom_domain: boolean;
    priority_support: boolean;
    advanced_customization: boolean;
    api_access?: boolean;
    white_label?: boolean;
  };
}
```

**Ver todas las interfaces**: `src/types/index.ts`

---

## Sistema de Facturación POS

### Características del Sistema POS

PLATYO incluye un sistema completo de facturación tipo POS (Point of Sale) optimizado para impresoras térmicas de 80mm. Este sistema permite a los restaurantes imprimir recibos profesionales para cada pedido.

### Componente POSInvoice

**Ubicación**: Integrado en `OrdersManagement.tsx`

**Funcionalidad**:

1. **Generación de Factura**
   - Formato tipo recibo térmico
   - Ancho optimizado para 80mm
   - Compatible con impresoras térmicas estándar
   - Responsive para preview en pantalla

2. **Contenido de la Factura**
   ```
   +----------------------------------+
   |           [LOGO]                 |
   |      NOMBRE DEL RESTAURANTE      |
   |        Dirección completa        |
   |      Teléfono: 123-456-7890      |
   |      Email: email@ejemplo.com    |
   +----------------------------------+
   |           FACTURA POS            |
   +----------------------------------+
   | Pedido #: ORD-12345              |
   | Fecha: 09/11/2024 14:30:00       |
   | Tipo: Delivery                    |
   | Estado: Confirmado                |
   +----------------------------------+
   |        INFORMACIÓN CLIENTE       |
   +----------------------------------+
   | Nombre: Juan Pérez               |
   | Teléfono: 3001234567             |
   | Dirección: Calle 123 #45-67      |
   +----------------------------------+
   |          DETALLE PEDIDO          |
   +----------------------------------+
   | 2x Pizza Grande         $30,000  |
   |    - Extra queso        $ 4,000  |
   |    Notas: Sin cebolla            |
   |                                  |
   | 1x Coca Cola            $ 3,000  |
   +----------------------------------+
   | Subtotal:              $37,000   |
   | Delivery:              $ 5,000   |
   | TOTAL:                 $42,000   |
   +----------------------------------+
   |    ¡Gracias por tu pedido!       |
   |      www.turestaurante.com       |
   +----------------------------------+
   ```

3. **Secciones de la Factura**:
   - **Header**: Logo y datos del restaurante
   - **Información del pedido**: Número, fecha, tipo, estado
   - **Datos del cliente**: Nombre, teléfono, dirección (si aplica)
   - **Detalle de productos**:
     - Cantidad y nombre del producto
     - Variación seleccionada
     - Ingredientes opcionales con precio
     - Notas especiales
     - Precio unitario y total por ítem
   - **Totales**:
     - Subtotal de productos
     - Costo de delivery (si aplica)
     - Total general
   - **Footer**: Mensaje de agradecimiento y URL

4. **Características Técnicas**:
   - Fuente monoespaciada para alineación perfecta
   - Tamaño de fuente ajustable
   - Separadores visuales claros
   - Formato de moneda localizado
   - Formato de fecha/hora legible
   - Badges de estado coloridos

5. **Proceso de Impresión**:
   ```typescript
   const handlePrintInvoice = (order: Order) => {
     setSelectedOrder(order);
     setShowInvoice(true);

     // Espera a que el componente se renderice
     setTimeout(() => {
       window.print();
     }, 100);
   };
   ```

6. **Estilos de Impresión**:
   ```css
   @media print {
     @page {
       size: 80mm auto;
       margin: 0;
     }

     body {
       width: 80mm;
     }

     .no-print {
       display: none;
     }
   }
   ```

### Uso del Sistema POS

1. **Desde OrdersManagement**:
   - El owner ve la lista de pedidos
   - Cada pedido tiene un botón "Imprimir Factura"
   - Al hacer clic, se muestra la vista previa
   - La ventana de impresión se abre automáticamente

2. **Vista Previa**:
   - Modal con el formato exacto de la factura
   - Botón para imprimir manualmente
   - Botón para cerrar sin imprimir

3. **Configuración de Impresora**:
   - Compatible con impresoras térmicas de 80mm
   - Configurar como impresora predeterminada
   - Sin márgenes (margin: 0)
   - Tamaño de página: 80mm x auto

### Personalización

El sistema POS respeta la configuración del restaurante:
- Logo personalizado
- Colores del tema (en pantalla)
- Información de contacto
- Mensaje personalizado en footer
- Formato de moneda según configuración

---

## Sistema de Notificaciones

### useToast Hook

**Ubicación**: `src/hooks/useToast.tsx`

**Funcionalidad**:
```typescript
const { showToast } = useToast();

showToast({
  type: 'success',
  title: 'Éxito',
  message: 'El producto se guardó correctamente',
  duration: 3000,
  customColors: {
    primary: '#10b981',
    secondary: '#ffffff'
  }
});
```

**Tipos de Toast**:
- `success`: Operaciones exitosas (verde)
- `warning`: Advertencias (amarillo)
- `error`: Errores (rojo)
- `info`: Información (azul)

**Features**:
- Auto-close configurable
- Cierre manual con botón X
- Colores personalizables por tema del restaurante
- Animaciones suaves
- Posición fija en top-right
- Stack de múltiples toasts
- Responsive (adaptado a móvil)

### Integración con Temas

El sistema de toast está completamente integrado con el sistema de temas:

```typescript
// En CheckoutModal.tsx
showToast({
  type: 'warning',
  title: t('orderSent'),
  message: t('checkWhatsApp'),
  customColors: {
    primary: restaurant.settings?.theme?.primary_color,
    secondary: restaurant.settings?.theme?.secondary_text_color
  }
});
```

Esto asegura que las notificaciones mantengan la identidad visual del restaurante.

---

## Guía de Edición

### Cómo Agregar una Nueva Página

1. **Crear el archivo de la página**:
```typescript
// src/pages/restaurant/NuevaPagina.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

export const NuevaPagina: React.FC = () => {
  const { user, restaurant } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Cargar datos de Supabase
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('titulo')}</h1>
      {/* Tu contenido aquí */}
    </div>
  );
};
```

2. **Agregar ruta en DashboardPage**:
```typescript
// src/pages/DashboardPage.tsx
import { NuevaPagina } from './restaurant/NuevaPagina';

// En renderContent
case 'nueva-pagina':
  return <NuevaPagina />;
```

3. **Agregar tab en Sidebar**:
```typescript
// src/components/layout/Sidebar.tsx
import { NuevoIcono } from 'lucide-react';

const restaurantTabs = [
  // ... tabs existentes
  {
    id: 'nueva-pagina',
    name: t('nuevaPagina'),
    icon: NuevoIcono
  },
];
```

4. **Agregar traducciones**:
```typescript
// src/utils/translations.ts
const translations = {
  es: {
    nuevaPagina: 'Nueva Página',
    titulo: 'Título de la Página',
  },
  en: {
    nuevaPagina: 'New Page',
    titulo: 'Page Title',
  },
};
```

### Cómo Agregar un Nuevo Campo a una Tabla

1. **Crear migración de Supabase**:
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_new_field.sql
/*
  # Agregar nuevo campo a products

  1. Cambios
    - Agregar columna `nuevo_campo` a tabla `products`
*/

ALTER TABLE products
ADD COLUMN IF NOT EXISTS nuevo_campo text;
```

2. **Actualizar interfaz TypeScript**:
```typescript
// src/types/index.ts
export interface Product {
  // ... campos existentes
  nuevo_campo?: string;
}
```

3. **Actualizar formulario**:
```typescript
// src/components/restaurant/ProductForm.tsx
<Input
  label={t('nuevoCampo')}
  value={formData.nuevo_campo || ''}
  onChange={(e) => setFormData({
    ...formData,
    nuevo_campo: e.target.value
  })}
/>
```

4. **Actualizar query de Supabase**:
```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    ...productData,
    nuevo_campo: formData.nuevo_campo
  });
```

### Cómo Crear una Nueva Tabla

1. **Crear migración**:
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_nueva_tabla.sql
/*
  # Crear tabla nueva_tabla

  1. Nueva Tabla
    - `nueva_tabla`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `campo1` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for restaurant owners
*/

CREATE TABLE IF NOT EXISTS nueva_tabla (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  campo1 text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nueva_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can view own data"
  ON nueva_tabla FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can insert own data"
  ON nueva_tabla FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants
      WHERE owner_id = auth.uid()
    )
  );

CREATE INDEX idx_nueva_tabla_restaurant
ON nueva_tabla(restaurant_id);
```

2. **Crear interfaz TypeScript**:
```typescript
// src/types/index.ts
export interface NuevaTabla {
  id: string;
  restaurant_id: string;
  campo1: string;
  created_at: string;
}
```

3. **Crear funciones de consulta**:
```typescript
// En tu componente o archivo de utilidades
const loadNuevaTabla = async (restaurantId: string) => {
  const { data, error } = await supabase
    .from('nueva_tabla')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading data:', error);
    return [];
  }

  return data;
};

const createNuevaTabla = async (newData: Partial<NuevaTabla>) => {
  const { data, error } = await supabase
    .from('nueva_tabla')
    .insert(newData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};
```

### Cómo Modificar el Sistema de Temas

1. **Agregar nuevo color predefinido**:
```typescript
// src/utils/themeUtils.ts
export const predefinedColors = [
  // ... colores existentes
  {
    name: 'Purple',
    primary: '#9333ea',
    secondary: '#a855f7',
    text: '#1f2937',
    secondaryText: '#6b7280'
  },
];
```

2. **Agregar nueva propiedad de tema**:
```typescript
// src/types/index.ts
interface ThemeSettings {
  // ... propiedades existentes
  nueva_propiedad: string;
}
```

3. **Actualizar RestaurantSettings**:
```typescript
// En RestaurantSettings.tsx
const handleSaveTheme = async () => {
  const updatedSettings = {
    ...restaurant.settings,
    theme: {
      ...themeSettings,
      nueva_propiedad: nuevoValor
    }
  };

  const { error } = await supabase
    .from('restaurants')
    .update({ settings: updatedSettings })
    .eq('id', restaurant.id);
};
```

### Cómo Agregar una Nueva Traducción

```typescript
// src/utils/translations.ts
const translations = {
  es: {
    // ... traducciones existentes
    nuevaClave: 'Nuevo Texto en Español',
    conParametros: 'Hola {name}, tienes {count} mensajes',
  },
  en: {
    // ... traducciones existentes
    nuevaClave: 'New Text in English',
    conParametros: 'Hello {name}, you have {count} messages',
  }
};

// Uso con parámetros (si implementas esta funcionalidad)
const message = t('conParametros')
  .replace('{name}', userName)
  .replace('{count}', messageCount);
```

### Cómo Personalizar Estilos Globales

1. **Agregar colores personalizados**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#3b82f6',
        'brand-secondary': '#8b5cf6',
      }
    }
  }
}
```

2. **Agregar animaciones personalizadas**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      }
    }
  }
}
```

3. **Usar en componentes**:
```jsx
<div className="bg-brand-primary animate-slide-in">
  Contenido
</div>
```

---

## Flujos de Usuario

### Flujo de Registro Completo

1. Usuario accede a `/login`
2. Clic en "Registrarse"
3. Formulario de registro:
   - Email (validación en tiempo real)
   - Contraseña (mínimo 8 caracteres)
   - Confirmar contraseña
   - Nombre del restaurante
   - Teléfono
   - Dirección
   - Nombre del propietario
   - Aceptar términos y condiciones
4. Sistema ejecuta:
   ```typescript
   // Crear usuario en Supabase Auth
   const { data: authData, error: authError } =
     await supabase.auth.signUp({
       email,
       password,
     });

   // Crear registro de usuario
   await supabase.from('users').insert({
     id: authData.user.id,
     email,
     role: 'restaurant_owner'
   });

   // Crear restaurante con slug único
   const slug = generateSlug(restaurantName);
   await supabase.from('restaurants').insert({
     name: restaurantName,
     slug,
     owner_id: authData.user.id,
     phone,
     address,
     owner_name,
     is_active: true
   });

   // Crear suscripción gratuita
   await supabase.from('subscriptions').insert({
     restaurant_id: restaurantId,
     plan_type: 'free',
     status: 'active',
     start_date: new Date(),
     end_date: addMonths(new Date(), 1),
     auto_renew: false
   });
   ```
5. Email de confirmación (si está activado)
6. Redirect a `/login` para iniciar sesión

### Flujo de Login

1. Usuario ingresa email y password
2. Sistema ejecuta:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password
   });
   ```
3. Si es exitoso, carga datos del usuario:
   ```typescript
   const { data: userData } = await supabase
     .from('users')
     .select('*')
     .eq('id', data.user.id)
     .single();
   ```
4. Si es `restaurant_owner`, carga restaurante y suscripción:
   ```typescript
   const { data: restaurantData } = await supabase
     .from('restaurants')
     .select('*')
     .eq('owner_id', userData.id)
     .single();

   const { data: subscriptionData } = await supabase
     .from('subscriptions')
     .select('*')
     .eq('restaurant_id', restaurantData.id)
     .eq('status', 'active')
     .single();
   ```
5. Guarda sesión en AuthContext
6. Redirect a `/dashboard`

### Flujo de Creación de Producto

1. Restaurant owner accede a "Menú"
2. Clic en "Nuevo Producto"
3. Sistema verifica límite del plan:
   ```typescript
   const productCount = await getProductCount(restaurant.id);
   const limit = subscription.plan_type === 'free' ? 10 :
                 subscription.plan_type === 'basic' ? 50 :
                 subscription.plan_type === 'pro' ? 200 : -1;

   if (limit !== -1 && productCount >= limit) {
     showToast({
       type: 'warning',
       title: 'Límite alcanzado',
       message: 'Upgrade tu plan para más productos'
     });
     return;
   }
   ```
4. Muestra ProductForm
5. Usuario completa:
   - Información básica
   - Imágenes (hasta 5 URLs)
   - Variaciones (al menos una)
   - Ingredientes opcionales
   - Configuraciones adicionales
6. Validación:
   ```typescript
   if (!name || !description || !category_id) {
     showError('Completa todos los campos requeridos');
     return;
   }

   if (variations.length === 0) {
     showError('Agrega al menos una variación');
     return;
   }
   ```
7. Guardar en Supabase:
   ```typescript
   const { data, error } = await supabase
     .from('products')
     .insert({
       restaurant_id: restaurant.id,
       name,
       description,
       category_id,
       images,
       variations,
       ingredients,
       // ... más campos
     })
     .select()
     .single();
   ```
8. Toast de éxito
9. Actualiza lista de productos

### Flujo de Pedido Público

1. Cliente accede a `/:slug`
2. Sistema carga restaurante:
   ```typescript
   const { data: restaurant } = await supabase
     .from('restaurants')
     .select('*')
     .eq('slug', slug)
     .eq('is_active', true)
     .single();
   ```
3. Carga categorías y productos activos:
   ```typescript
   const { data: categories } = await supabase
     .from('categories')
     .select('*')
     .eq('restaurant_id', restaurant.id)
     .eq('is_active', true)
     .order('order_index');

   const { data: products } = await supabase
     .from('products')
     .select('*')
     .eq('restaurant_id', restaurant.id)
     .eq('status', 'active')
     .eq('is_available', true)
     .order('order_index');
   ```
4. Aplica tema del restaurante:
   ```typescript
   document.documentElement.style.setProperty(
     '--primary-color',
     restaurant.settings.theme.primary_color
   );
   ```
5. Cliente navega y agrega productos:
   ```typescript
   addItem(product, variation, quantity, notes, ingredients);
   ```
6. Revisa carrito en CartSidebar
7. Clic en "Checkout"
8. Completa CheckoutModal:
   - Nombre, teléfono, email
   - Tipo de pedido
   - Dirección (si delivery)
   - Ciudad (para calcular delivery)
   - Instrucciones especiales
9. Sistema calcula total:
   ```typescript
   const subtotal = cart.reduce((sum, item) => {
     const itemTotal = item.variation.price * item.quantity;
     const ingredientsTotal = item.ingredients.reduce(
       (sum, ing) => sum + ing.price * item.quantity,
       0
     );
     return sum + itemTotal + ingredientsTotal;
   }, 0);

   const deliveryCost = orderType === 'delivery'
     ? getDeliveryCost(city)
     : 0;

   const total = subtotal + deliveryCost;
   ```
10. Genera pedido:
    ```typescript
    const orderNumber = `ORD-${Date.now()}`;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.id,
        order_number: orderNumber,
        customer: { name, phone, email },
        items: cartItems,
        order_type: orderType,
        delivery_address: address,
        delivery_cost: deliveryCost,
        subtotal,
        total,
        status: 'pending',
        special_instructions: instructions
      })
      .select()
      .single();
    ```
11. Genera mensaje de WhatsApp:
    ```typescript
    const message = `
    🍽️ *Nuevo Pedido #${orderNumber}*

    📋 *Cliente:*
    - Nombre: ${customer.name}
    - Teléfono: ${customer.phone}

    📦 *Pedido:*
    ${items.map(item => `
    - ${item.quantity}x ${item.product_name}
      ${item.variation.name} - ${formatCurrency(item.total_price)}
      ${item.notes ? `Notas: ${item.notes}` : ''}
    `).join('\n')}

    💰 *Total: ${formatCurrency(total)}*

    📍 *Entrega: ${orderType === 'delivery' ? address : 'Recoger en local'}*
    `;

    const whatsappUrl = `https://wa.me/${restaurant.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    ```
12. Toast de confirmación con colores del tema
13. Limpia carrito
14. Cierra modal

### Flujo de Gestión de Pedidos

1. Restaurant owner accede a "Pedidos"
2. Carga pedidos en tiempo real:
   ```typescript
   const { data: orders } = await supabase
     .from('orders')
     .select('*')
     .eq('restaurant_id', restaurant.id)
     .order('created_at', { ascending: false });

   // Suscripción a cambios en tiempo real
   const subscription = supabase
     .channel('orders')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'orders',
       filter: `restaurant_id=eq.${restaurant.id}`
     }, payload => {
       // Actualizar lista de pedidos
       handleOrderUpdate(payload);
     })
     .subscribe();
   ```
3. Vista tipo kanban con columnas por estado
4. Cambiar estado de pedido:
   ```typescript
   const updateOrderStatus = async (orderId: string, newStatus: string) => {
     const { error } = await supabase
       .from('orders')
       .update({
         status: newStatus,
         updated_at: new Date()
       })
       .eq('id', orderId);

     if (error) {
       showToast({
         type: 'error',
         title: 'Error',
         message: 'No se pudo actualizar el estado'
       });
       return;
     }

     showToast({
       type: 'success',
       title: 'Estado actualizado',
       message: `Pedido marcado como ${newStatus}`
     });
   };
   ```
5. Ver detalles completos del pedido
6. Imprimir factura POS:
   - Generar vista de factura
   - Abrir diálogo de impresión
   - Enviar a impresora térmica
7. Contactar cliente vía WhatsApp
8. Filtrar pedidos por:
   - Estado
   - Fecha
   - Tipo de pedido
   - Búsqueda por número o cliente

### Flujo de Cambio de Suscripción

1. Restaurant owner accede a "Suscripción"
2. Ve plan actual con features desbloqueadas
3. Compara planes disponibles
4. Selecciona nuevo plan
5. Sistema valida límites:
   ```typescript
   const validateUpgrade = async (newPlan: string) => {
     const productCount = await getProductCount(restaurant.id);
     const categoryCount = await getCategoryCount(restaurant.id);

     const limits = getPlanLimits(newPlan);

     if (limits.max_products !== -1 &&
         productCount > limits.max_products) {
       showError(
         `Tienes ${productCount} productos. ` +
         `El plan ${newPlan} permite máximo ${limits.max_products}`
       );
       return false;
     }

     if (limits.max_categories !== -1 &&
         categoryCount > limits.max_categories) {
       showError(
         `Tienes ${categoryCount} categorías. ` +
         `El plan ${newPlan} permite máximo ${limits.max_categories}`
       );
       return false;
     }

     return true;
   };
   ```
6. Confirma cambio
7. Sistema actualiza suscripción:
   ```typescript
   const upgradePlan = async (newPlanType: string) => {
     const { error } = await supabase
       .from('subscriptions')
       .update({
         plan_type: newPlanType,
         status: 'active',
         start_date: new Date(),
         end_date: addMonths(new Date(), 1),
         updated_at: new Date()
       })
       .eq('restaurant_id', restaurant.id)
       .eq('status', 'active');

     if (error) {
       throw error;
     }
   };
   ```
8. Toast de éxito
9. Recarga datos del contexto
10. Features se desbloquean inmediatamente

### Flujo de Impresión de Factura POS

1. En OrdersManagement, owner selecciona un pedido
2. Clic en "Imprimir Factura"
3. Sistema genera vista de factura:
   ```typescript
   const generateInvoice = (order: Order) => {
     return (
       <div className="pos-invoice">
         {/* Header con logo */}
         <div className="invoice-header">
           {restaurant.logo && <img src={restaurant.logo} />}
           <h2>{restaurant.name}</h2>
           <p>{restaurant.address}</p>
           <p>{restaurant.phone}</p>
         </div>

         {/* Información del pedido */}
         <div className="invoice-info">
           <p>Pedido: {order.order_number}</p>
           <p>Fecha: {formatDate(order.created_at)}</p>
           <p>Tipo: {order.order_type}</p>
         </div>

         {/* Cliente */}
         <div className="customer-info">
           <p>Cliente: {order.customer.name}</p>
           <p>Teléfono: {order.customer.phone}</p>
         </div>

         {/* Items */}
         <div className="items">
           {order.items.map(item => (
             <div key={item.product_id}>
               <p>
                 {item.quantity}x {item.product_name}
                 <span>{formatCurrency(item.total_price)}</span>
               </p>
               <p className="variation">
                 {item.variation.name}
               </p>
               {item.ingredients?.map(ing => (
                 <p className="ingredient">
                   - {ing.name}
                   <span>{formatCurrency(ing.price)}</span>
                 </p>
               ))}
             </div>
           ))}
         </div>

         {/* Totales */}
         <div className="totals">
           <p>Subtotal: {formatCurrency(order.subtotal)}</p>
           {order.delivery_cost > 0 && (
             <p>Delivery: {formatCurrency(order.delivery_cost)}</p>
           )}
           <p className="total">
             TOTAL: {formatCurrency(order.total)}
           </p>
         </div>

         {/* Footer */}
         <div className="footer">
           <p>¡Gracias por tu pedido!</p>
         </div>
       </div>
     );
   };
   ```
4. Muestra modal con vista previa
5. Llama a `window.print()`
6. Navegador abre diálogo de impresión
7. Usuario selecciona impresora térmica
8. Configuración de página:
   - Tamaño: 80mm x auto
   - Márgenes: 0
   - Sin headers/footers
9. Imprime recibo
10. Cierra modal

---

## Notas Importantes

### Seguridad

1. **Row Level Security (RLS)**:
   - Todas las tablas tienen RLS habilitado
   - Políticas estrictas por rol
   - Los owners solo ven sus datos
   - Super admins tienen acceso completo

2. **Autenticación**:
   - Uso de Supabase Auth
   - JWT tokens seguros
   - Sesiones con expiración
   - Logout completo limpia estado

3. **Validación de Datos**:
   - Frontend: validación en tiempo real
   - Backend: constraints de base de datos
   - Sanitización de inputs
   - Prevención de SQL injection (Supabase lo maneja)

### Performance

1. **Optimizaciones**:
   - Lazy loading de imágenes
   - Paginación en listas grandes
   - Índices en columnas clave
   - Real-time solo donde es necesario
   - Debouncing en búsquedas

2. **Caching**:
   - Datos de restaurante en Context
   - CartContext en localStorage
   - Configuración de idioma en localStorage

### Escalabilidad

1. **Base de Datos**:
   - PostgreSQL escala verticalmente
   - Índices optimizados
   - Queries eficientes con select específicos
   - Foreign keys con ON DELETE CASCADE

2. **Frontend**:
   - Code splitting preparado
   - Lazy loading de rutas preparado
   - Componentes reutilizables
   - State management escalable

### Mantenimiento

1. **Migraciones**:
   - Todas documentadas
   - Versionadas con timestamp
   - Reversibles cuando sea posible
   - Con comentarios explicativos

2. **Código**:
   - TypeScript para type safety
   - ESLint configurado
   - Patrones consistentes
   - Comentarios en funciones complejas

### Limitaciones Conocidas

1. **Imágenes**:
   - Solo URLs, no hay upload directo
   - No hay optimización automática
   - No hay CDN integrado
   - Sugerencia: usar servicios externos como Cloudinary

2. **Pagos**:
   - Sistema de pagos simulado
   - No hay integración real con pasarelas
   - Preparado para integrar Stripe o similar

3. **Notificaciones**:
   - No hay email/SMS automáticos
   - WhatsApp manual (no API)
   - Preparado para integrar servicios de notificación

4. **Reportes**:
   - Exportación no implementada
   - Gráficos básicos
   - Preparado para librerías como Chart.js

### Roadmap Futuro

1. **Corto Plazo**:
   - Upload de imágenes a Supabase Storage
   - Integración con pasarela de pagos
   - Email notifications con Supabase Edge Functions
   - Exportación de reportes (PDF, Excel)

2. **Mediano Plazo**:
   - App móvil nativa
   - WhatsApp Business API
   - Sistema de loyalty/puntos
   - Multi-sucursales
   - Inventario y stock

3. **Largo Plazo**:
   - Integración con deliverys (Rappi, UberEats)
   - IA para recomendaciones
   - Sistema de reservas
   - CRM completo
   - API pública para integraciones

---

## Mejores Prácticas

### Desarrollo

1. **TypeScript**:
   - Definir interfaces para todos los datos
   - Evitar `any`
   - Usar tipos estrictos
   - Documentar tipos complejos

2. **Componentes**:
   - Un componente = una responsabilidad
   - Props tipadas
   - Reutilización máxima
   - Nombres descriptivos

3. **Estado**:
   - Context para estado global
   - useState para estado local
   - No duplicar estado
   - Limpiar suscripciones

4. **Base de Datos**:
   - Usar RLS siempre
   - Índices en FK y campos de búsqueda
   - Validar datos antes de guardar
   - Manejar errores apropiadamente

5. **Estilos**:
   - Tailwind para consistencia
   - Responsive mobile-first
   - Reutilizar clases en variables
   - Seguir sistema de diseño

### Testing (Recomendado)

1. **Unit Tests**:
   - Funciones utilitarias
   - Cálculos de totales
   - Formateo de datos

2. **Integration Tests**:
   - Flujos de usuario completos
   - Integración con Supabase

3. **E2E Tests**:
   - Registro y login
   - Creación de productos
   - Proceso de pedido
   - Cambio de suscripción

### Deployment

1. **Variables de Entorno**:
   ```env
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxx...
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Hosting**:
   - Vercel (recomendado)
   - Netlify
   - Supabase Hosting
   - Cualquier hosting de SPA


---

## Soporte y Contacto

### Documentación Adicional

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs

### Recursos del Proyecto

- **Repositorio**: [Link al repo]
- **Demo**: [Link a demo]
- **Issues**: [Link a issues]

### Consideraciones Finales

Este sistema está diseñado para ser:
- **Escalable**: Crece con tu negocio
- **Mantenible**: Código limpio y documentado
- **Seguro**: RLS y validaciones en todos los niveles
- **Performante**: Optimizado para velocidad
- **User-friendly**: Interfaz intuitiva y responsive

Para preguntas, sugerencias o reportar bugs, por favor usa el sistema de issues del repositorio o contacta al equipo de desarrollo.

---

**Última actualización**: Enero 2026
**Versión**: 3.0.0
**Autor**: Equipo PLATYO - Digital Fenix Pro
**Licencia**: Propietaria
**Email**: admin@digitalfenixpro.com
