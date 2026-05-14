import Dexie from 'dexie';

export const db = new Dexie('OrdraOfflineDB');

// Define the database schema
// The '++' means auto-incrementing primary key for the queue
// For orders and customers, we use the Convex _id as the primary key
db.version(3).stores({
  orders: '_id, orderId, customer, customerPhone, status, createdAt, isOffline',
  customers: '_id, name, phone',
  sync_queue: '++id, type, timestamp',
  metadata: 'key'
});

export const getMetadata = async (key) => {
  const item = await db.metadata.get(key);
  return item ? item.value : null;
};

export const setMetadata = async (key, value) => {
  await db.metadata.put({ key, value, updatedAt: Date.now() });
};

export const saveOrderToCache = async (order) => {
  try {
    // Basic validation to prevent DataError: Provided data is inadequate
    if (!order || !order._id || !order.createdAt) {
      console.warn("Skipping cache for invalid order object:", order);
      return;
    }
    await db.orders.put(order);
    window.dispatchEvent(new CustomEvent('ordra:cache-updated', { detail: { type: 'orders' } }));
  } catch (err) {
    console.error('Failed to cache order:', err);
  }
};

export const saveCustomerToCache = async (customer) => {
  try {
    await db.customers.put(customer);
    window.dispatchEvent(new CustomEvent('ordra:cache-updated', { detail: { type: 'customers' } }));
  } catch (err) {
    console.error('Failed to cache customer:', err);
  }
};

export const addToSyncQueue = async (type, data) => {
  try {
    await db.sync_queue.add({
      type,
      data,
      timestamp: Date.now(),
      synced: false
    });
  } catch (err) {
    console.error('Failed to add to sync queue:', err);
  }
};
