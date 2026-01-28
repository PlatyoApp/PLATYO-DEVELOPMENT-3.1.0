# Supabase Implementation Guide - Complete Code Changes

This guide provides specific code changes for each file that needs to be migrated from localStorage to Supabase.

## 1. CustomersManagement.tsx

### Import Changes
```typescript
// REMOVE:
import { loadFromStorage, saveToStorage } from '../../data/mockData';

// ADD:
import { supabase } from '../../lib/supabase';
```

### Key Functions to Replace

#### loadCustomersData()
```typescript
const loadCustomersData = async () => {
  if (!restaurant) return;

  try {
    // Get all orders for this restaurant with customer info
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurant.id);

    if (ordersError) throw ordersError;

    // Get all customers directly from customers table
    const { data: dbCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurant.id);

    if (customersError) throw customersError;

    // Aggregate customer data from orders
    const customerMap = new Map();

    (orders || []).forEach((order: any) => {
      const customerKey = order.customer_phone;
      if (!customerKey) return;

      if (customerMap.has(customerKey)) {
        const existing = customerMap.get(customerKey);
        existing.totalOrders += 1;
        existing.totalSpent += order.status === 'delivered' ? order.total_amount : 0;
        existing.lastOrderDate = order.created_at > existing.lastOrderDate ? order.created_at : existing.lastOrderDate;
        if (!existing.orderTypes.includes(order.order_type)) {
          existing.orderTypes.push(order.order_type);
        }
      } else {
        customerMap.set(customerKey, {
          id: customerKey,
          name: order.customer_name || 'N/A',
          phone: order.customer_phone,
          email: order.customer_email,
          address: order.customer_address,
          totalOrders: 1,
          totalSpent: order.status === 'delivered' ? order.total_amount : 0,
          lastOrderDate: order.created_at,
          orderTypes: [order.order_type],
          isVip: false,
        });
      }
    });

    // Add customers from customers table who haven't ordered yet
    (dbCustomers || []).forEach((customer: any) => {
      if (!customerMap.has(customer.phone)) {
        customerMap.set(customer.phone, {
          id: customer.phone,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          delivery_instructions: customer.notes,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: customer.created_at,
          orderTypes: [],
          isVip: false,
        });
      }
    });

    setCustomers(Array.from(customerMap.values()));
  } catch (error) {
    console.error('Error loading customers:', error);
    showToast('error', t('error'), t('failedToLoadCustomers'));
  }
};
```

#### handleCreateCustomer()
```typescript
const handleCreateCustomer = async () => {
  if (!restaurant) return;

  // Validation
  if (!createForm.name.trim()) {
    showToast('warning', t('validationError'), t('nameRequiredError'), 3000);
    return;
  }

  if (!createForm.phone.trim()) {
    showToast('warning', t('validationError'), t('phoneRequiredError'), 3000);
    return;
  }

  if (createForm.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      showToast('warning', t('validationError'), t('emailInvalid'), 3000);
      return;
    }
  }

  try {
    // Check if customer already exists
    const { data: existing, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .eq('phone', createForm.phone.trim())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existing) {
      showToast('warning', t('validationError'), t('customerAlreadyExists'), 3000);
      return;
    }

    // Create new customer
    const { error: insertError } = await supabase
      .from('customers')
      .insert([{
        restaurant_id: restaurant.id,
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || null,
        address: createForm.address.trim() || null,
        notes: createForm.delivery_instructions.trim() || null,
      }]);

    if (insertError) throw insertError;

    await loadCustomersData();
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      delivery_instructions: '',
      isVip: false,
    });

    showToast('success', 'Cliente creado', `${createForm.name} ha sido agregado exitosamente`, 4000);
  } catch (error) {
    console.error('Error creating customer:', error);
    showToast('error', t('error'), t('failedToCreateCustomer'));
  }
};
```

