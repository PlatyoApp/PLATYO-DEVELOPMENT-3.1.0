import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { availablePlans } from '../lib/plans';
import {
  Menu as MenuIcon,
  X,
  Check,
  Smartphone,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
  Receipt,
  ArrowRight,
  Star,
  MessageCircle,
  Volume2,
  VolumeX
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Audio state (sin reiniciar video)
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  // YouTube Player ref
  const playerRef = useRef<any>(null);

  // Un único contenedor (IMPORTANTE: no duplicar este id en el DOM)
  const ytContainerId = 'platyo-yt-banner-player';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDisplayPrice = (plan: typeof availablePlans[0]) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = (plan: typeof availablePlans[0]) => {
    const yearlyMonthly = plan.monthlyPrice * 12;
    return yearlyMonthly - plan.annualPrice;
  };

  const getPlanFeaturesList = (plan: typeof availablePlans[0]) => {
    const features = [];
    if (plan.id === 'free') {
      features.push(`Hasta ${plan.features.max_products} productos`);
      features.push(`Hasta ${plan.features.max_categories} categorías`);
      features.push('Menú digital');
      features.push('Gestión de órdenes');
      features.push('Soporte por email');
    } else if (plan.id === 'basic') {
      features.push(`Hasta ${plan.features.max_products} productos`);
      features.push(`Hasta ${plan.features.max_categories} categorías`);
      features.push('Análisis y estadísticas');
      features.push('Personalización avanzada');
      features.push('Soporte prioritario');
    } else if (plan.id === 'pro') {
      features.push(`Hasta ${plan.features.max_products} productos`);
      features.push(`Hasta ${plan.features.max_categories} categorías`);
      features.push('Análisis avanzados');
      features.push('Soporte prioritario 24/7');
      features.push('Personalización completa');
    } else if (plan.id === 'business') {
      features.push(`Hasta ${plan.features.max_products} productos`);
      features.push(`Hasta ${plan.features.max_categories} categorías`);
      features.push('Todo lo de Pro +');
      features.push('Asistente virtual con IA');
      features.push('API personalizada');
      features.push('Soporte dedicado');
    }
    return features;
  };

  // Cargar YouTube IFrame API (una sola vez) y crear el player
  useEffect(() => {
    const videoId = 'bSKNTe1m3QY';

    const createPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      // Evita recrearlo si ya existe
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(ytContainerId, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          loop: 1,
          playlist: videoId, // necesario para loop
          mute: 1, // arrancar mute para que el autoplay no lo bloquee
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            try {
              event.target.mute();
              event.target.playVideo();

              if (isVideoMuted) event.target.mute();
              else event.target.unMute();
            } catch {}
          },
          onStateChange: (event: any) => {
            try {
              if (event.data === -1 || event.data === 5) {
                event.target.playVideo();
              }
            } catch {}
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      createPlayer();
    };

    return () => {
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mutear / desmutear SIN reiniciar
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isVideoMuted) playerRef.current.mute();
      else playerRef.current.unMute();
    } catch {}
  }, [isVideoMuted]);

  const features = [
    {
      icon: Smartphone,
      title: t('featureDigitalMenu'),
      description: t('featureDigitalMenuDesc'),
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: TrendingUp,
      title: t('featureMoreSales'),
      description: t('featureMoreSalesDesc'),
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: BarChart3,
      title: t('featureRealTimeAnalytics'),
      description: t('featureRealTimeAnalyticsDesc'),
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: Clock,
      title: t('featureOrderManagement'),
      description: t('featureOrderManagementDesc'),
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: Users,
      title: t('featureCustomerBase'),
      description: t('featureCustomerBaseDesc'),
      color: 'from-rose-500 to-pink-500'
    },
    {
      icon: Receipt,
      title: t('featurePOSBilling'),
      description: t('featurePOSBillingDesc'),
      color: 'from-indigo-500 to-blue-500'
    }
  ];


  const testimonials = [
    {
      name: 'Carlos Rodríguez',
      restaurant: 'La Casa del Sabor',
      rating: 5,
      text: t('testimonial1'),
      image: '👨‍🍳'
    },
    {
      name: 'María González',
      restaurant: 'Pizzería Bella Italia',
      rating: 5,
      text: t('testimonial2'),
      image: '👩‍🍳'
    },
    {
      name: 'Juan Martínez',
      restaurant: 'Café & Bistro',
      rating: 5,
      text: t('testimonial3'),
      image: '👨‍💼'
    }
  ];

  const navButtonClass = isScrolled
    ? 'text-gray-700 hover:text-orange-600'
    : 'text-white hover:text-white/90';

  const mobileMenuIconClass = isScrolled ? 'text-gray-700' : 'text-white';

  const brandTextClass = isScrolled
    ? 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'
    : 'text-white';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <img src="/PLATYO FAVICON BLANCO.svg" alt="Platyo" className="w-8 h-8" />
              </div>

              <span className={`text-2xl font-bold transition-colors ${brandTextClass}`}>
                Platyo
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className={`${navButtonClass} font-medium transition-colors`}
              >
                {t('navFeatures')}
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className={`${navButtonClass} font-medium transition-colors`}
              >
                {t('navPricing')}
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className={`${navButtonClass} font-medium transition-colors`}
              >
                {t('navTestimonials')}
              </button>

              {/* Language Selector */}
              <div
                className={`flex items-center gap-2 rounded-lg p-1 border transition-colors ${
                  isScrolled
                    ? 'bg-white/40 backdrop-blur-sm border-white/60'
                    : 'bg-white/10 backdrop-blur border-white/20'
                }`}
              >
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    language === 'es'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : isScrolled
                        ? 'text-gray-600 hover:bg-gray-200'
                        : 'text-white hover:bg-white/15'
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : isScrolled
                        ? 'text-gray-600 hover:bg-gray-200'
                        : 'text-white hover:bg-white/15'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {t('login')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 transition-colors ${mobileMenuIconClass}`}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/80 backdrop-blur-lg border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('navFeatures')}
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('navPricing')}
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('navTestimonials')}
              </button>

              {/* Language Selector Mobile */}
              <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-lg p-1 border border-white/60">
                <button
                  onClick={() => setLanguage('es')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    language === 'es'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'text-gray-600'
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    language === 'en'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'text-gray-600'
                  }`}
                >
                  EN
                </button>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium text-center"
              >
                {t('login')}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Video Banner (detrás del header también en móvil) */}
      <section className="relative w-full overflow-hidden bg-black pt-0">
        {/* Botón mute/unmute */}
        <div className="absolute top-12 md:top-28 right-4 md:right-8 z-10">
          <button
            type="button"
            onClick={() => setIsVideoMuted((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur border border-white/20 transition-colors"
            aria-label={isVideoMuted ? 'Activar audio del video' : 'Silenciar audio del video'}
          >
            {isVideoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="text-sm font-medium">{isVideoMuted ? 'OFF' : 'ON'}</span>
          </button>
        </div>

        <div className="yt-wrapper">
          <div className="yt-surface">
            <div id={ytContainerId} className="yt-player-root" />
          </div>
          <div className="yt-overlay" />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-32 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-white -z-10"></div>

        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
              >
                {t('startFreeTrial')}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:border-orange-500 hover:text-orange-600 transition-all duration-300"
              >
                {t('learnMore')}
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  100+
                </div>
                <div className="text-sm md:text-base text-gray-600 mt-1">
                  {t('statActiveRestaurants')}
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-sm md:text-base text-gray-600 mt-1">
                  {t('statOrdersProcessed')}
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  98%
                </div>
                <div className="text-sm md:text-base text-gray-600 mt-1">
                  {t('statSatisfaction')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('featuresSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('howItWorksTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('howItWorksSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('step1Title')}</h3>
              <p className="text-gray-600">{t('step1Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('step2Title')}</h3>
              <p className="text-gray-600">{t('step2Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('step3Title')}</h3>
              <p className="text-gray-600">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('pricingTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">{t('pricingSubtitle')}</p>

            {/* Billing Period Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  billingPeriod === 'annual'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Anual
                <span className="ml-2 text-xs text-green-600 font-semibold">Ahorra 15%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {availablePlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl ${
                  plan.popular
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-2xl scale-105 border-4 border-orange-400'
                    : 'bg-white border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg'
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white text-orange-600 px-4 py-1 rounded-full text-sm font-bold">
                    {t('mostPopular')}
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      plan.popular ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    {plan.monthlyPrice === 0 ? (
                      <div>
                        <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                          Gratis
                        </span>
                        <p className={`text-sm mt-1 ${plan.popular ? 'text-orange-100' : 'text-gray-600'}`}>
                          1 mes
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div>
                          <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(getDisplayPrice(plan))}
                          </span>
                          <span className={`text-lg ${plan.popular ? 'text-orange-100' : 'text-gray-600'}`}>
                            {billingPeriod === 'monthly' ? '/mes' : '/año'}
                          </span>
                        </div>
                        {billingPeriod === 'annual' && (
                          <div className="mt-2">
                            <span className={`text-xs ${plan.popular ? 'text-white' : 'text-green-600'} font-semibold`}>
                              Ahorras {formatPrice(getSavings(plan))}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {getPlanFeaturesList(plan).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'text-white' : 'text-green-500'
                        }`}
                      />
                      <span className={`text-sm ${plan.popular ? 'text-white' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-white text-orange-600 hover:bg-orange-50'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg'
                  }`}
                >
                  {plan.id === 'free' ? t('getStarted') : t('choosePlan')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('testimonialsTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('testimonialsSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.restaurant}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('ctaTitle')}</h2>
          <p className="text-xl mb-10 text-orange-100">{t('ctaSubtitle')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-white text-orange-600 rounded-lg font-bold text-lg hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
          >
            {t('startNow')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <img src="/PLATYO FAVICON BLANCO.svg" alt="Platyo" className="w-8 h-8" />
                </div>
                <span className="text-2xl font-bold text-white">Platyo</span>
              </div>
              <p className="text-gray-400 mb-4">{t('footerDescription')}</p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">{t('footerQuickLinks')}</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="hover:text-orange-400 transition-colors"
                  >
                    {t('navFeatures')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    className="hover:text-orange-400 transition-colors"
                  >
                    {t('navPricing')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('testimonials')}
                    className="hover:text-orange-400 transition-colors"
                  >
                    {t('navTestimonials')}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">{t('footerContact')}</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">{t('footerEmail')}: admin@digitalfenixpro.com</li>
                <li className="text-gray-400">{t('footerPhone')}: +57 302 709 9669</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Platyo. {t('footerRights')}</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/573027099669"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        aria-label="Contact via WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>

      {/* Animation Styles + YouTube full-bleed cover (mobile + desktop) */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }

        /* ====== VIDEO WRAPPER: FULL-BLEED TAMBIÉN EN MÓVIL ====== */
        .yt-wrapper{
          position: relative;
          width: 100%;
          height: 30vh;       /* móvil */
          background: #000;
          overflow: hidden;
        }
        
        @media (min-width: 768px){
          .yt-wrapper{
            height: 100vh;    /* desktop */
          }
        }

        .yt-surface{
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #000;
        }

        .yt-overlay{
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.10);
          pointer-events: none;
        }

        /* Cover (móvil + desktop) */
        .yt-surface iframe{
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;

          min-width: 100% !important;
          min-height: 100% !important;

          width: 177.7777778vh !important; /* 100vh * (16/9) */
          height: 56.25vw !important;      /* 100vw * (9/16) */

          border: 0 !important;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
