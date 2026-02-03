import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Save, Globe, Clock, Truck, QrCode, Palette, Bell, MapPin, HelpCircle, Send, Eye, Calendar, Mail, Phone, Building, Store, Megaphone, Upload, Image as ImageIcon, FileText, DollarSign, Star, ChevronDown, ExternalLink } from 'lucide-react';
import { colombianDepartments, colombianCitiesByDepartment, validateNIT, formatNIT } from '../../utils/colombianCities';
import { Restaurant } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export const RestaurantSettings: React.FC = () => {
  const { restaurant, user } = useAuth();
  const { showToast } = useToast();
  const { t, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: '',
    priority: 'medium',
    category: 'general',
    message: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadSupportTickets = async () => {
      if (!restaurant?.id) return;

      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      const formattedTickets = (data || []).map(ticket => ({
        id: ticket.id,
        restaurantId: ticket.restaurant_id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        message: ticket.message,
        contactEmail: ticket.contact_email,
        contactPhone: ticket.contact_phone,
        status: ticket.status === 'open' ? 'pending' : ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        response: ticket.response,
        responseDate: ticket.response_date,
        adminNotes: ticket.admin_notes
      }));

      setSupportTickets(formattedTickets);
    };

    const loadProducts = async () => {
      if (!restaurant?.id) return;

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'active')
        .order('name', { ascending: true });

      setProducts(data || []);
    };

    // Optimización: no cargar tickets/productos hasta que se necesiten
    if (activeTab === 'support') loadSupportTickets();
    if (activeTab === 'promo') loadProducts();

    if (restaurant) {
      setSupportForm(prev => ({
        ...prev,
        contactEmail: restaurant.email || '',
        contactPhone: restaurant.phone || ''
      }));
    }
  }, [restaurant, activeTab]);

  useEffect(() => {
    if (restaurant) {
      const defaultTheme = {
        primary_color: '#dc2626',
        secondary_color: '#f3f4f6',
        menu_background_color: '#ffffff',
        card_background_color: '#f9fafb',
        primary_text_color: '#111827',
        secondary_text_color: '#6b7280',
        accent_color: '#16a34a',
        text_color: '#1f2937',
        primary_font: 'Inter',
        secondary_font: 'Poppins',
        font_sizes: {
          title: '32px',
          subtitle: '24px',
          normal: '16px',
          small: '14px',
        },
        font_weights: {
          light: 300,
          regular: 400,
          medium: 500,
          bold: 700,
        },
        button_style: 'rounded' as const,
      };

      setFormData({
        ...restaurant,
        settings: {
          ...restaurant.settings,
          theme: {
            ...defaultTheme,
            ...restaurant.settings.theme,
            font_sizes: {
              ...defaultTheme.font_sizes,
              ...(restaurant.settings.theme.font_sizes || {}),
            },
            font_weights: {
              ...defaultTheme.font_weights,
              ...(restaurant.settings.theme.font_weights || {}),
            },
          },
          promo: restaurant.settings.promo || {
            enabled: false,
            banner_image: '',
            promo_text: '',
            cta_text: 'Ver Ofertas',
            cta_link: '',
          },
          billing: restaurant.settings.billing || {
            nombreComercial: restaurant.name || '',
            razonSocial: '',
            nit: '',
            direccion: restaurant.address || '',
            departamento: 'Cundinamarca',
            ciudad: 'Bogotá D.C.',
            telefono: restaurant.phone || '',
            correo: restaurant.email || '',
            regimenTributario: 'simple' as const,
            responsableIVA: false,
            aplicaIPC: false,
            porcentajeIPC: 8,
            tieneResolucionDIAN: false,
            numeroResolucionDIAN: '',
            fechaResolucion: '',
            rangoNumeracionDesde: undefined,
            rangoNumeracionHasta: undefined,
            aplicaPropina: true,
            mostrarLogoEnTicket: false,
            logoTicket: '',
            mensajeFinalTicket: '',
          },
        },
      });
    }
  }, [restaurant]);

  const handleSave = useCallback(async () => {
    if (!formData || !restaurant) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          logo_url: formData.logo_url,
          banner_url: formData.banner_url,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          theme_color: formData.theme_color,
          settings: formData.settings,
          domain: formData.domain,
          elevenlabs_agent_id: formData.elevenlabs_agent_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) throw error;

      showToast(
        'success',
        t('config_saved_title'),
        t('changes_saved_success'),
        4000
      );

      // Evitamos recargar toda la página: el estado local ya refleja los cambios
      // Si tu AuthContext expone un método para refrescar `restaurant`, puedes llamarlo aquí.

    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(
        'error',
        t('config_toast_error'),
        t('config_toast_error1'),
        4000
      );
    } finally {
      setLoading(false);
    }
  }, [formData, restaurant, showToast, t]);

  const updateFormData = useCallback((path: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;

      const keys = path.split('.');

      // Clonado inmutable por niveles (evita mutaciones profundas y mantiene referencias estables)
      const next: any = Array.isArray(prev) ? [...(prev as any)] : { ...prev };

      let curPrev: any = prev;
      let curNext: any = next;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        const prevVal = curPrev?.[k];

        const nextVal = Array.isArray(prevVal)
          ? [...prevVal]
          : prevVal && typeof prevVal === 'object'
            ? { ...prevVal }
            : {};

        curNext[k] = nextVal;
        curPrev = prevVal;
        curNext = nextVal;
      }

      curNext[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const handleCurrencyChange = useCallback(async (currency: string) => {
    if (!formData || !restaurant) return;

    updateFormData('settings.currency', currency);

    try {
      const updatedSettings = {
        ...restaurant.settings,
        currency
      };

      const { error } = await supabase
        .from('restaurants')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurant.id);

      if (error) {
        console.error('Error updating currency in database:', error);
        showToast('error', t('config_toast_error'), t('config_toast_error1'), 3000);
        return;
      }

      showToast('success', t('config_saved_title'), t('currency') + ' ' + t('changes_saved_success').toLowerCase(), 2000);
    } catch (error) {
      console.error('Error updating currency:', error);
      showToast('error', t('config_toast_error'), t('config_toast_error1'), 3000);
    }
  }, [formData, restaurant, showToast, t, updateFormData]);

  const handleSupportSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);

    try {
      const newTicket = {
        user_id: user?.id,
        restaurant_id: restaurant?.id,
        subject: supportForm.subject,
        category: supportForm.category,
        priority: supportForm.priority,
        description: supportForm.message,
        message: supportForm.message,
        contact_email: supportForm.contactEmail,
        contact_phone: supportForm.contactPhone || '',
        status: 'open',
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert([newTicket])
        .select()
        .single();

      if (error) throw error;

      console.log('Ticket de soporte creado:', data);

      showToast(
        'success',
        t('support_ticket_created_title') || 'Ticket creado',
        t('support_ticket_created_message') || 'Tu solicitud de soporte ha sido enviada exitosamente.',
        4000
      );

      setSupportSuccess(true);

      setTimeout(() => {
        setSupportForm({
          subject: '',
          priority: 'medium',
          category: 'general',
          message: '',
          contactEmail: restaurant?.email || '',
          contactPhone: restaurant?.phone || ''
        });
        setSupportSuccess(false);
      }, 3000);

      const formattedTicket = {
        id: data.id,
        restaurantId: data.restaurant_id,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        message: data.message,
        contactEmail: data.contact_email,
        contactPhone: data.contact_phone,
        status: data.status === 'open' ? 'pending' : data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        response: data.response,
        responseDate: data.response_date,
        adminNotes: data.admin_notes
      };

      setSupportTickets(prev => [formattedTicket, ...prev]);

    } catch (error) {
      console.error('Error sending support request:', error);
      showToast(
        'error',
        t('config_toast_error'),
        t('config_toast_error2'),
        4000
      );
    } finally {
      setSupportLoading(false);
    }
  }, [restaurant, showToast, supportForm, t, user]);

  const handleViewTicketDetails = useCallback((ticket: any) => {
    setSelectedTicket(ticket);
    setShowTicketDetailModal(true);
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('status_pending')}</Badge>;
      case 'in_progress':
        return <Badge variant="info">{t('status_in_progress')}</Badge>;
      case 'resolved':
        return <Badge variant="success">{t('status_resolved')}</Badge>;
      case 'closed':
        return <Badge variant="gray">{t('status_closed_simple')}</Badge>;
      default:
        return <Badge variant="gray">{t('status_closed_unknown')}</Badge>;
    }
  }, [t]);

  const getPriorityBadge = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="error">{t('priority_urgent')}</Badge>;
      case 'high':
        return <Badge variant="warning">{t('priority_high')}</Badge>;
      case 'medium':
        return <Badge variant="info">{t('priority_medium')}</Badge>;
      case 'low':
        return <Badge variant="gray">{t('priority_low')}</Badge>;
      default:
        return <Badge variant="gray">{t('priority_medium')}</Badge>;
    }
  }, [t]);

  const getCategoryName = useCallback((category: string) => {
    const categories: { [key: string]: string } = {
      general: 'Consulta General',
      technical: 'Problema Técnico',
      billing: 'Facturación',
      feature: 'Solicitud de Función',
      account: 'Cuenta y Configuración',
      other: 'Otro'
    };
    return categories[category] || category;
  }, []);

  const tabs = useMemo(() => ([
    { id: 'general', name: t('tab_general'), icon: Globe },
    { id: 'hours', name: t('tab_hours'), icon: Clock },
    { id: 'social', name: t('tab_social'), icon: Globe },
    { id: 'delivery', name: t('tab_delivery'), icon: Truck },
    { id: 'tables', name: t('tab_table_orders'), icon: QrCode },
    { id: 'promo', name: t('tab_promo'), icon: Megaphone },
    { id: 'theme', name: t('tab_theme'), icon: Palette },
    { id: 'billing', name: t('tab_billing'), icon: FileText },
    { id: 'support', name: t('tab_support'), icon: HelpCircle },
  ]), [t]);

  if (!formData) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('settings')}</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <a
            href={restaurant?.slug ? `/${restaurant.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!restaurant?.slug) {
                e.preventDefault();
                showToast('warning', 'No disponible', 'El menú público aún no está disponible', 3000);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            {t('viewMenu')}
          </a>
          <Button
            onClick={handleSave}
            loading={loading}
            icon={Save}
            className="w-full sm:w-auto"
          >
            {t('save')} {t('settings')}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          {/* Mobile Dropdown */}
          <div className="block md:hidden px-4 py-3">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Desktop Tabs */}
          <nav className="hidden md:flex md:space-x-4 lg:space-x-8 px-4 lg:px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 lg:px-1 border-b-2 font-medium text-xs lg:text-sm flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">


              {/* Logo Section - Modern Card */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900">{t('visual_identity_title')}</h3>
                      <p className="text-sm text-gray-600">{t('logo_subtitle')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl md:rounded-2xl border-2 md:border-4 border-gray-100 shadow-xl bg-gradient-to-br from-gray-50 to-white overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                          {formData.logo_url ? (
                            <img
                              src={formData.logo_url}
                              alt="Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-2 md:p-4">
                              <Store className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-400 font-medium">{t('no_logo')}</p>
                            </div>
                          )}
                        </div>
                        {formData.logo_url && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                          <label className="relative cursor-pointer flex-1 min-w-[200px]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    showToast('error', t('file_too_large_title'), t('max_size_5mb_error'), 3000);
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateFormData('logo_url', reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                              id="logo-upload"
                            />
                            <span className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
                              <Upload className="w-4 h-4 mr-2" />
                              {formData.logo_url ? t('change_logo_button') : t('upload_logo_button')}
                            </span>
                          </label>

                          {formData.logo_url && (
                            <button
                              onClick={() => updateFormData('logo_url', '')}
                              className="inline-flex items-center px-6 py-3 bg-red-50 border-2 border-red-200 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-100 hover:border-red-300 transition-all"
                            >
                              {t('delete_button')}
                            </button>
                          )}
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 mb-2">{t('recommended_specs_title')}</p>
                              <ul className="space-y-1.5 text-xs text-gray-700">
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                  {t('accepted_formats_list')}
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                  {t('optimal_dimensions_list')}
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                  {t('max_size_list')}
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                  {t('prefer_transparent_bg_list')}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restaurant Info Section - Modern Grid */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900">{t('restaurantInfo')}</h3>
                      <p className="text-sm text-gray-600">{t('contact_location_subtitle')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        {t('restaurantName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-medium"
                        placeholder={t('restaurant_name_placeholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {t('email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="contacto@restaurante.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {t('phone')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all font-medium"
                        placeholder={t('whatsapp_placeholder')}
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {t('required_for_whatsapp')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {t('address')}
                      </label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                        placeholder={t('address_placeholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      {t('description')}
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none"
                      placeholder={t('description_placeholder')}
                    />
                    <p className="text-xs text-gray-500 mt-2">{t('max_500_chars_hint')}</p>
                  </div>
                </div>
              </div>

              {/* Regional Settings Section - Modern Design */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900">{t('regionalSettings')}</h3>
                      <p className="text-sm text-gray-600">{t('language_currency_subtitle')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg md:rounded-xl p-4 md:p-5 border-2 border-purple-100">
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        {t('language')}
                      </label>
                      <select
                        value={formData.settings.language || 'es'}
                        onChange={(e) => {
                          updateFormData('settings.language', e.target.value);
                          setLanguage(e.target.value as 'es' | 'en');
                        }}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                      >
                        <option value="es">{t('language_es_option')}</option>
                        <option value="en">{t('language_en_option')}</option>
                      </select>
                      <p className="text-xs text-gray-600 mt-2">
                        {t('language_selector_hint')}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-50 rounded-xl p-5 border-2 border-purple-100">
                      <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        {t('currency')}
                      </label>
                      <select
                        value={formData.settings.currency || 'COP'}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                      >
                        <option value="COP">{t('currency_cop_option')}</option>
                        <option value="USD">{t('currency_usd_option')}</option>
                        <option value="EUR">{t('currency_eur_option')}</option>
                        <option value="MXN">{t('currency_mxn_option')}</option>
                        <option value="ARS">{t('currency_ars_option')}</option>
                        <option value="CLP">{t('currency_clp_option')}</option>
                        <option value="PEN">{t('currency_pen_option')}</option>
                      </select>
                      <p className="text-xs text-gray-600 mt-2">
                        {t('currency_selector_hint')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Voice Assistant Section */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900">Asistente de Voz</h3>
                      <p className="text-sm text-gray-600">Configura tu agente de voz</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Agent ID
                      </label>
                      <input
                        type="text"
                        value={formData.elevenlabs_agent_id || ''}
                        onChange={(e) => updateFormData('elevenlabs_agent_id', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                        placeholder="agent_xxxxxxxxxxxxxxxxxxxxx"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Ingresa el Agent ID de tu agente para habilitar el widget de voz en tu menú público.
                      </p>
                    </div>

                    

                    {formData.elevenlabs_agent_id && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-green-800">
                            Widget de voz habilitado
                          </p>
                        </div>
                        <p className="text-xs text-green-700 mt-2 ml-8">
                          El widget de voz aparecerá en tu menú público una vez guardes los cambios.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>





            </div>
          )}

          {activeTab === 'hours' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">{t('businessHours')}</h3>
                  <p className="text-sm text-gray-600">{t('config_hours_subtitle')}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 border border-blue-100 shadow-sm">
                <h4 className="text-sm md:text-md font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  {t('preparation_time_title')}
                </h4>
                <div className="space-y-3">
                  <Input
                    label={t('prep_time_label')}
                    value={formData.settings.preparation_time || '30-45 minutos'}
                    onChange={(e) => updateFormData('settings.preparation_time', e.target.value)}
                    placeholder={t('prep_time_placeholder')}
                  />
                  <p className="text-xs text-gray-500">
                    {t('prep_time_hint')}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg md:rounded-xl p-4 md:p-6 border border-blue-100 shadow-sm">
                <h4 className="text-sm md:text-md font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  {t('opening_hours_section')}
                </h4>
                <div className="space-y-3">
                  {Object.entries(formData.settings.business_hours).map(([day, hours]) => (
                    <div key={day} className="bg-white rounded-lg p-3 md:p-4 border border-blue-200 hover:border-blue-300 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 md:w-40">
                          <input
                            type="checkbox"
                            checked={hours.is_open}
                            onChange={(e) => updateFormData(`settings.business_hours.${day}.is_open`, e.target.checked)}
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            id={`${day}-checkbox`}
                          />
                          <label htmlFor={`${day}-checkbox`} className="text-sm font-semibold text-gray-900 capitalize cursor-pointer">
                            {t(day)}
                          </label>
                        </div>

                        {hours.is_open ? (
                        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1 w-full">
                          {/* Hora de apertura */}
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('hours_open_label')}
                            </label>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) =>
                                updateFormData(`settings.business_hours.${day}.open`, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        
                          {/* Separador */}
                          <div className="text-gray-400 text-center md:mt-5">—</div>
                        
                          {/* Hora de cierre */}
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('hours_close_label')}
                            </label>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) =>
                                updateFormData(`settings.business_hours.${day}.close`, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        </div>

                        ) : (
                          <div className="flex-1">
                            <Badge variant="gray">{t('closed')}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">{t('important_info')}</p>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                      <li>{t('hours_show_public')}</li>
                      <li>{t('hours_show_status')}</li>
                      <li>{t('hours_different_days')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-md">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">{t('socialMedia')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('social_media_subtitle')}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Facebook</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={formData.settings.social_media?.facebook || ''}
                        onChange={(e) => updateFormData('settings.social_media.facebook', e.target.value)}
                        placeholder={t('facebook_placeholder')}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Instagram</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={formData.settings.social_media?.instagram || ''}
                        onChange={(e) => updateFormData('settings.social_media.instagram', e.target.value)}
                        placeholder={t('instagram_placeholder')}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Twitter / X</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={formData.settings.social_media?.twitter || ''}
                        onChange={(e) => updateFormData('settings.social_media.twitter', e.target.value)}
                        placeholder={t('twitter_placeholder')}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      </div>
                      <input
                        type="tel"
                        value={formData.settings.social_media?.whatsapp || ''}
                        onChange={(e) => {
                          // Limpiar espacios y caracteres no permitidos
                          const cleanNumber = e.target.value.replace(/[^0-9]/g, '');
                          updateFormData('settings.social_media.whatsapp', cleanNumber);
                        }}
                        placeholder="573001234567"
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">TikTok</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0011.14-4.02v-6.95a8.16 8.16 0 004.65 1.46v-3.4a4.84 4.84 0 01-1.2-.5z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={formData.settings.social_media?.tiktok || ''}
                        onChange={(e) => updateFormData('settings.social_media.tiktok', e.target.value)}
                        placeholder={t('tiktok_placeholder')}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t('website_label')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        value={formData.settings.social_media?.website || ''}
                        onChange={(e) => updateFormData('settings.social_media.website', e.target.value)}
                        placeholder={t('website_placeholder')}
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Globe className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-purple-800 font-medium">{t('about_social_media')}</p>
                    <ul className="text-xs text-purple-700 mt-2 space-y-1 list-disc list-inside">
                      <li>{t('social_footer_hint')}</li>
                      <li>{t('social_full_urls')}</li>
                      <li>{t('social_whatsapp_format')}</li>
                      <li>{t('social_auto_icons')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base md:text-lg font-medium text-gray-900">{t('deliverySettings')}</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.settings.delivery.enabled}
                    onChange={(e) => updateFormData('settings.delivery.enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {formData.settings.delivery.enabled ? t('enable') : t('disabled')}
                  </span>
                </div>
              </div>

              {formData.settings.delivery.enabled && (
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <h4 className="text-sm md:text-md font-medium text-gray-900 mb-3 md:mb-4">{t('delivery_rates_title')}</h4>
                    <div className="space-y-3 md:space-y-4">
                      {(formData.settings.delivery.pricing_tiers || []).map((tier, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 p-3 md:p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <Input
                              label={t('rate_name_label')}
                              value={tier.name || ''}
                              onChange={(e) => {
                                const newTiers = [...(formData.settings.delivery.pricing_tiers || [])];
                                newTiers[index] = { ...tier, name: e.target.value };
                                updateFormData('settings.delivery.pricing_tiers', newTiers);
                              }}
                              placeholder="Estándar, Express, Premium..."
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              label={t('min_order_label')}
                              type="number"
                              step="0.01"
                              value={tier.min_order_amount || 0}
                              onChange={(e) => {
                                const newTiers = [...(formData.settings.delivery.pricing_tiers || [])];
                                newTiers[index] = { ...tier, min_order_amount: parseFloat(e.target.value) || 0 };
                                updateFormData('settings.delivery.pricing_tiers', newTiers);
                              }}
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              label={t('max_order_label')}
                              type="number"
                              step="0.01"
                              value={tier.max_order_amount || 0}
                              onChange={(e) => {
                                const newTiers = [...(formData.settings.delivery.pricing_tiers || [])];
                                newTiers[index] = { ...tier, max_order_amount: parseFloat(e.target.value) || 0 };
                                updateFormData('settings.delivery.pricing_tiers', newTiers);
                              }}
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              label={t('shipping_cost_label')}
                              type="number"
                              step="0.01"
                              value={tier.cost || 0}
                              onChange={(e) => {
                                const newTiers = [...(formData.settings.delivery.pricing_tiers || [])];
                                newTiers[index] = { ...tier, cost: parseFloat(e.target.value) || 0 };
                                updateFormData('settings.delivery.pricing_tiers', newTiers);
                              }}
                            />
                          </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newTiers = [...(formData.settings.delivery.pricing_tiers || [])];
                            newTiers.splice(index, 1);
                            updateFormData('settings.delivery.pricing_tiers', newTiers);
                          }}
                          className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          {t('delete')}
                        </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newTiers = [...(formData.settings.delivery.pricing_tiers || []), {
                            id: Date.now().toString(),
                            name: '',
                            min_order_amount: 0,
                            max_order_amount: 0,
                            cost: 0
                          }];
                          updateFormData('settings.delivery.pricing_tiers', newTiers);
                        }}
                      >
                        {t('delivery_rates_title')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-base md:text-lg font-medium text-gray-900">{t('tableOrders')}</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.settings.table_orders?.enabled || false}
                    onChange={(e) => updateFormData('settings.table_orders.enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {formData.settings.table_orders?.enabled ? t('enabled') : t('disabled')}
                  </span>
                </div>
              </div>
              
              {formData.settings.table_orders?.enabled && (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Input
                      label={t('numberOfTables')}
                      type="number"
                      min="1"
                      max="100"
                      value={formData.settings.table_orders?.table_numbers || 10}
                      onChange={(e) => updateFormData('settings.table_orders.table_numbers', parseInt(e.target.value) || 10)}
                    />
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">{t('table_qr_codes_title')}</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('qr_codes_description')}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                      {Array.from({ length: formData.settings.table_orders?.table_numbers || 10 }, (_, i) => {
                        const tableNum = i + 1;
                        const qrUrl = `${window.location.origin}/${formData.domain}?table=${tableNum}`;
                        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
                        
                        return (
                          <div key={tableNum} className="border border-gray-200 rounded-lg p-4 text-center bg-white min-h-[320px] flex flex-col">
                            <div className="flex items-center justify-center mb-2">
                              <QrCode className="w-5 h-5 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-blue-800">
                                {t('mesa')} {tableNum}
                              </span>
                            </div>
                            <div className="flex-1 flex items-center justify-center mb-4">
                              <img 
                                src={qrImageUrl} 
                                alt={`QR Mesa ${tableNum}`}
                                className="w-48 h-48 object-contain"
                              />
                            </div>
                            <div className="mt-auto">
                              <p className="text-sm font-medium text-gray-900 mb-3">{t('mesa')} {tableNum}</p>
                              <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs py-2 px-3 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                  const qrUrl = `${window.location.origin}/${formData.domain}?table=${tableNum}`;
                                  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;
                                  
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                    printWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>QR Mesa ${tableNum}</title>
                                          <style>
                                            body { 
                                              margin: 0;
                                              padding: 0;
                                              display: flex;
                                              justify-content: center;
                                              align-items: center;
                                              min-height: 100vh;
                                              background: white;
                                            }
                                            .qr-image {
                                              max-width: 100%;
                                              max-height: 100%;
                                              width: 400px;
                                              height: 400px;
                                            }
                                            @media print {
                                              body { 
                                                margin: 0;
                                                padding: 0;
                                              }
                                            }
                                          </style>
                                        </head>
                                        <body>
                                          <img src="${qrImageUrl}" alt="QR Mesa ${tableNum}" class="qr-image" />
                                        </body>
                                      </html>
                                    `);
                                    printWindow.document.close();
                                    
                                    printWindow.onload = () => {
                                      setTimeout(() => {
                                        printWindow.print();
                                      }, 500);
                                    };
                                  }
                                }}
                              >
                                {t('print')}
                              </Button>
                              <Button
                                size="sm"
                                className="w-full text-xs py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white border-0"
                                onClick={() => {
                                  const qrUrl = `${window.location.origin}/${formData.domain}?table=${tableNum}`;
                                  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
                                  
                                  fetch(qrImageUrl)
                                    .then(response => response.blob())
                                    .then(blob => {
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `QR-Mesa-${tableNum}-${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                    })
                                    .catch(error => {
                                      console.error('Error downloading QR:', error);
                                      const link = document.createElement('a');
                                      link.href = qrImageUrl;
                                      link.download = `QR-Mesa-${tableNum}-${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    });
                                }}
                              >
                                {t('download')}
                              </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">{t('tutorialStepByStepInstructions')}:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• {t('qr_hint_unique_code')}</li>
                        <li>• {t('qr_scan_menu')}</li>
                        <li>• {t('qr_auto_detect')}</li>
                        <li>• {t('qr_print_download')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  {t('theme_customization_title')}
                </h3>
                <p className="text-sm text-gray-600">
                  {t('theme_customization_subtitle')}
                </p>
              </div>
              

              <div className="bg-gradient-to-br from-gray-50 to-gray-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-purple-100">
                <h4 className="text-sm md:text-md font-semibold text-gray-900 mb-3 md:mb-4">{t('color_templates_title')}</h4>
                <p className="text-sm text-gray-600 mb-4">{t('color_templates_subtitle')}</p>

                <h4 className="text-md font-semibold text-gray-900 mb-4">Light themes</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#d64545');
                      updateFormData('settings.theme.secondary_color', '#f7bcbc');
                      updateFormData('settings.theme.menu_background_color', '#fff1f1');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#5d1f1f');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  >

                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#d64545' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#5d1f1f' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#fff1f1' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Coral Soft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#ff8d4a');
                      updateFormData('settings.theme.secondary_color', '#ffd3b3');
                      updateFormData('settings.theme.menu_background_color', '#fff5ec');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#5a321c');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-slate-700 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#ff8d4a' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#5a321c' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#fff5ec' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Peach Cake</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#d6a800');
                      updateFormData('settings.theme.secondary_color', '#ffef9a');
                      updateFormData('settings.theme.menu_background_color', '#fffbea');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#4a3b00');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#d6a800' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#4a3b00' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#fffbea' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Yellow Cream</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#2ea88c');
                      updateFormData('settings.theme.secondary_color', '#c6f4e6');
                      updateFormData('settings.theme.menu_background_color', '#f2fffa');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#124437');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-red-600 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#2ea88c' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#124437' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#f2fffa' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Mint Green</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#2a7be4');
                      updateFormData('settings.theme.secondary_color', '#cce1ff');
                      updateFormData('settings.theme.menu_background_color', '#f3f9ff');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#153870');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-amber-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#2a7be4' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#153870' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#f3f9ff' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Sky Blue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#9a63e8');
                      updateFormData('settings.theme.secondary_color', '#e6d8ff');
                      updateFormData('settings.theme.menu_background_color', '#fbf7ff');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#3c2670');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#9a63e8' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#3c2670' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#fbf7ff' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Soft Purple</span>
                  </button>
                </div>
                
<h4 className="text-md font-semibold text-gray-900 mb-4">Colorful themes</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#FF7A00');
                      updateFormData('settings.theme.secondary_color', '#1A8C3A');
                      updateFormData('settings.theme.menu_background_color', '#00150E');
                      updateFormData('settings.theme.card_background_color', '#022015');
                      updateFormData('settings.theme.primary_text_color', '#ffffff');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-pink-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#FF7A00' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#00150E' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Orange Brutally</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#f09042');
                      updateFormData('settings.theme.secondary_color', '#f09042');
                      updateFormData('settings.theme.menu_background_color', '#1F7872');
                      updateFormData('settings.theme.card_background_color', '#0b413e');
                      updateFormData('settings.theme.primary_text_color', '#ffffff');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-violet-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#f09042' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#1F7872' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Sunset Blue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#A0FF00');
                      updateFormData('settings.theme.secondary_color', '#0032FF');
                      updateFormData('settings.theme.menu_background_color', '#000B1A');
                      updateFormData('settings.theme.card_background_color', '#00142A');
                      updateFormData('settings.theme.primary_text_color', '#FFFFFF');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-lime-600 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#A0FF00' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#FFFFFF' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#000B1A' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Green Lime</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#92400e');
                      updateFormData('settings.theme.secondary_color', '#ea580c');
                      updateFormData('settings.theme.menu_background_color', '#fef3c7');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#1f2937');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#92400e' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#1f2937' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#fef3c7' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Coffee Cream</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#ff6d00');
                      updateFormData('settings.theme.secondary_color', '#00d27a');
                      updateFormData('settings.theme.menu_background_color', '#fff1e2');
                      updateFormData('settings.theme.card_background_color', '#ffffff');
                      updateFormData('settings.theme.primary_text_color', '#582700');
                      updateFormData('settings.theme.secondary_text_color', '#ffe7d1');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#ff6d00' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#582700' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#fff1e2' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Mandarin Forest</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#F59E0B');
                      updateFormData('settings.theme.secondary_color', '#F59E0B');
                      updateFormData('settings.theme.menu_background_color', '#14532D');
                      updateFormData('settings.theme.card_background_color', '#062814');
                      updateFormData('settings.theme.primary_text_color', '#FFFFFF');
                      updateFormData('settings.theme.secondary_text_color', '#ffffff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#F59E0B' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#FFFFFF' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#14532D' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Green Forest</span>
                  </button>
                </div>
                
                <h4 className="text-md font-semibold text-gray-900 mb-4">{t('dark_mode_templates')}</h4>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#ff3b3b');
                      updateFormData('settings.theme.secondary_color', '#1e1e1e');
                      updateFormData('settings.theme.menu_background_color', '#121212');
                      updateFormData('settings.theme.card_background_color', '#1c1c1c');
                      updateFormData('settings.theme.primary_text_color', '#ffffff');
                      updateFormData('settings.theme.secondary_text_color', '#cfcfcf');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#ff3b3b' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#121212' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Midnight</span>
                  </button>

                   <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#28ff84');
                      updateFormData('settings.theme.secondary_color', '#0f0f0f');
                      updateFormData('settings.theme.menu_background_color', '#161616');
                      updateFormData('settings.theme.card_background_color', '#1f1f1f');
                      updateFormData('settings.theme.primary_text_color', '#ffffff');
                      updateFormData('settings.theme.secondary_text_color', '#808080');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#28ff84' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#161616' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Dark Obsidian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#2d7dff');
                      updateFormData('settings.theme.secondary_color', '#1b1b1b');
                      updateFormData('settings.theme.menu_background_color', '#12151a');
                      updateFormData('settings.theme.card_background_color', '#1c2025');
                      updateFormData('settings.theme.primary_text_color', '#ffffff');
                      updateFormData('settings.theme.secondary_text_color', '#e8e8e8');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#2d7dff' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#12151a' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Dark Ocean</span>
                  </button>

                   <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#ff46d1');
                      updateFormData('settings.theme.secondary_color', '#2e004d');
                      updateFormData('settings.theme.menu_background_color', '#160025');
                      updateFormData('settings.theme.card_background_color', '#210036');
                      updateFormData('settings.theme.primary_text_color', '#ffffff');
                      updateFormData('settings.theme.secondary_text_color', '#f3d6ff');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#ff46d1' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#160025' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Cosmic Violet</span>
                  </button>

                   <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#00d4ff');
                      updateFormData('settings.theme.secondary_color', '#062a34');
                      updateFormData('settings.theme.menu_background_color', '#03171d');
                      updateFormData('settings.theme.card_background_color', '#072127');
                      updateFormData('settings.theme.primary_text_color', '#eaffff');
                      updateFormData('settings.theme.secondary_text_color', '#26393b');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#00d4ff' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#eaffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#03171d' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Emerald Night</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('settings.theme.primary_color', '#ffcc66');
                      updateFormData('settings.theme.secondary_color', '#2b1b14');
                      updateFormData('settings.theme.menu_background_color', '#1a120f');
                      updateFormData('settings.theme.card_background_color', '#241a15');
                      updateFormData('settings.theme.primary_text_color', '#ffffff');
                      updateFormData('settings.theme.secondary_text_color', '#431919');
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="h-6 rounded-t" style={{ backgroundColor: '#ffcc66' }}></div>
                      <div className="flex gap-1">
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#ffffff' }}></div>
                        <div className="flex-1 h-8 rounded" style={{ backgroundColor: '#1a120f' }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">Crimson Noir</span>
                  </button>
                </div>

                <h4 className="text-md font-semibold text-gray-900 mb-4">{t('manual_customization_title')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('primary_color_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.settings.theme.primary_color}
                        onChange={(e) => updateFormData('settings.theme.primary_color', e.target.value)}
                        className="w-14 h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.settings.theme.primary_color}
                          onChange={(e) => updateFormData('settings.theme.primary_color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('primary_color_hint')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('secondary_color_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.settings.theme.secondary_color}
                        onChange={(e) => updateFormData('settings.theme.secondary_color', e.target.value)}
                        className="w-14 h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.settings.theme.secondary_color}
                          onChange={(e) => updateFormData('settings.theme.secondary_color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('secondary_color_hint')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('menu_bg_color_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.settings.theme.menu_background_color}
                        onChange={(e) => updateFormData('settings.theme.menu_background_color', e.target.value)}
                        className="w-14 h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.settings.theme.menu_background_color}
                          onChange={(e) => updateFormData('settings.theme.menu_background_color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('menu_bg_color_hint')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('card_bg_color_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.settings.theme.card_background_color}
                        onChange={(e) => updateFormData('settings.theme.card_background_color', e.target.value)}
                        className="w-14 h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.settings.theme.card_background_color}
                          onChange={(e) => updateFormData('settings.theme.card_background_color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('card_bg_color_hint')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('primary_text_color_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.settings.theme.primary_text_color}
                        onChange={(e) => updateFormData('settings.theme.primary_text_color', e.target.value)}
                        className="w-14 h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.settings.theme.primary_text_color}
                          onChange={(e) => updateFormData('settings.theme.primary_text_color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('primary_text_color_hint')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('secondary_text_color_label')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.settings.theme.secondary_text_color}
                        onChange={(e) => updateFormData('settings.theme.secondary_text_color', e.target.value)}
                        className="w-14 h-14 border-2 border-gray-300 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.settings.theme.secondary_text_color}
                          onChange={(e) => updateFormData('settings.theme.secondary_text_color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('secondary_text_color_hint')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                <h4 className="text-md font-semibold text-gray-900 mb-4">{t('typography_title')}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('primary_font_label')}
                    </label>
                    <select
                      value={formData.settings.theme.primary_font}
                      onChange={(e) => updateFormData('settings.theme.primary_font', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Raleway">Raleway</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option  value="Merriweather">Merriweather</option>
                    </select>
                    <p className="text-xs text-gray-500">{t('primary_font_hint')}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('secondary_font_label')}
                    </label>
                    <select
                      value={formData.settings.theme.secondary_font}
                      onChange={(e) => updateFormData('settings.theme.secondary_font', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Raleway">Raleway</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Merriweather">Merriweather</option>
                    </select>
                    <p className="text-xs text-gray-500">{t('secondary_font_hint')}</p>
                  </div>
                </div>

              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-50 border rounded-lg p-4">
              {/* 🔸 Bloque para activar o desactivar PathForms */}
              <div className="flex flex-col gap-2">
                  <h2 className="text-sm text-black-800 font-medium">
                    {t('pathforms_label')}
                  </h2>
                  <p className="text-sm text-black-500 ">
                    {t('pathforms_hint')} 
                  </p>
              
                  <div className="flex items-center gap-3">
                    {/* 🔹 Checkbox controlado */}
                    <input
                      type="checkbox"
                      checked={formData.settings.theme?.pathform || false}
                      onChange={(e) =>
                        updateFormData('settings.theme.pathform', e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                    />
                    <label className="text-sm font-medium text-gray-700">
                      {formData.settings.theme?.pathform ? t('enable') : t('disable')}
                    </label>
                  </div>
                </div>
              </div> 

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Palette className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">{t('about_customization_title')}</p>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                      <li>{t('theme_auto_apply')}</li>
                      <li>{t('theme_preview')}</li>
                      <li>{t('theme_contrast')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">{t('billing_settings_title')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('billing_hint_legal_tickets')}
                  </p>
                </div>
              </div>

              {/* Información del Restaurante */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-gray-100">
                <h4 className="text-sm md:text-md font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-green-600" />
                  {t('restaurantInfo')}
                </h4>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('commercial_name_label')}
                      </label>
                      <input
                        type="text"
                        value={formData.settings.billing?.nombreComercial || ''}
                        onChange={(e) => updateFormData('settings.billing.nombreComercial', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder={t('commercial_name_placeholder')}
                        required
                      />
                      <p className="text-xs text-gray-500">{t('commercial_name_hint')}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('social_reason_label')}
                      </label>
                      <input
                        type="text"
                        value={formData.settings.billing?.razonSocial || ''}
                        onChange={(e) => updateFormData('settings.billing.razonSocial', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder={t('social_reason_placeholder')}
                      />
                      <p className="text-xs text-gray-500">{t('legal_company_name')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('nit_label')}
                      </label>
                      <input
                        type="text"
                        value={formData.settings.billing?.nit || ''}
                        onChange={(e) => {
                          const formatted = formatNIT(e.target.value);
                          updateFormData('settings.billing.nit', formatted);
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          formData.settings.billing?.nit && !validateNIT(formData.settings.billing.nit)
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder={t('nit_placeholder')}
                        maxLength={11}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        {formData.settings.billing?.nit && !validateNIT(formData.settings.billing.nit)
                          ? '❌ Formato inválido. Use: 123456789-0'
                          : 'Formato: 123456789-0'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('department_label')}
                      </label>
                      <select
                        value={formData.settings.billing?.departamento || 'Cundinamarca'}
                        onChange={(e) => {
                          const newDept = e.target.value;
                          updateFormData('settings.billing.departamento', newDept);
                          const cities = colombianCitiesByDepartment[newDept];
                          if (cities && cities.length > 0) {
                            updateFormData('settings.billing.ciudad', cities[0]);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        {colombianDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('city_label')}
                      </label>
                      <select
                        value={formData.settings.billing?.ciudad || ''}
                        onChange={(e) => updateFormData('settings.billing.ciudad', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        {formData.settings.billing?.departamento &&
                          colombianCitiesByDepartment[formData.settings.billing.departamento]?.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500">
                        {t('select_department_first_hint')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('address_billing_label')}
                    </label>
                    <input
                      type="text"
                      value={formData.settings.billing?.direccion || ''}
                      onChange={(e) => updateFormData('settings.billing.direccion', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Calle 123 #45-67"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('phone_billing_label')}
                      </label>
                      <input
                        type="tel"
                        value={formData.settings.billing?.telefono || ''}
                        onChange={(e) => updateFormData('settings.billing.telefono', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder={t('whatsapp_placeholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('email_billing_label')}
                      </label>
                      <input
                        type="email"
                        value={formData.settings.billing?.correo || ''}
                        onChange={(e) => updateFormData('settings.billing.correo', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="contacto@restaurante.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Fiscal */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  {t('fiscal_billing_information')}
                </h4>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('tax_regime_label')}
                      </label>
                      <select
                        value={formData.settings.billing?.regimenTributario || 'simple'}
                        onChange={(e) => updateFormData('settings.billing.regimenTributario', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="simple">{t('taxRegimeSimple')}</option>
                        <option value="comun">{t('taxRegimeCommon')}</option>
                        <option value="no_responsable_iva">{t('taxRegimeNoIva')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('taxRegimeIvaQuestion')}
                      </label>
                      <div className="flex items-center gap-6 h-12">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="responsableIVA"
                            checked={formData.settings.billing?.responsableIVA === true}
                            onChange={() => updateFormData('settings.billing.responsableIVA', true)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{t('yes')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="responsableIVA"
                            checked={formData.settings.billing?.responsableIVA === false}
                            onChange={() => updateFormData('settings.billing.responsableIVA', false)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        ¿Aplica Impuesto al Consumo (IPC)?
                      </label>
                      <div className="flex items-center gap-6 h-12">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="aplicaIPC"
                            checked={formData.settings.billing?.aplicaIPC === true}
                            onChange={() => updateFormData('settings.billing.aplicaIPC', true)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{t('yes')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="aplicaIPC"
                            checked={formData.settings.billing?.aplicaIPC === false}
                            onChange={() => updateFormData('settings.billing.aplicaIPC', false)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>

                    {formData.settings.billing?.aplicaIPC && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Porcentaje IPC (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.settings.billing?.porcentajeIPC || 8}
                          onChange={(e) => updateFormData('settings.billing.porcentajeIPC', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="8"
                        />
                        <p className="text-xs text-gray-500">
                          El porcentaje estándar de IPC en Colombia es 8%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('has_dian_resolution_label')}
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tieneResolucionDIAN"
                          checked={formData.settings.billing?.tieneResolucionDIAN === true}
                          onChange={() => updateFormData('settings.billing.tieneResolucionDIAN', true)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{t('yes')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tieneResolucionDIAN"
                          checked={formData.settings.billing?.tieneResolucionDIAN === false}
                          onChange={() => updateFormData('settings.billing.tieneResolucionDIAN', false)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>

                  {formData.settings.billing?.tieneResolucionDIAN && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200 space-y-4">
                      <h5 className="text-sm font-semibold text-gray-900">{t('dian_resolution_data_title')}</h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {t('resolution_number_label')}
                          </label>
                          <input
                            type="text"
                            value={formData.settings.billing?.numeroResolucionDIAN || ''}
                            onChange={(e) => updateFormData('settings.billing.numeroResolucionDIAN', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="18760000001"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {t('resolution_date_label')}
                          </label>
                          <input
                            type="date"
                            value={formData.settings.billing?.fechaResolucion || ''}
                            onChange={(e) => updateFormData('settings.billing.fechaResolucion', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {t('numbering_range_label')}
                          </label>
                          <input
                            type="number"
                            value={formData.settings.billing?.rangoNumeracionDesde || ''}
                            onChange={(e) => updateFormData('settings.billing.rangoNumeracionDesde', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="1000"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {t('numbering_range_label_to')}
                          </label>
                          <input
                            type="number"
                            value={formData.settings.billing?.rangoNumeracionHasta || ''}
                            onChange={(e) => updateFormData('settings.billing.rangoNumeracionHasta', parseInt(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="10000"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Propina */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                  {t('tax_tip_settings_title')}
                </h4>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('suggested_tip_label')}
                      </label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="aplicaPropina"
                            checked={formData.settings.billing?.aplicaPropina === true}
                            onChange={() => updateFormData('settings.billing.aplicaPropina', true)}
                            className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">{t('suggestedTipLabel')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="aplicaPropina"
                            checked={formData.settings.billing?.aplicaPropina === false}
                            onChange={() => updateFormData('settings.billing.aplicaPropina', false)}
                            className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {formData.settings.billing?.aplicaPropina && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600">
                        {t('billing_hint_tip_optional')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personalización del Ticket */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  {t('ticket_customization_title')}
                </h4>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('show_logo_on_ticket_label')}
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mostrarLogoEnTicket"
                          checked={formData.settings.billing?.mostrarLogoEnTicket === true}
                          onChange={() => updateFormData('settings.billing.mostrarLogoEnTicket', true)}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{t('yes')}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mostrarLogoEnTicket"
                          checked={formData.settings.billing?.mostrarLogoEnTicket === false}
                          onChange={() => updateFormData('settings.billing.mostrarLogoEnTicket', false)}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>

                  {formData.settings.billing?.mostrarLogoEnTicket && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200 space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('ticket_logo_label')}
                      </label>

                      {formData.settings.billing?.logoTicket && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <img
                            src={formData.settings.billing.logoTicket}
                            alt="Logo del ticket"
                            className="w-16 h-16 object-contain rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{t('ticket_current_logo')}</p>
                            <p className="text-xs text-gray-500">{t('ticket_buttom_logo_change')}</p>
                          </div>
                        <button
                          type="button"
                          onClick={() => updateFormData('settings.billing.logoTicket', '')}
                          className="bg-gradient-to-br from-red-500 to-rose-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-md hover:opacity-90 transition"
                        >
                          {t('delete')}
                        </button>
                        </div>
                      )}

                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                showToast('error', 'Archivo muy grande', 'El tamaño máximo es 1MB', 3000);
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                updateFormData('settings.billing.logoTicket', reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm w-full justify-center">
                          <Upload className="w-4 h-4 mr-2" />
                          {formData.settings.billing?.logoTicket ? 'Cambiar logo' : 'Subir logo'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500">
                        {t('ticket_buttom_logo_change_hint')}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('ticket_final_message_label')}
                    </label>
                    <textarea
                      value={formData.settings.billing?.mensajeFinalTicket || ''}
                      onChange={(e) => updateFormData('settings.billing.mensajeFinalTicket', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      placeholder={t('ticket_message_hint')}
                    />
                    <p className="text-xs text-gray-500">
                      {t('ticket_message_hint2')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información importante */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">{t('ticket_final_tips_title')}</p>
                    <ul className="text-xs text-green-700 mt-2 space-y-1 list-disc list-inside">
                      <li>{t('ticket_final_tip1')}</li>
                      <li>{t('ticket_final_tip2')}</li>
                      <li>{t('ticket_final_tip3')}</li>
                      <li>{t('ticket_final_tip4')}</li>
                      <li>{t('ticket_final_tip5')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'promo' && (
            <div className="space-y-4 md:space-y-6">
              <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  {t('promo_settings_title')}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {t('promo_settings_subtitle')}
                </p>
              </div>

              {/* Vertical Promo Image */}
              <div className="space-y-3 bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-orange-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    {t('vertical_promo_image_label')}
                  </label>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  {t('vertical_promo_image_hint')}
                </p>
                <div className="space-y-2">
                  {formData.settings.promo?.vertical_promo_image && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <img
                        src={formData.settings.promo.vertical_promo_image}
                        alt="Promo Vertical"
                        className="w-20 h-28 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{t('promo_image_current')}</p>
                        <p className="text-xs text-gray-500">{t('promo_image_current_hint')}</p>
                      </div>
                    <button
                      type="button"
                      onClick={() => updateFormData('settings.promo.vertical_promo_image', '')}
                      className="bg-gradient-to-br from-red-500 to-rose-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-md hover:opacity-90 transition"
                    >
                      {t('delete')}
                    </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            showToast('error', 'Archivo muy grande', 'El tamaño máximo es 5MB', 3000);
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateFormData('settings.promo.vertical_promo_image', reader.result as string);
                            updateFormData('settings.promo.enabled', true);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm w-full justify-center">
                      <Upload className="w-4 h-4 mr-2" />
                      {t('upload_vertical_imagen_promo')}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500">
                    {t('upload_vertical_imagen_promo_hint')}
                  </p>
                </div>
              </div>

            {/* Featured Products Selector */}
            <div className="space-y-3 bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-orange-600" />
                <label className="block text-sm font-medium text-gray-700">
                  {t('featured_products_title')}
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  (Max. 5)
                </label>
              </div>
            
              <p className="text-xs text-gray-600 mb-4">
                {t('featured_products_hint')}
              </p>
            
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {products.map((product: any) => {
                    const isSelected = validSelectedFeaturedIds.includes(product.id);
                    const canSelect = validSelectedFeaturedIds.length < 5 || isSelected;
            
                    return (
                      <label
                        key={product.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50 border-orange-300'
                            : canSelect
                            ? 'bg-white border-gray-200 hover:border-gray-300'
                            : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!canSelect}
                          onChange={(e) => {
                            let newIds = isSelected
                              ? validSelectedFeaturedIds.filter((id: string) => id !== product.id)
                              : [...validSelectedFeaturedIds, product.id].slice(0, 5);
            
                            // Si intenta marcar cuando ya hay 5, slice(0,5) lo limita sin lógica extra
                            updateFormData('settings.promo.featured_product_ids', newIds);
                          }}
                          className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
            
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
            
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          {/* Descripción eliminada para render más rápido */}
                        </div>
            
                        {isSelected && (
                          <Badge variant="success">{t('featured_products_label')}</Badge>
                        )}
                      </label>
                    );
                  })}
            
                  {products.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">
                      {t('noProductsAdded')}
                    </p>
                  )}
                </div>
              </div>
            
              <p className="text-xs text-gray-600">
                {validSelectedFeaturedIds.length} {t('featured_products_selected')}
              </p>
            </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Megaphone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">{t('featured_products_tip_title')}</p>
                    <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                      <li>{t('featured_products_tip1')}</li>
                      <li>{t('featured_products_tip2')}</li>
                      <li>{t('featured_products_tip3')}</li>
                      <li>{t('featured_products_tip4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md mx-auto mb-3 md:mb-4">
                  <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{t('technical_support_title')}</h3>
                <p className="text-gray-600">
                  {t('technical_support_subtitle')}
                </p>
              </div>

              {supportSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h4 className="text-green-800 font-medium">{t('ticket_sent_title')}</h4>
                      <p className="text-green-700 text-sm">
                        {t('awaiting_response_text')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('subject_label')}
                    </label>
                    <input
                      type="text"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('subject_placeholder')}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('category')}
                    </label>
                    <select
                      value={supportForm.category}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">{t('support_general')}</option>
                      <option value="technical">{t('support_problem')}</option>
                      <option value="billing">{t('support_billing')}</option>
                      <option value="feature">{t('support_function')}</option>
                      <option value="account">{t('support_account')}</option>
                      <option value="other">{t('support_other')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('priority_label')}
                    </label>
                    <select
                      value={supportForm.priority}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">{t('priority_option1')}</option>
                      <option value="medium">{t('priority_option2')}</option>
                      <option value="high">{t('priority_option3')}</option>
                      <option value="urgent">{t('priority_option4')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact_email_label')}
                    </label>
                    <input
                      type="email"
                      value={supportForm.contactEmail}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="info@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact_phone_label')}
                  </label>
                  <input
                    type="tel"
                    value={supportForm.contactPhone}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('support_problem_description')}
                  </label>
                  <textarea
                    value={supportForm.message}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('support_problem_description_hint')}
                    required
                  />
                </div>

                {/* Historial de tickets */}
                {supportTickets.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-gray-800 font-medium mb-3">{t('my_support_tickets_title')}</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {supportTickets
                        .filter(ticket => ticket.restaurantId === restaurant?.id)
                        .slice(-5)
                        .reverse()
                        .map(ticket => (
                          <div key={ticket.id} className="bg-white p-3 rounded border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900 text-sm truncate flex-1 mr-2">
                                {ticket.subject}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {getPriorityBadge(ticket.priority)}
                                {getStatusBadge(ticket.status)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                {new Date(ticket.createdAt).toLocaleDateString()} • {getCategoryName(ticket.category)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Eye}
                                onClick={() => handleViewTicketDetails(ticket)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                {t('view_details_button')}
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSupportForm({
                      subject: '',
                      priority: 'medium',
                      category: 'general',
                      message: '',
                      contactEmail: restaurant?.email || '',
                      contactPhone: restaurant?.phone || ''
                    })}
                  >
                    {t('clear_form_button')}
                  </Button>
                  <Button
                    type="submit"
                    loading={supportLoading}
                    icon={Send}
                    disabled={!supportForm.subject.trim() || !supportForm.message.trim() || !supportForm.contactEmail.trim()}
                  >
                    {t('send_ticket_button')}
                  </Button>
                </div>
              </form>

              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h4 className="text-gray-900 font-medium mb-3">{t('other_support_channels')}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>{t('support_direct_email')}<a href="mailto:admin@digitalfenixpro.com" className="text-blue-600 hover:text-blue-700">admin@digitalfenixpro.com</a></p>
                  <p>{t('support_days')}</p>
                  <p>{t('support_time')}</p>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>{t('noteLabel')}</strong> {t('support_message_note_description')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal for Restaurant */}
      <Modal
        isOpen={showTicketDetailModal}
        onClose={() => {
          setShowTicketDetailModal(false);
          setSelectedTicket(null);
        }}
        title="Detalles del Ticket"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">{selectedTicket.subject}</h3>
                <div className="flex gap-2">
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('ticket_id_label')} {selectedTicket.id} • {new Date(selectedTicket.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Ticket Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <h4 className="text-sm md:text-md font-medium text-gray-900 mb-2 md:mb-3">{t('ticket_info_title')}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('category_label')}</span> {getCategoryName(selectedTicket.category)}
                  </div>
                  <div>
                    <span className="text-gray-600">{t('priority_label')}</span> {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">{t('contactInfo')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{selectedTicket.contactEmail}</span>
                  </div>
                  {selectedTicket.contactPhone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{selectedTicket.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Original Message */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">{t('support_original_message')}</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>
            </div>

            {/* Admin Response */}
            {selectedTicket.response ? (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">{t('admin_response_title')}</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 whitespace-pre-wrap">{selectedTicket.response}</p>
                  {selectedTicket.responseDate && (
                    <div className="text-xs text-green-600 mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {t('support_information_response')} {new Date(selectedTicket.responseDate).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <HelpCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <h4 className="text-yellow-800 font-medium">{t('awaiting_response_title')}</h4>
                    <p className="text-yellow-700 text-sm">
                     {t('awaiting_response_text')}
                    </p>
                  </div>
                </div>
              </div>
            )}


            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  setShowTicketDetailModal(false);
                  setSelectedTicket(null);
                }}
              >
                {t('close_button')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};