#### handleSaveCustomer()
```typescript
const handleSaveCustomer = async () => {
  if (!editingCustomer) return;

  // Validation...
  if (!editForm.name.trim() || !editForm.phone.trim()) {
    showToast('warning', t('validationError'), t('nameAndPhoneRequired'), 3000);
    return;
  }

  try {
    // Update customer in customers table
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || null,
        address: editForm.address.trim() || null,
        notes: editForm.delivery_instructions.trim() || null,
      })
      .eq('restaurant_id', restaurant?.id)
      .eq('phone', editingCustomer.phone);

    if (updateError) throw updateError;

    // Update orders with new customer info
    const { error: ordersError } = await supabase
      .from('orders')
      .update({
        customer_name: editForm.name.trim(),
        customer_phone: editForm.phone.trim(),
        customer_email: editForm.email.trim() || null,
        customer_address: editForm.address.trim() || null,
      })
      .eq('restaurant_id', restaurant?.id)
      .eq('customer_phone', editingCustomer.phone);

    if (ordersError) throw ordersError;

    await loadCustomersData();
    setShowEditModal(false);
    setEditingCustomer(null);

    showToast('success', t('customerUpdated'), t('customerInfoUpdatedSuccessfully'), 4000);
  } catch (error) {
    console.error('Error updating customer:', error);
    showToast('error', t('error'), t('failedToUpdateCustomer'));
  }
};
```

#### deleteCustomerData()
```typescript
const deleteCustomerData = async (customer: CustomerData) => {
  try {
    // Delete all orders from this customer
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('restaurant_id', restaurant?.id)
      .eq('customer_phone', customer.phone);

    if (ordersError) throw ordersError;

    // Delete from customers table
    const { error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('restaurant_id', restaurant?.id)
      .eq('phone', customer.phone);

    if (customerError) throw customerError;

    await loadCustomersData();
    showToast('info', t('customerDeleted'), t('customerAndOrdersDeleted', { name: customer.name }), 5000);
  } catch (error) {
    console.error('Error deleting customer:', error);
    showToast('error', t('error'), t('failedToDeleteCustomer'));
  }
};
```

## 2. CategoriesManagement.tsx

### Import Changes
```typescript
// REMOVE:
import { loadFromStorage, saveToStorage, availablePlans } from '../../data/mockData';

// ADD:
import { supabase } from '../../lib/supabase';
```

### Key Functions

#### loadCategories()
```typescript
const loadCategories = async () => {
  if (!restaurant) return;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('display_order', { ascending: true });

    if (error) throw error;

    setCategories(data || []);
  } catch (error) {
    console.error('Error loading categories:', error);
    showToast('error', t('error'), t('failedToLoadCategories'));
  }
};
```

#### handleSave()
```typescript
const handleSave = async () => {
  if (!restaurant || !formData.name.trim()) return;

  // Check category limit...
  if (!editingCategory && currentSubscription) {
    const currentPlan = availablePlans.find(p => p.id === currentSubscription.plan_type);
    if (currentPlan && currentPlan.features.max_categories !== -1) {
      if (categories.length >= currentPlan.features.max_categories) {
        showToast('warning', t('categoryLimitReached'), /* message */, 8000);
        return;
      }
    }
  }

  try {
    if (editingCategory) {
      // Update existing category
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          description: formData.description,
          // Note: icon field doesn't exist in DB, consider storing in settings
        })
        .eq('id', editingCategory.id);

      if (error) throw error;
    } else {
      // Create new category
      const { error } = await supabase
        .from('categories')
        .insert([{
          restaurant_id: restaurant.id,
          name: formData.name,
          description: formData.description,
          display_order: categories.length + 1,
          is_active: true,
        }]);

      if (error) throw error;
    }

    await loadCategories();
    handleCloseModal();
    showToast('success', editingCategory ? t('categoryUpdated') : t('categoryCreated'), /* message */);
  } catch (error) {
    console.error('Error saving category:', error);
    showToast('error', t('error'), t('failedToSaveCategory'));
  }
};
```

#### handleDelete()
```typescript
const handleDelete = async (categoryId: string) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    await loadCategories();
    showToast('info', t('categoryDeleted'), t('messageCategoryDeleted'), 4000);
  } catch (error) {
    console.error('Error deleting category:', error);
    showToast('error', t('error'), t('failedToDeleteCategory'));
  }
};
```

#### toggleActive()
```typescript
const toggleActive = async (categoryId: string) => {
  try {
    const category = categories.find((cat: Category) => cat.id === categoryId);
    if (!category) return;

    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', categoryId);

    if (error) throw error;

    await loadCategories();
    showToast('info', !category.is_active ? t('categoryActivated') : t('categoryDeactivated'), /* message */);
  } catch (error) {
    console.error('Error toggling category:', error);
    showToast('error', t('error'), t('failedToToggleCategory'));
  }
};
```

