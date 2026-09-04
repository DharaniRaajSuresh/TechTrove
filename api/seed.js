const DEFAULT_SEED_ITEMS = [
  { id: 'item-dell-lat-01', brand: 'Dell', model: 'Latitude 3420', type: 'Laptop', serial: 'DELL-3420-SN01', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD', status: 'rented' },
  { id: 'item-dell-lat-02', brand: 'Dell', model: 'Latitude 3420', type: 'Laptop', serial: 'DELL-3420-SN02', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD', status: 'repair', repairInfo: { serviceCenter: 'Dell Authorized Service Care, SP Road', servicePerson: 'Suresh Kumar', servicePhone: '9876500001', givenToServiceDate: '2026-09-03', expectedReturnDate: '2026-09-03', repairCost: 1800, repairIssue: 'Keyboard replacement & fan thermal service' } },
  { id: 'item-dell-lat-03', brand: 'Dell', model: 'Latitude 3420', type: 'Laptop', serial: 'DELL-3420-SN03', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD', status: 'available' },
  { id: 'item-len-t14-01', brand: 'Lenovo', model: 'ThinkPad T14 Gen 2', type: 'Laptop', serial: 'LEN-T14-SN01', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD IPS', status: 'rented' },
  { id: 'item-apl-m1-01', brand: 'Apple', model: 'MacBook Air M1 (2020)', type: 'MacBook', serial: 'APL-MBA-SN01', specs: 'Apple M1 (8-Core CPU) • 8GB Unified RAM • 256GB SSD • 13.3" Retina Display', status: 'available' },
  // DC-0501 (SOEZY INDIA)
  { id: 'item-apl-mbp16-780', brand: 'Apple', model: 'MacBook Pro 16-inch', type: 'MacBook', serial: 'SMHP1V7079J', assetNo: '780', specs: 'M3 Pro | 18-Core CPU | 20-Core GPU | 48GB Unified Memory | 1TB SSD | Space Black | Part No: MGEC4HN/A | Asset No: 780', status: 'rented', createdAt: '2026-09-03' },
  { id: 'item-apl-mbp14-781', brand: 'Apple', model: 'MacBook Pro 14-inch', type: 'MacBook', serial: '5LJP2TV9L2J', assetNo: '781', specs: 'M3 Pro | 15-Core CPU | 16-Core GPU | 24GB Unified Memory | 1TB SSD | Silver | Part No: MGDN4HN/A | Asset No: 781', status: 'rented', createdAt: '2026-09-03' },
  // DC-0496 (LUXARA HOLIDAYS)
  { id: 'item-len-tp-606', brand: 'Lenovo', model: 'ThinkPad', type: 'Laptop', serial: 'PF1C5NUR', assetNo: '606', specs: 'i5-8th GEN / 8 GB RAM / 256 GB SSD with Adaptor | Asset No: 606', status: 'rented', createdAt: '2026-08-28' },
  { id: 'item-hp-ryz-757', brand: 'HP', model: 'AMD Ryzen 5 PRO 4650U', type: 'Laptop', serial: '5CG1074VDO', assetNo: '757', specs: 'AMD Ryzen 5 PRO 4650U with Radeon Graphics • 8GB RAM / 256 GB SSD with Adaptor | Asset No: 757', status: 'rented', createdAt: '2026-08-28' },
  { id: 'item-tsh-db-760', brand: 'Toshiba', model: 'DynaBook', type: 'Laptop', serial: '52119506H', assetNo: '760', specs: 'i7-11th GEN / 16GB RAM / 256 GB SSD with Adaptor | Asset No: 760', status: 'rented', createdAt: '2026-08-28' },
  { id: 'item-tsh-db-761', brand: 'Toshiba', model: 'DynaBook', type: 'Laptop', serial: '32094378H', assetNo: '761', specs: 'i7-11th GEN / 16GB RAM / 256 GB SSD with Adaptor | Asset No: 761', status: 'rented', createdAt: '2026-08-28' },
  { id: 'item-tsh-db-762', brand: 'Toshiba', model: 'DynaBook', type: 'Laptop', serial: '52119486H', assetNo: '762', specs: 'i7-11th GEN / 16GB RAM / 256 GB SSD with Adaptor | Asset No: 762', status: 'rented', createdAt: '2026-08-28' },
  { id: 'item-tsh-db-763', brand: 'Toshiba', model: 'DynaBook', type: 'Laptop', serial: 'V1183901H', assetNo: '763', specs: 'i7-11th GEN / 16GB RAM / 256 GB SSD with Adaptor | Asset No: 763', status: 'rented', createdAt: '2026-08-28' },
  { id: 'item-tsh-db-764', brand: 'Toshiba', model: 'DynaBook', type: 'Laptop', serial: 'Z1104249H', assetNo: '764', specs: 'i7-11th GEN / 16GB RAM / 256 GB SSD with Adaptor | Asset No: 764', status: 'rented', createdAt: '2026-08-28' },
  { id: 'item-tsh-db-765', brand: 'Toshiba', model: 'DynaBook', type: 'Laptop', serial: '91027929H', assetNo: '765', specs: 'i7-11th GEN / 16GB RAM / 256 GB SSD with Adaptor | Asset No: 765', status: 'rented', createdAt: '2026-08-28' }
];

const DEFAULT_SEED_CUSTOMERS = [
  { id: 'cust-rajesh', name: 'Rajesh Kumar', phone: '9876543210', address: 'Indiranagar, Bangalore' },
  { id: 'cust-priya', name: 'Priya Sharma', phone: '9845012345', address: 'Koramangala, Bangalore' },
  { id: 'cust-amit', name: 'Amit Patel', phone: '9731234567', address: 'HSR Layout, Bangalore' },
  { id: 'cust-soezy-india', name: 'SOEZY INDIA PRIVATE LIMITED', phone: '9876543201', address: '385, Paneer Nagar, Mogappair, Chennai 600037 Tamil Nadu India', createdAt: '2026-09-03' },
  { id: 'cust-luxara-holidays', name: 'LUXARA HOLIDAYS AND RESORTS', phone: '9876543202', address: 'GROUND FLOOR NO/14 PATTULAS ROAD THOUSAND LIGHTS, Chennai 600002 Tamil Nadu India', createdAt: '2026-08-28' }
];

const DEFAULT_SEED_RENTALS = [
  { id: 'rental-rajesh-dell', customerId: 'cust-rajesh', itemId: 'item-dell-lat-01', rentAmount: 2500, billingCycle: 'monthly', startDate: '2026-09-03', advancePayment: 2500, securityDeposit: 5000, status: 'active' },
  { id: 'rental-priya-lenovo', customerId: 'cust-priya', itemId: 'item-len-t14-01', rentAmount: 3000, billingCycle: 'monthly', startDate: '2026-09-03', advancePayment: 3000, securityDeposit: 6000, status: 'active' },
  // DC-0501 (SOEZY)
  { id: 'rental-soezy-mbp16', customerId: 'cust-soezy-india', itemId: 'item-apl-mbp16-780', rentAmount: 20000, billingCycle: 'monthly', startDate: '2026-09-03', advancePayment: 20000, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0501' },
  { id: 'rental-soezy-mbp14', customerId: 'cust-soezy-india', itemId: 'item-apl-mbp14-781', rentAmount: 13900, billingCycle: 'monthly', startDate: '2026-09-03', advancePayment: 13900, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0501' },
  // DC-0496 (LUXARA)
  { id: 'rental-luxara-tp-606', customerId: 'cust-luxara-holidays', itemId: 'item-len-tp-606', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' },
  { id: 'rental-luxara-hp-757', customerId: 'cust-luxara-holidays', itemId: 'item-hp-ryz-757', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' },
  { id: 'rental-luxara-db-760', customerId: 'cust-luxara-holidays', itemId: 'item-tsh-db-760', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' },
  { id: 'rental-luxara-db-761', customerId: 'cust-luxara-holidays', itemId: 'item-tsh-db-761', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' },
  { id: 'rental-luxara-db-762', customerId: 'cust-luxara-holidays', itemId: 'item-tsh-db-762', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' },
  { id: 'rental-luxara-db-763', customerId: 'cust-luxara-holidays', itemId: 'item-tsh-db-763', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' },
  { id: 'rental-luxara-db-764', customerId: 'cust-luxara-holidays', itemId: 'item-tsh-db-764', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' },
  { id: 'rental-luxara-db-765', customerId: 'cust-luxara-holidays', itemId: 'item-tsh-db-765', rentAmount: 1700, billingCycle: 'monthly', startDate: '2026-08-28', advancePayment: 1700, securityDeposit: 0, status: 'active', notes: 'Delivery Challan # DC-0496' }
];

module.exports = { DEFAULT_SEED_ITEMS, DEFAULT_SEED_CUSTOMERS, DEFAULT_SEED_RENTALS };
