// Translation system for the restaurant management app
export type Language = 'es' | 'en';

interface Translations {
  // Common
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  create: string;
  update: string;
  loading: string;
  search: string;
  filter: string;
  actions: string;
  status: string;
  date: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  total: string;
  subtotal: string;
  yes: string;
  no: string;
  close: string;
  view: string;
  print: string;
  download: string;
  active: string;
  inactive: string;
  pending: string;
  confirmed: string;
  preparing: string;
  ready: string;
  delivered: string;
  cancelled: string;

  // Confirm Dialog - Defaults
  confirmDialogDefaultConfirm: string;
  confirmDialogDefaultCancel: string;
    
  // Navigation
  dashboard: string;
  categories: string;
  menu: string;
  orders: string;
  customers: string;
  subscription: string;
  settings: string;
  analytics: string;

  // Terms and Conditions
  termsSection1Title: string;
  termsSection1Content: string;
  termsSection2Title: string;
  termsSection2Content: string;
  termsSection2Item1: string;
  termsSection2Item2: string;
  termsSection2Item3: string;
  termsSection2Item4: string;
  termsSection2Item5: string;
  termsSection3Title: string;
  termsSection3Content: string;
  termsSection3Item1: string;
  termsSection3Item2: string;
  termsSection3Item3: string;
  termsSection3Item4: string;
  termsSection4Title: string;
  termsSection4Content: string;
  termsSection4Item1: string;
  termsSection4Item3: string;
  termsSection4Item4: string;
  termsSection5Title: string;
  termsSection5Content: string;
  termsSection5Item1: string;
  termsSection5Item2: string;
  termsSection5Item3: string;
  termsSection5Item4: string;
  termsSection5Item5: string;
  termsSection5Item6: string;
  termsSection6Title: string;
  termsSection6Content1: string;
  termsSection6Content2: string;
  termsSection7Title: string;
  termsSection7Content: string;
  termsSection7Item1: string;
  termsSection7Item2: string;
  termsSection7Item3: string;
  termsSection7Content2: string;
  termsSection8Title: string;
  termsSection8Content: string;
  termsSection8Item1: string;
  termsSection8Item2: string;
  termsSection8Item3: string;
  termsSection8Content2: string;
  termsSection9Title: string;
  termsSection9Content: string;
  termsSection9Item1: string;
  termsSection9Item2: string;
  termsSection9Item3: string;
  termsSection9Item4: string;
  termsSection10Title: string;
  termsSection10Content: string;
  termsSection10Item1: string;
  termsSection10Item2: string;
  termsSection10Item3: string;
  termsSection10Item4: string;
  termsSection11Title: string;
  termsSection11Content: string;
  termsSection12Title: string;
  termsSection12Content: string;
  termsSection13Title: string;
  termsSection13Item1Label: string;
  termsSection13Item1: string;
  termsSection13Item2Label: string;
  termsSection13Item2: string;
  termsSection13Item3Label: string;
  termsSection13Item3: string;
  termsSection13Item4Label: string;
  termsSection13Item4: string;
  termsSection14Title: string;
  termsSection14Content: string;
  termsSection14Item1: string;
  termsSection14Item2: string;
  termsLastUpdate: string;
  termsLastUpdateDate: string;
  termsAcceptDisclaimer: string;
  acceptTermsAndConditionsButton: string;
  
  // Auth Context Errors
  restaurantNotFoundForUser: string;
  noRestaurantAssigned: string;
  noAccountFoundWithEmail: string;
  passwordRecoveryRequest: string;
  passwordRecoveryMessage: string;
  userRole: string;
  requestDate: string;
  userWithoutRestaurant: string;
  noName: string;
  notAvailable: string;
  
  // Auth
  login: string;
  register: string;
  logout: string;
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  noAccount: string;
  restaurantName: string;
  ownerName: string;
  acceptTerms: string;
  backToLogin: string;
  demoAccounts: string;
  superadmin: string;
  restaurant: string;
  requestSent: string;
  requestInfo: string;
  requestResponse: string;
  recoverPassword: string;
  recoverPasswordInstructions: string;
  helpReactivateAccount: string;
  emailPlaceholder: string;
  sendRequest: string;
  requestSendError: string;

  // Register Form
  restaurantNameRequired: string;
  emailRequired: string;
  passwordRequired: string;
  mustAcceptTerms: string;
  registerError: string;
  contactEmail: string;
  restaurantAddress: string;
  minimumCharacters: string;
  repeatPassword: string;
  termsAndConditions: string;
  ofService: string;
  createAccount: string;
  termsModalTitle: string;
  restaurantNamePlaceholder: string;
  ownerNamePlaceholder: string;
  contactEmailPlaceholder: string;
  phonePlaceholder: string;
  addressPlaceholder: string;

  // Change Password Modal
  changePasswordRequired: string;
  provisionalPasswordDetected: string;
  securityPasswordChange: string;
  newPassword: string;
  confirmNewPassword: string;
  changePassword: string;
  writePasswordAgain: string;
  
  // Dashboard
  totalProducts: string;
  activeProducts: string;
  todayOrders: string;
  totalSales: string;
  recentOrders: string;
  restaurantStatus: string;
  lastUpdate: string;
  noOrdersYet: string;
  ordersWillAppear: string;

  // Tutorial Modal
  tutorialStepOf: string;
  tutorialStepByStepInstructions: string;
  tutorialImportantInfo: string;
  tutorialPrevious: string;
  tutorialNext: string;
  tutorialFinish: string;
  tutorialGoToStep: string;
  
  // Tutorial Steps Titles
  tutorialStep1Title: string;
  tutorialStep2Title: string;
  tutorialStep3Title: string;
  tutorialStep4Title: string;
  tutorialStep5Title: string;
  tutorialStep6Title: string;
  tutorialStep7Title: string;
  tutorialStep8Title: string;
  
  // Tutorial Steps Descriptions
  tutorialStep1Description: string;
  tutorialStep2Description: string;
  tutorialStep3Description: string;
  tutorialStep4Description: string;
  tutorialStep5Description: string;
  tutorialStep6Description: string;
  tutorialStep7Description: string;
  tutorialStep8Description: string;
  
  // Step 1: Categories
  tutorialStep1Item1: string;
  tutorialStep1Item2: string;
  tutorialStep1Item3: string;
  tutorialStep1Item4: string;
  tutorialStep1Item5: string;
  tutorialStep1Item6: string;
  tutorialStep1Detail1: string;
  tutorialStep1Detail2: string;
  tutorialStep1Detail3: string;
  tutorialStep1Detail4: string;
  tutorialStep1Detail5: string;
  tutorialStep1Image: string;
  
  // Step 2: Products
  tutorialStep2Item1: string;
  tutorialStep2Item2: string;
  tutorialStep2Item3: string;
  tutorialStep2Item4: string;
  tutorialStep2Item5: string;
  tutorialStep2Item6: string;
  tutorialStep2Item7: string;
  tutorialStep2Item8: string;
  tutorialStep2Item9: string;
  tutorialStep2Item10: string;
  tutorialStep2Detail1: string;
  tutorialStep2Detail2: string;
  tutorialStep2Detail3: string;
  tutorialStep2Detail4: string;
  tutorialStep2Detail5: string;
  tutorialStep2Detail6: string;
  tutorialStep2Image: string;
  
  // Step 3: Menu Configuration
  tutorialStep3Item1: string;
  tutorialStep3Item2: string;
  tutorialStep3Item3: string;
  tutorialStep3Item4: string;
  tutorialStep3Item5: string;
  tutorialStep3Item6: string;
  tutorialStep3Item7: string;
  tutorialStep3Item8: string;
  tutorialStep3Item9: string;
  tutorialStep3Item10: string;
  tutorialStep3Item11: string;
  tutorialStep3Item12: string;
  tutorialStep3Item13: string;
  tutorialStep3Item14: string;
  tutorialStep3Item15: string;
  tutorialStep3Item16: string;
  tutorialStep3Item17: string;
  tutorialStep3Detail1: string;
  tutorialStep3Detail2: string;
  tutorialStep3Detail3: string;
  tutorialStep3Detail4: string;
  tutorialStep3Detail5: string;
  tutorialStep3Detail6: string;
  tutorialStep3Detail7: string;
  tutorialStep3Image: string;
  
  // Step 4: Orders Management
  tutorialStep4Item1: string;
  tutorialStep4Item2: string;
  tutorialStep4Item3: string;
  tutorialStep4Item4: string;
  tutorialStep4Item5: string;
  tutorialStep4Item6: string;
  tutorialStep4Item7: string;
  tutorialStep4Item8: string;
  tutorialStep4Item9: string;
  tutorialStep4Item10: string;
  tutorialStep4Item11: string;
  tutorialStep4Item12: string;
  tutorialStep4Item13: string;
  tutorialStep4Item14: string;
  tutorialStep4Item15: string;
  tutorialStep4Item16: string;
  tutorialStep4Item17: string;
  tutorialStep4Item18: string;
  tutorialStep4Item19: string;
  tutorialStep4Detail1: string;
  tutorialStep4Detail2: string;
  tutorialStep4Detail3: string;
  tutorialStep4Detail4: string;
  tutorialStep4Detail5: string;
  tutorialStep4Detail6: string;
  tutorialStep4Detail7: string;
  tutorialStep4Image: string;
  
  // Step 5: Public Menu
  tutorialStep5Item1: string;
  tutorialStep5Item2: string;
  tutorialStep5Item3: string;
  tutorialStep5Item4: string;
  tutorialStep5Item5: string;
  tutorialStep5Item6: string;
  tutorialStep5Item7: string;
  tutorialStep5Item8: string;
  tutorialStep5Item9: string;
  tutorialStep5Item10: string;
  tutorialStep5Item11: string;
  tutorialStep5Item12: string;
  tutorialStep5Item13: string;
  tutorialStep5Item14: string;
  tutorialStep5Item15: string;
  tutorialStep5Detail1: string;
  tutorialStep5Detail2: string;
  tutorialStep5Detail3: string;
  tutorialStep5Detail4: string;
  tutorialStep5Detail5: string;
  tutorialStep5Detail6: string;
  tutorialStep5Detail7: string;
  tutorialStep5Detail8: string;
  tutorialStep5Image: string;
  
  // Step 6: Analytics
  tutorialStep6Item1: string;
  tutorialStep6Item2: string;
  tutorialStep6Item3: string;
  tutorialStep6Item4: string;
  tutorialStep6Item5: string;
  tutorialStep6Item6: string;
  tutorialStep6Item7: string;
  tutorialStep6Item8: string;
  tutorialStep6Item9: string;
  tutorialStep6Item10: string;
  tutorialStep6Item11: string;
  tutorialStep6Item12: string;
  tutorialStep6Item13: string;
  tutorialStep6Item14: string;
  tutorialStep6Item15: string;
  tutorialStep6Item16: string;
  tutorialStep6Item17: string;
  tutorialStep6Item18: string;
  tutorialStep6Item19: string;
  tutorialStep6Item20: string;
  tutorialStep6Item21: string;
  tutorialStep6Item22: string;
  tutorialStep6Item23: string;
  tutorialStep6Item24: string;
  tutorialStep6Item25: string;
  tutorialStep6Item26: string;
  tutorialStep6Item27: string;
  tutorialStep6Detail1: string;
  tutorialStep6Detail2: string;
  tutorialStep6Detail3: string;
  tutorialStep6Detail4: string;
  tutorialStep6Detail5: string;
  tutorialStep6Detail6: string;
  tutorialStep6Detail7: string;
  tutorialStep6Detail8: string;
  tutorialStep6Image: string;
  
  // Step 7: Customers
  tutorialStep7Item1: string;
  tutorialStep7Item2: string;
  tutorialStep7Item3: string;
  tutorialStep7Item4: string;
  tutorialStep7Item5: string;
  tutorialStep7Item6: string;
  tutorialStep7Item7: string;
  tutorialStep7Item8: string;
  tutorialStep7Item9: string;
  tutorialStep7Item10: string;
  tutorialStep7Item11: string;
  tutorialStep7Item12: string;
  tutorialStep7Item13: string;
  tutorialStep7Item14: string;
  tutorialStep7Item15: string;
  tutorialStep7Item16: string;
  tutorialStep7Item17: string;
  tutorialStep7Item18: string;
  tutorialStep7Detail1: string;
  tutorialStep7Detail2: string;
  tutorialStep7Detail3: string;
  tutorialStep7Detail4: string;
  tutorialStep7Detail5: string;
  tutorialStep7Detail6: string;
  tutorialStep7Detail7: string;
  tutorialStep7Detail8: string;
  tutorialStep7Detail9: string;
  tutorialStep7Image: string;
  
  // Step 8: Subscription
  tutorialStep8Item1: string;
  tutorialStep8Item2: string;
  tutorialStep8Item3: string;
  tutorialStep8Item4: string;
  tutorialStep8Item5: string;
  tutorialStep8Item6: string;
  tutorialStep8Item7: string;
  tutorialStep8Item8: string;
  tutorialStep8Item9: string;
  tutorialStep8Item10: string;
  tutorialStep8Item11: string;
  tutorialStep8Item12: string;
  tutorialStep8Item13: string;
  tutorialStep8Item14: string;
  tutorialStep8Item15: string;
  tutorialStep8Item16: string;
  tutorialStep8Item17: string;
  tutorialStep8Item18: string;
  tutorialStep8Item19: string;
  tutorialStep8Item20: string;
  tutorialStep8Item21: string;
  tutorialStep8Detail1: string;
  tutorialStep8Detail2: string;
  tutorialStep8Detail3: string;
  tutorialStep8Detail4: string;
  tutorialStep8Detail5: string;
  tutorialStep8Detail6: string;
  tutorialStep8Detail7: string;
  tutorialStep8Image: string;

  // Order Product Selector
  orderProducts: string;
  searchProducts: string;
  selectProduct: string;
  selectProductOption: string;
  selectVariation: string;
  selectVariationOption: string;
  additionalIngredients: string;
  quantity: string;
  addProduct: string;
  noProductsAdded: string;
  selectProductsToAdd: string;
  errorSelectProductVariation: string;
  
  // Orders
  orderManagement: string;
  orderNumber: string;
  customer: string;
  orderType: string;
  pickup: string;
  delivery: string;
  table: string;
  completedToday: string;
  inPreparation: string;
  printTicket: string;
  confirmOrder: string;
  cancelOrder: string;
  nextStep: string;
  customerInfo: string;
  products: string;
  orderSummary: string;
  specialInstructions: string;
  deliveryAddress: string;
  references: string;
  estimatedTime: string;
  thankYouOrder: string;
  allDates: string;
  productsSectionTitle: string;
  
  // Products
  productManagement: string;
  newProduct: string;
  productName: string;
  category: string;
  price: string;
  variations: string;
  ingredients: string;
  noProductsInCategory: string;
  createFirstProduct: string;
  productImages: string;
  variationsAndPrices: string;
  addVariation: string;
  addIngredient: string;
  preparationTime: string;
  productStatus: string;
  draft: string;
  outOfStock: string;
  archived: string;
  optional: string;
  extraCost: string;
  productUpdated: string;
  productCreated: string;
  productDeleted: string;
  productArchived: string;

  // Product Form
  enterProductName: string;
  selectCategory: string;
  enterProductDescription: string;
  productSKU: string;
  productImage: string;
  uploadedImage: string;
  uploadImageFromDevice: string;
  uploadHighQualityImage: string;
  productPreview: string;
  imageWillShowInMenu: string;
  noImageAdded: string;
  uploadImageToShow: string;
  variationName: string;
  variationNamePlaceholder: string;
  priceRequired: string;
  comparePrice: string;
  priceBeforeDiscount: string;
  savings: string;
  ingredientsLabel: string;
  ingredientName: string;
  optionalLabel: string;
  noIngredientsAdded: string;
  ingredientsAreOptional: string;
  updateProduct: string;
  createProduct: string;
  fillRequiredFields: string;
  fileTooLarge: string;
  maxSize5MB: string;
  onlyOneImageAllowed: string;
  
  // Categories
  categoryManagement: string;
  newCategory: string;
  categoryName: string;
  noCategoriesCreated: string;
  createFirstCategory: string;
  categoryIcon: string;
  categoryUpdated: string;
  categoryCreated: string;
  messageCategoryUpdated: string;
  messageCategoryCreated: string;
  messageCategoryDeleted: string;
  categoryDeleted: string;
  categoryActivated: string;
  categoryDeactivated: string;
  order: string;
  totalCategories: string;
  activeCategories: string;
  inactiveCategories: string;
  categoriesTip: string;
  categoriesDescription: string;
  categoriesNameDes: string;
  categoryAppearance: string;
  catIconSec: string;
  catIconDes: string;
  catImg: string;
  catUpImg: string;
  catImgRec: string;
  catObligatry: string;
  catDeleteImg: string;
  categoryActivatedDes: string;
  categoryDeactivatedDes: string;
  viewMenu: string;
  deleteCategoryTitle: string;
  deleteCategoryMessage: string;
  deleteCategoryButton: string;
  
  // Customers
  customerManagement: string;
  totalCustomers: string;
  vipCustomers: string;
  frequentCustomers: string;
  averageSpent: string;
  contact: string;
  ordersCount: string;
  totalSpent: string;
  orderTypes: string;
  segment: string;
  lastOrder: string;
  newCustomer: string;
  removeVip: string;
  regular: string;
  frequent: string;
  vip: string;
  
  // Settings
  generalSettings: string;
  regionalSettings: string;
  language: string;
  currency: string;
  businessHours: string;
  deliverySettings: string;
  tableOrders: string;
  qrCodes: string;
  themeSettings: string;
  socialMedia: string;
  notifications: string;
  restaurantInfo: string;
  contactInfo: string;
  businessInfo: string;
  operationalSettings: string;
  enabled: string;
  disabled: string;
  minimumOrder: string;
  deliveryCost: string;
  deliveryZones: string;
  numberOfTables: string;
  enableQRCodes: string;
  printAll: string;
  downloadAll: string;
  mesa: string;
  
  // Analytics
  totalRevenue: string;
  averageTicket: string;
  monthlyOrders: string;
  ordersByType: string;
  ordersByStatus: string;
  topProducts: string;
  recentActivity: string;
  filterByDates: string;
  from: string;
  to: string;
  clearFilters: string;
  showingDataFrom: string;
  until: string;
  today: string;
  notEnoughData: string;
  noSalesYet: string;
  sold: string;
  
  // Subscription
  subscriptionPlans: string;
  choosePlan: string;
  currentPlan: string;
  planActivated: string;
  freePlan: string;
  basicPlan: string;
  proPlan: string;
  businessPlan: string;
  mostPopular: string;
  unlimited: string;
  upTo: string;
  advancedStats: string;
  customDomain: string;
  prioritySupport: string;
  advancedCustomization: string;
  perfectToStart: string;
  forGrowingRestaurants: string;
  forChainsAndFranchises: string;
  needHelp: string;
  allPlansInclude: string;
  canChangeAnytime: string;
  
  // Public Menu
  addToCart: string;
  cart: string;
  checkout: string;
  yourOrder: string;
  cartEmpty: string;
  addProductsToStart: string;
  proceedToCheckout: string;
  orderConfirmed: string;
  orderSent: string;
  willContactSoon: string;
  continue: string;
  finalizeOrder: string;
  orderTypeSelection: string;
  pickupAtRestaurant: string;
  tableOrder: string;
  selectTable: string;
  fullName: string;
  optionalEmail: string;
  completeAddress: string;
  locationReferences: string;
  
  // Days of week
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  
  // Months
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
  
  // Time
  open: string;
  closed: string;
  openNow: string;
  closedNow: string;
  hours: string;
  minutes: string;
  
  // Errors and Messages
  error: string;
  success: string;
  warning: string;
  info: string;
  required: string;
  invalidEmail: string;
  passwordTooShort: string;
  passwordsDontMatch: string;
  userNotFound: string;
  incorrectPassword: string;
  emailAlreadyRegistered: string;
  registrationSuccessful: string;
  accountPendingApproval: string;
  unexpectedError: string;
  confirmDelete: string;
  actionCannotBeUndone: string;
  
  // Limits and Restrictions
  productLimitReached: string;
  categoryLimitReached: string;
  upgradeSubscription: string;
  addMoreProducts: string;
  addMoreCategories: string;

  // Super Admin
  superAdminPanel: string;
  superAdminDashboard: string;
  restaurantsManagement: string;
  usersManagement: string;
  subscriptionsManagement: string;
  systemStatistics: string;

  // Landing Page
  navFeatures: string;
  navPricing: string;
  navTestimonials: string;
  heroTitle: string;
  heroSubtitle: string;
  startFreeTrial: string;
  learnMore: string;
  featuresTitle: string;
  featuresSubtitle: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  pricingTitle: string;
  pricingSubtitle: string;
  planFree: string;
  planFreeDesc: string;
  planFreeFeature1: string;
  planFreeFeature2: string;
  planFreeFeature3: string;
  planFreeFeature4: string;
  planFreeFeature5: string;
  perMonth: string;
  planBasicDesc: string;
  planBasicFeature1: string;
  planBasicFeature2: string;
  planBasicFeature3: string;
  planBasicFeature4: string;
  planBasicFeature5: string;
  planProDesc: string;
  planProFeature1: string;
  planProFeature2: string;
  planProFeature3: string;
  planProFeature4: string;
  planProFeature5: string;
  planBusinessDesc: string;
  planBusinessFeature1: string;
  planBusinessFeature2: string;
  planBusinessFeature3: string;
  planBusinessFeature4: string;
  planBusinessFeature5: string;
  getStarted: string;
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonial1: string;
  testimonial2: string;
  testimonial3: string;
  ctaTitle: string;
  ctaSubtitle: string;
  startNow: string;
  footerDescription: string;
  footerQuickLinks: string;
  footerContact: string;
  footerEmail: string;
  footerPhone: string;
  footerRights: string;

  // Public Menu
  charging_public_menu: string;
}