#### moveCategory()
```typescript
const moveCategory = async (categoryId: string, direction: 'up' | 'down') => {
  const currentIndex = categories.findIndex(cat => cat.id === categoryId);
  if (currentIndex === -1) return;

  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0 || newIndex >= categories.length) return;

  const newCategories = [...categories];
  [newCategories[currentIndex], newCategories[newIndex]] = [newCategories[newIndex], newCategories[currentIndex]];

  try {
    // Update order positions for all affected categories
    const updates = newCategories.map((cat, index) => ({
      id: cat.id,
      display_order: index + 1,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: update.display_order })
        .eq('id', update.id);

      if (error) throw error;
    }

    await loadCategories();
  } catch (error) {
    console.error('Error moving category:', error);
    showToast('error', t('error'), t('failedToMoveCategory'));
  }
};
```

## 3. MenuManagement.tsx

### Key Functions

#### loadMenuData()
```typescript
const loadMenuData = async () => {
  if (!restaurant) return;

  try {
    // Load categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (categoriesError) throw categoriesError;

    // Load products with category info
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (category_id)
      `)
      .eq('restaurant_id', restaurant.id);

    if (productsError) throw productsError;

    setCategories(categoriesData || []);
    setProducts(productsData || []);
  } catch (error) {
    console.error('Error loading menu data:', error);
    showToast('error', t('error'), t('failedToLoadMenu'));
  }
};
```

#### handleSaveProduct()
```typescript
const handleSaveProduct = async (productData: any) => {
  if (!restaurant) return;

  // Check product limit...

  try {
    if (editingProduct) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          image_url: productData.images?.[0] || null,
          is_available: productData.status === 'active',
          is_featured: productData.is_featured || false,
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      // Update category mapping
      await supabase.from('product_categories').delete().eq('product_id', editingProduct.id);

      if (productData.category_id) {
        await supabase.from('product_categories').insert([{
          product_id: editingProduct.id,
          category_id: productData.category_id,
        }]);
      }
    } else {
      // Create new product
      const { data, error } = await supabase
        .from('products')
        .insert([{
          restaurant_id: restaurant.id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          image_url: productData.images?.[0] || null,
          is_available: productData.status === 'active',
          is_featured: productData.is_featured || false,
        }])
        .select()
        .single();

      if (error) throw error;

      // Create category mapping
      if (productData.category_id && data) {
        await supabase.from('product_categories').insert([{
          product_id: data.id,
          category_id: productData.category_id,
        }]);
      }
    }

    await loadMenuData();
    setShowProductModal(false);
    setEditingProduct(null);
    showToast('success', editingProduct ? t('productUpdatedTitle') : t('productCreatedTitle'), /* message */);
  } catch (error) {
    console.error('Error saving product:', error);
    showToast('error', t('error'), t('failedToSaveProduct'));
  }
};
```

#### handleDeleteProduct()
```typescript
const handleDeleteProduct = async (productId: string) => {
  try {
    // Delete category mappings first
    await supabase.from('product_categories').delete().eq('product_id', productId);

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;

    await loadMenuData();
    showToast('info', t('productDeletedTitle'), t('productDeletedMessage'), 4000);
  } catch (error) {
    console.error('Error deleting product:', error);
    showToast('error', t('error'), t('failedToDeleteProduct'));
  }
};
```

#### handleArchiveProduct()
```typescript
const handleArchiveProduct = async (productId: string) => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ is_available: false })
      .eq('id', productId);

    if (error) throw error;

    await loadMenuData();
    showToast('info', t('productArchivedTitle'), t('productArchivedMessage'), 4000);
  } catch (error) {
    console.error('Error archiving product:', error);
    showToast('error', t('error'), t('failedToArchiveProduct'));
  }
};
```

## 4. OrdersManagement.tsx

### Key Functions

#### loadOrders()
```typescript
const loadOrders = async () => {
  if (!restaurant) return;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        ),
        customer:customers (*)
      `)
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setOrders(data || []);
  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('error', t('error'), t('failedToLoadOrders'));
  }
};
```

