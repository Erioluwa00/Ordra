// Shared mock data — imported by both Customers.jsx and Orders.jsx
// When localStorage is wired up later, this gets replaced by the hook.

export const MOCK_CUSTOMERS = [
  { id: 'CUST-001', name: 'Sarah Jenkins',   email: 'sarah.j@example.com',    phone: '08012345678', address: '12 Admiralty Way, Lekki Phase 1', totalOrders: 12, lifetimeValue: '₦240,000', notes: 'VIP Customer. Prefers morning deliveries.' },
  { id: 'CUST-002', name: 'Marcus Chen',     email: 'm.chen@example.com',     phone: '08023456789', address: '45 Bode Thomas, Surulere',        totalOrders: 4,  lifetimeValue: '₦85,000',  notes: '' },
  { id: 'CUST-003', name: 'Elena Rodriguez', email: '',                        phone: '08034567890', address: 'Victoria Island, Lagos',          totalOrders: 1,  lifetimeValue: '₦12,500',  notes: 'First time buyer from Instagram.' },
  { id: 'CUST-004', name: 'David Kim',       email: 'david.k@brand.co',       phone: '08045678901', address: '8 Isaac John, Ikeja GRA',         totalOrders: 8,  lifetimeValue: '₦410,000', notes: 'Regular. Always pays on time.' },
  { id: 'CUST-005', name: 'Aisha Bello',     email: 'aisha.bello@gmail.com',  phone: '08056789012', address: 'Maitama, Abuja',                  totalOrders: 15, lifetimeValue: '₦650,000', notes: 'High volume corporate orders.' },
];

export const MOCK_ORDERS = [
  {
    id: 'ORD-7841', customerId: 'CUST-001', customer: 'Sarah Jenkins',   customerPhone: '08012345678',
    item: 'Custom Ceramic Vase × 2, Gift Wrapping × 1',
    items: [{ desc: 'Custom Ceramic Vase', qty: 2, price: 55000 }, { desc: 'Gift Wrapping', qty: 1, price: 10000 }],
    amount: '₦120,000', total: 120000, status: 'Processing', paymentStatus: 'paid',
    amountPaid: 120000, deliveryAddress: '12 Admiralty Way, Lekki Phase 1',
    notes: 'Handle with care – fragile item.', createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ORD-6203', customerId: 'CUST-002', customer: 'Marcus Chen',     customerPhone: '08023456789',
    item: 'Artisan Coffee Blend × 3',
    items: [{ desc: 'Artisan Coffee Blend', qty: 3, price: 15000 }],
    amount: '₦45,000', total: 45000, status: 'Delivered', paymentStatus: 'paid',
    amountPaid: 45000, deliveryAddress: '45 Bode Thomas, Surulere',
    notes: '', createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ORD-5512', customerId: 'CUST-003', customer: 'Elena Rodriguez', customerPhone: '08034567890',
    item: 'Handwoven Scarf × 1',
    items: [{ desc: 'Handwoven Scarf', qty: 1, price: 85000 }],
    amount: '₦85,000', total: 85000, status: 'Pending', paymentStatus: 'partial',
    amountPaid: 40000, deliveryAddress: 'Victoria Island, Lagos',
    notes: 'Customer wants blue variant.', createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'ORD-4198', customerId: 'CUST-004', customer: 'David Kim',       customerPhone: '08045678901',
    item: 'Minimalist Desk Lamp × 2',
    items: [{ desc: 'Minimalist Desk Lamp', qty: 2, price: 32500 }],
    amount: '₦65,000', total: 65000, status: 'Ready', paymentStatus: 'paid',
    amountPaid: 65000, deliveryAddress: '8 Isaac John, Ikeja GRA',
    notes: '', createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'ORD-3047', customerId: 'CUST-005', customer: 'Aisha Bello',     customerPhone: '08056789012',
    item: 'Scented Candle Set × 4',
    items: [{ desc: 'Scented Candle Set', qty: 4, price: 8000 }],
    amount: '₦32,000', total: 32000, status: 'Cancelled', paymentStatus: 'unpaid',
    amountPaid: 0, deliveryAddress: 'Maitama, Abuja',
    notes: 'Customer cancelled.', createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: 'ORD-2861', customerId: 'CUST-001', customer: 'Sarah Jenkins',   customerPhone: '08012345678',
    item: 'Embroidered Tote Bag × 1',
    items: [{ desc: 'Embroidered Tote Bag', qty: 1, price: 22000 }],
    amount: '₦22,000', total: 22000, status: 'New', paymentStatus: 'unpaid',
    amountPaid: 0, deliveryAddress: '12 Admiralty Way, Lekki Phase 1',
    notes: '', createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'ORD-1934', customerId: 'CUST-001', customer: 'Sarah Jenkins',   customerPhone: '08012345678',
    item: 'Ceramic Dinner Set × 1',
    items: [{ desc: 'Ceramic Dinner Set', qty: 1, price: 75000 }],
    amount: '₦75,000', total: 75000, status: 'Delivered', paymentStatus: 'paid',
    amountPaid: 75000, deliveryAddress: '12 Admiralty Way, Lekki Phase 1',
    notes: '', createdAt: new Date(Date.now() - 864000000).toISOString(),
  },
  {
    id: 'ORD-1102', customerId: 'CUST-004', customer: 'David Kim',       customerPhone: '08045678901',
    item: 'Oak Bookshelf × 1',
    items: [{ desc: 'Oak Bookshelf', qty: 1, price: 180000 }],
    amount: '₦180,000', total: 180000, status: 'Delivered', paymentStatus: 'paid',
    amountPaid: 180000, deliveryAddress: '8 Isaac John, Ikeja GRA',
    notes: '', createdAt: new Date(Date.now() - 1296000000).toISOString(),
  },
  {
    id: 'ORD-0891', customerId: 'CUST-005', customer: 'Aisha Bello',     customerPhone: '08056789012',
    item: 'Luxury Gift Basket × 2',
    items: [{ desc: 'Luxury Gift Basket', qty: 2, price: 55000 }],
    amount: '₦110,000', total: 110000, status: 'Delivered', paymentStatus: 'paid',
    amountPaid: 110000, deliveryAddress: 'Maitama, Abuja',
    notes: '', createdAt: new Date(Date.now() - 1728000000).toISOString(),
  },
];