const translations: Record<Language, Translations> = {
  es: {
    // Common
    suscription: 'Suscripción',
    save: 'Guardar',
    todos_button: 'Todos',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    create: 'Crear',
    update: 'Actualizar',
    loading: 'Cargando',
    search: 'Buscar',
    filter: 'Filtrar',
    actions: 'Acciones',
    status: 'Estado',
    date: 'Fecha',
    name: 'Nombre',
    description: 'Descripción',
    email: 'Email',
    phone: 'Teléfono',
    address: 'Dirección',
    total: 'Total',
    subtotal: 'Subtotal',
    yes: 'Sí',
    no: 'No',
    close: 'Cerrar',
    view: 'Ver',
    print: 'Imprimir',
    download: 'Descargar',
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Listo',
    delivered: 'Entregado',
    cancelled: 'Cancelado',

    // Confirm Dialog - Defaults
    confirmDialogDefaultConfirm: 'Confirmar',
    confirmDialogDefaultCancel: 'Cancelar',
    
    // Navigation
    dashboard: 'Dashboard',
    categories: 'Categorías',
    menu: 'Menú',
    orders: 'Pedidos',
    customers: 'Clientes',
    subscription: 'Suscripción',
    settings: 'Configuración',
    analytics: 'Estadísticas',

    // Terms and Conditions
    termsSection1Title: 'Aceptación de los Términos',
    termsSection1Content: 'Al registrarse y utilizar Platyo, usted acepta estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio. Estos términos aplican a todos los usuarios: propietarios de restaurantes, personal administrativo y clientes finales.',

    termsSection2Title: 'Descripción del Servicio',
    termsSection2Content: 'Platyo es una plataforma integral de gestión para restaurantes que proporciona herramientas tecnológicas avanzadas para:',
    termsSection2Item1: 'Gestión completa de menú digital con catálogo de productos, categorías, variaciones de productos e ingredientes opcionales',
    termsSection2Item2: 'Sistema inteligente de pedidos en línea con seguimiento en tiempo real y notificaciones automáticas vía WhatsApp',
    termsSection2Item3: 'Administración avanzada de clientes con historial de pedidos, datos de contacto y análisis de comportamiento',
    termsSection2Item4: 'Panel de analíticas con reportes detallados de ventas, productos más vendidos, ingresos por período y estadísticas en tiempo real',
    termsSection2Item5: 'Sistema de facturación electrónica configurable con soporte para IVA (19%), Impuesto al Consumo (IPC), propinas y resolución DIAN',
    
    termsSection3Title: 'Registro y Cuenta',
    termsSection3Content: 'Para utilizar Platyo, debe crear una cuenta proporcionando información precisa y completa. Usted es responsable de:',
    termsSection3Item1: 'Mantener la confidencialidad de su contraseña',
    termsSection3Item2: 'Todas las actividades que ocurran bajo su cuenta',
    termsSection3Item3: 'Notificar inmediatamente cualquier uso no autorizado',
    termsSection3Item4: 'Proporcionar información veraz y actualizada',
    
    termsSection4Title: 'Suscripciones y Pagos',
    termsSection4Content: 'Platyo ofrece tres planes de suscripción: FREE (gratuito con funcionalidades básicas), BUSINESS (mensual con características avanzadas) y ENTERPRISE (anual con todas las funcionalidades premium). Al suscribirse, usted acepta:',
    termsSection4Item1: 'Pagar todas las tarifas asociadas con su plan seleccionado según la periodicidad elegida (mensual o anual)',
    termsSection4Item3: 'Que los precios, límites de productos, categorías y características pueden cambiar con previo aviso de 30 días',
    termsSection4Item4: 'La política de reembolso: no se realizan devoluciones por períodos parcialmente utilizados. Al cancelar, mantendrá acceso hasta el final del período pagado',
    
    termsSection5Title: 'Uso Aceptable',
    termsSection5Content: 'Al usar Platyo, usted se compromete a NO:',
    termsSection5Item1: 'Violar leyes o regulaciones aplicables',
    termsSection5Item2: 'Infringir derechos de propiedad intelectual',
    termsSection5Item3: 'Transmitir contenido ofensivo, ilegal o inapropiado',
    termsSection5Item4: 'Intentar acceder sin autorización a sistemas o datos',
    termsSection5Item5: 'Usar el servicio para actividades fraudulentas',
    termsSection5Item6: 'Interferir con el funcionamiento del servicio',
    
    termsSection6Title: 'Propiedad Intelectual',
    termsSection6Content1: 'Todo el contenido, características, funcionalidad, código fuente, diseño, marca "Platyo", logotipos, interfaz de usuario y tecnología subyacente son propiedad exclusiva de Digital Fenix Pro y están protegidos por leyes de derechos de autor, marcas registradas y otras leyes de propiedad intelectual internacionales.',
    termsSection6Content2: 'Usted conserva todos los derechos sobre el contenido que cargue (menús, productos, imágenes, datos de clientes, configuraciones), pero nos otorga una licencia limitada, no exclusiva y revocable para almacenar, procesar y mostrar dicho contenido únicamente para la prestación del servicio contratado. Nunca compartiremos su contenido con terceros sin su autorización expresa.',
    
    termsSection7Title: 'Privacidad y Protección de Datos',
    termsSection7Content: 'Recopilamos y procesamos datos personales (información de restaurante, datos de clientes, pedidos, transacciones) de acuerdo con nuestra Política de Privacidad y cumpliendo estrictamente con:',
    termsSection7Item1: 'Ley 1581 de 2012 de Protección de Datos Personales en Colombia y su normativa complementaria',
    termsSection7Item2: 'Decreto 1377 de 2013 sobre tratamiento de datos personales',
    termsSection7Item3: 'Principios de legalidad, finalidad, libertad, veracidad, transparencia, acceso, circulación restringida y seguridad en el tratamiento de datos',
    termsSection7Content2: 'Sus derechos incluyen: conocer, actualizar, rectificar y suprimir sus datos personales, así como revocar la autorización otorgada. Utilizamos encriptación SSL/TLS, almacenamiento seguro en servidores certificados y medidas de seguridad robustas para proteger su información. Puede ejercer sus derechos contactándonos en admin@digitalfenixpro.com.',
    
    termsSection8Title: 'Limitación de Responsabilidad',
    termsSection8Content: 'Platyo se proporciona "tal cual" y "según disponibilidad". No garantizamos que:',
    termsSection8Item1: 'El servicio será ininterrumpido o libre de errores',
    termsSection8Item2: 'Los resultados obtenidos serán exactos o confiables',
    termsSection8Item3: 'Todos los errores serán corregidos',
    termsSection8Content2: 'No seremos responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de beneficios, datos, uso o buena voluntad.',
    
    termsSection9Title: 'Indemnización',
    termsSection9Content: 'Usted acepta indemnizar y mantener indemne a Platyo, sus afiliados, directores, empleados y agentes de cualquier reclamación, daño, obligación, pérdida, responsabilidad, costo o deuda que surja de:',
    termsSection9Item1: 'Su uso del servicio',
    termsSection9Item2: 'Violación de estos términos',
    termsSection9Item3: 'Violación de derechos de terceros',
    termsSection9Item4: 'Contenido que usted publique o comparta',
    
    termsSection10Title: 'Terminación del Servicio',
    termsSection10Content: 'Podemos suspender o terminar su acceso al servicio inmediatamente, sin previo aviso, por cualquier motivo, incluyendo:',
    termsSection10Item1: 'Violación de estos términos',
    termsSection10Item2: 'Solicitud de autoridades legales',
    termsSection10Item3: 'Discontinuación del servicio',
    termsSection10Item4: 'Actividad fraudulenta o ilegal',
    
    termsSection11Title: 'Modificaciones',
    termsSection11Content: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación. Su uso continuado del servicio constituye su aceptación de los términos modificados.',
    
    termsSection12Title: 'Ley Aplicable y Jurisdicción',
    termsSection12Content: 'Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será resuelta en los tribunales competentes de Colombia, renunciando expresamente a cualquier otro fuero que pudiera corresponder.',
    
    termsSection13Title: 'Disposiciones Generales',
    termsSection13Item1Label: 'Divisibilidad',
    termsSection13Item1: 'Si alguna disposición es considerada inválida, las demás permanecerán vigentes',
    termsSection13Item2Label: 'Renuncia',
    termsSection13Item2: 'La falta de ejercicio de un derecho no constituye renuncia al mismo',
    termsSection13Item3Label: 'Acuerdo Completo',
    termsSection13Item3: 'Estos términos constituyen el acuerdo completo entre las partes',
    termsSection13Item4Label: 'Cesión',
    termsSection13Item4: 'No puede ceder sus derechos sin nuestro consentimiento previo por escrito',
    
    termsSection14Title: 'Contacto',
    termsSection14Content: 'Para preguntas sobre estos términos, puede contactarnos a través de:',
    termsSection14Item1: 'Email: admin@digitalfenixpro.com',
    termsSection14Item2: 'Dentro de la plataforma mediante el sistema de tickets de soporte',
    
    termsLastUpdate: 'Última actualización',
    termsLastUpdateDate: 'Enero 2026',
    termsAcceptDisclaimer: 'Al hacer clic en "Aceptar" o al usar el servicio, usted reconoce que ha leído, entendido y acepta estar legalmente vinculado por estos Términos y Condiciones. Para cualquier duda o aclaración, contáctenos en admin@digitalfenixpro.com o mediante el sistema de soporte dentro de la plataforma.',
    acceptTermsAndConditionsButton: 'Aceptar Términos y Condiciones',


    // Auth Context Errors
    restaurantNotFoundForUser: 'Restaurante no encontrado para este usuario',
    noRestaurantAssigned: 'No tienes un restaurante asignado. Contacta al administrador.',
    noAccountFoundWithEmail: 'No se encontró una cuenta con ese email',
    passwordRecoveryRequest: 'Solicitud de recuperación de contraseña',
    passwordRecoveryMessage: 'ha solicitado recuperar su contraseña.',
    userRole: 'Rol del usuario',
    requestDate: 'Fecha de solicitud',
    userWithoutRestaurant: 'Usuario sin restaurante',
    noName: 'Sin nombre',
    notAvailable: 'No disponible',

    
    // Auth
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',
    loginTitle: 'Iniciar Sesión',
    loginSubtitle: 'Accede a tu panel de administración',
    registerTitle: 'Registra tu Restaurante',
    registerSubtitle: 'Completa los datos para crear tu cuenta',
    password: 'Contraseña',
    noAccount: '¿No tienes una cuenta?',
    confirmPassword: 'Confirmar Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',  
    restaurantName: 'Nombre del Restaurante',
    ownerName: 'Nombre del Propietario',
    acceptTerms: 'Acepto los ',
    backToLogin: 'Volver al Login',
    demoAccounts: 'Cuentas de demostración:',
    superadmin: 'Superadmin',
    restaurant: 'Restaurante',
    authPageSubtitle: 'Sistema Completo de Gestión de Restaurantes',
    authPageTitle: 'Transforma la gestión de tu restaurante',
    authPageDescription: 'La plataforma todo-en-uno que necesitas para modernizar tu negocio y aumentar tus ventas',
    featureDigitalMenu: 'Menú Digital',
    featureDigitalMenuDesc: 'Catálogo online con código QR',
    featureMoreSales: 'Más Ventas',
    featureMoreSalesDesc: 'Aumenta hasta 40% tus ingresos',
    featureRealTimeAnalytics: 'Análisis en Tiempo Real',
    featureRealTimeAnalyticsDesc: 'Reportes y estadísticas detalladas',
    featureOrderManagement: 'Gestión de Pedidos',
    featureOrderManagementDesc: 'Control total y eficiente',
    featureCustomerBase: 'Base de Clientes',
    featureCustomerBaseDesc: 'Fideliza y conoce mejor a tus clientes',
    featureQuickSetup: 'Configuración Rápida',
    featureQuickSetupDesc: 'Listo en menos de 10 minutos',
    featurePOSBilling: 'Facturación POS',
    featurePOSBillingDesc: 'Sistema integrado de punto de venta',
    featureRealTimeTracking: 'Seguimiento en Tiempo Real',
    featureRealTimeTrackingDesc: 'Clientes rastrean sus pedidos al instante',
    statActiveRestaurants: 'Crecimiento en ventas',
    statOrdersProcessed: 'Más visualizaciones',
    statSatisfaction: 'Margen de satisfacción',
    requestSent: '¡Solicitud Enviada!',
    requestInfo: 'Hemos recibido tu solicitud de recuperación de contraseña.',
    requestResponse: 'Nuestro equipo se contactará contigo al email',
    recoverPassword: 'Recuperar Contraseña',
    recoverPasswordInstructions: 'Ingresa tu dirección de email y nos pondremos en contacto contigo para ayudarte a recuperar el acceso a tu cuenta.',
    helpReactivateAccount: 'para ayudarte a reactivar tu cuenta.',
    emailPlaceholder: 'tu@email.com',
    sendRequest: 'Enviar Solicitud',
    requestSendError: 'Error al enviar la solicitud',

    // Register Form
    restaurantNameRequired: 'El nombre del restaurante es obligatorio',
    emailRequired: 'El email es obligatorio',
    passwordRequired: 'La contraseña es obligatoria',
    mustAcceptTerms: 'Debes aceptar los términos y condiciones',
    registerError: 'Error al registrar',
    contactEmail: 'Email de Contacto',
    restaurantAddress: 'Dirección del Restaurante',
    minimumCharacters: 'Mínimo 6 caracteres',
    repeatPassword: 'Repite tu contraseña',
    termsAndConditions: 'términos y condiciones',
    ofService: 'del servicio',
    createAccount: 'Crear Cuenta',
    termsModalTitle: 'Términos y Condiciones de Platyo',
    restaurantNamePlaceholder: 'Mi Restaurante',
    ownerNamePlaceholder: 'Pepito Perez',
    contactEmailPlaceholder: 'contacto@mirestaurante.com',
    phonePlaceholder: '+57 (310) 123-4567',
    addressPlaceholder: 'Calle 123 No 45-67, Ciudad',

    // Change Password Modal
    changePasswordRequired: 'Cambio de Contraseña Requerido',
    provisionalPasswordDetected: 'Contraseña provisional detectada.',
    securityPasswordChange: 'Por seguridad, debes cambiar tu contraseña antes de continuar. Esta contraseña será permanente y podrás usarla en futuros inicios de sesión.',
    newPassword: 'Nueva Contraseña',
    confirmNewPassword: 'Confirmar Nueva Contraseña',
    changePassword: 'Cambiar Contraseña',
    writePasswordAgain: 'Escribe la contraseña nuevamente',

    // Tutorial Modal
    tutorialStepOf: 'de',
    tutorialStepByStepInstructions: 'Instrucciones Paso a Paso',
    tutorialImportantInfo: 'Información Importante',
    tutorialPrevious: 'Anterior',
    tutorialNext: 'Siguiente',
    tutorialFinish: 'Finalizar Tutorial',
    tutorialGoToStep: 'Ir al paso',
    
    // Tutorial Steps Titles
    tutorialStep1Title: 'Paso 1: Crear Categorías',
    tutorialStep2Title: 'Paso 2: Agregar Productos',
    tutorialStep3Title: 'Paso 3: Configurar tu Menú',
    tutorialStep4Title: 'Paso 4: Gestionar Pedidos',
    tutorialStep5Title: 'Paso 5: Compartir tu Menú',
    tutorialStep6Title: 'Paso 6: Revisar Estadísticas',
    tutorialStep7Title: 'Paso 7: Gestión de Clientes',
    tutorialStep8Title: 'Paso 8: Gestionar Suscripción',
    
    // Tutorial Steps Descriptions
    tutorialStep1Description: 'Primero debes crear las categorías para organizar tu menú',
    tutorialStep2Description: 'Ahora crea los productos que aparecerán en tu menú',
    tutorialStep3Description: 'Personaliza la apariencia y configuración de tu menú público',
    tutorialStep4Description: 'Aprende a recibir y gestionar los pedidos de tus clientes',
    tutorialStep5Description: 'Comparte el enlace de tu menú con tus clientes',
    tutorialStep6Description: 'Monitorea el rendimiento de tu negocio con reportes detallados',
    tutorialStep7Description: 'Consulta y administra tu base de clientes',
    tutorialStep8Description: 'Mantén tu cuenta activa y administra tu plan',
    
    // Step 1: Categories
    tutorialStep1Item1: 'Haz clic en "Categorías" en el menú lateral izquierdo',
    tutorialStep1Item2: 'Presiona el botón "+ Nueva Categoría" (esquina superior derecha)',
    tutorialStep1Item3: 'En el formulario que aparece, ingresa el nombre de la categoría (ej: "Entradas", "Platos Fuertes", "Bebidas")',
    tutorialStep1Item4: 'Ingrese una descripción para la categoría creada',
    tutorialStep1Item5: 'Haz clic en "Guardar" para crear la categoría',
    tutorialStep1Item6: 'Repite estos pasos para crear todas las categorías que necesites',
    tutorialStep1Detail1: 'El nombre debe ser claro y descriptivo para tus clientes',
    tutorialStep1Detail2: 'Puedes crear categorías como: Entradas, Platos Principales, Bebidas, Postres, Especialidades, etc.',
    tutorialStep1Detail3: 'Una vez creada, puedes activar/desactivar la categoría usando el icono de visualización',
    tutorialStep1Detail4: 'Si desactivas una categoría, esta no se mostrará en el menú público',
    tutorialStep1Detail5: 'Para editar o eliminar una categoría, usa los iconos de lápiz (editar) o papelera (eliminar) en cada fila',
    tutorialStep1Image: 'Pantalla de Categorías con lista de categorías creadas, cada una con su imagen y botón "Nueva Categoría" en la esquina superior derecha',
    
    // Step 2: Products
    tutorialStep2Item1: 'Haz clic en "Menú" en el menú lateral izquierdo',
    tutorialStep2Item2: 'Presiona el botón "+ Nuevo Producto" en la parte superior',
    tutorialStep2Item3: 'Completa los campos requeridos: Nombre del producto (ej: "Pizza Margarita")',
    tutorialStep2Item4: 'Escribe una descripción atractiva del producto (ej: "Deliciosa pizza con salsa de tomate, mozzarella fresca y albahaca")',
    tutorialStep2Item5: 'Selecciona la categoría a la que pertenece de la lista desplegable',
    tutorialStep2Item6: 'Sube una imagen del producto haciendo clic en "Seleccionar Imagen" (opcional pero recomendado)',
    tutorialStep2Item7: 'En la sección "Variaciones", agrega al menos una opción: Nombre (ej: "Personal"), Precio (ej: $15000)',
    tutorialStep2Item8: 'Puedes agregar más variaciones con "+ Agregar Variación" (ej: "Mediana", "Familiar")',
    tutorialStep2Item9: 'Si aplica, agrega ingredientes opcionales con "+ Agregar Ingrediente" especificando nombre y precio adicional',
    tutorialStep2Item10: 'Haz clic en "Guardar Producto"',
    tutorialStep2Detail1: 'Las variaciones son obligatorias: cada producto debe tener al menos una variación (tamaño, sabor, presentación)',
    tutorialStep2Detail2: 'Ejemplo de variaciones: Pizza → Personal, Mediana, Familiar | Bebida → 300ml, 500ml, 1L',
    tutorialStep2Detail3: 'Los ingredientes opcionales son adicionales que el cliente puede agregar (ej: Queso extra, Tocino, Aguacate)',
    tutorialStep2Detail4: 'Las imágenes aumentan significativamente las ventas',
    tutorialStep2Detail5: 'El orden de los productos en la lista se puede cambiar arrastrándolos',
    tutorialStep2Detail6: 'Puedes activar/desactivar productos temporalmente sin eliminarlos usando el switch de estado',
    tutorialStep2Image: 'Formulario de creación de producto con campos: nombre, descripción, categoría, imagen, variaciones (nombre/precio) e ingredientes opcionales',
    
    // Step 3: Menu Configuration
    tutorialStep3Item1: 'Haz clic en "Configuración" en el menú lateral',
    tutorialStep3Item2: 'En la pestaña "General", completa toda la información de tu restaurante:',
    tutorialStep3Item3: '• Nombre del restaurante',
    tutorialStep3Item4: '• Teléfono (formato: +57 3001234567) - importante para recibir pedidos por WhatsApp',
    tutorialStep3Item5: '• Dirección completa',
    tutorialStep3Item6: '• Ciudad',
    tutorialStep3Item7: 'En la pestaña "Personalización", ajusta los colores de tu menú:',
    tutorialStep3Item8: '• Color primario (color principal de botones y elementos destacados)',
    tutorialStep3Item9: '• Color secundario (color de fondo y elementos secundarios)',
    tutorialStep3Item10: '• Color de acento (color para elementos importantes)',
    tutorialStep3Item11: 'En la pestaña "Domicilio", configura si ofreces servicio a domicilio:',
    tutorialStep3Item12: '• Activa el switch "Habilitar Domicilio"',
    tutorialStep3Item13: '• Configura los niveles de precio según el monto del pedido',
    tutorialStep3Item14: '• Ejemplo: $0-$20000 = $5000 domicilio | $20000-$50000 = $3000 | Más de $50000 = Gratis',
    tutorialStep3Item15: 'En la misma sección, configura si aceptas pedidos para consumir en mesa',
    tutorialStep3Item16: 'Establece el tiempo de preparación estimado (ej: "30-45 minutos")',
    tutorialStep3Item17: 'Guarda todos los cambios',
    tutorialStep3Detail1: 'El teléfono es crucial: todos los pedidos se enviarán automáticamente a ese número por WhatsApp',
    tutorialStep3Detail2: 'El formato del teléfono debe incluir el código del país (ej: +57 para Colombia)',
    tutorialStep3Detail3: 'Los colores personalizados se aplican inmediatamente en el menú público',
    tutorialStep3Detail4: 'El tiempo de preparación aparece al cliente cuando va a hacer un pedido',
    tutorialStep3Detail5: 'La configuración de Domicilio permite establecer diferentes costos según el monto del pedido',
    tutorialStep3Detail6: 'Si desactivas el Domicilio, los clientes solo podrán elegir "Recoger en tienda" o "Mesa"',
    tutorialStep3Detail7: 'Prueba diferentes combinaciones de colores para que coincidan con tu marca',
    tutorialStep3Image: 'Panel de Configuración mostrando pestañas: General, Personalización y Domicilio con formularios para cada sección',
    
    // Step 4: Orders Management
    tutorialStep4Item1: 'Cuando un cliente hace un pedido, recibirás un mensaje de WhatsApp automáticamente con todos los detalles',
    tutorialStep4Item2: 'El pedido también aparecerá en la sección "Pedidos" de la aplicación',
    tutorialStep4Item3: 'Para ver los pedidos, haz clic en "Pedidos" en el menú lateral',
    tutorialStep4Item4: 'Verás una lista con todos los pedidos. Los estados son:',
    tutorialStep4Item5: '• 🟡 Pendiente: Pedido recién recibido, requiere confirmación',
    tutorialStep4Item6: '• 🔵 Confirmado: Pedido aceptado',
    tutorialStep4Item7: '• 🟠 Preparando: Pedido en cocina',
    tutorialStep4Item8: '• 🟢 Listo: Pedido terminado y listo para entregar',
    tutorialStep4Item9: '• ✅ Entregado: Pedido completado',
    tutorialStep4Item10: '• 🔴 Cancelado: Pedido cancelado',
    tutorialStep4Item11: 'Para cambiar el estado de un pedido, haz clic en el botón "Editar" en la tarjeta del pedido',
    tutorialStep4Item12: 'Selecciona el nuevo estado del menú desplegable',
    tutorialStep4Item13: 'Para ver todos los detalles de un pedido, haz clic en "Ver Detalles"',
    tutorialStep4Item14: 'Puedes filtrar pedidos usando los filtros en la parte superior:',
    tutorialStep4Item15: '• Por estado (Pendientes, En preparación, etc.)',
    tutorialStep4Item16: '• Por tipo (Domicilio, Recoger, Mesa)',
    tutorialStep4Item17: '• Por rango de fechas',
    tutorialStep4Item18: 'Usa la barra de búsqueda para encontrar un pedido específico por número o nombre de cliente',
    tutorialStep4Item19: 'Puedes utilizar el icono de mensaje para mantener al tanto a tus clientes sobre el estado del pedido a través de WhatsApp',
    tutorialStep4Detail1: 'El mensaje de WhatsApp incluye: número de pedido, datos del cliente, productos, precios y notas especiales',
    tutorialStep4Detail2: 'IMPORTANTE: Actualiza el estado del pedido a medida que avanza para mantener informado al cliente',
    tutorialStep4Detail3: 'Los pedidos "Pendientes" aparecen destacados en amarillo para llamar tu atención',
    tutorialStep4Detail4: 'En los detalles del pedido verás: información del cliente, dirección (si es Domicilio), lista de productos con variaciones e ingredientes extras, notas especiales del cliente',
    tutorialStep4Detail5: 'Si necesitas cancelar un pedido, cambia su estado a "Cancelado" y contacta al cliente para explicar',
    tutorialStep4Detail6: 'Los filtros te ayudan a enfocarte en los pedidos que requieren acción inmediata',
    tutorialStep4Detail7: 'Mantén organizada tu cocina: primero confirma el pedido, luego marca como "Preparando", después "Listo" y finalmente "Entregado"',
    tutorialStep4Image: 'Pantalla de Pedidos mostrando tarjetas con información de cada pedido: número, cliente, estado, productos y botones de acción',
    
    // Step 5: Public Menu
    tutorialStep5Item1: 'Tu menú público tiene una URL única que puedes compartir',
    tutorialStep5Item2: 'La URL tiene el formato: platyo.com/nombre-de-tu-restaurante',
    tutorialStep5Item3: 'Para compartir tu menú:',
    tutorialStep5Item4: '• Copia la URL de tu navegador cuando estés en la vista de menú público',
    tutorialStep5Item5: '• Compártela en redes sociales (Facebook, Instagram, WhatsApp)',
    tutorialStep5Item6: '• Agrégala a tu biografía de Instagram',
    tutorialStep5Item7: '• Envíala directamente a tus clientes por WhatsApp',
    tutorialStep5Item8: '• Imprímela como código QR para colocar en tu local',
    tutorialStep5Item9: 'Los clientes pueden:',
    tutorialStep5Item10: '• Ver todos tus productos organizados por categorías',
    tutorialStep5Item11: '• Agregar productos al carrito',
    tutorialStep5Item12: '• Personalizar productos (elegir variación, agregar ingredientes opcionales)',
    tutorialStep5Item13: '• Escribir notas especiales por producto',
    tutorialStep5Item14: '• Finalizar la compra eligiendo: Recoger en tienda, Domicilio, o Mesa',
    tutorialStep5Item15: '• Al confirmar el pedido, se abre WhatsApp automáticamente con todos los datos',
    tutorialStep5Detail1: 'El menú público se actualiza automáticamente cuando agregas o editas productos',
    tutorialStep5Detail2: 'Los clientes ven el menú con los colores que configuraste en personalización',
    tutorialStep5Detail3: 'Si un producto está desactivado, no aparecerá en el menú público',
    tutorialStep5Detail4: 'Si una categoría está desactivada, no aparecerá en el menú público',
    tutorialStep5Detail5: 'Los productos destacados aparecen primero con un distintivo especial. Puedes configurarlos desde el apartado "Promocional"',
    tutorialStep5Detail6: 'El carrito de compras se mantiene mientras el cliente navega por el menú',
    tutorialStep5Detail7: 'Cuando el cliente confirma el pedido, tú recibes toda la información por WhatsApp',
    tutorialStep5Detail8: 'El mensaje incluye resumen completo: productos, variaciones, ingredientes extras, datos de contacto, dirección de entrega si aplica',
    tutorialStep5Image: 'Vista del menú público con categorías en la parte superior, productos con imágenes y precios, y carrito de compras flotante',
    
    // Step 6: Analytics
    tutorialStep6Item1: 'Haz clic en "Estadísticas" en el menú lateral',
    tutorialStep6Item2: 'En la parte superior verás las métricas principales:',
    tutorialStep6Item3: '• Total de pedidos en el período seleccionado',
    tutorialStep6Item4: '• Pedidos completados',
    tutorialStep6Item5: '• Ingresos totales',
    tutorialStep6Item6: '• Ticket promedio (valor promedio por pedido)',
    tutorialStep6Item7: 'Usa los "Filtros Avanzados" para analizar datos específicos:',
    tutorialStep6Item8: '• Haz clic en "Filtros Avanzados" en la esquina superior derecha',
    tutorialStep6Item9: '• Selecciona un rango de fechas (desde/hasta)',
    tutorialStep6Item10: '• Filtra por categoría específica',
    tutorialStep6Item11: '• Filtra por tipo de pedido (Domicilio, Recoger, Mesa)',
    tutorialStep6Item12: '• Filtra por estado del pedido',
    tutorialStep6Item13: '• Puedes combinar múltiples filtros',
    tutorialStep6Item14: 'Revisa los gráficos que se muestran:',
    tutorialStep6Item15: '• Pedidos por Tipo: cuántos pedidos de cada modalidad',
    tutorialStep6Item16: '• Pedidos por Mes: tendencia de pedidos a lo largo del tiempo',
    tutorialStep6Item17: '• Estados de Pedidos: distribución de estados',
    tutorialStep6Item18: '• Productos Más Vendidos: tu top 5 de productos',
    tutorialStep6Item19: 'Para exportar los datos, haz clic en "Exportar CSV"',
    tutorialStep6Item20: 'Se descargará un archivo Excel con información detallada:',
    tutorialStep6Item21: '• Resumen ejecutivo con todas las métricas',
    tutorialStep6Item22: '• Distribución por tipo y estado',
    tutorialStep6Item23: '• Productos más vendidos',
    tutorialStep6Item24: '• Ventas por categoría',
    tutorialStep6Item25: '• Ventas por día de la semana',
    tutorialStep6Item26: '• Detalle completo de cada pedido',
    tutorialStep6Item27: '• Detalle de items vendidos',
    tutorialStep6Detail1: 'Los filtros te permiten analizar períodos específicos (ej: ventas del último mes)',
    tutorialStep6Detail2: 'El reporte CSV es perfecto para llevar a tu contador o hacer análisis detallados',
    tutorialStep6Detail3: 'Usa las estadísticas para identificar tus productos más rentables',
    tutorialStep6Detail4: 'Analiza qué días de la semana vendes más para optimizar tu inventario',
    tutorialStep6Detail5: 'El ticket promedio te ayuda a evaluar estrategias de upselling',
    tutorialStep6Detail6: 'Si ves productos con pocas ventas, considera mejorar su presentación o precio',
    tutorialStep6Detail7: 'Las ventas por categoría muestran qué tipo de productos prefieren tus clientes',
    tutorialStep6Detail8: 'Revisa las estadísticas semanalmente para tomar decisiones informadas',
    tutorialStep6Image: 'Dashboard de estadísticas con gráficos de barras, métricas clave en tarjetas, filtros avanzados y botón de exportar CSV',
    
    // Step 7: Customers
    tutorialStep7Item1: 'Haz clic en "Clientes" en el menú lateral',
    tutorialStep7Item2: 'Verás una tabla con todos los clientes que han hecho pedidos',
    tutorialStep7Item3: 'La información mostrada incluye:',
    tutorialStep7Item4: '• Nombre del cliente',
    tutorialStep7Item5: '• Teléfono de contacto',
    tutorialStep7Item6: '• Email (si lo proporcionó)',
    tutorialStep7Item7: '• Total de pedidos realizados',
    tutorialStep7Item8: '• Monto total gastado',
    tutorialStep7Item9: '• Fecha del último pedido',
    tutorialStep7Item10: 'Para buscar un cliente específico, usa la barra de búsqueda en la parte superior',
    tutorialStep7Item11: 'Puedes buscar por: nombre, teléfono o email',
    tutorialStep7Item12: 'Haz clic en un cliente para ver el detalle completo de su historial de pedidos',
    tutorialStep7Item13: 'El número de teléfono será la identificación principal del cliente. Si un cliente ya registrado con un número ingresa un nombre diferente, no se creará un nuevo registro, sino que se actualizará la información asociada a ese número de teléfono.',
    tutorialStep7Item14: 'En la vista de detalle verás:',
    tutorialStep7Item15: '• Información de contacto completa',
    tutorialStep7Item16: '• Direcciones de entrega usadas previamente',
    tutorialStep7Item17: '• Lista completa de todos sus pedidos con fechas',
    tutorialStep7Item18: '• Productos que más ordena',
    tutorialStep7Item19: '• Estadísticas de compra',
    tutorialStep7Detail1: 'Los clientes se registran automáticamente cuando hacen su primer pedido',
    tutorialStep7Detail2: 'No necesitas crear clientes manualmente. Si necesitas crear clientes de manera masiva, puedes hacerlo importando CSV',
    tutorialStep7Detail3: 'La información del cliente se guarda para futuras órdenes',
    tutorialStep7Detail4: 'Puedes identificar a tus clientes más frecuentes por el número de pedidos',
    tutorialStep7Detail5: 'Usa esta información para crear programas de lealtad o promociones especiales',
    tutorialStep7Detail6: 'Los clientes con mayor gasto total son tus clientes VIP. Podrás asignarlos manualmente',
    tutorialStep7Detail7: 'Respeta siempre la privacidad de los datos de tus clientes',
    tutorialStep7Detail8: 'Puedes exportar la base de datos de clientes para campañas de marketing',
    tutorialStep7Detail9: 'Si un cliente solicita eliminar sus datos, puedes hacerlo desde esta sección',
    tutorialStep7Image: 'Tabla de clientes con columnas: nombre, teléfono, email, pedidos totales, gasto total y última compra, con barra de búsqueda',
    
    // Step 8: Subscription
    tutorialStep8Item1: 'Haz clic en "Suscripción" en el menú lateral',
    tutorialStep8Item2: 'En la parte superior verás tu plan actual con:',
    tutorialStep8Item3: '• Nombre del plan (Básico, Profesional, Empresarial)',
    tutorialStep8Item4: '• Estado (Activo/Inactivo/Vencido)',
    tutorialStep8Item5: '• Fecha de inicio',
    tutorialStep8Item6: '• Fecha de vencimiento',
    tutorialStep8Item7: '• Días restantes',
    tutorialStep8Item8: 'Verás el estado de renovación automática:',
    tutorialStep8Item9: '• Si está activada, tu plan se renovará automáticamente antes de vencer',
    tutorialStep8Item10: '• Si está desactivada, tendrás que renovar manualmente',
    tutorialStep8Item11: '• Para cambiar, usa el switch "Renovación Automática"',
    tutorialStep8Item12: 'Para ver todos los planes disponibles, revisa la sección "Planes Disponibles"',
    tutorialStep8Item13: 'Cada plan muestra:',
    tutorialStep8Item14: '• Precio mensual',
    tutorialStep8Item15: '• Características incluidas',
    tutorialStep8Item16: '• Límites (pedidos, productos, etc.)',
    tutorialStep8Item17: 'Para cambiar de plan:',
    tutorialStep8Item18: '• Haz clic en "Seleccionar Plan" en el plan que deseas',
    tutorialStep8Item19: '• Confirma el cambio',
    tutorialStep8Item20: '• El nuevo plan se activa inmediatamente',
    tutorialStep8Item21: 'Revisa el historial de pagos en la parte inferior para ver tus transacciones anteriores',
    tutorialStep8Detail1: 'IMPORTANTE: Si tu suscripción vence, no podrás recibir nuevos pedidos',
    tutorialStep8Detail2: 'Activa la renovación automática para evitar interrupciones en tu servicio',
    tutorialStep8Detail3: 'Puedes cambiar de plan en cualquier momento',
    tutorialStep8Detail4: 'Al cambiar a un plan superior, pagas la diferencia prorrateada',
    tutorialStep8Detail5: 'Al cambiar a un plan inferior, el cambio se efectúa al final del período actual',
    tutorialStep8Detail6: 'Si tu negocio está creciendo, considera actualizar a un plan con más capacidad',
    tutorialStep8Detail7: 'Todos los planes incluyen soporte técnico',
    tutorialStep8Image: 'Panel de suscripción mostrando plan actual con fecha de vencimiento, switch de renovación automática y tarjetas de planes disponibles',

    // Dashboard
    totalProducts: 'Productos',
    activeProducts: 'activos',
    todayOrders: 'Pedidos Hoy',
    totalSales: 'Ventas Totales',
    recentOrders: 'Pedidos Recientes',
    restaurantStatus: 'Estado del Restaurante',
    lastUpdate: 'Última actualización',
    noOrdersYet: 'No hay pedidos aún',
    ordersWillAppear: 'Los pedidos aparecerán aquí una vez que los clientes empiecen a ordenar.',
    noSubscription: 'Sin suscripción',
    btnTutorial: 'Tutorial',
    statTotalSubtitle: 'total',
    statCurrentMonthSubtitle: 'Mes actual',
    statusMenuUrl: 'URL del Menú',
    statusSubscription: 'Suscripción',
    statusTableService: 'Atención en Mesas',
    na: 'N/A',
    orderTable: 'Mesa',

    // Order Product Selector
    orderProducts: 'Productos del Pedido',
    searchProducts: 'Buscar productos...',
    selectProduct: 'Seleccionar producto',
    selectProductOption: 'Selecciona un producto',
    selectVariation: 'Seleccionar variación',
    selectVariationOption: 'Selecciona una variación',
    additionalIngredients: 'Ingredientes adicionales',
    quantity: 'Cantidad',
    addProduct: 'Agregar Producto',
    noProductsAdded: 'No hay productos agregados',
    selectProductsToAdd: 'Selecciona productos para agregar al pedido',
    errorSelectProductVariation: 'Selecciona un producto y variación',

    
    // Orders
    orderManagement: 'Gestión de Pedidos',
    orderNumber: 'Pedido',
    customer: 'Cliente',
    orderType: 'Tipo',
    pickup: 'Recoger',
    Delivery: 'Domicilio',
    table: 'Mesa',
    completedToday: 'Completados Hoy',
    inPreparation: 'En Preparación',
    printTicket: 'Imprimir Ticket',
    confirmOrder: 'Confirmar',
    cancelOrder: 'Cancelar',
    nextStep: 'Siguiente Paso',
    customerInfo: 'Información del Cliente',
    products: 'Productos',
    orderSummary: 'Resumen del Pedido',
    specialInstructions: 'Instrucciones Especiales',
    deliveryAddress: 'Dirección de Entrega',
    references: 'Referencias',
    estimatedTime: 'Tiempo estimado',
    thankYouOrder: '¡Gracias por tu pedido!',
    allDates: 'Todas las fechas',
    productsSectionTitle: 'Resumen del pedido',
    statusUpdatedTitle: 'Estado Actualizado',
    orderStatusUpdated: 'Estado del pedido actualizado',
    orderTypeTitle: 'Tipo de pedido',
    orderStatusMarkedSuccess: 'El estado del pedido ha sido actualizado.',
    orderConfirmedMsg: 'Pedido confirmado',
    orderInPreparationMsg: 'Pedido en preparación',
    orderReadyForDeliveryMsg: 'Pedido listo para entrega',
    orderDeliveredMsg: 'Pedido entregado',
    orderCancelledMsg: 'Pedido cancelado',
    actionConfirm: 'Confirmar',
    actionPrepare: 'Preparar',
    actionMarkReady: 'Marcar Listo',
    actionDeliver: 'Entregar',
    bulkActionCompleteTitle: 'Acción Masiva Completada',
    ordersUpdatedCount: 'pedidos actualizados',
    orderLabel: 'Pedido',
    productsTitle: 'Productos',
    productHeader: 'Producto',
    variationLabel: 'Variación',
    quantityHeader: 'Cantidad',
    priceHeader: 'Precio',
    noteLabel: 'Nota:',
    deliveryLabel: 'Domicilio',
    specialInstructionsTitle: 'Instrucciones Especiales',
    restaurantDefaultName: 'Restaurante',
    newOrderTitle: 'NUEVO PEDIDO',
    orderNumberLabel: 'Pedido #',
    customerSectionTitle: 'CLIENTE',
    deliveryReferencesLabel: 'Referencias',
    tableLabel: 'Mesa',
    orderSummaryTitle: 'RESUMEN DEL PEDIDO',
    estimatedTimeLabel: 'Tiempo estimado',
    defaultPreparationTime: '30-45 minutos',
    thankYouForOrder: 'Gracias por tu pedido!',
    orderUpdateTitle: 'ACTUALIZACIÓN DE PEDIDO',
    statusPendingMessage: 'está *PENDIENTE* de confirmación. Pronto recibirás una actualización',
    statusConfirmedMessage: 'ha sido *CONFIRMADO*. Estamos preparando tu pedido',
    statusPreparingMessage: 'se está *PREPARANDO*',
    statusReadyMessage: 'está *LISTO* para ser recogido/entregado',
    statusDeliveredMessage: 'ha sido *ENTREGADO* exitosamente. ¡Esperamos que lo disfrutes!',
    statusCancelledMessage: 'ha sido *CANCELADO*. Si tienes dudas, contáctanos',
    readyForPickup: 'Tu pedido está listo para recoger.',
    weAreWaitingForYou: 'Te esperamos!',
    readyForDelivery: 'Tu pedido está listo y será entregado pronto.',
    preparingWithCare: 'Estamos preparando tu pedido con mucho cuidado.',
    thankYouForPreference: 'Gracias por tu preferencia!',
    errorTitle: 'Error',
    noPhoneError: 'El pedido no tiene un número de teléfono asociado',
    invalidPhoneError: 'El número de teléfono no es válido. Debe tener al menos 10 dígitos.',
    warningTitle: 'Advertencia',
    popupWarning: 'Por favor permite las ventanas emergentes para abrir WhatsApp',
    successTitle: 'Éxito',
    openingWhatsapp: 'Abriendo WhatsApp...',
    whatsappOpenError: 'No se pudo abrir WhatsApp. Por favor intenta de nuevo.',
    ticketTitle: 'Ticket',
    dianResolutionNumber: 'Resolución DIAN N°',
    rangeLabel: 'Rango',
    taxRegimeSimple: 'Régimen Simple',
    taxRegimeCommon: 'Régimen Común',
    taxRegimeNoIva: 'No responsable de IVA',
    taxRegimeIvaQuestion: '¿Responsable de IVA? *',
    deliveryOrderType: 'Domicilio',
    pickupOrderType: 'Para llevar',
    tableOrderType: 'Mesa',
    ivaLabel: 'IVA (19%)',
    suggestedTipLabel: 'Sí (10% del subtotal)',
    totalWithTipLabel: 'Total con propina',
    thankYouForPurchase: '¡Gracias por su compra!',
    createOrder: 'Crear Pedido',
    bulkActions: 'Acciones Masivas',
    filtersTitle: 'Filtros',
    ordersToday: 'Pedidos Hoy',
    dailySales: 'Ventas del día',
    inProcess: 'En Proceso',
    averageValue: 'Valor Promedio',
    completedOrders: 'Pedidos Completados',
    completionRate: 'Tasa de Finalización',
    totalOrders: 'Pedidos Totales',
    bulkActionLabel: 'Acción Masiva',
    selectActionPlaceholder: 'Seleccionar acción',
    markAsConfirmed: 'Marcar como confirmado',
    markAsPreparing: 'Marcar como en preparación',
    markAsReady: 'Marcar como listo',
    markAsDelivered: 'Marcar como entregado',
    apply: 'Aplicar',
    pendingPlural: 'Pendientes',
    confirmedPlural: 'Confirmados',
    preparingPlural: 'En preparación',
    readyPlural: 'Listos',
    deliveredPlural: 'Entregados',
    cancelledPlural: 'Cancelados',
    allTypes: 'Todos los tipos',
    yesterday: 'Ayer',
    lastWeek: 'Última semana',
    lastMonth: 'Último mes',
    customRange: 'Rango personalizado',
    sortByLabel: 'Ordenar por...',
    noOrdersRegistered: 'No hay pedidos registrados',
    noOrdersFound: 'No se encontraron pedidos',
    noOrdersMessage: 'Los pedidos aparecerán aquí una vez que los clientes empiecen a ordenar.',
    adjustFiltersMessage: 'Intenta ajustar los filtros de búsqueda.',
    sendByWhatsappTitle: 'Enviar por WhatsApp',
    changeToTitle: 'Cambiar a:',
    previous: 'Anterior',
    next: 'Siguiente',
    showing: 'Mostrando',
    of: 'de',
    results: 'resultados',
    orderInfoTitle: 'Información del Pedido',
    customerInfoTitle: 'Información del Cliente',
    nameRequiredLabel: 'Nombre *',
    customerNamePlaceholder: 'Nombre del cliente',
    phoneRequiredLabel: 'Teléfono *',
    customerPhonePlaceholder: 'Teléfono del cliente',
    customerEmailPlaceholder: 'Email del cliente',
    customerAddressPlaceholder: 'Dirección del cliente',
    deliveryAddressLabel: 'Dirección de Entrega',
    deliveryAddressPlaceholder: 'Dirección completa de entrega',
    deliveryReferencesPlaceholder: 'Referencias para encontrar la dirección',
    tableNumberLabel: 'Número de Mesa',
    tableNumberPlaceholder: 'Número de mesa',
    specialInstructionsLabel: 'Instrucciones Especiales',
    specialInstructionsPlaceholder: 'Instrucciones especiales para el pedido...',
    saveOrder: 'Guardar Pedido',
    updateOrder: 'Actualizar Pedido',
    deleteOrder: 'Eliminar Pedido',
    confirmDeleteOrder: '¿Estás seguro que deseas eliminar el pedido',
    irreversibleAction: 'Esta acción es irreversible.',
    namePhoneRequiredError: 'Por favor completa el nombre y teléfono del cliente',
    nameLettersOnlyError: 'El nombre solo puede contener letras y espacios',
    phoneInvalidError: 'El teléfono solo puede contener números y el símbolo +',
    invalidEmailError: 'Por favor ingresa un email válido',
    orderUpdateSuccess: 'El pedido ha sido actualizado exitosamente.',
    orderCreatedTitle: 'Pedido Creado',
    orderCreateSuccess: 'El pedido ha sido creado exitosamente.',
    orderDeletedTitle: 'Pedido Eliminado',
    orderDeleteSuccess: 'El pedido ha sido eliminado exitosamente.',
    customerLabel: 'Cliente',
    addressLabel: 'Dirección',
    dateLabel: 'Fecha',
    subtotalLabel: 'Subtotal',
    totalLabel: 'Total',
    
    // Products
    productManagement: 'Gestión de Menú',
    newProduct: 'Nuevo Producto',
    productName: 'Nombre del Producto',
    category: 'Categoría',
    price: 'Precio',
    variations: 'Variaciones',
    ingredients: 'Ingredientes',
    noProductsInCategory: 'No hay productos en esta categoría',
    productImages: 'Imágenes del Producto',
    variationsAndPrices: 'Variaciones y Precios',
    addVariation: 'Agregar Variación',
    addIngredient: 'Agregar Ingrediente',
    preparationTime: 'Tiempo de Preparación',
    productStatus: 'Estado',
    draft: 'Borrador',
    outOfStock: 'Agotado',
    archived: 'Archivado',
    optional: 'Opcional',
    extraCost: 'Costo extra',
    productUpdated: 'Producto Actualizado',
    productCreated: 'Producto Creado',
    productDeleted: 'Producto Eliminado',
    productArchived: 'Producto Archivado',

    // Product Form
    enterProductName: 'Ingresa el nombre del producto',
    selectCategory: 'Selecciona una categoría',
    enterProductDescription: 'Ingresa la descripción del producto',
    productSKU: 'SKU del Producto',
    productImage: 'Imagen del Producto',
    uploadedImage: 'Imagen cargada',
    uploadImageFromDevice: 'Subir imagen desde dispositivo',
    uploadHighQualityImage: 'Sube una imagen de alta calidad de tu producto. Solo se permite una imagen. Máximo 5MB.',
    productPreview: 'Vista previa del producto',
    imageWillShowInMenu: 'La imagen se mostrará en el menú público',
    noImageAdded: 'No hay imagen agregada',
    uploadImageToShow: 'Sube una imagen para mostrar tu producto',
    variationName: 'Nombre de la variación',
    variationNamePlaceholder: 'Nombre de la variación (ej: Pequeño, Mediano, Grande)',
    priceRequired: 'Precio',
    comparePrice: 'Precio Comparativo',
    priceBeforeDiscount: 'Precio antes del descuento',
    savings: 'Ahorro',
    ingredientsLabel: 'Ingredientes',
    ingredientName: 'Nombre del ingrediente',
    optionalLabel: 'Opcional',
    noIngredientsAdded: 'No hay ingredientes agregados',
    ingredientsAreOptional: 'Los ingredientes son opcionales y permiten personalizar el producto',
    updateProduct: 'Actualizar Producto',
    createProduct: 'Crear Producto',
    fillRequiredFields: 'Por favor completa todos los campos requeridos',
    fileTooLarge: 'es muy grande. Tamaño máximo: 5MB',
    maxSize5MB: 'Tamaño máximo: 5MB',
    onlyOneImageAllowed: 'Solo se permite una imagen',

    
    // Categories
    viewMenu: 'Ver Menú',
    categoryManagement: 'Gestión de Categorías',
    newCategory: 'Nueva Categoría',
    categoryName: 'Nombre de la Categoría',
    noCategoriesCreated: 'No hay categorías creadas',
    createFirstCategory: 'Crea tu primera categoría para organizar tu menú.',
    categoryIcon: 'Icono (Emoji)',
    categoryUpdated: 'Categoría Actualizada',
    messageCategoryUpdated: 'La categoría se ha actualizado correctamente.',
    messageCategoryCreated: 'La nueva categoría se ha añadido a tu menú.',
    messageCategoryDeleted: 'La categoría se ha eliminado de tu menú',
    categoryCreated: 'Categoría Creada',
    categoryDeleted: 'Categoría Eliminada',
    categoryActivated: 'Categoría Activada',
    categoryDeactivated: 'Categoría Desactivada',
    order: 'Orden',
    totalCategories: 'Total Categorías',
    activeCategories: 'Categorías Activas',
    inactiveCategories: 'Categorías Inactivas',
    categoriesTip: 'Arrastra y suelta las categorías para reordenarlas',
    categoriesCreated: 'Creada',
    categoriesDescription: 'Agrega una descripción para ayudar a tus clientes...',
    categoriesNameDes: 'Ej: Pizzas, Bebidas, Postres',
    categoryAppearance: 'Apariencia de la categoría',
    catIconSec: 'Icono (Emoji)',
    catIconDes: 'Usa un emoji para identificar rápidamente',
    catImg: 'Imagen de portada',
    catUpImg: 'Subir imagen',
    catImgRec: 'Recomendado: 600x600px (máx. 5MB)',
    catObligatry: '*Campos obligatorios',
    catDeleteImg: 'Eliminar imagen',
    categoryActivatedDes: 'La categoría ha sido activada y ahora aparece en su menú público.',
    categoryDeactivatedDes: 'La categoría ha sido desactivada y ya no aparece en su menú público.',
    deleteCategoryTitle: '¿Eliminar categoría?',
    deleteCategoryMessage: 'Esta acción eliminará permanentemente la categoría de tu menú. Todos los productos asociados a esta categoría quedarán sin categoría asignada.',
    deleteCategoryButton: 'Eliminar categoría',

    
    // Customers
    deletedSuccessfully: 'Eliminados exitosamente',
    deleteCustomers: 'Eliminar clientes',
    selectedPlural: 'Clientes',
    customerPlural: 'Clientes',
    customerManagement: 'Gestión de Clientes',
    totalCustomers: 'Total Clientes',
    vipCustomers: 'Clientes VIP',
    frequentCustomers: 'Frecuentes',
    averageSpent: 'Gasto Promedio',
    contact: 'Contacto',
    ordersCount: 'Pedidos',
    totalSpent: 'Total Gastado',
    orderTypes: 'Tipos de Pedido',
    segment: 'Segmento',
    lastOrder: 'Último Pedido',
    newCustomer: 'Nuevo',
    deleteCustomer: 'Eliminar cliente',
    makeVip: 'Hacer VIP',
    regular: 'Regular',
    frequent: 'Frecuente',
    vip: 'VIP',
    filtersAndSearch: 'Filtros y Búsqueda',
    customerBase: 'Base de clientes',
    assignedManually: 'Porcentaje asignado',
    averageSpending: 'Gasto Promedio',
    perCustomer: 'Por cliente',
    allStatuses: 'Todos los estados',
    activeLast30Days: 'Activos (últimos 30 días)',
    inactivePlus30Days: 'Inactivos (+30 días)',
    allSegments: 'Todos los segmentos',
    onlyVip: 'Solo VIP',
    onlyFrequent: 'Solo Frecuentes (5+)',
    onlyRegular: 'Solo Regular (2-4)',
    onlyNew: 'Solo Nuevos (1)',
    sortByName: 'Ordenar por Nombre',
    sortByOrders: 'Ordenar por Pedidos',
    sortBySpent: 'Ordenar por Gastado',
    sortByDate: 'Ordenar por Fecha',
    changeToDescending: 'Cambiar a descendente',
    changeToAscending: 'Cambiar a ascendente',
    avg: 'prom',
    segmentVipDescription: 'Asignado manualmente',
    segmentNewDescription: '1 pedido',
    segmentRegularDescription: '2-4 pedidos',
    segmentFrequentDescription: '5+ pedidos',
    segmentNote: '* Un cliente puede ser VIP y tener otro segmento',
    noRegisteredCustomers: 'No hay clientes registrados',
    noCustomersFound: 'No se encontraron clientes',
    customersWillAppear: 'Los clientes aparecerán aquí una vez que realicen pedidos.',
    tryDifferentSearch: 'Intenta con diferentes términos de búsqueda.',
    fullNameRequired: 'Nombre Completo*',
    phoneRequired: 'Teléfono*',
    customerName: 'Nombre del cliente',
    fullAddress: 'Dirección completa',
    deliveryInstructionsPlaceholder: 'Referencias para encontrar la dirección...',
    vipCustomer: 'Cliente VIP',
    saveChanges: 'Guardar Cambios',
    confirmDeletion: 'Confirmar Eliminación',
    deleteCustomerConfirm: '¿Eliminar cliente',
    actionWillDeletePermanently: 'Esta acción eliminará permanentemente:',
    allCustomerInfo: 'Toda la información del cliente',
    associatedOrders: 'pedido(s) asociado(s)',
    purchaseHistory: 'Historial de compras',
    customerVipStatus: 'Estado VIP del cliente',
    bulkEdit: 'Edición Masiva',
    customersSelected: 'cliente(s) seleccionado(s)',
    selectActionToPerform: 'Selecciona la acción a realizar:',
    markAsVip: 'Marcar como VIP',
    addVipStatusToSelected: 'Agregar estado VIP a todos los clientes seleccionados',
    removeVip: 'Eliminar de VIP',
    removeVipStatusFromSelected: 'Quitar estado VIP de todos los clientes seleccionados',
    permanentlyDeleteAllCustomersAndOrders: 'Eliminar permanentemente todos los clientes y sus pedidos',
    importCustomersFromCSV: 'Importar Clientes desde CSV',
    csvFileFormat: 'Formato del archivo CSV:',
    customerFullName: 'Nombre completo del cliente',
    uniquePhoneNumber: 'Número de teléfono único',
    emailAddress: 'Correo electrónico',
    additionalDirections: 'Indicaciones adicionales',
    or: 'o',
    downloadExampleTemplate: 'Descargar plantilla de ejemplo',
    preview: 'Vista previa',
    line: 'Línea',
    validCustomers: 'cliente(s) válido(s)',
    searchCustomersPlaceholder: 'Clientes por nombre, teléfono o email...',
    customersTemplate: 'plantilla_clientes',
    averagePerOrder: 'Promedio por Pedido',
    isVip: 'Es VIP',
    exampleDeliveryInstruction1: 'Casa de dos pisos portón azul',
    exampleDeliveryInstruction2: 'Apartamento 301 edificio blanco',
    vipCustomerRemoved: 'Cliente VIP Removido',
    vipCustomerAdded: 'Cliente VIP Agregado',
    noLongerVipCustomer: 'ya no es un cliente VIP.',
    nowVipCustomer: 'ahora es un cliente VIP.',
    noSelection: 'Sin selección',
    selectAtLeastOneCustomer: 'Selecciona al menos un cliente para editar.',
    vipAssigned: 'VIP Asignado',
    markedAsVipPlural: 'marcado(s) como VIP.',
    vipRemoved: 'VIP Removido',
    noLongerVipPlural: 'ya no es/son VIP.',
    customersDeleted: 'Clientes Eliminados',
    deletedSuccessfullyPlural: 'eliminado(s) exitosamente.',
    confirmDeleteMultiple: '¿Estás seguro de que quieres eliminar',
    warningDeleteAction: 'Esta acción eliminará también todos sus pedidos y no se puede deshacer.',
    customerUpdated: 'Cliente Actualizado',
    customerInfoUpdatedSuccessfully: 'La información del cliente ha sido actualizada exitosamente.',
    customerAndOrdersDeleted: 'El cliente y todos sus pedidos han sido eliminados.',
    noDataToExport: 'Sin datos para exportar',
    noCustomersMatchFilters: 'No hay clientes que coincidan con los filtros actuales.',
    csvExported: 'CSV Exportado',
    exportedSuccessfullyPlural: 'Se han exportado los cliente(s) exitosamente.',
    templateDownloaded: 'Plantilla Descargada',
    useTemplateAsGuide: 'Usa esta plantilla como guía para importar clientes.',
    invalidFile: 'Archivo inválido',
    pleaseSelectValidCSV: 'Por favor selecciona un archivo CSV válido.',
    emptyFile: 'Archivo vacío',
    csvFileIsEmpty: 'El archivo CSV está vacío.',
    readError: 'Error de lectura',
    couldNotReadFile: 'No se pudo leer el archivo. Por favor intenta de nuevo.',
    csvEmptyOrNoData: 'El archivo CSV está vacío o no tiene datos.',
    missingRequiredColumnsMsg: 'Columnas requeridas faltantes: {columns}. Columnas encontradas: {found}',
    lineIncorrectColumnsMsg: 'Línea {line}: Número incorrecto de columnas (esperado {expected}, obtenido {got}). Valores: [{values}]',
    lineNameRequired: 'Línea {line}: El nombre es requerido',
    lineNameOnlyLetters: 'Línea {line}: El nombre "{name}" solo puede contener letras y espacios',
    linePhoneRequired: 'Línea {line}: El teléfono es requerido',
    linePhoneOnlyNumbers: 'Línea {line}: El teléfono "{phone}" solo puede contener números y el símbolo +',
    lineEmailInvalidFormat: 'Línea {line}: El email "{email}" no tiene un formato válido',
    lineCustomerAlreadyExists: 'Línea {line}: El cliente con teléfono {phone} ya existe',
    noData: 'Sin datos',
    fileContainsNoData: 'El archivo no contiene datos para importar.',
    validationErrors: 'Errores de validación',
    validationError: 'Error de validación',
    nameRequiredError: 'El nombre es obligatorio',
    nameInvalid: 'El nombre solo puede contener letras y espacios',
    phoneRequiredError: 'El teléfono es obligatorio',
    phoneInvalid: 'El teléfono solo puede contener números y los caracteres: + - ( ) espacio',
    emailInvalid: 'El formato del correo electrónico no es válido',
    customerAlreadyExists: 'Ya existe un cliente con este teléfono',
    errorsFoundMsg: 'Se encontraron {count} error(es). Revisa el archivo y corrige los errores.',
    partialImport: 'Importación parcial',
    validRecordsAndErrorsMsg: '{valid} registro(s) válido(s) y {errors} error(es) encontrado(s).',
    dataValidated: 'Datos validados',
    customersReadyToImportMsg: '{count} cliente(s) listo(s) para importar.',
    importSuccessful: 'Importación Exitosa',
    customersImportedMsg: 'Se importaron {count} cliente(s) exitosamente.',
    errorsFoundCount: 'Se encontraron {count} error(es):',
    editSelected: 'Editar {count} seleccionado(s)',
    editCustomer: 'Editar cliente',
    ordersPlus: '5+ pedidos',
    new: 'nuevo(s)',
    deliveryInstructions: 'Instrucciones del domicilio',
    customerDeleted: 'El cliente fue eliminado',
    importCSV: 'Importar CSV',
    exportCSV: 'Exportar CSV',
    
    // Settings
    generalSettings: 'Configuración General',
    regionalSettings: 'Configuración Regional',
    language: 'Idioma',
    currency: 'Moneda',
    businessHours: 'Horarios de Atención',
    deliverySettings: 'Configuración de Domicilio',
    tableOrders: 'Pedidos en Mesa',
    qrCodes: 'Códigos QR',
    themeSettings: 'Configuración de Tema',
    socialMedia: 'Redes Sociales',
    notifications: 'Notificaciones',
    restaurantInfo: 'Información del Restaurante',
    contactInfo: 'Información de Contacto',
    businessInfo: 'Información del Negocio',
    operationalSettings: 'Configuración Operacional',
    minimumOrder: 'Pedido Mínimo',
    deliveryCost: 'Costo de Domicilio',
    deliveryZones: 'Zonas de Domicilio',
    numberOfTables: 'Número de Mesas',
    enableQRCodes: 'Habilitar Códigos QR',
    printAll: 'Imprimir Todos',
    downloadAll: 'Descargar Todos',
    mesa: 'Mesa',
    // TABS
    tab_general: 'General',
    tab_hours: 'Horarios',
    tab_social: 'Redes Sociales',
    tab_delivery: 'Domicilio',
    tab_table_orders: 'Pedidos en Mesa',
    tab_promo: 'Promocional',
    tab_theme: 'Tema',
    tab_billing: 'Facturación',
    tab_support: 'Soporte',
    // TITLES & LABELS
    settings_title: 'Ajustes del Restaurante',
    save_button: 'Guardar Cambios',
    visual_identity_title: 'Identidad Visual',
    logo_subtitle: 'Logo de tu restaurante',
    no_logo: 'Sin logo',
    change_logo_button: 'Cambiar Logo',
    upload_logo_button: 'Subir Logo',
    delete_button: 'Eliminar',
    restaurant_info_title: 'Información del Restaurante',
    contact_location_subtitle: 'Información de contacto y ubicación',
    restaurant_name_label: 'Nombre del Restaurante',
    email_label: 'Correo Electrónico',
    phone_label: 'Teléfono',
    address_label: 'Dirección',
    description_label: 'Descripción',
    regional_settings_title: 'Ajustes Regionales',
    language_currency_subtitle: 'Idioma y moneda del sistema',
    language_label: 'Idioma',
    currency_label: 'Moneda',
    public_menu_title: 'Menú Público',
    public_menu_description: 'Comparte este enlace con tus clientes para que puedan ver tu menú y realizar pedidos',
    your_custom_url_label: 'Tu URL personalizada:',
    copy_button: 'Copiar',
    view_menu_button: 'Ver Menú',
    opening_hours_title: 'Horarios de Atención',
    opening_hours_subtitle: 'Configura los horarios en los que tu restaurante está abierto.',
    day_of_week_header: 'Día de la Semana',
    status_header: 'Estado',
    opening_time_header: 'Horario de Apertura',
    opening_time_label: 'Apertura',
    closing_time_label: 'Cierre',
    social_media_title: 'Redes Sociales',
    social_media_subtitle: 'Conecta tus redes sociales para aparecer en tu menú público',
    delivery_rates_title: 'Tarifas de Domicilio',
    rate_name_label: 'Nombre de la Tarifa',
    coverage_radius_km_label: 'Radio de cobertura (km)',
    shipping_cost_cop_label: 'Costo de envío (COP)',
    min_order_value_cop_label: 'Valor mínimo de pedido (COP)',
    add_rate_button: 'Añadir Tarifa',
    table_orders_settings_title: 'Configuración de Pedidos en Mesa',
    number_of_tables_label: 'Número de Mesas',
    table_qr_codes_title: 'Códigos QR de Mesas',
    table_qr_codes_description: 'Los códigos QR permiten a los clientes acceder directamente al menú desde su mesa.',
    table_label: 'Mesa',
    download_png_button: 'Descargar PNG',
    print_qr_button: 'Imprimir QR',
    theme_customization_title: 'Personalización de Tema',
    theme_customization_subtitle: 'Configura los colores, tipografía y estilos de tu menú público',
    color_templates_title: 'Plantillas de Colores',
    color_templates_subtitle: 'Selecciona una plantilla predefinida o personaliza tus colores manualmente',
    dark_mode_templates: 'Modo Oscuro',
    manual_customization_title: 'Personalización Manual',
    primary_color_label: 'Color Primario',
    primary_color_hint: 'Botones principales, iconos, textos principales',
    secondary_color_label: 'Color Secundario',
    secondary_color_hint: 'Pathforms',
    menu_bg_color_label: 'Color de Fondo del Menú',
    menu_bg_color_hint: 'Fondo principal del menú',
    card_bg_color_label: 'Color de las Tarjetas y Fondo',
    card_bg_color_hint: 'Tarjetas de productos',
    primary_text_color_label: 'Color Texto Primario',
    primary_text_color_hint: 'Títulos y textos principales',
    secondary_text_color_label: 'Color Texto Secundario',
    secondary_text_color_hint: 'Descripciones y subtítulos',
    pathforms_label: 'Activar o desactivar Pathforms',
    pathforms_hint: 'Habilita esta opción para mostrar las formas decorativas que aparecen en el fondo de la página.',
    billing_settings_title: 'Configuración de Facturación',
    restaurant_info_billing_title: 'Información del Restaurante',
    commercial_name_label: 'Nombre Comercial *',
    commercial_name_hint: 'El nombre que aparecerá en los tickets',
    social_reason_label: 'Razón Social *',
    legal_company_name: 'Opcional - Nombre legal de la empresa',
    nit_label: 'NIT *',
    tax_regime_label: 'Régimen Tributario *',
    iva_responsible_label: 'Responsable de IVA',
    has_dian_resolution_label: '¿Tiene Resolución DIAN? *',
    department_label: 'Departamento *',
    city_label: 'Ciudad *',
    address_billing_label: 'Dirección *',
    phone_billing_label: 'Teléfono *',
    email_billing_label: 'Correo Electrónico *',
    fiscal_billing_information: 'Información fiscal',
    dian_resolution_data_title: 'Datos de la Resolución DIAN',
    resolution_number_label: 'Número de Resolución *',
    resolution_date_label: 'Fecha de Resolución *',
    numbering_range_label: 'Rango de Numeración - Desde *',
    numbering_range_label_to: 'Rango de Numeración - Hasta *',
    from_label: 'Desde',
    to_label: 'Hasta',
    tax_tip_settings_title: 'Configuración Propina',
    suggested_tip_label: '¿Aplicar Propina Sugerida?',
    ticket_customization_title: 'Personalización del Ticket',
    show_logo_on_ticket_label: '¿Mostrar logo en el ticket?',
    ticket_logo_label: 'Logo para el ticket',
    ticket_current_logo: 'Logo actual',
    ticket_buttom_logo_change: 'Click para cambiar',
    ticket_buttom_logo_change_hint: 'PNG o JPG. Máximo 1MB. Se recomienda 200x200px',
    ticket_final_message_label: 'Mensaje Final del Ticket (opcional)',
    ticket_message_hint: '¡Gracias por tu visita! Esperamos verte pronto.',
    ticket_message_hint2: 'Este mensaje aparecerá al final de cada ticket',
    ticket_final_tips_title: 'Sobre la configuración de facturación:',
    ticket_final_tip1: 'Estos datos se utilizarán para generar tickets de pedido legalmente válidos en Colombia',
    ticket_final_tip2: 'Si eres responsable de IVA, el IVA se calculará y mostrará en cada ticket',
    ticket_final_tip3: 'La resolución DIAN es requerida para facturación electrónica',
    ticket_final_tip4: 'La propina es opcional y aparecerá como sugerencia al cliente',
    ticket_final_tip5: 'Asegúrate de mantener esta información actualizada',
    promo_settings_title: 'Configuración Promocional',
    promo_settings_subtitle: 'Configura la imagen promocional y los productos destacados en tu menú público',
    vertical_promo_image_label: 'Imagen Promocional Vertical',
    vertical_promo_image_hint: 'Sube una imagen que aparecerá al hacer clic en el botón de promociones en el menú público',
    promo_image_current: 'Imagen promocional actual',
    promo_image_current_hint: 'Se mostrará al hacer clic en el botón de promoción',
    upload_vertical_imagen_promo: 'Subir imagen promocional vertical',
    upload_vertical_imagen_promo_hint: 'Recomendado: 600x900px (formato vertical). Máximo 5MB. Formatos: JPG, PNG, WebP',
    featured_products_title: 'Productos',
    featured_products_hint: 'Selecciona hasta 5 productos para mostrar en el carrusel de destacados',
    featured_products_label: 'Destacado',
    featured_products_tip_title: 'Consejos para promociones:',
    featured_products_tip1: 'La imagen promocional aparecerá al hacer clic en el botón de regalo',
    featured_products_tip2: 'Los productos destacados aparecerán en un carrusel en la parte superior del menú',
    featured_products_tip3: 'Usa imágenes atractivas y de calidad de tus productos destacados',
    featured_products_tip4: 'Selecciona tus mejores productos o los que tengan promociones especiales',
    technical_support_title: 'Soporte Técnico',
    technical_support_subtitle: '¿Necesitas ayuda? Completa el formulario y nuestro equipo te contactará pronto.',
    create_new_ticket: 'Crear Nuevo Ticket de Soporte',
    subject_label: 'Asunto *',
    subject_placeholder: 'Describe el problema',
    priority_label: 'Prioridad',
    priority_option1: 'Baja - No es urgente',
    priority_option2: 'Media - Respuesta en 24-48h',
    priority_option3: 'Alta - Respuesta en 2-8h',
    priority_option4: 'Urgente - Respuesta inmediata',
    category_label: 'Categoría',
    support_general: 'Consulta General',
    support_problem: 'Problema Técnico',
    support_billing: 'Facturación',
    support_function: 'Solicitud de Función',
    support_account: 'Cuenta y Configuración',
    support_other: 'Otro',
    message_label: 'Mensaje *',
    contact_email_label: 'Email de Contacto *',
    contact_phone_label: 'Teléfono de Contacto (opcional)',
    support_problem_description: 'Descripción del Problema o Consulta *',
    support_problem_description_hint: 'Describe detalladamente tu consulta o problema. Incluye pasos para reproducir el problema si es técnico.',
    send_ticket_button: 'Enviar Ticket',
    other_support_channels: 'Otros canales de soporte:',
    ticket_sent_title: 'Ticket Enviado',
    my_support_tickets_title: 'Mis Tickets de Soporte',
    support_message_note_description: 'Los tickets se almacenan localmente y se envían automáticamente a nuestro sistema de soporte. Recibirás una respuesta en el email de contacto proporcionado.',
    support_direct_email: '📧 Email directo: ',
    support_days: '⏰ Horario de atención: Lunes a Viernes, 9:00 AM - 6:00 PM',
    support_time: '🕐 Tiempo de respuesta típico: 2-24 horas según prioridad',
    id_header: 'ID',
    subject_header: 'Asunto',
    date_header: 'Fecha',
    view_details_button: 'Ver Detalles',
    clear_form_button: 'Limpiar Formulario',
    ticket_detail_modal_title: 'Detalle del Ticket',
    ticket_info_title: 'Información del Ticket',
    ticket_id_label: 'ID del Ticket',
    support_original_message: 'Tu mensaje',
    opened_by_label: 'Abierto por',
    creation_date_label: 'Fecha de Creación',
    last_update_label: 'Última Actualización',
    client_message_title: 'Mensaje del Cliente',
    admin_response_title: 'Respuesta del equipo de soporte',
    support_information_response: 'Respondido el:',
    additional_notes_title: 'Notas Adicionales',
    awaiting_response_title: 'Esperando Respuesta',
    awaiting_response_text: 'Tu ticket está siendo revisado por nuestro equipo. Te contactaremos pronto.',
    close_button: 'Cerrar',
    // STATUS/PRIORITY/CATEGORY
    status_pending: 'Pendiente',
    status_in_progress: 'En Progreso',
    status_resolved: 'Resuelto',
    status_closed: 'Cerrado',
    status_unknown: 'Desconocido',
    status_closed_simple: 'Cerrado',
    priority_urgent: 'Urgente',
    priority_high: 'Alta',
    priority_medium: 'Media',
    priority_low: 'Baja',
    category_general_name: 'Consulta General',
    category_technical_name: 'Problema Técnico',
    category_billing_name: 'Facturación',
    category_feature_name: 'Solicitud de Función',
    category_account_name: 'Cuenta y Configuración',
    category_other_name: 'Otro',
    enabled: 'Habilitado',
    disabled: 'Deshabilitado',
    regime_simple: 'Régimen Simple de Tributación',
    regime_common_iva: 'Régimen Común de IVA',
    // DAYS
    day_monday: 'Lunes',
    day_tuesday: 'Martes',
    day_wednesday: 'Miércoles',
    day_thursday: 'Jueves',
    day_friday: 'Viernes',
    day_saturday: 'Sábado',
    day_sunday: 'Domingo',
    // SOCIAL MEDIA
    social_facebook: 'Facebook',
    social_instagram: 'Instagram',
    social_twitter: 'Twitter / X',
    social_whatsapp: 'WhatsApp',
    social_youtube: 'Youtube',
    // TEMPLATES
    colorTemplate1: 'Azul Océano',
    colorTemplate2: 'Modo Nocturno',
    colorTemplate3: 'Jardín Natural',
    colorTemplate4: 'Rojo Oscuro',
    colorTemplate5: 'Atardecer Dorado',
    colorTemplate6: 'Océano Profundo',
    colorTemplate7: 'Rosa Vibrante',
    colorTemplate8: 'Noche Violeta',
    colorTemplate9: 'Bosque Nocturno',
    colorTemplate10: 'Naranja Energía',
    colorTemplate11: 'Lavanda Suave',
    colorTemplate12: 'Minimalista Dark',
    // Typography
    typography_title: 'Tipografía',
    primary_font_label: 'Fuente primaria',
    primary_font_hint: 'Fuente para body y textos generales',
    secondary_font_label: 'Fuente secundaria',
    secondary_font_hint: 'Para títulos y destacados',
    font_size_title_label: 'Tamaño título',
    font_size_subtitle_label: 'Tamaño subtítulo',
    font_size_normal_label: 'Tamaño normal',
    font_size_example_hint: 'Ej: 32px',
    // MESSAGES/HINTS/ERRORS
    config_saved_title: 'Configuración Guardada',
    changes_saved_success: 'Los cambios han sido guardados exitosamente.',
    file_too_large_title: 'Archivo muy grande',
    max_size_5mb_error: 'El tamaño máximo es 5MB',
    recommended_specs_title: 'Especificaciones recomendadas',
    accepted_formats_list: 'Formatos aceptados: JPG, PNG o GIF',
    optimal_dimensions_list: 'Dimensiones óptimas: 500x500px o superior',
    max_size_list: 'Tamaño máximo: 5MB',
    prefer_transparent_bg_list: 'Preferible fondo transparente (PNG)',
    restaurant_name_placeholder: 'Ej: Restaurante El Buen Sabor',
    email_placeholder: 'contacto@restaurante.com',
    required_for_whatsapp: 'Necesario para recibir pedidos por WhatsApp',
    address_placeholder: 'Calle 123 #45-67, Bogotá',
    description_placeholder: 'Describe tu restaurante: especialidad, ambiente, historia, qué te hace único...',
    max_500_chars_hint: 'Máximo 500 caracteres',
    language_es_option: '🇪🇸 Español',
    language_en_option: '🇺🇸 English',
    language_selector_hint: 'Define el idioma de la interfaz de administración',
    currency_cop_option: '🇨🇴 Peso Colombiano (COP)',
    currency_usd_option: '🇺🇸 Dólar (USD)',
    currency_eur_option: '🇪🇺 Euro (EUR)',
    currency_mxn_option: '🇲🇽 Peso Mexicano (MXN)',
    currency_ars_option: '🇦🇷 Peso Argentino (ARS)',
    currency_clp_option: '🇨🇱 Peso Chileno (CLP)',
    currency_pen_option: '🇵🇪 Sol Peruano (PEN)',
    currency_selector_hint: 'Moneda para mostrar precios en tu menú',
    copied_title: 'Copiado',
    url_copied_success: 'URL copiada al portapapeles',
    hours_hint_public_menu: 'Los horarios se muestran en tu menú público',
    hours_hint_open_closed: 'Los clientes verán si estás abierto o cerrado',
    hours_hint_different_days: 'Puedes configurar diferentes horarios para cada día',
    about_social_media_title: 'Sobre las redes sociales:',
    social_hint_footer: 'Los enlaces aparecerán en el footer de tu menú público',
    social_hint_full_urls: 'Asegúrate de usar URLs completas (https://...)',
    social_hint_whatsapp_format: 'Para WhatsApp, usa el formato internacional (+código país + número)',
    social_hint_icons: 'Los iconos se mostrarán automáticamente según la red social',
    rate_value_number_error: 'El valor de la tarifa debe ser un número.',
    important_qr_info_title: 'Información importante sobre QR:',
    qr_hint_unique_code: 'Cada mesa tendrá su propio código QR único',
    qr_hint_scan_to_menu: 'Los clientes escanean el código para acceder al menú',
    qr_hint_table_auto_detect: 'El número de mesa se detecta automáticamente',
    qr_hint_print_download: 'Puedes imprimir y descargar cada código QR individualmente',
    about_customization_title: 'Sobre la personalización:',
    theme_hint_auto_apply: 'Los cambios se aplicarán automáticamente en tu menú público',
    theme_hint_preview: 'Puedes previsualizar los cambios guardando la configuración',
    theme_hint_contrast: 'Asegúrate de que los colores tengan buen contraste para legibilidad',
    theme_hint_font_css: 'Los tamaños de fuente aceptan valores CSS (px, rem, em)',
    field_required_error: 'Este campo es obligatorio.',
    nit_invalid_error: 'El NIT no es válido.',
    select_department_first_hint: 'Selecciona primero el departamento',
    ticket_final_message_placeholder: 'Ej: Gracias por tu compra! Vuelve pronto.',
    notes_about_billing_title: 'Notas sobre Facturación:',
    billing_hint_legal_tickets: 'Importante para la generación de tickets de pedido legalmente válidos en Colombia',
    billing_hint_iva_calc: 'Si eres responsable de IVA, el IVA se calculará y mostrará en cada ticket',
    billing_hint_dian_fe: 'La resolución DIAN es requerida para facturación electrónica',
    billing_hint_tip_optional: 'La propina sugerida se calculará automáticamente como el 10% del subtotal y se mostrará al final del ticket. El cliente puede decidir si desea incluirla o no.',
    billing_hint_keep_updated: 'Asegúrate de mantener esta información actualizada',
    max_5_products_error: 'Máximo 5 productos seleccionados',
    featured_products_selected: 'de 5 productos seleccionados',
    message_placeholder: 'Tu mensaje detallado...',
    ticket_sent_success_message: 'Tu solicitud de soporte ha sido enviada con éxito. Te responderemos lo antes posible.',
    admin_no_response_yet: 'El administrador aún no ha respondido a este ticket.',
    select_department: 'Selecciona un Departamento',
    select_city: 'Selecciona una Ciudad',
    view_offers: 'Ver Ofertas', // Added missing key from initial state
    actions_header: 'Acciones',
    // Placeholders for social media, added for completeness
    facebook_placeholder: 'https://facebook.com/tu-restaurante',
    instagram_placeholder: 'https://instagram.com/tu-restaurante',
    twitter_placeholder: 'https://twitter.com/tu-restaurante',
    whatsapp_placeholder: '+57 300 123 4567',
    youtube_placeholder: 'https://youtube.com/tu-canal',
    tiktok_placeholder: 'https://tiktok.com/@tu-restaurante',
    website_label: 'Sitio Web',
    website_placeholder: 'https://tu-restaurante.com',
    // Additional Settings Strings
    status_closed_unknown: 'Desconocido',
    config_toast_error: 'Error',
    config_toast_error1: 'Hubo un problema al guardar la configuración.',
    config_toast_error2: 'Hubo un problema al enviar la solicitud de soporte.',
    config_hours_subtitle: 'Configura los horarios de atención de tu restaurante',
    preparation_time_title: 'Tiempo de Preparación',
    prep_time_label: 'Tiempo estimado de preparación',
    prep_time_placeholder: 'Ej: 30-45 minutos',
    prep_time_hint: 'Este es el tiempo que se mostrará a los clientes como estimación de preparación de sus pedidos',
    opening_hours_section: 'Horarios de Atención',
    hours_open_label: 'Apertura',
    hours_close_label: 'Cierre',
    important_info: 'Información importante:',
    hours_show_public: 'Los horarios se muestran en tu menú público',
    hours_show_status: 'Los clientes verán si estás abierto o cerrado',
    hours_different_days: 'Puedes configurar diferentes horarios para cada día',
    about_social_media: 'Sobre las redes sociales:',
    social_footer_hint: 'Los enlaces aparecerán en el footer de tu menú público',
    social_full_urls: 'Asegúrate de usar URLs completas (https://...)',
    social_whatsapp_format: 'Para WhatsApp, usa el formato internacional (+código país + número)',
    social_auto_icons: 'Los iconos se mostrarán automáticamente según la red social',
    rate_name_placeholder: 'Estándar, Express, Premium...',
    min_order_label: 'Pedido Mínimo ($)',
    max_order_label: 'Pedido Máximo ($)',
    shipping_cost_label: 'Costo ($)',
    rate_value_error: 'El valor de la tarifa debe ser un número.',
    table_settings_title: 'Configuración de Pedidos en Mesa',
    qr_codes_title: 'Códigos QR de Mesas',
    qr_codes_description: 'Los códigos QR permiten a los clientes acceder directamente al menú desde su mesa.',
    important_qr_info: 'Información importante sobre QR:',
    qr_unique_code: 'Cada mesa tendrá su propio código QR único',
    qr_scan_menu: 'Los clientes escanean el código para acceder al menú',
    qr_auto_detect: 'El número de mesa se detecta automáticamente',
    qr_print_download: 'Puedes imprimir y descargar cada código QR individualmente',
    menu_bg_label: 'Color de Fondo del Menú',
    menu_bg_hint: 'Fondo principal del menú',
    card_bg_label: 'Color de las Tarjetas y Fondo',
    card_bg_hint: 'Tarjetas de productos',
    primary_text_label: 'Color Texto Primario',
    primary_text_hint: 'Títulos y textos principales',
    secondary_text_label: 'Color Texto Secundario',
    secondary_text_hint: 'Descripciones y subtítulos',
    about_customization: 'Sobre la personalización:',
    theme_auto_apply: 'Los cambios se aplicarán automáticamente en tu menú público',
    theme_preview: 'Puedes previsualizar los cambios guardando la configuración',
    theme_contrast: 'Asegúrate de que los colores tengan buen contraste para legibilidad',

    // Analytics
    totalRevenue: 'Ingresos Totales',
    averageTicket: 'Ticket Promedio',
    monthlyOrders: 'Pedidos por Mes',
    ordersByType: 'Pedidos por Tipo',
    ordersByStatus: 'Estados de Pedidos',
    topProducts: 'Productos Más Vendidos',
    recentActivity: 'Actividad Reciente',
    filterByDates: 'Filtrar por Fechas',
    from: 'Desde',
    to: 'Hasta',
    clearFilters: 'Limpiar Filtros',
    showingDataFrom: 'Mostrando datos desde',
    until: 'hasta',
    today: 'Hoy',
    notEnoughData: 'No hay datos suficientes para mostrar',
    noSalesYet: 'No hay ventas registradas aún',
    sold: 'vendidos',
    analyticsToastNoData: "No hay datos para exportar con los filtros actuales.",
    analyticsToastExportSuccess: "Reporte de estadísticas exportado exitosamente.",
    csvReportTitle: "REPORTE DE ESTADÍSTICAS",
    csvRestaurantLabel: "Restaurante",
    csvGenerationDate: "Fecha de Generación",
    csvPeriodLabel: "Período Analizado",
    csvAllPeriods: "Todos los Períodos",
    csvExecutiveSummary: "RESUMEN EJECUTIVO",
    csvTotalOrders: "Total de Pedidos",
    csvCompletedOrders: "Pedidos Completados",
    csvCancelledOrders: "Pedidos Cancelados",
    csvCompletionRate: "Tasa de Finalización",
    csvTotalRevenue: "Ingresos Totales",
    csvAverageTicket: "Ticket Promedio",
    csvOrderTypeDistribution: "DISTRIBUCIÓN POR TIPO DE PEDIDO",
    csvOrderStatusDistribution: "DISTRIBUCIÓN POR ESTADO",
    orderTypePickup: "Recoger en Local",
    orderTypeDelivery: "Domicilio",
    orderTypeTable: "En Mesa",
    orderStatusPendingPlural: "Pedidos Pendientes",
    orderStatusConfirmedPlural: "Pedidos Confirmados",
    orderStatusPreparing: "En Preparación",
    orderStatusReadyPlural: "Pedidos Listos",
    orderStatusDeliveredPlural: "Pedidos Entregados",
    orderStatusCancelledPlural: "Pedidos Cancelados",
    csvTopSellingProducts: "PRODUCTOS MÁS VENDIDOS",
    csvPosition: "Posición",
    csvProduct: "Producto",
    csvQuantitySold: "Cantidad Vendida",
    csvRevenue: "Ingreso",
    csvSalesByCategory: "VENTAS POR CATEGORÍA",
    csvCategory: "Categoría",
    csvProductCount: "Cantidad de Productos",
    csvNoCategory: "Sin Categoría",
    csvSalesByDay: "VENTAS POR DÍA DE LA SEMANA",
    csvDay: "Día",
    csvOrderCount: "Cant. Pedidos",
    daySunday: "Domingo",
    dayMonday: "Lunes",
    dayTuesday: "Martes",
    dayWednesday: "Miércoles",
    dayThursday: "Jueves",
    dayFriday: "Viernes",
    daySaturday: "Sábado",
    csvOrderDetails: "DETALLE COMPLETO DE PEDIDOS",
    csvOrderNumber: "N° Pedido",
    csvDate: "Fecha",
    csvTime: "Hora",
    csvCustomer: "Cliente",
    csvPhone: "Teléfono",
    csvEmail: "Email",
    csvOrderType: "Tipo de Pedido",
    csvStatus: "Estado",
    csvSubtotal: "Subtotal",
    csvDeliveryCost: "Costo Envío",
    csvTotal: "Total",
    csvPaymentMethod: "Método de Pago",
    csvItems: "Items",
    csvSpecialNotes: "Notas Especiales",
    csvItemsSoldDetails: "DETALLE DE ITEMS VENDIDOS",
    csvVariation: "Variación",
    csvUnitPrice: "Precio Unitario",
    fileNameRestaurantDefault: "Restaurante",
    fileNamePrefixFrom: "Desde",
    fileNamePrefixUntil: "Hasta",
    analyticsPageTitle: "Estadísticas del Restaurante",
    btnExportCSV: "Exportar CSV",
    btnAdvancedFilters: "Filtros Avanzados",
    filterDateRange: "Rango de Fechas",
    filterDateStart: "Fecha de inicio",
    filterDateUntil: "Fecha de fin",
    filterCategory: "Filtrar por Categoría",
    filterAllCategories: "Todas las categorías",
    filterOrderType: "Filtrar por Tipo de Pedido",
    filterAllTypes: "Todos los tipos",
    filterStatus: "Filtrar por Estado",
    filterAllStatuses: "Todos los estados",
    filterActiveLabel: "Filtros Activos",
    filterDateStartShort: "Inicio",
    filterDateToday: "Hoy",
    btnClearAllFilters: "Limpiar Todos los Filtros",
    filterSummaryShowing: "Mostrando",
    filterSummaryOrderPlural: "pedidos",
    filterSummaryOrderSingular: "pedido",
    filterSummaryMatchingFilters: " que coinciden con los filtros.",
    filterSummaryInTotal: " en total.",
    analyticsLastUpdated: "Última actualización",
    statTotalOrders: "Total de Pedidos",
    statCompletedSubtitle: "completados",
    statTotalRevenue: "Ingresos Totales",
    statDeliveredOrdersSubtitle: "de pedidos entregados",
    statAverageTicket: "Ticket Promedio",
    statPerOrderSubtitle: "por pedido entregado",
    statActiveProducts: "Productos Activos",
    statOf: "de",
    statTotal: "total",
    chartOrdersByType: "Distribución por Tipo de Pedido",
    chartOrdersByMonth: "Pedidos por Mes (Últimos 6)",
    chartNoData: "No hay datos disponibles para el rango de fechas seleccionado.",
    chartOrderStatus: "Distribución por Estado de Pedido",
    orderStatusPending: "Pendiente",
    orderStatusConfirmed: "Confirmado",
    orderStatusReady: "Listo",
    orderStatusDelivered: "Entregado",
    orderStatusCancelled: "Cancelado",
    orderStatusUnknown: "Desconocido",
    chartTopProductsTitle: 'Productos Más Vendidos',
    chartNoProducts: 'No hay ventas registradas aún',
    unitsSold: 'vendidos',
    recentOrdersTitle: 'Pedidos Recientes',
    customerUnknown: 'N/A',
    
    // Subscription
    subscriptionPlans: 'Planes de Suscripción',
    choosePlan: 'Seleccionar Plan',
    currentPlan: 'Plan Actual',
    planActivated: '¡Plan Activado!',
    freePlan: 'Gratis',
    basicPlan: 'Basic',
    proPlan: 'Pro',
    businessPlan: 'Business',
    mostPopular: 'Más Popular',
    unlimited: 'ilimitados',
    upTo: 'Hasta',
    advancedStats: 'Estadísticas avanzadas',
    customDomain: 'Dominio personalizado',
    prioritySupport: 'Soporte prioritario',
    advancedCustomization: 'Personalización avanzada',
    perfectToStart: 'Perfecto para empezar',
    forGrowingRestaurants: 'Para restaurantes en crecimiento',
    forChainsAndFranchises: 'Para cadenas y franquicias',
    needHelp: '¿Necesitas ayuda para elegir?',
    allPlansInclude: 'Todos los planes incluyen acceso completo a nuestro sistema de gestión de menús y pedidos.',
    canChangeAnytime: 'Puedes cambiar de plan en cualquier momento.',
    
    // Public Menu
    charging_public_menu: 'Cargando menú...',
    presenting_featured_products: 'Te presentamos nuestros',
    presenting_featured_products1: 'DESTACADOS',
    title_public_menu: 'Menú público',
    description_public_menu: 'Comparte este link con tus clientes para que puedan ver tu menú y crear ordenes',
    your_custom_url: 'Tu URL personalizada:',
    copy: 'Copiar',
    copied_title_public_menu: 'Copiado',
    copied_message: 'URL copiada en el portapapeles',
    view_menu: 'Ver menú',
    addToCart: 'Agregar al Carrito',
    cart: 'Carrito',
    checkout: 'Finalizar Pedido',
    yourOrder: 'Tu Pedido',
    cartEmpty: 'Tu carrito está vacío',
    addProductsToStart: 'Agrega algunos productos para comenzar',
    proceedToCheckout: 'Proceder al Checkout',
    orderConfirmed: '¡Pedido Confirmado!',
    orderSent: '¡Tu pedido ha sido enviado!',
    willContactSoon: 'Hemos enviado tu pedido por WhatsApp al restaurante. Te contactarán pronto para confirmar.',
    continue: 'Continuar',
    finalizeOrder: 'Finalizar Pedido',
    orderTypeSelection: 'Tipo de Pedido',
    pickupAtRestaurant: 'En el restaurante',
    tableOrder: 'Pedido en mesa',
    selectTable: 'Seleccionar Mesa',
    fullName: 'Nombre Completo',
    optionalEmail: 'Email (opcional)',
    completeAddress: 'Dirección Completa',
    productActivatedTitle: 'Producto activado',
    productActivatedMessage: 'El producto ha sido activado y ahora aparece en tu menú público.',
    productCreatedTitle: 'Producto creado',
    productCreatedMessage: 'El nuevo producto ha sido agregado a tu menú.',
    productUpdatedTitle: 'Producto actualizado',
    productUpdatedMessage: 'El producto ha sido actualizado correctamente.',
    productDeletedTitle: 'Producto eliminado',
    productDeletedMessage: 'El producto ha sido eliminado de tu menú.',
    productDuplicatedTitle: 'Producto duplicado',
    productDuplicatedMessage: 'Se ha creado una copia del producto.',
    productArchivedTitle: 'Producto archivado',
    productArchivedMessage: 'El producto ha sido archivado y ya no aparece en tu menú público.',
    orderUpdatedMessage: 'La posición del producto ha sido actualizada.',
    productsReorderedMessage: 'Los productos han sido reordenados correctamente.',
    productLimitTitle: 'Límite de productos alcanzado',
    productLimitMessage: 'Tu plan actual solo permite {{limit}} productos. Actualiza tu plan para agregar más.',
    productsAllowed: 'productos permitidos',
    upgradePlanToAddMore: 'Actualiza tu plan para agregar más.',
    unknown: 'Desconocido',
    unknownCategory: 'Categoría desconocida',
    copyLabel: 'Copia',
    searchPlaceholder: 'Buscar productos por nombre, descripción o SKU...',
    all: 'Todas',
    tipLabel: 'Consejo',
    dragToReorder: 'Arrastra y suelta los productos para reordenarlos',
    noProductsFound: 'No se encontraron productos',
    createFirstProduct: 'Crea tu primer producto para comenzar.',
    clearSearch: 'Limpiar búsqueda',
    noImage: 'Sin imagen',
    offer: 'OFERTA',
    statusUpdated: 'Estado actualizado',
    productStatusChangedTo: 'El estado del producto ha cambiado a:',
    moveUp: 'Mover arriba',
    moveDown: 'Mover abajo',
    editProduct: 'Editar producto',
    duplicateProduct: 'Duplicar producto',
    activateProduct: 'Activar producto',
    archiveProduct: 'Archivar producto',
    deleteProduct: 'Eliminar producto',
    deleteProductQuestion: '¿Eliminar producto?',
    deleteProductWarning: 'Esta acción eliminará permanentemente el producto de tu menú. Los clientes ya no podrán verlo ni pedirlo.',
      
    // Days of week
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    
    // Months
    january: 'Enero',
    february: 'Febrero',
    march: 'Marzo',
    april: 'Abril',
    may: 'Mayo',
    june: 'Junio',
    july: 'Julio',
    august: 'Agosto',
    september: 'Septiembre',
    october: 'Octubre',
    november: 'Noviembre',
    december: 'Diciembre',
    
    // Time
    open: 'Abierto',
    closed: 'Cerrado',
    openNow: 'Abierto ahora',
    closedNow: 'Cerrado',
    hours: 'horas',
    minutes: 'minutos',
    
    // Errors and Messages
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    required: 'obligatorio',
    invalidEmail: 'Email inválido',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    passwordsDontMatch: 'Las contraseñas no coinciden',
    userNotFound: 'Usuario no encontrado',
    incorrectPassword: 'Contraseña incorrecta',
    emailAlreadyRegistered: 'El email ya está registrado',
    registrationSuccessful: '¡Registro Exitoso!',
    accountPendingApproval: 'Tu cuenta está pendiente de aprobación por nuestro equipo.',
    unexpectedError: 'Error inesperado',
    confirmDelete: '¿Estás seguro de que quieres eliminar',
    actionCannotBeUndone: 'Esta acción no se puede deshacer.',
    
    // Limits and Restrictions
    productLimitReached: 'Límite de Productos Alcanzado',
    categoryLimitReached: 'Límite de Categorías Alcanzado',
    upgradeSubscription: 'Actualiza tu suscripción',
    addMoreProducts: 'para agregar más productos.',
    addMoreCategories: 'para agregar más categorías.',
    
    // Super Admin
    superAdminPanel: 'Panel de Superadministrador',
    superAdminDashboard: 'Dashboard Principal',
    restaurantsManagement: 'Gestión de Restaurantes',
    usersManagement: 'Gestión de Usuarios',
    subscriptionsManagement: 'Gestión de Suscripciones',
    systemStatistics: 'Estadísticas del Sistema',

    // Landing Page
    navFeatures: 'Características',
    navPricing: 'Planes',
    navTestimonials: 'Testimonios',
    heroTitle: 'Transforma tu Restaurante con Tecnología Digital',
    heroSubtitle: 'Gestiona pedidos, menú digital, clientes y ventas en una sola plataforma. Aumenta tus ventas hasta un 40% con Platyo.',
    startFreeTrial: 'Comenzar Gratis',
    learnMore: 'Conoce Más',
    featuresTitle: 'Todo lo que necesitas para gestionar tu restaurante',
    featuresSubtitle: 'Una plataforma completa con todas las herramientas para hacer crecer tu negocio',
    howItWorksTitle: '¿Cómo funciona?',
    howItWorksSubtitle: 'Comienza a recibir pedidos en minutos',
    step1Title: 'Regístrate Gratis',
    step1Desc: 'Crea tu cuenta sin necesidad de tarjeta de crédito. Comienza con el plan gratuito.',
    step2Title: 'Configura tu Menú',
    step2Desc: 'Añade tus productos, categorías y personaliza tu menú digital con tus colores de marca.',
    step3Title: 'Recibe Pedidos',
    step3Desc: 'Comparte tu link único y comienza a recibir pedidos en tiempo real desde cualquier dispositivo.',
    pricingTitle: 'Elige el plan perfecto para tu negocio',
    pricingSubtitle: 'Planes flexibles que crecen contigo. Cambia o cancela en cualquier momento.',
    planFree: 'Gratis',
    planFreeDesc: 'Perfecto para comenzar',
    planFreeFeature1: 'Hasta 10 productos',
    planFreeFeature2: 'Hasta 3 categorías',
    planFreeFeature3: 'Menú digital público',
    planFreeFeature4: 'Gestión de pedidos ilimitados',
    planFreeFeature5: 'Soporte por email',
    perMonth: 'mes',
    planBasicDesc: 'Para restaurantes en crecimiento',
    planBasicFeature1: 'Hasta 50 productos',
    planBasicFeature2: 'Hasta 10 categorías',
    planBasicFeature3: 'Personalización completa de temas',
    planBasicFeature4: 'Múltiples imágenes por producto',
    planBasicFeature5: 'Soporte prioritario',
    planProDesc: 'Para restaurantes establecidos',
    planProFeature1: 'Hasta 200 productos',
    planProFeature2: 'Hasta 20 categorías',
    planProFeature3: 'Analytics avanzadas',
    planProFeature4: 'Facturación POS avanzada',
    planProFeature5: 'Soporte 24/7',
    planBusinessDesc: 'Para cadenas y franquicias',
    planBusinessFeature1: 'Productos ilimitados',
    planBusinessFeature2: 'Categorías ilimitadas',
    planBusinessFeature3: 'API para integraciones',
    planBusinessFeature4: 'White label completo',
    planBusinessFeature5: 'Soporte dedicado',
    getStarted: 'Comenzar Ahora',
    testimonialsTitle: 'Lo que dicen nuestros clientes',
    testimonialsSubtitle: 'Miles de restaurantes confían en Platyo para gestionar su negocio',
    testimonial1: 'Platyo transformó completamente mi restaurante. Los pedidos aumentaron un 50% en el primer mes. ¡Increíble!',
    testimonial2: 'La mejor inversión que hemos hecho. El sistema es muy fácil de usar y nuestros clientes aman el menú digital.',
    testimonial3: 'Excelente plataforma. El soporte es fantástico y la facturación POS nos ha ahorrado mucho tiempo.',
    ctaTitle: '¿Listo para transformar tu restaurante?',
    ctaSubtitle: 'Únete a cientos de restaurantes que ya están creciendo con Platyo. Sin tarjeta de crédito requerida.',
    startNow: 'Comenzar Ahora',
    footerDescription: 'La plataforma todo-en-uno para la gestión moderna de restaurantes. Menú digital, pedidos, facturación y más.',
    footerQuickLinks: 'Enlaces Rápidos',
    footerContact: 'Contacto',
    footerEmail: 'Email',
    footerPhone: 'Teléfono',
    footerRights: 'Todos los derechos reservados.',
  },
  
  en: {
    // Common
    todos_button: 'All',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    loading: 'Loading',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    name: 'Name',
    description: 'Description',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    total: 'Total',
    subtotal: 'Subtotal',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    view: 'View',
    print: 'Print',
    download: 'Download',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled',

    // Confirm Dialog - Defaults
    confirmDialogDefaultConfirm: 'Confirm',
    confirmDialogDefaultCancel: 'Cancel',

    // Navigation
    dashboard: 'Dashboard',
    categories: 'Categories',
    menu: 'Menu',
    orders: 'Orders',
    customers: 'Customers',
    subscription: 'Subscription',
    settings: 'Settings',
    analytics: 'Analytics',

    // Terms and Conditions
    termsSection1Title: 'Acceptance of Terms',
    termsSection1Content: 'By registering and using Platyo, you agree to be legally bound by these Terms and Conditions. If you do not agree with any part of these terms, you should not use our service. These terms apply to all users: restaurant owners, administrative staff, and end customers.',

    termsSection2Title: 'Service Description',
    termsSection2Content: 'Platyo is a comprehensive restaurant management platform that provides advanced technological tools for:',
    termsSection2Item1: 'Complete digital menu management with product catalog, categories, product variations, and optional ingredients',
    termsSection2Item2: 'Smart online ordering system with real-time tracking and automatic WhatsApp notifications',
    termsSection2Item3: 'Advanced customer management with order history, contact data, and behavior analysis',
    termsSection2Item4: 'Analytics dashboard with detailed sales reports, best-selling products, revenue by period, and real-time statistics',
    termsSection2Item5: 'Configurable electronic billing system with support for VAT (19%), Consumption Tax (IPC), tips, and DIAN resolution',
    
    termsSection3Title: 'Registration and Account',
    termsSection3Content: 'To use Platyo, you must create an account by providing accurate and complete information. You are responsible for:',
    termsSection3Item1: 'Maintaining the confidentiality of your password',
    termsSection3Item2: 'All activities that occur under your account',
    termsSection3Item3: 'Immediately notifying any unauthorized use',
    termsSection3Item4: 'Providing truthful and updated information',
    
    termsSection4Title: 'Subscriptions and Payments',
    termsSection4Content: 'Platyo offers three subscription plans: FREE (free with basic functionalities), BUSINESS (monthly with advanced features), and ENTERPRISE (annual with all premium functionalities). By subscribing, you agree to:',
    termsSection4Item1: 'Pay all fees associated with your selected plan according to the chosen periodicity (monthly or annual)',
    termsSection4Item3: 'That prices, product limits, categories, and features may change with 30 days prior notice',
    termsSection4Item4: 'Refund policy: no refunds for partially used periods. Upon cancellation, you will maintain access until the end of the paid period',
    
    termsSection5Title: 'Acceptable Use',
    termsSection5Content: 'By using Platyo, you agree NOT to:',
    termsSection5Item1: 'Violate applicable laws or regulations',
    termsSection5Item2: 'Infringe intellectual property rights',
    termsSection5Item3: 'Transmit offensive, illegal or inappropriate content',
    termsSection5Item4: 'Attempt unauthorized access to systems or data',
    termsSection5Item5: 'Use the service for fraudulent activities',
    termsSection5Item6: 'Interfere with the operation of the service',
    
    termsSection6Title: 'Intellectual Property',
    termsSection6Content1: 'All content, features, functionality, source code, design, "Platyo" brand, logos, user interface, and underlying technology are the exclusive property of Digital Fenix Pro and are protected by copyright laws, trademarks, and other international intellectual property laws.',
    termsSection6Content2: 'You retain all rights to the content you upload (menus, products, images, customer data, configurations), but grant us a limited, non-exclusive, and revocable license to store, process, and display such content solely for the provision of the contracted service. We will never share your content with third parties without your express authorization.',

    termsSection7Title: 'Privacy and Data Protection',
    termsSection7Content: 'We collect and process personal data (restaurant information, customer data, orders, transactions) in accordance with our Privacy Policy and strictly complying with:',
    termsSection7Item1: 'Law 1581 of 2012 on Personal Data Protection in Colombia and its complementary regulations',
    termsSection7Item2: 'Decree 1377 of 2013 on personal data processing',
    termsSection7Item3: 'Principles of legality, purpose, freedom, veracity, transparency, access, restricted circulation, and security in data processing',
    termsSection7Content2: 'Your rights include: knowing, updating, rectifying and deleting your personal data, as well as revoking the authorization granted. We use SSL/TLS encryption, secure storage on certified servers, and robust security measures to protect your information. You can exercise your rights by contacting us at admin@digitalfenixpro.com.',
    
    termsSection8Title: 'Limitation of Liability',
    termsSection8Content: 'Platyo is provided "as is" and "as available". We do not guarantee that:',
    termsSection8Item1: 'The service will be uninterrupted or error-free',
    termsSection8Item2: 'The results obtained will be accurate or reliable',
    termsSection8Item3: 'All errors will be corrected',
    termsSection8Content2: 'We will not be liable for indirect, incidental, special, consequential or punitive damages, including loss of profits, data, use or goodwill.',
    
    termsSection9Title: 'Indemnification',
    termsSection9Content: 'You agree to indemnify and hold harmless Platyo, its affiliates, directors, employees and agents from any claim, damage, obligation, loss, liability, cost or debt arising from:',
    termsSection9Item1: 'Your use of the service',
    termsSection9Item2: 'Violation of these terms',
    termsSection9Item3: 'Violation of third party rights',
    termsSection9Item4: 'Content you post or share',
    
    termsSection10Title: 'Service Termination',
    termsSection10Content: 'We may suspend or terminate your access to the service immediately, without prior notice, for any reason, including:',
    termsSection10Item1: 'Violation of these terms',
    termsSection10Item2: 'Request from legal authorities',
    termsSection10Item3: 'Discontinuation of service',
    termsSection10Item4: 'Fraudulent or illegal activity',
    
    termsSection11Title: 'Modifications',
    termsSection11Content: 'We reserve the right to modify these terms at any time. Modifications will take effect immediately after publication. Your continued use of the service constitutes your acceptance of the modified terms.',
    
    termsSection12Title: 'Applicable Law and Jurisdiction',
    termsSection12Content: 'These terms are governed by the laws of the Republic of Colombia. Any dispute will be resolved in the competent courts of Colombia, expressly waiving any other jurisdiction that may correspond.',
    
    termsSection13Title: 'General Provisions',
    termsSection13Item1Label: 'Severability',
    termsSection13Item1: 'If any provision is deemed invalid, the others will remain in effect',
    termsSection13Item2Label: 'Waiver',
    termsSection13Item2: 'Failure to exercise a right does not constitute a waiver of it',
    termsSection13Item3Label: 'Entire Agreement',
    termsSection13Item3: 'These terms constitute the entire agreement between the parties',
    termsSection13Item4Label: 'Assignment',
    termsSection13Item4: 'You may not assign your rights without our prior written consent',
    
    termsSection14Title: 'Contact',
    termsSection14Content: 'For questions about these terms, you can contact us through:',
    termsSection14Item1: 'Email: admin@digitalfenixpro.com',
    termsSection14Item2: 'Within the platform through the support ticket system',
    
    termsLastUpdate: 'Last Update',
    termsLastUpdateDate: 'January 2026',
    termsAcceptDisclaimer: 'By clicking "Accept" or by using the service, you acknowledge that you have read, understood and agree to be legally bound by these Terms and Conditions. For any questions or clarifications, contact us at admin@digitalfenixpro.com or through the support system within the platform.',
    acceptTermsAndConditionsButton: 'Accept Terms and Conditions',


    // Auth Context Errors
    restaurantNotFoundForUser: 'Restaurant not found for this user',
    noRestaurantAssigned: 'You do not have a restaurant assigned. Contact the administrator.',
    noAccountFoundWithEmail: 'No account found with that email',
    passwordRecoveryRequest: 'Password recovery request',
    passwordRecoveryMessage: 'has requested to recover their password.',
    userRole: 'User role',
    requestDate: 'Request date',
    userWithoutRestaurant: 'User without restaurant',
    noName: 'No name',
    notAvailable: 'Not available',

    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    loginTitle: 'Login',
    loginSubtitle: 'Access your admin panel',
    registerTitle: 'Register your Restaurant',
    registerSubtitle: 'Complete the information to create your account',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: '¿Forgot your password?', 
    noAccount: 'Do not have an account?',
    restaurantName: 'Restaurant Name',
    ownerName: 'Owner Name',
    acceptTerms: 'I accept the terms and conditions ',
    backToLogin: 'Back to Login',
    demoAccounts: 'Demo accounts:',
    superadmin: 'Superadmin',
    restaurant: 'Restaurant',
    authPageSubtitle: 'Complete Restaurant Management System',
    authPageTitle: 'Transform your restaurant management',
    authPageDescription: 'The all-in-one platform you need to modernize your business and increase your sales',
    featureDigitalMenu: 'Digital Menu',
    featureDigitalMenuDesc: 'Online catalog with QR code',
    featureMoreSales: 'More Sales',
    featureMoreSalesDesc: 'Increase your revenue up to 40%',
    featureRealTimeAnalytics: 'Real-Time Analytics',
    featureRealTimeAnalyticsDesc: 'Detailed reports and statistics',
    featureOrderManagement: 'Order Management',
    featureOrderManagementDesc: 'Total and efficient control',
    featureCustomerBase: 'Customer Base',
    featureCustomerBaseDesc: 'Loyalty and better knowledge of your customers',
    featureQuickSetup: 'Quick Setup',
    featureQuickSetupDesc: 'Ready in less than 10 minutes',
    featurePOSBilling: 'POS Billing',
    featurePOSBillingDesc: 'Integrated point-of-sale system',
    featureRealTimeTracking: 'Real-Time Tracking',
    featureRealTimeTrackingDesc: 'Customers track their orders instantly',
    statActiveRestaurants: 'Crecimiento en ventas',
    statOrdersProcessed: 'Orders Processed',
    statSatisfaction: 'Satisfaction',
    requestSent: 'Request submitted!',
    requestInfo: 'We have received your password recovery request.',
    requestResponse: 'Our team will contact you by email.',
    recoverPassword: 'Recover Password',
    recoverPasswordInstructions: 'Enter your email address and we will contact you to help you recover access to your account.',
    helpReactivateAccount: 'to help you reactivate your account.',
    emailPlaceholder: 'your@email.com',
    sendRequest: 'Send Request',
    requestSendError: 'Error sending the request',

    // Register Form
    restaurantNameRequired: 'Restaurant name is required',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    mustAcceptTerms: 'You must accept the terms and conditions',
    registerError: 'Registration error',
    contactEmail: 'Contact Email',
    restaurantAddress: 'Restaurant Address',
    minimumCharacters: 'Minimum 6 characters',
    repeatPassword: 'Repeat your password',
    termsAndConditions: 'terms and conditions',
    ofService: 'of service',
    createAccount: 'Create Account',
    termsModalTitle: 'Platyo Terms and Conditions',
    restaurantNamePlaceholder: 'My Restaurant',
    ownerNamePlaceholder: 'John Doe',
    contactEmailPlaceholder: 'contact@myrestaurant.com',
    phonePlaceholder: '+1 (555) 123-4567',
    addressPlaceholder: '123 Main St, City',

    // Change Password Modal
    changePasswordRequired: 'Password Change Required',
    provisionalPasswordDetected: 'Provisional password detected.',
    securityPasswordChange: 'For security reasons, you must change your password before continuing. This password will be permanent and you can use it for future logins.',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    changePassword: 'Change Password',
    writePasswordAgain: 'Write the password again',

    // Tutorial Modal
    tutorialStepOf: 'of',
    tutorialStepByStepInstructions: 'Step-by-Step Instructions',
    tutorialImportantInfo: 'Important Information',
    tutorialPrevious: 'Previous',
    tutorialNext: 'Next',
    tutorialFinish: 'Finish Tutorial',
    tutorialGoToStep: 'Go to step',
    
    // Tutorial Steps Titles
    tutorialStep1Title: 'Step 1: Create Categories',
    tutorialStep2Title: 'Step 2: Add Products',
    tutorialStep3Title: 'Step 3: Configure Your Menu',
    tutorialStep4Title: 'Step 4: Manage Orders',
    tutorialStep5Title: 'Step 5: Share Your Menu',
    tutorialStep6Title: 'Step 6: Review Analytics',
    tutorialStep7Title: 'Step 7: Customer Management',
    tutorialStep8Title: 'Step 8: Manage Subscription',
    
    // Tutorial Steps Descriptions
    tutorialStep1Description: 'First you must create categories to organize your menu',
    tutorialStep2Description: 'Now create the products that will appear in your menu',
    tutorialStep3Description: 'Customize the appearance and configuration of your public menu',
    tutorialStep4Description: 'Learn how to receive and manage customer orders',
    tutorialStep5Description: 'Share your menu link with your customers',
    tutorialStep6Description: 'Monitor your business performance with detailed reports',
    tutorialStep7Description: 'View and manage your customer base',
    tutorialStep8Description: 'Keep your account active and manage your plan',
    
    // Step 1: Categories
    tutorialStep1Item1: 'Click "Categories" in the left sidebar menu',
    tutorialStep1Item2: 'Press the "+ New Category" button (top right corner)',
    tutorialStep1Item3: 'In the form that appears, enter the category name (e.g., "Appetizers", "Main Courses", "Drinks")',
    tutorialStep1Item4: 'Enter a description for the created category',
    tutorialStep1Item5: 'Click "Save" to create the category',
    tutorialStep1Item6: 'Repeat these steps to create all the categories you need',
    tutorialStep1Detail1: 'The name should be clear and descriptive for your customers',
    tutorialStep1Detail2: 'You can create categories like: Appetizers, Main Courses, Drinks, Desserts, Specialties, etc.',
    tutorialStep1Detail3: 'Once created, you can activate/deactivate the category using the visibility icon',
    tutorialStep1Detail4: 'If you deactivate a category, it will not be shown in the public menu',
    tutorialStep1Detail5: 'To edit or delete a category, use the pencil (edit) or trash (delete) icons in each row',
    tutorialStep1Image: 'Categories screen with list of created categories, each with its image and "New Category" button in the top right corner',
    
    // Step 2: Products
    tutorialStep2Item1: 'Click "Menu" in the left sidebar',
    tutorialStep2Item2: 'Press the "+ New Product" button at the top',
    tutorialStep2Item3: 'Complete the required fields: Product name (e.g., "Margarita Pizza")',
    tutorialStep2Item4: 'Write an attractive product description (e.g., "Delicious pizza with tomato sauce, fresh mozzarella and basil")',
    tutorialStep2Item5: 'Select the category it belongs to from the dropdown list',
    tutorialStep2Item6: 'Upload a product image by clicking "Select Image" (optional but recommended)',
    tutorialStep2Item7: 'In the "Variations" section, add at least one option: Name (e.g., "Personal"), Price (e.g., $15000)',
    tutorialStep2Item8: 'You can add more variations with "+ Add Variation" (e.g., "Medium", "Family")',
    tutorialStep2Item9: 'If applicable, add optional ingredients with "+ Add Ingredient" specifying name and additional price',
    tutorialStep2Item10: 'Click "Save Product"',
    tutorialStep2Detail1: 'Variations are mandatory: each product must have at least one variation (size, flavor, presentation)',
    tutorialStep2Detail2: 'Variation examples: Pizza → Personal, Medium, Family | Drink → 300ml, 500ml, 1L',
    tutorialStep2Detail3: 'Optional ingredients are extras that customers can add (e.g., Extra Cheese, Bacon, Avocado)',
    tutorialStep2Detail4: 'Images significantly increase sales',
    tutorialStep2Detail5: 'The order of products in the list can be changed by dragging them',
    tutorialStep2Detail6: 'You can temporarily activate/deactivate products without deleting them using the status switch',
    tutorialStep2Image: 'Product creation form with fields: name, description, category, image, variations (name/price) and optional ingredients',
    
    // Step 3: Menu Configuration
    tutorialStep3Item1: 'Click "Settings" in the sidebar',
    tutorialStep3Item2: 'In the "General" tab, complete all your restaurant information:',
    tutorialStep3Item3: '• Restaurant name',
    tutorialStep3Item4: '• Phone (format: +57 3001234567) - important for receiving orders via WhatsApp',
    tutorialStep3Item5: '• Complete address',
    tutorialStep3Item6: '• City',
    tutorialStep3Item7: 'In the "Customization" tab, adjust your menu colors:',
    tutorialStep3Item8: '• Primary color (main color for buttons and highlighted elements)',
    tutorialStep3Item9: '• Secondary color (background and secondary elements color)',
    tutorialStep3Item10: '• Accent color (color for important elements)',
    tutorialStep3Item11: 'In the "Delivery" tab, configure if you offer delivery service:',
    tutorialStep3Item12: '• Activate the "Enable Delivery" switch',
    tutorialStep3Item13: '• Configure price levels according to order amount',
    tutorialStep3Item14: '• Example: $0-$20000 = $5000 delivery | $20000-$50000 = $3000 | More than $50000 = Free',
    tutorialStep3Item15: 'In the same section, configure if you accept dine-in orders',
    tutorialStep3Item16: 'Set the estimated preparation time (e.g., "30-45 minutes")',
    tutorialStep3Item17: 'Save all changes',
    tutorialStep3Detail1: 'The phone is crucial: all orders will be sent automatically to that number via WhatsApp',
    tutorialStep3Detail2: 'The phone format must include the country code (e.g., +57 for Colombia)',
    tutorialStep3Detail3: 'Custom colors are applied immediately to the public menu',
    tutorialStep3Detail4: 'The preparation time appears to the customer when placing an order',
    tutorialStep3Detail5: 'Delivery configuration allows setting different costs based on order amount',
    tutorialStep3Detail6: 'If you disable delivery, customers can only choose "Pickup" or "Dine-in"',
    tutorialStep3Detail7: 'Try different color combinations to match your brand',
    tutorialStep3Image: 'Settings panel showing tabs: General, Customization, and Delivery with forms for each section',
    
    // Step 4: Orders Management
    tutorialStep4Item1: 'When a customer places an order, you will receive a WhatsApp message automatically with all details',
    tutorialStep4Item2: 'The order will also appear in the "Orders" section of the application',
    tutorialStep4Item3: 'To view orders, click "Orders" in the sidebar',
    tutorialStep4Item4: 'You will see a list with all orders. The statuses are:',
    tutorialStep4Item5: '• 🟡 Pending: Newly received order, requires confirmation',
    tutorialStep4Item6: '• 🔵 Confirmed: Order accepted',
    tutorialStep4Item7: '• 🟠 Preparing: Order in kitchen',
    tutorialStep4Item8: '• 🟢 Ready: Order finished and ready to deliver',
    tutorialStep4Item9: '• ✅ Delivered: Order completed',
    tutorialStep4Item10: '• 🔴 Cancelled: Order cancelled',
    tutorialStep4Item11: 'To change an order status, click the "Edit" button on the order card',
    tutorialStep4Item12: 'Select the new status from the dropdown menu',
    tutorialStep4Item13: 'To see all order details, click "View Details"',
    tutorialStep4Item14: 'You can filter orders using the filters at the top:',
    tutorialStep4Item15: '• By status (Pending, In preparation, etc.)',
    tutorialStep4Item16: '• By type (Delivery, Pickup, Dine-in)',
    tutorialStep4Item17: '• By date range',
    tutorialStep4Item18: 'Use the search bar to find a specific order by number or customer name',
    tutorialStep4Item19: 'You can use the message icon to keep your customers updated on the order status via WhatsApp',
    tutorialStep4Detail1: 'The WhatsApp message includes: order number, customer data, products, prices, and special notes',
    tutorialStep4Detail2: 'IMPORTANT: Update the order status as it progresses to keep the customer informed',
    tutorialStep4Detail3: '"Pending" orders appear highlighted in yellow to call your attention',
    tutorialStep4Detail4: 'In order details you will see: customer information, address (if delivery), product list with variations and extra ingredients, customer special notes',
    tutorialStep4Detail5: 'If you need to cancel an order, change its status to "Cancelled" and contact the customer to explain',
    tutorialStep4Detail6: 'Filters help you focus on orders that require immediate action',
    tutorialStep4Detail7: 'Keep your kitchen organized: first confirm the order, then mark as "Preparing", then "Ready" and finally "Delivered"',
    tutorialStep4Image: 'Orders screen showing cards with information for each order: number, customer, status, products and action buttons',
    
    // Step 5: Public Menu
    tutorialStep5Item1: 'Your public menu has a unique URL that you can share',
    tutorialStep5Item2: 'The URL has the format: platyo.com/your-restaurant-name',
    tutorialStep5Item3: 'To share your menu:',
    tutorialStep5Item4: '• Copy the URL from your browser when in the public menu view',
    tutorialStep5Item5: '• Share it on social media (Facebook, Instagram, WhatsApp)',
    tutorialStep5Item6: '• Add it to your Instagram bio',
    tutorialStep5Item7: '• Send it directly to your customers via WhatsApp',
    tutorialStep5Item8: '• Print it as a QR code to place in your venue',
    tutorialStep5Item9: 'Customers can:',
    tutorialStep5Item10: '• View all your products organized by categories',
    tutorialStep5Item11: '• Add products to cart',
    tutorialStep5Item12: '• Customize products (choose variation, add optional ingredients)',
    tutorialStep5Item13: '• Write special notes per product',
    tutorialStep5Item14: '• Complete purchase by choosing: Pickup, Delivery, or Dine-in',
    tutorialStep5Item15: '• When confirming the order, WhatsApp opens automatically with all data',
    tutorialStep5Detail1: 'The public menu updates automatically when you add or edit products',
    tutorialStep5Detail2: 'Customers see the menu with the colors you configured in customization',
    tutorialStep5Detail3: 'If a product is deactivated, it will not appear in the public menu',
    tutorialStep5Detail4: 'If a category is deactivated, it will not appear in the public menu',
    tutorialStep5Detail5: 'Featured products appear first with a special badge. You can configure them from the "Promotional" section',
    tutorialStep5Detail6: 'The shopping cart is maintained while the customer browses the menu',
    tutorialStep5Detail7: 'When the customer confirms the order, you receive all information via WhatsApp',
    tutorialStep5Detail8: 'The message includes complete summary: products, variations, extra ingredients, contact details, delivery address if applicable',
    tutorialStep5Image: 'Public menu view with categories at the top, products with images and prices, and floating shopping cart',
    
    // Step 6: Analytics
    tutorialStep6Item1: 'Click "Analytics" in the sidebar',
    tutorialStep6Item2: 'At the top you will see the main metrics:',
    tutorialStep6Item3: '• Total orders in the selected period',
    tutorialStep6Item4: '• Completed orders',
    tutorialStep6Item5: '• Total revenue',
    tutorialStep6Item6: '• Average ticket (average value per order)',
    tutorialStep6Item7: 'Use "Advanced Filters" to analyze specific data:',
    tutorialStep6Item8: '• Click "Advanced Filters" in the top right corner',
    tutorialStep6Item9: '• Select a date range (from/to)',
    tutorialStep6Item10: '• Filter by specific category',
    tutorialStep6Item11: '• Filter by order type (Delivery, Pickup, Dine-in)',
    tutorialStep6Item12: '• Filter by order status',
    tutorialStep6Item13: '• You can combine multiple filters',
    tutorialStep6Item14: 'Review the displayed charts:',
    tutorialStep6Item15: '• Orders by Type: how many orders of each modality',
    tutorialStep6Item16: '• Orders by Month: order trend over time',
    tutorialStep6Item17: '• Order Statuses: status distribution',
    tutorialStep6Item18: '• Top Selling Products: your top 5 products',
    tutorialStep6Item19: 'To export data, click "Export CSV"',
    tutorialStep6Item20: 'An Excel file will download with detailed information:',
    tutorialStep6Item21: '• Executive summary with all metrics',
    tutorialStep6Item22: '• Distribution by type and status',
    tutorialStep6Item23: '• Top selling products',
    tutorialStep6Item24: '• Sales by category',
    tutorialStep6Item25: '• Sales by day of the week',
    tutorialStep6Item26: '• Complete detail of each order',
    tutorialStep6Item27: '• Detail of items sold',
    tutorialStep6Detail1: 'Filters allow you to analyze specific periods (e.g., last month sales)',
    tutorialStep6Detail2: 'The CSV report is perfect for taking to your accountant or doing detailed analysis',
    tutorialStep6Detail3: 'Use statistics to identify your most profitable products',
    tutorialStep6Detail4: 'Analyze which days of the week you sell more to optimize your inventory',
    tutorialStep6Detail5: 'Average ticket helps you evaluate upselling strategies',
    tutorialStep6Detail6: 'If you see products with few sales, consider improving their presentation or price',
    tutorialStep6Detail7: 'Sales by category show what type of products your customers prefer',
    tutorialStep6Detail8: 'Review statistics weekly to make informed decisions',
    tutorialStep6Image: 'Analytics dashboard with bar charts, key metrics in cards, advanced filters and export CSV button',
    
    // Step 7: Customers
    tutorialStep7Item1: 'Click "Customers" in the sidebar',
    tutorialStep7Item2: 'You will see a table with all customers who have placed orders',
    tutorialStep7Item3: 'The displayed information includes:',
    tutorialStep7Item4: '• Customer name',
    tutorialStep7Item5: '• Contact phone',
    tutorialStep7Item6: '• Email (if provided)',
    tutorialStep7Item7: '• Total orders placed',
    tutorialStep7Item8: '• Total amount spent',
    tutorialStep7Item9: '• Date of last order',
    tutorialStep7Item10: 'To search for a specific customer, use the search bar at the top',
    tutorialStep7Item11: 'You can search by: name, phone or email',
    tutorialStep7Item12: 'Click on a customer to see the complete detail of their order history',
    tutorialStep7Item13: 'The phone number will be the customer\'s primary identification. If an already registered customer with a number enters a different name, a new record will not be created, but the information associated with that phone number will be updated.',
    tutorialStep7Item14: 'In the detail view you will see:',
    tutorialStep7Item15: '• Complete contact information',
    tutorialStep7Item16: '• Delivery addresses used previously',
    tutorialStep7Item17: '• Complete list of all their orders with dates',
    tutorialStep7Item18: '• Products they order most',
    tutorialStep7Item19: '• Purchase statistics',
    tutorialStep7Detail1: 'Customers are registered automatically when they place their first order',
    tutorialStep7Detail2: 'You don\'t need to create customers manually. If you need to create customers in bulk, you can do so by importing CSV',
    tutorialStep7Detail3: 'Customer information is saved for future orders',
    tutorialStep7Detail4: 'You can identify your most frequent customers by the number of orders',
    tutorialStep7Detail5: 'Use this information to create loyalty programs or special promotions',
    tutorialStep7Detail6: 'Customers with the highest total spend are your VIP customers. You can assign them manually',
    tutorialStep7Detail7: 'Always respect the privacy of your customers\' data',
    tutorialStep7Detail8: 'You can export the customer database for marketing campaigns',
    tutorialStep7Detail9: 'If a customer requests to delete their data, you can do so from this section',
    tutorialStep7Image: 'Customer table with columns: name, phone, email, total orders, total spent and last purchase, with search bar',
    
    // Step 8: Subscription
    tutorialStep8Item1: 'Click "Subscription" in the sidebar',
    tutorialStep8Item2: 'At the top you will see your current plan with:',
    tutorialStep8Item3: '• Plan name (Basic, Professional, Business)',
    tutorialStep8Item4: '• Status (Active/Inactive/Expired)',
    tutorialStep8Item5: '• Start date',
    tutorialStep8Item6: '• Expiration date',
    tutorialStep8Item7: '• Remaining days',
    tutorialStep8Item8: 'You will see the auto-renewal status:',
    tutorialStep8Item9: '• If activated, your plan will renew automatically before expiring',
    tutorialStep8Item10: '• If deactivated, you will have to renew manually',
    tutorialStep8Item11: '• To change, use the "Auto Renewal" switch',
    tutorialStep8Item12: 'To see all available plans, check the "Available Plans" section',
    tutorialStep8Item13: 'Each plan shows:',
    tutorialStep8Item14: '• Monthly price',
    tutorialStep8Item15: '• Included features',
    tutorialStep8Item16: '• Limits (orders, products, etc.)',
    tutorialStep8Item17: 'To change plan:',
    tutorialStep8Item18: '• Click "Select Plan" on the plan you want',
    tutorialStep8Item19: '• Confirm the change',
    tutorialStep8Item20: '• The new plan activates immediately',
    tutorialStep8Item21: 'Review the payment history at the bottom to see your previous transactions',
    tutorialStep8Detail1: 'IMPORTANT: If your subscription expires, you will not be able to receive new orders',
    tutorialStep8Detail2: 'Activate auto-renewal to avoid service interruptions',
    tutorialStep8Detail3: 'You can change plan at any time',
    tutorialStep8Detail4: 'When upgrading to a higher plan, you pay the prorated difference',
    tutorialStep8Detail5: 'When downgrading to a lower plan, the change takes effect at the end of the current period',
    tutorialStep8Detail6: 'If your business is growing, consider upgrading to a plan with more capacity',
    tutorialStep8Detail7: 'All plans include technical support',
    tutorialStep8Image: 'Subscription panel showing current plan with expiration date, auto-renewal switch and available plan cards',
    
    // Dashboard
    totalProducts: 'Products',
    activeProducts: 'active',
    todayOrders: 'Today Orders',
    totalSales: 'Total Sales',
    recentOrders: 'Recent Orders',
    restaurantStatus: 'Restaurant Status',
    lastUpdate: 'Last update',
    noOrdersYet: 'No orders yet',
    ordersWillAppear: 'Orders will appear here once customers start ordering.',
    noSubscription: 'No subscription',
    btnTutorial: 'Tutorial',
    statTotalSubtitle: 'total',
    statCurrentMonthSubtitle: 'Current Month',
    statusMenuUrl: 'Menu URL',
    statusSubscription: 'Subscription',
    statusTableService: 'Table Service',
    na: 'N/A',
    orderTable: 'Table',

    // Order Product Selector
    orderProducts: 'Order Products',
    searchProducts: 'Search products...',
    selectProduct: 'Select product',
    selectProductOption: 'Select a product',
    selectVariation: 'Select variation',
    selectVariationOption: 'Select a variation',
    additionalIngredients: 'Additional ingredients',
    quantity: 'Quantity',
    addProduct: 'Add Product',
    noProductsAdded: 'No products added',
    selectProductsToAdd: 'Select products to add to the order',
    errorSelectProductVariation: 'Select a product and variation',

    // Orders
    orderManagement: 'Order Management',
    orderNumber: 'Order',
    customer: 'Customer',
    orderType: 'Type',
    pickup: 'Pickup',
    Delivery: 'Delivery',
    table: 'Table',
    completedToday: 'Completed Today',
    inPreparation: 'In Preparation',
    printTicket: 'Print Ticket',
    confirmOrder: 'Confirm',
    cancelOrder: 'Cancel',
    nextStep: 'Next Step',
    customerInfo: 'Customer Information',
    products: 'Products',
    orderSummary: 'Order Summary',
    specialInstructions: 'Special Instructions',
    deliveryAddress: 'Delivery Address',
    references: 'References',
    estimatedTime: 'Estimated time',
    thankYouOrder: 'Thank you for your order!',
    allDates: 'All dates',
    productsSectionTitle: 'Order summary',
    statusUpdatedTitle: 'Status Updated',
    orderStatusUpdated: 'Order status updated',
    orderTypeTitle: 'Order type',
    orderStatusMarkedSuccess: 'The order status has been updated.',
    orderConfirmedMsg: 'Order confirmed',
    orderInPreparationMsg: 'Order in preparation',
    orderReadyForDeliveryMsg: 'Order ready for delivery',
    orderDeliveredMsg: 'Order delivered',
    orderCancelledMsg: 'Order cancelled',
    actionConfirm: 'Confirm',
    actionPrepare: 'Prepare',
    actionMarkReady: 'Mark Ready',
    actionDeliver: 'Deliver',
    bulkActionCompleteTitle: 'Bulk Action Complete',
    ordersUpdatedCount: 'orders updated',
    orderLabel: 'Order',
    productsTitle: 'Products',
    productHeader: 'Product',
    variationLabel: 'Variation',
    quantityHeader: 'Quantity',
    priceHeader: 'Price',
    noteLabel: 'Note:',
    deliveryLabel: 'Delivery',
    specialInstructionsTitle: 'Special Instructions',
    restaurantDefaultName: 'Restaurant',
    newOrderTitle: 'NEW ORDER',
    orderNumberLabel: 'Order #',
    customerSectionTitle: 'CUSTOMER',
    deliveryReferencesLabel: 'References',
    tableLabel: 'Table',
    orderSummaryTitle: 'ORDER SUMMARY',
    estimatedTimeLabel: 'Estimated time',
    defaultPreparationTime: '30-45 minutes',
    thankYouForOrder: 'Thank you for your order!',
    orderUpdateTitle: 'ORDER UPDATE',
    statusPendingMessage: 'is *PENDING* confirmation. You will receive an update soon',
    statusConfirmedMessage: 'has been *CONFIRMED*. We are preparing your order',
    statusPreparingMessage: 'is being *PREPARED* with great care',
    statusReadyMessage: 'is *READY* for pickup/delivery',
    statusDeliveredMessage: 'has been *DELIVERED* successfully. We hope you enjoy it!',
    statusCancelledMessage: 'has been *CANCELLED*. If you have questions, please contact us',
    readyForPickup: 'Your order is ready for pickup.',
    weAreWaitingForYou: 'We are waiting for you!',
    readyForDelivery: 'Your order is ready and will be delivered soon.',
    preparingWithCare: 'We are preparing your order with great care.',
    thankYouForPreference: 'Thank you for your preference!',
    errorTitle: 'Error',
    noPhoneError: 'The order does not have an associated phone number',
    invalidPhoneError: 'The phone number is not valid. It must have at least 10 digits.',
    warningTitle: 'Warning',
    popupWarning: 'Please allow pop-ups to open WhatsApp',
    successTitle: 'Success',
    openingWhatsapp: 'Opening WhatsApp...',
    whatsappOpenError: 'Could not open WhatsApp. Please try again.',
    ticketTitle: 'Ticket',
    dianResolutionNumber: 'DIAN Resolution N°',
    rangeLabel: 'Range',
    taxRegimeSimple: 'Simple Regime',
    taxRegimeCommon: 'Common Regime',
    taxRegimeNoIva: 'Not VAT responsible',
    taxRegimeIvaQuestion: '¿VAT responsible? *',
    deliveryOrderType: 'Delivery',
    pickupOrderType: 'Takeaway',
    tableOrderType: 'Table',
    ivaLabel: 'VAT (19%)',
    suggestedTipLabel: 'Yes (10% of the subtotal)',
    totalWithTipLabel: 'Total with tip',
    thankYouForPurchase: 'Thank you for your purchase!',
    createOrder: 'Create Order',
    bulkActions: 'Bulk Actions',
    filtersTitle: 'Filters',
    ordersToday: 'Orders Today',
    dailySales: 'Daily Sales',
    inProcess: 'In Process',
    averageValue: 'Average Value',
    completedOrders: 'Completed Orders',
    completionRate: 'Completion Rate',
    totalOrders: 'Total Orders',
    bulkActionLabel: 'Bulk Action',
    selectActionPlaceholder: 'Select action',
    markAsConfirmed: 'Mark as confirmed',
    markAsPreparing: 'Mark as in preparation',
    markAsReady: 'Mark as ready',
    markAsDelivered: 'Mark as delivered',
    apply: 'Apply',
    pendingPlural: 'Pending',
    confirmedPlural: 'Confirmed',
    preparingPlural: 'In preparation',
    readyPlural: 'Ready',
    deliveredPlural: 'Delivered',
    cancelledPlural: 'Cancelled',
    allTypes: 'All types',
    yesterday: 'Yesterday',
    lastWeek: 'Last week',
    lastMonth: 'Last month',
    customRange: 'Custom range',
    sortByLabel: 'Sort by...',
    noOrdersRegistered: 'No orders registered',
    noOrdersFound: 'No orders found',
    noOrdersMessage: 'Orders will appear here once customers start ordering.',
    adjustFiltersMessage: 'Try adjusting the search filters.',
    sendByWhatsappTitle: 'Send via WhatsApp',
    changeToTitle: 'Change to:',
    previous: 'Previous',
    next: 'Next',
    showing: 'Showing',
    of: 'of',
    results: 'results',
    orderInfoTitle: 'Order Information',
    customerInfoTitle: 'Customer Information',
    nameRequiredLabel: 'Name *',
    customerNamePlaceholder: 'Customer name',
    phoneRequiredLabel: 'Phone *',
    customerPhonePlaceholder: 'Customer phone',
    customerEmailPlaceholder: 'Customer email',
    customerAddressPlaceholder: 'Customer address',
    deliveryAddressLabel: 'Delivery Address',
    deliveryAddressPlaceholder: 'Full delivery address',
    deliveryReferencesPlaceholder: 'References to find the address',
    tableNumberLabel: 'Table Number',
    tableNumberPlaceholder: 'Table number',
    specialInstructionsLabel: 'Special Instructions',
    specialInstructionsPlaceholder: 'Special instructions for the order...',
    saveOrder: 'Save Order',
    updateOrder: 'Update Order',
    deleteOrder: 'Delete Order',
    confirmDeleteOrder: 'Are you sure you want to delete the order',
    irreversibleAction: 'This action is irreversible.',
    namePhoneRequiredError: 'Please fill in the customer\'s name and phone number',
    nameLettersOnlyError: 'The name can only contain letters and spaces',
    phoneInvalidError: 'The phone can only contain numbers and the + symbol',
    invalidEmailError: 'Please enter a valid email',
    orderUpdateSuccess: 'The order has been successfully updated.',
    orderCreatedTitle: 'Order Created',
    orderCreateSuccess: 'The order has been successfully created.',
    orderDeletedTitle: 'Order Deleted',
    orderDeleteSuccess: 'The order has been successfully deleted.',
    customerLabel: 'Customer',
    addressLabel: 'Address',
    dateLabel: 'Date',
    subtotalLabel: 'Subtotal',
    totalLabel: 'Total',

    
    // Products
    productManagement: 'Menu Management',
    newProduct: 'New Product',
    productName: 'Product Name',
    category: 'Category',
    price: 'Price',
    variations: 'Variations',
    ingredients: 'Ingredients',
    noProductsInCategory: 'No products in this category',
    productImages: 'Product Images',
    variationsAndPrices: 'Variations and Prices',
    addVariation: 'Add Variation',
    addIngredient: 'Add Ingredient',
    preparationTime: 'Preparation Time',
    productStatus: 'Status',
    draft: 'Draft',
    outOfStock: 'Out of Stock',
    archived: 'Archived',
    optional: 'Optional',
    extraCost: 'Extra cost',
    productUpdated: 'Product Updated',
    productCreated: 'Product Created',
    productDeleted: 'Product Deleted',
    productArchived: 'Product Archived',

    // Product Form
    enterProductName: 'Enter product name',
    selectCategory: 'Select a category',
    enterProductDescription: 'Enter product description',
    productSKU: 'Product SKU',
    productImage: 'Product Image',
    uploadedImage: 'Image uploaded',
    uploadImageFromDevice: 'Upload image from device',
    uploadHighQualityImage: 'Upload a high quality image of your product. Only one image allowed. Max 5MB.',
    productPreview: 'Product preview',
    imageWillShowInMenu: 'The image will be shown in the public menu',
    noImageAdded: 'No image added',
    uploadImageToShow: 'Upload an image to show your product',
    variationName: 'Variation name',
    variationNamePlaceholder: 'Variation name (e.g., Small, Medium, Large)',
    priceRequired: 'Price',
    comparePrice: 'Compare Price',
    priceBeforeDiscount: 'Price before discount',
    savings: 'Savings',
    ingredientsLabel: 'Ingredients',
    ingredientName: 'Ingredient name',
    optionalLabel: 'Optional',
    noIngredientsAdded: 'No ingredients added',
    ingredientsAreOptional: 'Ingredients are optional and allow product customization',
    updateProduct: 'Update Product',
    createProduct: 'Create Product',
    fillRequiredFields: 'Please fill in all required fields',
    fileTooLarge: 'is too large. Maximum size: 5MB',
    maxSize5MB: 'Maximum size: 5MB',
    onlyOneImageAllowed: 'Only one image allowed',

    
    // Categories
    viewMenu: 'View Menu',
    categoryManagement: 'Category Management',
    newCategory: 'New Category',
    categoryName: 'Category Name',
    noCategoriesCreated: 'No categories created',
    createFirstCategory: 'Create your first category to organize your menu.',
    categoryIcon: 'Icon (Emoji)',
    categoryUpdated: 'Category Updated',
    categoryCreated: 'Category Created',
    messageCategoryUpdated: 'The category has been updated successfully.',
    messageCategoryCreated: 'The new category has been added to your menu.',
    messageCategoryDeleted: 'The category has been removed from your menu.',
    categoryDeleted: 'Category Deleted',
    categoryActivated: 'Category Activated',
    categoryDeactivated: 'Category Deactivated',
    order: 'Order',
    totalCategories: 'Total Categories',
    activeCategories: 'Active Categories',
    inactiveCategories: 'Inactive Categories',
    categoriesTip: 'Drag and drop the categories to reorder them',
    categoriesCreated: 'Created',
    categoriesDescription: 'Add a description to help your customers...',
    categoriesNameDes: 'Examples: Pizzas, Drinks, Desserts',
    categoryAppearance: 'Category appearance',
    catIconSec: 'Icon (Emoji)',
    catIconDes: 'Use an emoji to quickly identify',
    catImg: 'Cover image',
    catUpImg: 'Upload image',
    catImgRec: 'Recommended: 600x600px (max. 5MB)',
    catObligatry: '*Required fields',
    catDeleteImg: 'Delete image',
    categoryActivatedDes: 'The category has been activated and now appears in your public menu.',
    categoryDeactivatedDes: 'The category has been deactivated and no longer appears in your public menu.',
    deleteCategoryTitle: 'Delete category?',
    deleteCategoryMessage: 'This action will permanently delete the category from your menu. All products associated with this category will be left without an assigned category.',
    deleteCategoryButton: 'Delete category',
    
    // Customers
    deletedSuccessfully: 'Deleted successfully',
    deleteCustomers: 'Delete customers',
    selectedPlural: 'Customers',
    customerPlural: 'Customers',
    customerManagement: 'Customer Management',
    totalCustomers: 'Total Customers',
    vipCustomers: 'VIP Customers',
    averageSpent: 'Average Spent',
    contact: 'Contact',
    ordersCount: 'Orders',
    totalSpent: 'Total Spent',
    orderTypes: 'Order Types',
    segment: 'Segment',
    lastOrder: 'Last Order',
    newCustomer: 'New',
    deleteCustomer: 'Delete customer',
    makeVip: 'Make VIP',
    regular: 'Regular',
    frequent: 'Frequent',
    vip: 'VIP',
    filtersAndSearch: 'Filters and Search',
    customerBase: 'Customer base',
    assignedManually: 'Percentage assigned',
    frequentCustomers: 'Frequent',
    averageSpending: 'Average Spending',
    perCustomer: 'Per customer',
    allStatuses: 'All statuses',
    activeLast30Days: 'Active (last 30 days)',
    inactivePlus30Days: 'Inactive (+30 days)',
    allSegments: 'All segments',
    onlyVip: 'VIP Only',
    onlyFrequent: 'Frequent Only (5+)',
    onlyRegular: 'Regular Only (2-4)',
    onlyNew: 'New Only (1)',
    sortByName: 'Sort by Name',
    sortByOrders: 'Sort by Orders',
    sortBySpent: 'Sort by Spent',
    sortByDate: 'Sort by Date',
    changeToDescending: 'Change to descending',
    changeToAscending: 'Change to ascending',
    avg: 'avg',
    segmentVipDescription: 'Manually assigned',
    segmentNewDescription: '1 order',
    segmentRegularDescription: '2-4 orders',
    segmentFrequentDescription: '5+ orders',
    segmentNote: '* A customer can be VIP and have another segment',
    noRegisteredCustomers: 'No registered customers',
    noCustomersFound: 'No customers found',
    customersWillAppear: 'Customers will appear here once they place orders.',
    tryDifferentSearch: 'Try different search terms.',
    fullNameRequired: 'Full Name*',
    phoneRequired: 'Phone*',
    customerName: 'Customer name',
    fullAddress: 'Full address',
    deliveryInstructionsPlaceholder: 'References to find the address...',
    vipCustomer: 'VIP Customer',
    saveChanges: 'Save Changes',
    confirmDeletion: 'Confirm Deletion',
    deleteCustomerConfirm: 'Delete customer',
    actionWillDeletePermanently: 'This action will permanently delete:',
    allCustomerInfo: 'All customer information',
    associatedOrders: 'associated order(s)',
    purchaseHistory: 'Purchase history',
    customerVipStatus: 'Customer VIP status',
    bulkEdit: 'Bulk Edit',
    customersSelected: 'customer(s) selected',
    selectActionToPerform: 'Select the action to perform:',
    markAsVip: 'Mark as VIP',
    addVipStatusToSelected: 'Add VIP status to all selected customers',
    removeVip: 'Remove from VIP',
    removeVipStatusFromSelected: 'Remove VIP status from all selected customers',
    permanentlyDeleteAllCustomersAndOrders: 'Permanently delete all customers and their orders',
    importCustomersFromCSV: 'Import Customers from CSV',
    csvFileFormat: 'CSV file format:',
    customerFullName: 'Customer full name',
    uniquePhoneNumber: 'Unique phone number',
    emailAddress: 'Email address',
    additionalDirections: 'Additional directions',
    or: 'or',
    downloadExampleTemplate: 'Download example template',
    preview: 'Preview',
    line: 'Line',
    validCustomers: 'valid customer(s)',
    searchCustomersPlaceholder: 'Customers by name, phone or email...',
    customersTemplate: 'customers_template',
    averagePerOrder: 'Average per Order',
    isVip: 'Is VIP',
    exampleDeliveryInstruction1: 'Two-story house with blue gate',
    exampleDeliveryInstruction2: 'Apartment 301 white building',
    vipCustomerRemoved: 'VIP Customer Removed',
    vipCustomerAdded: 'VIP Customer Added',
    noLongerVipCustomer: 'is no longer a VIP customer.',
    nowVipCustomer: 'is now a VIP customer.',
    noSelection: 'No Selection',
    selectAtLeastOneCustomer: 'Select at least one customer to edit.',
    vipAssigned: 'VIP Assigned',
    markedAsVipPlural: 'marked as VIP.',
    vipRemoved: 'VIP Removed',
    noLongerVipPlural: 'no longer VIP.',
    customersDeleted: 'Customers Deleted',
    deletedSuccessfullyPlural: 'deleted successfully.',
    confirmDeleteMultiple: 'Are you sure you want to delete',
    warningDeleteAction: 'This action will also delete all their orders and cannot be undone.',
    customerUpdated: 'Customer Updated',
    customerInfoUpdatedSuccessfully: 'Customer information has been updated successfully.',
    customerAndOrdersDeleted: 'Customer and all their orders have been deleted.',
    noDataToExport: 'No data to export',
    noCustomersMatchFilters: 'No customers match the current filters.',
    csvExported: 'CSV Exported',
    exportedSuccessfullyPlural: 'Customer(s) exported successfully.',
    templateDownloaded: 'Template Downloaded',
    useTemplateAsGuide: 'Use this template as a guide to import customers.',
    invalidFile: 'Invalid File',
    pleaseSelectValidCSV: 'Please select a valid CSV file.',
    emptyFile: 'Empty File',
    csvFileIsEmpty: 'The CSV file is empty.',
    readError: 'Read Error',
    couldNotReadFile: 'Could not read the file. Please try again.',
    csvEmptyOrNoData: 'The CSV file is empty or has no data.',
    missingRequiredColumnsMsg: 'Missing required columns: {columns}. Found columns: {found}',
    lineIncorrectColumnsMsg: 'Line {line}: Incorrect number of columns (expected {expected}, got {got}). Values: [{values}]',
    lineNameRequired: 'Line {line}: Name is required',
    lineNameOnlyLetters: 'Line {line}: Name "{name}" can only contain letters and spaces',
    linePhoneRequired: 'Line {line}: Phone is required',
    linePhoneOnlyNumbers: 'Line {line}: Phone "{phone}" can only contain numbers and the + symbol',
    lineEmailInvalidFormat: 'Line {line}: Email "{email}" does not have a valid format',
    lineCustomerAlreadyExists: 'Line {line}: Customer with phone {phone} already exists',
    noData: 'No Data',
    fileContainsNoData: 'The file contains no data to import.',
    validationErrors: 'Validation Errors',
    validationError: 'Validation Error',
    nameRequiredError: 'Name is required',
    nameInvalid: 'Name can only contain letters and spaces',
    phoneRequiredError: 'Phone is required',
    phoneInvalid: 'Phone can only contain numbers and the following characters: + - ( ) space',
    emailInvalid: 'Email format is not valid',
    customerAlreadyExists: 'A customer with this phone already exists',
    errorsFoundMsg: 'Found {count} error(s). Review the file and correct the errors.',
    partialImport: 'Partial Import',
    validRecordsAndErrorsMsg: '{valid} valid record(s) and {errors} error(s) found.',
    dataValidated: 'Data Validated',
    customersReadyToImportMsg: '{count} customer(s) ready to import.',
    importSuccessful: 'Import Successful',
    customersImportedMsg: '{count} customer(s) imported successfully.',
    errorsFoundCount: 'Found {count} error(s):',
    editSelected: 'Edit {count} selected',
    editCustomer: 'Edit customer',
    ordersPlus: '5+ orders',
    new: 'new',
    deliveryInstructions: 'Delivery instructions',
    customerDeleted: 'The customer was deleted',
    importCSV: 'Import CSV',
    exportCSV: 'Export CSV',
    
    // Settings
    generalSettings: 'General Settings',
    regionalSettings: 'Regional Settings',
    language: 'Language',
    currency: 'Currency',
    businessHours: 'Business Hours',
    deliverySettings: 'Delivery Settings',
    tableOrders: 'Table Orders',
    qrCodes: 'QR Codes',
    themeSettings: 'Theme Settings',
    socialMedia: 'Social Media',
    notifications: 'Notifications',
    restaurantInfo: 'Restaurant Information',
    contactInfo: 'Contact Information',
    businessInfo: 'Business Information',
    operationalSettings: 'Operational Settings',
    enabled: 'Enabled',
    disabled: 'Disabled',
    minimumOrder: 'Minimum Order',
    deliveryCost: 'Delivery Cost',
    deliveryZones: 'Delivery Zones',
    numberOfTables: 'Number of Tables',
    enableQRCodes: 'Enable QR Codes',
    printAll: 'Print All',
    downloadAll: 'Download All',
    mesa: 'Table',
    // TABS
    tab_general: 'General',
    tab_hours: 'Hours',
    tab_social: 'Social Media',
    tab_delivery: 'Delivery',
    tab_table_orders: 'Table Orders',
    tab_promo: 'Promotional',
    tab_theme: 'Theme',
    tab_billing: 'Billing',
    tab_support: 'Support',
    // TITLES & LABELS
    settings_title: 'Restaurant Settings',
    save_button: 'Save Changes',
    visual_identity_title: 'Visual Identity',
    logo_subtitle: 'Your restaurant logo',
    no_logo: 'No logo',
    change_logo_button: 'Change Logo',
    upload_logo_button: 'Upload Logo',
    delete_button: 'Delete',
    restaurant_info_title: 'Restaurant Information',
    contact_location_subtitle: 'Contact and location details',
    restaurant_name_label: 'Restaurant Name',
    email_label: 'Email',
    phone_label: 'Phone',
    address_label: 'Address',
    description_label: 'Description',
    regional_settings_title: 'Regional Settings',
    language_currency_subtitle: 'System language and currency',
    language_label: 'Language',
    currency_label: 'Currency',
    public_menu_title: 'Public Menu',
    public_menu_description: 'Share this link with your customers so they can view your menu and place orders',
    your_custom_url_label: 'Your custom URL:',
    copy_button: 'Copy',
    view_menu_button: 'View Menu',
    opening_hours_title: 'Opening Hours',
    opening_hours_subtitle: 'Set the hours when your restaurant is open.',
    day_of_week_header: 'Day of the Week',
    status_header: 'Status',
    opening_time_header: 'Opening Time',
    opening_time_label: 'Open',
    closing_time_label: 'Close',
    social_media_title: 'Social Media',
    social_media_subtitle: 'Connect your social networks to display them in your public menu',
    delivery_rates_title: 'Delivery Rates',
    rate_name_label: 'Rate Name',
    coverage_radius_km_label: 'Coverage Radius (km)',
    shipping_cost_cop_label: 'Shipping Cost (COP)',
    min_order_value_cop_label: 'Minimum Order Value (COP)',
    add_rate_button: 'Add Rate',
    table_orders_settings_title: 'Table Order Settings',
    number_of_tables_label: 'Number of Tables',
    table_qr_codes_title: 'Table QR Codes',
    table_qr_codes_description: 'QR codes allow customers to access the menu directly from their table.',
    table_label: 'Table',
    download_png_button: 'Download PNG',
    print_qr_button: 'Print QR',
    theme_customization_title: 'Theme Customization',
    theme_customization_subtitle: 'Configure the colors, typography, and styles of your public menu',
    color_templates_title: 'Color Templates',
    color_templates_subtitle: 'Select a predefined template or customize your colors manually',
    dark_mode_templates: 'Dark Mode',
    manual_customization_title: 'Manual Customization',
    primary_color_label: 'Primary Color',
    primary_color_hint: 'Main buttons, icons, main texts',
    secondary_color_label: 'Secondary Color',
    secondary_color_hint: 'Pathforms',
    menu_bg_color_label: 'Menu Background Color',
    menu_bg_color_hint: 'Main background of the menu',
    card_bg_color_label: 'Card and Background Color',
    card_bg_color_hint: 'Product cards',
    primary_text_color_label: 'Primary Text Color',
    primary_text_color_hint: 'Titles and main texts',
    secondary_text_color_label: 'Secondary Text Color',
    secondary_text_color_hint: 'Descriptions and subtitles',
    pathforms_label: 'Enable or disable Pathforms',
    pathforms_hint: 'Enable this option to display the decorative shapes that appear in the background of the page.',
    billing_settings_title: 'Billing Settings',
    billing_settings_subtitle: 'Legal and tax information for generating valid order tickets in Colombia',
    commercial_name_label: 'Trade Name *',
    commercial_name_hint: 'The name that will appear on the tickets',
    social_reason_label: 'Legal Name *',
    legal_company_name: 'Optional - Legal name of the company',
    nit_label: 'NIT *',
    tax_regime_label: 'Tax Regime *',
    iva_responsible_label: 'VAT Responsible',
    has_dian_resolution_label: 'Has DIAN Resolution?',
    department_label: 'Department *',
    city_label: 'City *',
    address_billing_label: 'Address *',
    phone_billing_label: 'Phone *',
    email_billing_label: 'Email *',
    fiscal_billing_information: 'Fiscal information',
    dian_resolution_data_title: 'DIAN Resolution Data',
    resolution_number_label: 'Resolution Number *',
    resolution_date_label: 'Resolution Date *',
    numbering_range_label: 'Numbering Range from *',
    numbering_range_label_to: 'Numbering Range to *',
    from_label: 'From',
    to_label: 'To',
    tax_tip_settings_title: 'Tip Settings',
    suggested_tip_label: 'Applies Suggested Tip?',
    ticket_customization_title: 'Ticket Customization',
    show_logo_on_ticket_label: 'Show logo on ticket?',
    ticket_logo_label: 'Ticket Logo',
    ticket_current_logo: 'Current logo',
    ticket_buttom_logo_change: 'Click to change',
    ticket_buttom_logo_change_hint: 'PNG or JPG. Maximum 1MB. 200x200px recommended',
    ticket_final_message_label: 'Final Ticket Message (optional)',
    ticket_message_hint: 'Thank you for your visit! We hope to see you soon.',
    ticket_message_hint2: 'This message will appear at the end of each ticket',
    ticket_final_tips_title: 'Regarding billing settings:',
    ticket_final_tip1: 'This data will be used to generate legally valid order receipts in Colombia',
    ticket_final_tip2: 'If you are VAT-registered, the VAT will be calculated and displayed on each receipt',
    ticket_final_tip3: 'DIAN registration is required for electronic invoicing',
    ticket_final_tip4: 'Tipping is optional and will appear as a suggestion to the customer',
    ticket_final_tip5: 'Please ensure this information is kept up to date',
    promo_settings_title: 'Promotional Settings',
    promo_settings_subtitle: 'Set the promotional image and featured products in your public menu',
    vertical_promo_image_label: 'Vertical Promotional Image',
    vertical_promo_image_hint: 'Upload an image that will appear when clicking the promotions button in the public menu',
    promo_image_current: 'Current promotional image',
    promo_image_current_hint: 'It will be displayed when you click the promotion button.',
    upload_vertical_imagen_promo: 'Upload vertical promotional image',
    upload_vertical_imagen_promo_hint: 'Recommended: 600x900px (vertical format). Maximum 5MB. Formats: JPG, PNG, WebP',
    featured_products_title: 'Featured',
    featured_products_hint: 'Select up to 5 products to display in the featured carousel',
    featured_products_label: 'Products',
    featured_products_tip_title: 'Tips for promotions:',
    featured_products_tip1: 'The promotional image will appear when the gift button is clicked',
    featured_products_tip2: 'Featured products will appear in a carousel at the top of the menu',
    featured_products_tip3: 'Use attractive, high-quality images of your featured products',
    featured_products_tip4: 'Select your best-selling products or those with special promotions',
    technical_support_title: 'Technical Support',
    technical_support_subtitle: 'Need help? Fill out the form and our team will contact you soon.',
    create_new_ticket: 'Create New Support Ticket',
    subject_label: 'Subject *',
    subject_placeholder: 'Describe the problem',
    priority_label: 'Priority',
    priority_option1: 'Low - Not urgent',
    priority_option2: 'Medium - Response in 24-48 hours',
    priority_option3: 'High - Response in 2-8 hours',
    priority_option4: 'Urgent - Immediate response',
    category_label: 'Category',
    support_general: 'General Inquiry',
    support_problem: 'Technical Issue',
    support_billing: 'Billing',
    support_function: 'Feature Request',
    support_account: 'Account and Settings',
    support_other: 'Other',
    message_label: 'Message *',
    contact_email_label: 'Contact Email *',
    contact_phone_label: 'Contact Phone (optional)',
    support_problem_description: 'Problem or Inquiry Description *',
    support_problem_description_hint: 'Describe your question or problem in detail. Include steps to reproduce the problem if it is technical.',
    send_ticket_button: 'Send Ticket',
    other_support_channels: 'Other support channels',
    ticket_sent_title: 'Ticket Sent',
    my_support_tickets_title: 'My Support Tickets',
    support_message_note_description: 'Tickets are stored locally and automatically sent to our support system. You will receive a response to the contact email you provided.',
    support_direct_email: '📧 Direct email: ',
    support_days: '⏰ Business hours: Monday to Friday, 9:00 AM - 6:00 PM',
    support_time: '🕐 Typical response time: 2-24 hours depending on priority',
    id_header: 'ID',
    subject_header: 'Subject',
    date_header: 'Date',
    view_details_button: 'View Details',
    clear_form_button: 'Clear Form',
    ticket_detail_modal_title: 'Ticket Details',
    ticket_info_title: 'Ticket Information',
    ticket_id_label: 'Ticket ID',
    support_original_message: 'Your message',
    opened_by_label: 'Opened By',
    creation_date_label: 'Creation Date',
    last_update_label: 'Last Update',
    client_message_title: 'Client Message',
    admin_response_title: 'Support team Response',
    support_information_response: 'answered on:',
    additional_notes_title: 'Additional Notes',
    awaiting_response_title: 'Awaiting Response',
    awaiting_response_text: 'Your ticket is being reviewed by our team. We will contact you soon.',
    close_button: 'Close',
    // STATUS/PRIORITY/CATEGORY
    status_pending: 'Pending',
    status_in_progress: 'In Progress',
    status_resolved: 'Resolved',
    status_closed: 'Closed',
    status_unknown: 'Unknown',
    status_closed_simple: 'Closed',
    priority_urgent: 'Urgent',
    priority_high: 'High',
    priority_medium: 'Medium',
    priority_low: 'Low',
    category_general_name: 'General Inquiry',
    category_technical_name: 'Technical Issue',
    category_billing_name: 'Billing',
    category_feature_name: 'Feature Request',
    category_account_name: 'Account & Settings',
    category_other_name: 'Other',
    regime_simple: 'Simple Tax Regime',
    regime_common_iva: 'Common VAT Regime',
    // DAYS
    day_monday: 'Monday',
    day_tuesday: 'Tuesday',
    day_wednesday: 'Wednesday',
    day_thursday: 'Thursday',
    day_friday: 'Friday',
    day_saturday: 'Saturday',
    day_sunday: 'Sunday',
    // SOCIAL MEDIA
    social_facebook: 'Facebook',
    social_instagram: 'Instagram',
    social_twitter: 'Twitter / X',
    social_whatsapp: 'WhatsApp',
    social_youtube: 'YouTube',
    // TEMPLATES
    colorTemplate1: 'Ocean Blue',
    colorTemplate2: 'Dark mode',
    colorTemplate3: 'Natural Garden',
    colorTemplate4: 'Dark Red',
    colorTemplate5: 'Golden Sunset',
    colorTemplate6: 'Dark Ocean',
    colorTemplate7: 'Vibrant Pink',
    colorTemplate8: 'Dark Purple',
    colorTemplate9: 'Dark Green',
    colorTemplate10: 'Vibrant Orange',
    colorTemplate11: 'Soft Purple',
    colorTemplate12: 'Minimalist Dark',
    // Typography
    typography_title: 'Typography',
    primary_font_label: 'Primary font',
    primary_font_hint: 'Font for body and general text',
    secondary_font_label: 'Secondary font',
    secondary_font_hint: 'For titles and highlights',
    font_size_title_label: 'Title size',
    font_size_subtitle_label: 'Subtitle size',
    font_size_normal_label: 'Normal size',
    font_size_example_hint: 'E.g. 32px',
    // MESSAGES/HINTS/ERRORS
    config_saved_title: 'Settings Saved',
    changes_saved_success: 'Changes have been saved successfully.',
    error_title: 'Error',
    save_error_message: 'There was a problem saving the settings.',
    support_send_error_message: 'There was a problem sending the support request.',
    file_too_large_title: 'File Too Large',
    max_size_5mb_error: 'Maximum size is 5MB',
    recommended_specs_title: 'Recommended Specifications',
    accepted_formats_list: 'Accepted formats: JPG, PNG or GIF',
    optimal_dimensions_list: 'Optimal dimensions: 500x500px or higher',
    max_size_list: 'Maximum size: 5MB',
    prefer_transparent_bg_list: 'Transparent background preferred (PNG)',
    restaurant_name_placeholder: 'Ex: El Buen Sabor Restaurant',
    email_placeholder: 'contact@restaurant.com',
    required_for_whatsapp: 'Required to receive orders via WhatsApp',
    address_placeholder: '123 Main St #45-67, Bogotá',
    description_placeholder: 'Describe your restaurant: specialty, atmosphere, story, what makes it unique...',
    max_500_chars_hint: 'Maximum 500 characters',
    language_es_option: '🇪🇸 Spanish',
    language_en_option: '🇺🇸 English',
    language_selector_hint: 'Set the language of the admin interface',
    currency_cop_option: '🇨🇴 Colombian Peso (COP)',
    currency_usd_option: '🇺🇸 US Dollar (USD)',
    currency_eur_option: '🇪🇺 Euro (EUR)',
    currency_mxn_option: '🇲🇽 Mexican Peso (MXN)',
    currency_ars_option: '🇦🇷 Argentine Peso (ARS)',
    currency_clp_option: '🇨🇱 Chilean Peso (CLP)',
    currency_pen_option: '🇵🇪 Peruvian Sol (PEN)',
    currency_selector_hint: 'Currency to display prices in your menu',
    copied_title: 'Copied',
    url_copied_success: 'URL copied to clipboard',
    hours_hint_public_menu: 'The hours are displayed in your public menu',
    hours_hint_open_closed: 'Customers will see whether you are open or closed',
    hours_hint_different_days: 'You can set different hours for each day',
    about_social_media_title: 'About social media:',
    social_hint_footer: 'Links will appear in the footer of your public menu',
    social_hint_full_urls: 'Make sure to use full URLs (https://...)',
    social_hint_whatsapp_format: 'For WhatsApp, use international format (+country code + number)',
    social_hint_icons: 'Icons will display automatically based on the social network',
    rate_value_number_error: 'The rate value must be a number.',
    important_qr_info_title: 'Important information about QR:',
    qr_hint_unique_code: 'Each table will have its own unique QR code',
    qr_hint_scan_to_menu: 'Customers scan the code to access the menu',
    qr_hint_table_auto_detect: 'The table number is detected automatically',
    qr_hint_print_download: 'You can print and download each QR code individually',
    about_customization_title: 'About customization:',
    theme_hint_auto_apply: 'Changes will be applied automatically to your public menu',
    theme_hint_preview: 'You can preview changes by saving the configuration',
    theme_hint_contrast: 'Ensure colors have good contrast for readability',
    theme_hint_font_css: 'Font sizes accept CSS values (px, rem, em)',
    field_required_error: 'This field is required.',
    nit_invalid_error: 'Invalid NIT.',
    select_department_first_hint: 'Select department first',
    ticket_final_message_placeholder: 'Ex: Thanks for your purchase! Come back soon.',
    notes_about_billing_title: 'Notes about Billing:',
    billing_hint_legal_tickets: 'Important for generating legally valid order tickets in Colombia',
    billing_hint_iva_calc: 'If you are VAT responsible, VAT will be calculated and shown on each ticket',
    billing_hint_dian_fe: 'DIAN resolution is required for electronic invoicing',
    billing_hint_tip_optional: 'The suggested tip will be automatically calculated as 10% of the subtotal and will be displayed at the end of the receipt. The customer can decide whether to include it or not.',
    billing_hint_keep_updated: 'Make sure to keep this information updated',
    max_5_products_error: 'Maximum 5 products selected',
    featured_products_selected: 'out of 5 selected products',
    message_placeholder: 'Your detailed message...',
    ticket_sent_success_message: 'Your support request has been sent successfully. We will respond as soon as possible.',
    admin_no_response_yet: 'The administrator has not yet responded to this ticket.',
    select_department: 'Select a Department',
    select_city: 'Select a City',
    view_offers: 'View Offers', // Added missing key from initial state
    actions_header: 'Actions',
    // Placeholders for social media
    facebook_placeholder: 'https://facebook.com/your-restaurant',
    instagram_placeholder: 'https://instagram.com/your-restaurant',
    twitter_placeholder: 'https://twitter.com/your-restaurant',
    whatsapp_placeholder: '+57 300 123 4567',
    youtube_placeholder: 'https://youtube.com/your-channel',
    tiktok_placeholder: 'https://tiktok.com/@your-restaurant',
    website_label: 'Website',
    website_placeholder: 'https://your-restaurant.com',
    // Additional Settings Strings
    status_closed_unknown: 'Unknown',
    config_toast_error: 'Error',
    config_toast_error1: 'There was a problem saving the settings.',
    config_toast_error2: 'There was a problem sending the support request.',
    config_hours_subtitle: 'Configure your restaurant operating hours',
    preparation_time_title: 'Preparation Time',
    prep_time_label: 'Estimated preparation time',
    prep_time_placeholder: 'E.g.: 30-45 minutes',
    prep_time_hint: 'This is the time that will be shown to customers as an estimate for order preparation',
    opening_hours_section: 'Operating Hours',
    hours_open_label: 'Opening',
    hours_close_label: 'Closing',
    important_info: 'Important information:',
    hours_show_public: 'Hours are displayed on your public menu',
    hours_show_status: 'Customers will see if you are open or closed',
    hours_different_days: 'You can configure different hours for each day',
    about_social_media: 'About social media:',
    social_footer_hint: 'Links will appear in the footer of your public menu',
    social_full_urls: 'Make sure to use full URLs (https://...)',
    social_whatsapp_format: 'For WhatsApp, use international format (+country code + number)',
    social_auto_icons: 'Icons will be displayed automatically based on the social network',
    rate_name_placeholder: 'Standard, Express, Premium...',
    min_order_label: 'Minimum Order ($)',
    max_order_label: 'Maximum Order ($)',
    shipping_cost_label: 'Cost ($)',
    rate_value_error: 'The rate value must be a number.',
    table_settings_title: 'Table Orders Settings',
    qr_codes_title: 'Table QR Codes',
    qr_codes_description: 'QR codes allow customers to access the menu directly from their table.',
    important_qr_info: 'Important information about QR codes:',
    qr_unique_code: 'Each table will have its own unique QR code',
    qr_scan_menu: 'Customers scan the code to access the menu',
    qr_auto_detect: 'The table number is automatically detected',
    qr_print_download: 'You can print and download each QR code individually',
    menu_bg_label: 'Menu Background Color',
    menu_bg_hint: 'Main menu background',
    card_bg_label: 'Card and Background Color',
    card_bg_hint: 'Product cards',
    primary_text_label: 'Primary Text Color',
    primary_text_hint: 'Titles and main texts',
    secondary_text_label: 'Secondary Text Color',
    secondary_text_hint: 'Descriptions and subtitles',
    about_customization: 'About customization:',
    theme_auto_apply: 'Changes will be applied automatically to your public menu',
    theme_preview: 'You can preview changes by saving the configuration',
    theme_contrast: 'Make sure colors have good contrast for readability',

    // Analytics
    totalRevenue: 'Total Revenue',
    averageTicket: 'Average Ticket',
    monthlyOrders: 'Monthly Orders',
    ordersByType: 'Orders by Type',
    ordersByStatus: 'Orders by Status',
    topProducts: 'Top Products',
    recentActivity: 'Recent Activity',
    filterByDates: 'Filter by Dates',
    from: 'From',
    to: 'To',
    clearFilters: 'Clear Filters',
    showingDataFrom: 'Showing data from',
    until: 'until',
    today: 'Today',
    notEnoughData: 'Not enough data to display',
    noSalesYet: 'No sales recorded yet',
    sold: 'sold',
    analyticsToastNoData: "No data to export with current filters.",
    analyticsToastExportSuccess: "Analytics report exported successfully.",
    csvReportTitle: "ANALYTICS REPORT",
    csvRestaurantLabel: "Restaurant",
    csvGenerationDate: "Generation Date",
    csvPeriodLabel: "Analyzed Period",
    csvAllPeriods: "All Periods",
    csvExecutiveSummary: "EXECUTIVE SUMMARY",
    csvTotalOrders: "Total Orders",
    csvCompletedOrders: "Completed Orders",
    csvCancelledOrders: "Cancelled Orders",
    csvCompletionRate: "Completion Rate",
    csvTotalRevenue: "Total Revenue",
    csvAverageTicket: "Average Ticket",
    csvOrderTypeDistribution: "ORDER TYPE DISTRIBUTION",
    csvOrderStatusDistribution: "STATUS DISTRIBUTION",
    orderTypePickup: "Pickup",
    orderTypeDelivery: "Delivery",
    orderTypeTable: "Table Service",
    orderStatusPendingPlural: "Pending Orders",
    orderStatusConfirmedPlural: "Confirmed Orders",
    orderStatusPreparing: "In Preparation",
    orderStatusReadyPlural: "Ready Orders",
    orderStatusDeliveredPlural: "Delivered Orders",
    orderStatusCancelledPlural: "Cancelled Orders",
    csvTopSellingProducts: "TOP SELLING PRODUCTS",
    csvPosition: "Position",
    csvProduct: "Product",
    csvQuantitySold: "Quantity Sold",
    csvRevenue: "Revenue",
    csvSalesByCategory: "SALES BY CATEGORY",
    csvCategory: "Category",
    csvProductCount: "Product Count",
    csvNoCategory: "No Category",
    csvSalesByDay: "SALES BY DAY OF THE WEEK",
    csvDay: "Day",
    csvOrderCount: "Order Count",
    daySunday: "Sunday",
    dayMonday: "Monday",
    dayTuesday: "Tuesday",
    dayWednesday: "Wednesday",
    dayThursday: "Thursday",
    dayFriday: "Friday",
    daySaturday: "Saturday",
    csvOrderDetails: "COMPLETE ORDER DETAILS",
    csvOrderNumber: "Order No.",
    csvDate: "Date",
    csvTime: "Time",
    csvCustomer: "Customer",
    csvPhone: "Phone",
    csvEmail: "Email",
    csvOrderType: "Order Type",
    csvStatus: "Status",
    csvSubtotal: "Subtotal",
    csvDeliveryCost: "Delivery Cost",
    csvTotal: "Total",
    csvPaymentMethod: "Payment Method",
    csvItems: "Items",
    csvSpecialNotes: "Special Notes",
    csvItemsSoldDetails: "DETAILS OF ITEMS SOLD",
    csvVariation: "Variation",
    csvUnitPrice: "Unit Price",
    fileNameRestaurantDefault: "Restaurant",
    fileNamePrefixFrom: "From",
    fileNamePrefixUntil: "Until",
    analyticsPageTitle: "Restaurant Analytics",
    btnExportCSV: "Export CSV",
    btnAdvancedFilters: "Advanced Filters",
    filterDateRange: "Date Range",
    filterDateStart: "Start Date",
    filterDateUntil: "End Date",
    filterCategory: "Filter by Category",
    filterAllCategories: "All Categories",
    filterOrderType: "Filter by Order Type",
    filterAllTypes: "All Types",
    filterStatus: "Filter by Status",
    filterAllStatuses: "All Statuses",
    filterActiveLabel: "Active Filters",
    filterDateStartShort: "Start",
    filterDateToday: "Today",
    btnClearAllFilters: "Clear All Filters",
    filterSummaryShowing: "Showing",
    filterSummaryOrderPlural: "orders",
    filterSummaryOrderSingular: "order",
    filterSummaryMatchingFilters: " matching the filters.",
    filterSummaryInTotal: " in total.",
    analyticsLastUpdated: "Last Updated",
    statTotalOrders: "Total Orders",
    statCompletedSubtitle: "completed",
    statTotalRevenue: "Total Revenue",
    statDeliveredOrdersSubtitle: "from delivered orders",
    statAverageTicket: "Average Ticket",
    statPerOrderSubtitle: "per delivered order",
    statActiveProducts: "Active Products",
    statOf: "of",
    statTotal: "total",
    chartOrdersByType: "Order Type Distribution",
    chartOrdersByMonth: "Orders by Month (Last 6)",
    chartNoData: "No data available for the selected date range.",
    chartOrderStatus: "Order Status Distribution",
    orderStatusPending: "Pending",
    orderStatusConfirmed: "Confirmed",
    orderStatusReady: "Ready",
    orderStatusDelivered: "Delivered",
    orderStatusCancelled: "Cancelled",
    orderStatusUnknown: "Unknown",
    chartTopProductsTitle: 'Top Selling Products',
    chartNoProducts: 'No sales registered yet',
    unitsSold: 'sold',
    recentOrdersTitle: 'Recent Orders',
    customerUnknown: 'N/A',
    
    // Subscription
    subscriptionPlans: 'Subscription Plans',
    choosePlan: 'Choose Plan',
    currentPlan: 'Current Plan',
    planActivated: 'Plan Activated!',
    freePlan: 'Free',
    basicPlan: 'Basic',
    proPlan: 'Pro',
    businessPlan: 'Business',
    mostPopular: 'Most Popular',
    unlimited: 'unlimited',
    upTo: 'Up to',
    advancedStats: 'Advanced analytics',
    customDomain: 'Custom domain',
    prioritySupport: 'Priority support',
    advancedCustomization: 'Advanced customization',
    perfectToStart: 'Perfect to start',
    forGrowingRestaurants: 'For growing restaurants',
    forChainsAndFranchises: 'For chains and franchises',
    needHelp: 'Need help choosing?',
    allPlansInclude: 'All plans include full access to our menu and order management system.',
    canChangeAnytime: 'You can change plans at any time.',
    
    // Public Menu
    title_public_menu: 'Public Menu',
    charging_public_menu: 'Charging menu...',
    presenting_featured_products: 'We present our',
    presenting_featured_products1: 'HIGHLIGHTS',
    description_public_menu: 'Share this link with your customers so they can view your menu and place orders',
    your_custom_url: 'Your custom URL:',
    copy: 'Copy',
    copied_title_public_menu: 'Copied',
    copied_message: 'URL copied to clipboard',
    view_menu: 'View Menu',
    addToCart: 'Add to Cart',
    cart: 'Cart',
    checkout: 'Checkout',
    yourOrder: 'Your Order',
    cartEmpty: 'Your cart is empty',
    addProductsToStart: 'Add some products to get started',
    proceedToCheckout: 'Proceed to Checkout',
    orderConfirmed: 'Order Confirmed!',
    orderSent: 'Your order has been sent!',
    willContactSoon: 'We have sent your order via WhatsApp to the restaurant. They will contact you soon to confirm.',
    continue: 'Continue',
    finalizeOrder: 'Finalize Order',
    orderTypeSelection: 'Order Type',
    pickupAtRestaurant: 'At the restaurant',
    tableOrder: 'Table order',
    selectTable: 'Select Table',
    fullName: 'Full Name',
    optionalEmail: 'Email (optional)',
    completeAddress: 'Complete Address',
    locationReferences: 'References and location points',
    productActivatedTitle: 'Product activated',
    productActivatedMessage: 'The product has been activated and now appears on your public menu.',
    productCreatedTitle: 'Product created',
    productCreatedMessage: 'The new product has been added to your menu.',
    productUpdatedTitle: 'Product updated',
    productUpdatedMessage: 'The product has been successfully updated.',
    productDeletedTitle: 'Product deleted',
    productDeletedMessage: 'The product has been removed from your menu.',
    productDuplicatedTitle: 'Product duplicated',
    productDuplicatedMessage: 'A copy of the product has been created.',
    productArchivedTitle: 'Product archived',
    productArchivedMessage: 'The product has been archived and no longer appears on your public menu.',
    orderUpdatedTitle: 'Order updated',
    orderUpdatedMessage: 'The product position has been updated.',
    productsReorderedMessage: 'Products have been reordered successfully.',
    productLimitTitle: 'Product limit reached',
    productLimitMessage: 'Your current plan allows only {{limit}} products. Upgrade your plan to add more.',
    productsAllowed: 'products allowed',
    upgradePlanToAddMore: 'Upgrade your plan to add more.',
    unknown: 'Unknown',
    unknownCategory: 'Unknown Category',
    copyLabel: 'Copy',
    searchPlaceholder: 'Search products by name, description or SKU...',
    all: 'All',
    tipLabel: 'Tip',
    dragToReorder: 'Drag and drop products to reorder them',
    noProductsFound: 'No products found',
    createFirstProduct: 'Create your first product to get started.',
    clearSearch: 'Clear search',
    noImage: 'No image',
    offer: 'OFFER',
    statusUpdated: 'Status updated',
    productStatusChangedTo: 'Product status changed to:',
    moveUp: 'Move up',
    moveDown: 'Move down',
    editProduct: 'Edit product',
    duplicateProduct: 'Duplicate product',
    activateProduct: 'Activate product',
    archiveProduct: 'Archive product',
    deleteProduct: 'Delete product',
    deleteProductQuestion: 'Delete product?',
    deleteProductWarning: 'This action will permanently remove the product from your menu. Customers will no longer see or order it.',
    
    
    // Days of week
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    
    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
    
    // Time
    open: 'Open',
    closed: 'Closed',
    openNow: 'Open now',
    closedNow: 'Closed',
    hours: 'hours',
    minutes: 'minutes',
    
    // Errors and Messages
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    required: 'required',
    invalidEmail: 'Invalid email',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordsDontMatch: 'Passwords do not match',
    userNotFound: 'User not found',
    incorrectPassword: 'Incorrect password',
    emailAlreadyRegistered: 'Email is already registered',
    registrationSuccessful: 'Registration Successful!',
    accountPendingApproval: 'Your account is pending approval by our team.',
    unexpectedError: 'Unexpected error',
    confirmDelete: 'Are you sure you want to delete',
    actionCannotBeUndone: 'This action cannot be undone.',
    
    // Limits and Restrictions
    productLimitReached: 'Product Limit Reached',
    categoryLimitReached: 'Category Limit Reached',
    upgradeSubscription: 'Upgrade your subscription',
    addMoreProducts: 'to add more products.',
    addMoreCategories: 'to add more categories.',
    
    // Super Admin
    superAdminPanel: 'Super Admin Panel',
    superAdminDashboard: 'Main Dashboard',
    restaurantsManagement: 'Restaurant Management',
    usersManagement: 'User Management',
    subscriptionsManagement: 'Subscription Management',
    systemStatistics: 'System Statistics',

    // Landing Page
    navFeatures: 'Features',
    navPricing: 'Pricing',
    navTestimonials: 'Testimonials',
    heroTitle: 'Transform Your Restaurant with Digital Technology',
    heroSubtitle: 'Manage orders, digital menu, customers and sales on a single platform. Increase your sales by up to 40% with Platyo.',
    startFreeTrial: 'Start Free Trial',
    learnMore: 'Learn More',
    featuresTitle: 'Everything you need to manage your restaurant',
    featuresSubtitle: 'A complete platform with all the tools to grow your business',
    howItWorksTitle: 'How it works?',
    howItWorksSubtitle: 'Start receiving orders in minutes',
    step1Title: 'Sign Up Free',
    step1Desc: 'Create your account without a credit card. Start with the free plan.',
    step2Title: 'Configure Your Menu',
    step2Desc: 'Add your products, categories and customize your digital menu with your brand colors.',
    step3Title: 'Receive Orders',
    step3Desc: 'Share your unique link and start receiving orders in real-time from any device.',
    pricingTitle: 'Choose the perfect plan for your business',
    pricingSubtitle: 'Flexible plans that grow with you. Change or cancel anytime.',
    planFree: 'Free',
    planFreeDesc: 'Perfect to get started',
    planFreeFeature1: 'Up to 10 products',
    planFreeFeature2: 'Up to 3 categories',
    planFreeFeature3: 'Public digital menu',
    planFreeFeature4: 'Unlimited order management',
    planFreeFeature5: 'Email support',
    perMonth: 'month',
    planBasicDesc: 'For growing restaurants',
    planBasicFeature1: 'Up to 50 products',
    planBasicFeature2: 'Up to 10 categories',
    planBasicFeature3: 'Full theme customization',
    planBasicFeature4: 'Multiple images per product',
    planBasicFeature5: 'Priority support',
    planProDesc: 'For established restaurants',
    planProFeature1: 'Up to 200 products',
    planProFeature2: 'Up to 20 categories',
    planProFeature3: 'Advanced analytics',
    planProFeature4: 'Advanced POS invoicing',
    planProFeature5: '24/7 support',
    planBusinessDesc: 'For chains and franchises',
    planBusinessFeature1: 'Unlimited products',
    planBusinessFeature2: 'Unlimited categories',
    planBusinessFeature3: 'API for integrations',
    planBusinessFeature4: 'Complete white label',
    planBusinessFeature5: 'Dedicated support',
    getStarted: 'Get Started Now',
    testimonialsTitle: 'What our customers say',
    testimonialsSubtitle: 'Thousands of restaurants trust Platyo to manage their business',
    testimonial1: 'Platyo completely transformed my restaurant. Orders increased by 50% in the first month. Amazing!',
    testimonial2: 'The best investment we have made. The system is very easy to use and our customers love the digital menu.',
    testimonial3: 'Excellent platform. The support is fantastic and POS invoicing has saved us a lot of time.',
    ctaTitle: 'Ready to transform your restaurant?',
    ctaSubtitle: 'Join hundreds of restaurants that are already growing with Platyo. No credit card required.',
    startNow: 'Start Now',
    footerDescription: 'The all-in-one platform for modern restaurant management. Digital menu, orders, billing and more.',
    footerQuickLinks: 'Quick Links',
    footerContact: 'Contact',
    footerEmail: 'Email',
    footerPhone: 'Phone',
    footerRights: 'All rights reserved.',
  },
};

export const useTranslation = (language: Language = 'es') => {
  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations['es'][key] || key;
  };
  
  return { t };
};