#### updateOrderStatus()
```typescript
const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) throw error;

    await loadOrders();

    const statusMessages = {
      confirmed: t('orderConfirmedMsg'),
      preparing: t('orderInPreparationMsg'),
      ready: t('orderReadyForDeliveryMsg'),
      delivered: t('orderDeliveredMsg'),
      cancelled: t('orderCancelledMsg')
    };

    showToast('success', t('statusUpdatedTitle'), statusMessages[newStatus] || t('orderStatusUpdated'), 3000);
  } catch (error) {
    console.error('Error updating order status:', error);
    showToast('error', t('error'), t('failedToUpdateStatus'));
  }
};
```

#### confirmDeleteOrder()
```typescript
const confirmDeleteOrder = async () => {
  if (!orderToDelete) return;

  try {
    // Delete order items first (FK constraint)
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderToDelete.id);

    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderToDelete.id);

    if (error) throw error;

    await loadOrders();
    setShowDeleteModal(false);
    setOrderToDelete(null);
    showToast('success', t('orderDeletedTitle'), t('orderDeleteSuccess'), 4000);
  } catch (error) {
    console.error('Error deleting order:', error);
    showToast('error', t('error'), t('failedToDeleteOrder'));
  }
};
```

## 5. RestaurantAnalytics.tsx

### Key Functions

#### loadAnalyticsData()
```typescript
const loadAnalyticsData = async () => {
  if (!restaurant) return;

  try {
    // Load products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurant.id);

    if (productsError) throw productsError;

    // Load orders with items
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('restaurant_id', restaurant.id);

    if (ordersError) throw ordersError;

    // Load categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true);

    if (categoriesError) throw categoriesError;

    setProducts(productsData || []);
    setOrders(ordersData || []);
    setCategories(categoriesData || []);
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showToast('error', t('error'), t('failedToLoadAnalytics'));
  }
};
```

## 6. SubscriptionPlans.tsx

### Key Functions

#### loadCurrentSubscription()
```typescript
const loadCurrentSubscription = async () => {
  if (!restaurant) return;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    setCurrentSubscription(data);
  } catch (error) {
    console.error('Error loading subscription:', error);
    showToast('error', t('error'), t('failedToLoadSubscription'));
  }
};
```

#### handleSelectPlan()
```typescript
const handleSelectPlan = async (planId: string) => {
  if (!restaurant || !user) return;
  setLoading(true);

  try {
    // Deactivate current subscription
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'active');

    // Create new subscription
    const endDate = planId === 'free'
      ? '2099-12-31T23:59:59Z'
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('subscriptions')
      .insert([{
        restaurant_id: restaurant.id,
        plan_name: planId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate,
        auto_renew: planId !== 'free',
      }]);

    if (error) throw error;

    await loadCurrentSubscription();

    const selectedPlan = availablePlans.find(p => p.id === planId);
    if (planId !== 'free') {
      showToast('success', t('planActivated'), `Your ${selectedPlan?.name} plan has been activated successfully.`, 6000);
    } else {
      showToast('info', 'Free Plan Activated', 'You have switched to the free plan.', 5000);
    }

    window.location.reload();
  } catch (error) {
    console.error('Error updating subscription:', error);
    showToast('error', 'Error Changing Plan', 'There was a problem changing your subscription plan.', 6000);
  } finally {
    setLoading(false);
  }
};
```

## Important Notes

### Real-time Subscriptions
Add real-time updates to all data loading functions:

```typescript
useEffect(() => {
  if (!restaurant) return;

  loadData();

  // Setup real-time subscription
  const channel = supabase
    .channel('table-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'your_table_name',
        filter: `restaurant_id=eq.${restaurant.id}`
      },
      () => {
        loadData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [restaurant]);
```

### Error Handling
Always wrap Supabase calls in try-catch blocks and show user-friendly error messages.

### Database Schema Differences
Note that the database schema differs from localStorage structure:
- Products use a junction table (`product_categories`) for category relationships
- Orders store customer data denormalized (customer_name, customer_phone, etc.) instead of nested objects
- Some fields like `variations`, `ingredients` may need to be stored as JSONB columns or separate tables

### Next Steps
1. Update each file with these patterns
2. Test thoroughly
3. Ensure RLS policies are configured correctly
4. Add proper TypeScript types for Supabase responses
