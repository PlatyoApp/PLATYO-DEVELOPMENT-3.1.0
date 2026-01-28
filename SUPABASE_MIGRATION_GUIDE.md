# Supabase Migration Guide for Restaurant Management Pages

This guide provides the patterns needed to migrate from localStorage to Supabase across all restaurant management pages.

## Key Migration Patterns

### 1. Import Changes

**Before:**
```typescript
import { loadFromStorage, saveToStorage } from '../../data/mockData';
```

**After:**
```typescript
import { supabase } from '../../lib/supabase';
```

### 2. Loading Data Pattern

**Before (localStorage):**
```typescript
const loadData = () => {
  const allData = loadFromStorage('tableName') || [];
  const filtered = allData.filter(item => item.restaurant_id === restaurant.id);
  setData(filtered);
};
```

**After (Supabase):**
```typescript
const loadData = async () => {
  try {
    const { data, error } = await supabase
      .from('tableName')
      .select('*')
      .eq('restaurant_id', restaurant.id);

    if (error) throw error;
    setData(data || []);
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('error', 'Error', 'Failed to load data');
  }
};
```

### 3. Creating Data Pattern

**Before (localStorage):**
```typescript
const handleCreate = () => {
  const allData = loadFromStorage('tableName') || [];
  const newItem = {
    id: `item-${Date.now()}`,
    restaurant_id: restaurant.id,
    ...formData,
    created_at: new Date().toISOString(),
  };
  saveToStorage('tableName', [...allData, newItem]);
  loadData();
};
```

**After (Supabase):**
```typescript
const handleCreate = async () => {
  try {
    const { data, error } = await supabase
      .from('tableName')
      .insert([{
        restaurant_id: restaurant.id,
        ...formData,
      }])
      .select();

    if (error) throw error;
    await loadData();
    showToast('success', 'Created', 'Item created successfully');
  } catch (error) {
    console.error('Error creating:', error);
    showToast('error', 'Error', 'Failed to create item');
  }
};
```

### 4. Updating Data Pattern

**Before (localStorage):**
```typescript
const handleUpdate = (itemId: string) => {
  const allData = loadFromStorage('tableName') || [];
  const updatedData = allData.map(item =>
    item.id === itemId
      ? { ...item, ...formData, updated_at: new Date().toISOString() }
      : item
  );
  saveToStorage('tableName', updatedData);
  loadData();
};
```

**After (Supabase):**
```typescript
const handleUpdate = async (itemId: string) => {
  try {
    const { error } = await supabase
      .from('tableName')
      .update(formData)
      .eq('id', itemId);

    if (error) throw error;
    await loadData();
    showToast('success', 'Updated', 'Item updated successfully');
  } catch (error) {
    console.error('Error updating:', error);
    showToast('error', 'Error', 'Failed to update item');
  }
};
```

### 5. Deleting Data Pattern

**Before (localStorage):**
```typescript
const handleDelete = (itemId: string) => {
  const allData = loadFromStorage('tableName') || [];
  const updatedData = allData.filter(item => item.id !== itemId);
  saveToStorage('tableName', updatedData);
  loadData();
};
```

**After (Supabase):**
```typescript
const handleDelete = async (itemId: string) => {
  try {
    const { error } = await supabase
      .from('tableName')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    await loadData();
    showToast('success', 'Deleted', 'Item deleted successfully');
  } catch (error) {
    console.error('Error deleting:', error);
    showToast('error', 'Error', 'Failed to delete item');
  }
};
```

### 6. Real-time Subscriptions Pattern

**Add real-time updates:**
```typescript
useEffect(() => {
  if (!restaurant) return;

  loadData();

  // Setup real-time subscription
  const channel = supabase
    .channel('tableName-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tableName',
        filter: `restaurant_id=eq.${restaurant.id}`
      },
      (payload) => {
        console.log('Change received!', payload);
        loadData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [restaurant]);
```

### 7. Query with Joins Pattern

**For orders with items:**
```typescript
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
  .eq('restaurant_id', restaurant.id);
```

### 8. Query with Filters Pattern

**Multiple filters:**
```typescript
let query = supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', restaurant.id);

if (statusFilter !== 'all') {
  query = query.eq('status', statusFilter);
}

if (startDate) {
  query = query.gte('created_at', startDate);
}

if (endDate) {
  query = query.lte('created_at', endDate);
}

const { data, error } = await query.order('created_at', { ascending: false });
```

## Table Mapping Guide

### Customers
- **localStorage key:** 'customers' or 'importedCustomers' + 'vipCustomers'
- **Supabase table:** `customers`
- **Key columns:** `id`, `restaurant_id`, `name`, `phone`, `email`, `address`, `notes`

### Categories
- **localStorage key:** 'categories'
- **Supabase table:** `categories`
- **Key columns:** `id`, `restaurant_id`, `name`, `description`, `display_order`, `is_active`

### Products
- **localStorage key:** 'products'
- **Supabase table:** `products` + `product_categories` (junction table)
- **Key columns:** `id`, `restaurant_id`, `name`, `description`, `price`, `image_url`, `is_available`, `is_featured`

### Orders
- **localStorage key:** 'orders'
- **Supabase tables:** `orders` + `order_items`
- **Key columns:**
  - orders: `id`, `restaurant_id`, `customer_id`, `status`, `order_type`, `total_amount`
  - order_items: `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`

### Subscriptions
- **localStorage key:** 'subscriptions'
- **Supabase table:** `subscriptions`
- **Key columns:** `id`, `restaurant_id`, `plan_name`, `status`, `start_date`, `end_date`

### Support Tickets
- **localStorage key:** 'supportTickets'
- **Supabase table:** `support_tickets`
- **Key columns:** `id`, `restaurant_id`, `user_id`, `subject`, `status`, `priority`

## Common Pitfalls and Solutions

### 1. Async/Await
All Supabase operations are async. Make sure to:
- Add `async` to function declarations
- Use `await` for Supabase calls
- Wrap in try-catch for error handling

### 2. Error Handling
Always check for errors:
```typescript
const { data, error } = await supabase.from('table').select();
if (error) throw error;
```

### 3. Auto-generated IDs
Supabase auto-generates UUIDs. Don't manually create IDs:
```typescript
// WRONG
const newItem = { id: `item-${Date.now()}`, ...data };

// RIGHT
const newItem = { ...data }; // Supabase generates the ID
```

### 4. Timestamps
Supabase auto-manages `created_at` and `updated_at`:
```typescript
// WRONG
const newItem = { ...data, created_at: new Date().toISOString() };

// RIGHT
const newItem = { ...data }; // Supabase handles timestamps
```

### 5. RLS Policies
Ensure RLS policies are correctly configured in Supabase to filter by restaurant_id automatically.

## Migration Checklist for Each File

- [ ] Remove `loadFromStorage` and `saveToStorage` imports
- [ ] Add `import { supabase } from '../../lib/supabase'`
- [ ] Convert all data loading functions to async
- [ ] Replace `loadFromStorage` with `supabase.from().select()`
- [ ] Replace `saveToStorage` with `supabase.from().insert()` or `.update()`
- [ ] Add proper error handling with try-catch
- [ ] Remove manual ID generation
- [ ] Remove manual timestamp generation
- [ ] Test all CRUD operations
- [ ] Add real-time subscriptions where appropriate

## Testing Checklist

- [ ] Create operation works correctly
- [ ] Read/List operation loads data
- [ ] Update operation saves changes
- [ ] Delete operation removes data
- [ ] Filtering works correctly
- [ ] Sorting works correctly
- [ ] Error messages display properly
- [ ] Real-time updates work (if implemented)
