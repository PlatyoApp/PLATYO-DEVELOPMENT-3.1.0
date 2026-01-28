import React, { useState, useEffect } from 'react';
import { Eye, Trash2, Filter, ExternalLink, Settings, Plus, UserCheck } from 'lucide-react';
import { Restaurant, Subscription, SubscriptionPlan } from '../../types';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';

export const RestaurantsManagement: React.FC = () => {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);
  const [restaurantToTransfer, setRestaurantToTransfer] = useState<Restaurant | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_name: 'free',
    duration: 'monthly' as Subscription['duration'],
    status: 'active' as Subscription['status'],
  });
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantError) {
        console.error('RestaurantsManagement - Error loading restaurants:', restaurantError);
        throw restaurantError;
      }

      console.log('RestaurantsManagement - Restaurants loaded:', restaurantData?.length || 0);

      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionError) {
        console.error('RestaurantsManagement - Error loading subscriptions:', subscriptionError);
        throw subscriptionError;
      }

      console.log('RestaurantsManagement - Subscriptions loaded:', subscriptionData?.length || 0, subscriptionData);

      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (plansError) {
        console.error('RestaurantsManagement - Error loading plans:', plansError);
        throw plansError;
      }

      console.log('RestaurantsManagement - Plans loaded:', plansData?.length || 0);

      setRestaurants(restaurantData || []);
      setSubscriptions(subscriptionData || []);
      setSubscriptionPlans(plansData || []);
    } catch (error) {
      console.error('RestaurantsManagement - Error loading data:', error);
      toast.showToast('error', 'Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getSubscription = (restaurantId: string) => {
    return subscriptions.find(sub => sub.restaurant_id === restaurantId);
  };

  const isRestaurantActive = (restaurantId: string) => {
    const subscription = getSubscription(restaurantId);
    return subscription?.status === 'active';
  };

  const handleEditSubscription = (restaurant: Restaurant) => {
    const subscription = getSubscription(restaurant.id);
    setEditingRestaurant(restaurant);

    if (subscription) {
      setSubscriptionForm({
        plan_name: subscription.plan_name,
        duration: subscription.duration,
        status: subscription.status,
      });
    } else {
      setSubscriptionForm({
        plan_name: 'free',
        duration: 'monthly',
        status: 'active',
      });
    }
    setShowSubscriptionModal(true);
  };

  const saveSubscription = async () => {
    if (!editingRestaurant) return;

    try {
      const existingSubscription = getSubscription(editingRestaurant.id);
      const selectedPlan = subscriptionPlans.find(p => p.slug === subscriptionForm.plan_name);

      if (!selectedPlan) {
        alert('Plan no encontrado');
        return;
      }

      const endDate = new Date();
      if (subscriptionForm.duration === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscriptionData = {
        plan_name: subscriptionForm.plan_name,
        duration: subscriptionForm.duration,
        status: subscriptionForm.status,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        monthly_price: selectedPlan.price,
        max_products: selectedPlan.max_products,
        max_orders: 999999,
        features: selectedPlan.features,
      };

      if (existingSubscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert([{
            restaurant_id: editingRestaurant.id,
            ...subscriptionData,
            auto_renew: false,
          }]);

        if (error) throw error;
      }

      await loadData();
      setShowSubscriptionModal(false);
      setEditingRestaurant(null);
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('Error al guardar la suscripción');
    }
  };

  const handleDeleteRestaurant = (restaurant: Restaurant) => {
    setRestaurantToDelete(restaurant);
    setShowDeleteModal(true);
  };

  const confirmDeleteRestaurant = async () => {
    if (!restaurantToDelete) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.showToast('error', 'Error', 'Sesión expirada');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-restaurant`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurantToDelete.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el restaurante');
      }

      toast.showToast('success', 'Eliminado', `Restaurante "${restaurantToDelete.name}" eliminado exitosamente`);
      await loadData();
      setShowDeleteModal(false);
      setRestaurantToDelete(null);
    } catch (error: any) {
      console.error('Error deleting restaurant:', error);
      toast.showToast('error', 'Error', error.message || 'Error al eliminar el restaurante');
    }
  };

  const handleTransferOwnership = async (restaurant: Restaurant) => {
    setRestaurantToTransfer(restaurant);
    setSelectedNewOwner('');

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('restaurant_id', restaurant.id)
        .neq('id', restaurant.owner_id)
        .in('role', ['restaurant_owner', 'superadmin']);

      if (error) throw error;

      setAvailableUsers(users || []);
      setShowTransferModal(true);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios disponibles');
    }
  };

  const confirmTransferOwnership = async () => {
    if (!restaurantToTransfer || !selectedNewOwner) return;

    try {
      setTransferLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesión expirada');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transfer-restaurant-ownership`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurantToTransfer.id,
          newOwnerId: selectedNewOwner,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al transferir propiedad');
      }

      toast.success(`Propiedad transferida exitosamente a ${result.restaurant.newOwnerName}`);
      await loadData();
      setShowTransferModal(false);
      setRestaurantToTransfer(null);
      setSelectedNewOwner('');
    } catch (error: any) {
      console.error('Error transferring ownership:', error);
      toast.error(error.message || 'Error al transferir propiedad');
    } finally {
      setTransferLoading(false);
    }
  };

  const filteredRestaurants = restaurants
    .filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           restaurant.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (startDate || endDate) {
        const restaurantDate = new Date(restaurant.created_at);
        if (startDate && restaurantDate < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (restaurantDate > end) return false;
        }
      }

      if (filter === 'all') return matchesSearch;

      const isActive = isRestaurantActive(restaurant.id);
      if (filter === 'active') return matchesSearch && isActive;
      if (filter === 'inactive') return matchesSearch && !isActive;

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  const getRestaurantStatusBadge = (restaurantId: string) => {
    const subscription = getSubscription(restaurantId);
    if (!subscription) {
      return <Badge variant="gray">Sin suscripción</Badge>;
    }

    return subscription.status === 'active'
      ? <Badge variant="success">Activo</Badge>
      : <Badge variant="error">Inactivo</Badge>;
  };

  const getSubscriptionBadge = (subscription: Subscription | undefined) => {
    if (!subscription) return <Badge variant="gray">Sin suscripción</Badge>;

    const plan = subscriptionPlans.find(p => p.slug === subscription.plan_name);
    const planName = plan?.name || subscription.plan_name.toUpperCase();

    const variant = subscription.plan_name === 'free' ? 'gray' :
                   subscription.plan_name === 'basic' ? 'info' :
                   subscription.plan_name === 'pro' ? 'success' :
                   'error';

    return <Badge variant={variant}>{planName}</Badge>;
  };

  const getPublicMenuUrl = (restaurant: Restaurant) => {
    return `${window.location.origin}/${restaurant.domain}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Restaurantes</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Más reciente</option>
                <option value="oldest">Más antiguo</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
            {(startDate || endDate || sortBy !== 'newest') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSortBy('newest');
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suscripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Menú Público
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRestaurants.map((restaurant) => {
                const subscription = getSubscription(restaurant.id);
                return (
                  <tr key={restaurant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {restaurant.logo_url && (
                          <img
                            className="h-10 w-10 rounded-full object-cover mr-3"
                            src={restaurant.logo_url}
                            alt={restaurant.name}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {restaurant.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {restaurant.domain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{restaurant.email}</div>
                      {restaurant.phone && (
                        <div className="text-sm text-gray-500">{restaurant.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRestaurantStatusBadge(restaurant.id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSubscriptionBadge(subscription)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={getPublicMenuUrl(restaurant)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ver Menú
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(restaurant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setShowModal(true);
                          }}
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Settings}
                          onClick={() => handleEditSubscription(restaurant)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Gestionar Suscripción"
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={UserCheck}
                          onClick={() => handleTransferOwnership(restaurant)}
                          className="text-green-600 hover:text-green-700"
                          title="Transferir Propiedad"
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteRestaurant(restaurant)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar Restaurante"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRestaurant(null);
        }}
        title="Detalles del Restaurante"
        size="lg"
      >
        {selectedRestaurant && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-sm text-gray-900">{selectedRestaurant.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Propietario</label>
                  <p className="text-sm text-gray-900">{selectedRestaurant.owner_name || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedRestaurant.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <p className="text-sm text-gray-900">{selectedRestaurant.phone || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {selectedRestaurant.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <p className="text-sm text-gray-900">{selectedRestaurant.address}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Dominio</label>
              <p className="text-sm text-gray-900">{selectedRestaurant.domain}</p>
              <a
                href={getPublicMenuUrl(selectedRestaurant)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm mt-1"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Ver Menú Público
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                {getRestaurantStatusBadge(selectedRestaurant.id)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Suscripción</label>
                {getSubscriptionBadge(getSubscription(selectedRestaurant.id))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedRestaurant.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Última Actualización</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedRestaurant.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          setEditingRestaurant(null);
        }}
        title="Gestionar Suscripción"
        size="md"
      >
        {editingRestaurant && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Configurando suscripción para: <strong>{editingRestaurant.name}</strong>
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Plan
                  </label>
                  <select
                    value={subscriptionForm.plan_name}
                    onChange={(e) => setSubscriptionForm(prev => ({
                      ...prev,
                      plan_name: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {subscriptionPlans.map(plan => (
                      <option key={plan.id} value={plan.slug}>
                        {plan.name} - ${plan.price}/{plan.billing_period === 'monthly' ? 'mes' : 'año'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración
                  </label>
                  <select
                    value={subscriptionForm.duration}
                    onChange={(e) => setSubscriptionForm(prev => ({
                      ...prev,
                      duration: e.target.value as Subscription['duration']
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={subscriptionForm.status}
                    onChange={(e) => setSubscriptionForm(prev => ({
                      ...prev,
                      status: e.target.value as Subscription['status']
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activa</option>
                    <option value="expired">Vencida</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSubscriptionModal(false);
                  setEditingRestaurant(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={saveSubscription}>
                Guardar Suscripción
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRestaurantToDelete(null);
        }}
        title="Confirmar Eliminación"
        size="md"
      >
        {restaurantToDelete && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Eliminar restaurante "{restaurantToDelete.name}"?
              </h3>
              <p className="text-gray-600 mb-4">
                Esta acción eliminará permanentemente toda la información del restaurante.
              </p>
              <p className="text-sm text-gray-500">
                <strong>Esta acción no se puede deshacer.</strong>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setRestaurantToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteRestaurant}
                icon={Trash2}
              >
                Eliminar Restaurante
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setRestaurantToTransfer(null);
          setSelectedNewOwner('');
        }}
        title="Transferir Propiedad del Restaurante"
        size="md"
      >
        {restaurantToTransfer && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Transferir propiedad de "{restaurantToTransfer.name}"
              </h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                El propietario actual es: <strong>{restaurantToTransfer.owner_name || 'No especificado'}</strong>
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Esta acción transferirá todos los derechos y responsabilidades del restaurante al nuevo propietario. El propietario actual perderá el control total del restaurante.
                </p>
              </div>
            </div>

            {availableUsers.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">
                  No hay usuarios disponibles para transferir la propiedad. El nuevo propietario debe ser un miembro del restaurante con rol de "restaurant_owner" o "superadmin".
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Nuevo Propietario
                </label>
                <select
                  value={selectedNewOwner}
                  onChange={(e) => setSelectedNewOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={transferLoading}
                >
                  <option value="">-- Seleccionar usuario --</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowTransferModal(false);
                  setRestaurantToTransfer(null);
                  setSelectedNewOwner('');
                }}
                disabled={transferLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmTransferOwnership}
                icon={UserCheck}
                disabled={!selectedNewOwner || transferLoading || availableUsers.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {transferLoading ? 'Transfiriendo...' : 'Transferir Propiedad'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
