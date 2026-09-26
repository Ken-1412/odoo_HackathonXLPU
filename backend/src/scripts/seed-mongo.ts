import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import {
  User,
  Category,
  Warehouse,
  Location,
  Product,
  Inventory,
  StockLedger,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  Alert,
  OmniDimAgentConfig,
  OmniDimCallLog,
} from '../models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stocksense';

async function seed() {
  console.log('🌱 Starting StockSense MongoDB Seeding...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing collections if desired
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Warehouse.deleteMany({}),
    Location.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    StockLedger.deleteMany({}),
    Receipt.deleteMany({}),
    Delivery.deleteMany({}),
    Transfer.deleteMany({}),
    Adjustment.deleteMany({}),
    Alert.deleteMany({}),
    OmniDimAgentConfig.deleteMany({}),
    OmniDimCallLog.deleteMany({}),
  ]);
  console.log('🧹 Cleaned existing database collections');

  // 1. Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const admin = await User.create({
    name: 'Marcus Vance',
    email: 'admin@stocksense.io',
    passwordHash,
    role: 'ADMIN',
    phone: '+1-555-0199',
    isActive: true,
  });

  const manager = await User.create({
    name: 'Sarah Connor',
    email: 'marcus.vance@stocksense.io',
    passwordHash,
    role: 'INVENTORY_MANAGER',
    phone: '+1-555-0188',
    isActive: true,
  });

  await User.create({
    name: 'Dave Bowman',
    email: 'staff@stocksense.io',
    passwordHash,
    role: 'WAREHOUSE_STAFF',
    phone: '+1-555-0177',
    isActive: true,
  });

  console.log('✅ Created default users (admin@stocksense.io, marcus.vance@stocksense.io, staff@stocksense.io)');

  // 2. Warehouses
  const wh1 = await Warehouse.create({
    name: 'Main Store',
    shortCode: 'WH-01',
    address: 'Bay 4, Industrial Logistics Corridor, Sector 9',
    manager: 'Marcus Vance',
    active: true,
  });

  const wh2 = await Warehouse.create({
    name: 'Production Floor',
    shortCode: 'WH-02',
    address: 'Fabrication Plant West, Assembly Line 3',
    manager: 'Sarah Connor',
    active: true,
  });

  const wh3 = await Warehouse.create({
    name: 'Regional Depot',
    shortCode: 'WH-03',
    address: 'East Coast Transit Hub, Dock 14',
    manager: 'Dave Bowman',
    active: true,
  });

  console.log('✅ Created warehouses (WH-01, WH-02, WH-03)');

  // 3. Locations
  const loc1 = await Location.create({
    name: 'Main Rack',
    shortCode: 'WH01-MR',
    warehouseId: wh1._id,
    zone: 'Zone A',
    rack: 'Rack 01',
    bin: 'Bin 01',
  });

  const loc2 = await Location.create({
    name: 'Rack A',
    shortCode: 'WH01-RA',
    warehouseId: wh1._id,
    zone: 'Zone A',
    rack: 'Rack 02',
    bin: 'Bin 04',
  });

  const loc3 = await Location.create({
    name: 'Production Floor Rack',
    shortCode: 'WH02-PFR',
    warehouseId: wh2._id,
    zone: 'Zone B',
    rack: 'Rack P1',
    bin: 'Bin 10',
  });

  const loc4 = await Location.create({
    name: 'Rack B',
    shortCode: 'WH02-RB',
    warehouseId: wh2._id,
    zone: 'Zone B',
    rack: 'Rack 03',
    bin: 'Bin 02',
  });

  console.log('✅ Created locations');

  // 4. Categories
  const catMetals = await Category.create({ name: 'Metals & Raw Materials', code: 'MET', description: 'Raw metals, rods, ingots' });
  const catElectronics = await Category.create({ name: 'Electronics', code: 'ELE', description: 'Circuits, microcontrollers, sensors' });
  const catPackaging = await Category.create({ name: 'Packaging', code: 'PKG', description: 'Pallet boxes, cartons, bubble wraps' });

  // 5. Products
  const pSteel = await Product.create({
    name: 'Steel Rods',
    sku: 'STL-001',
    category: catMetals.name,
    categoryId: catMetals._id,
    unitOfMeasure: 'KG',
    reorderLevel: 25,
    preferredReorderQuantity: 100,
    costPerUnit: 14.5,
    initialStock: 150,
    description: 'High-tensile hardened structural carbon steel rods 12mm',
    active: true,
  });

  const pAluminum = await Product.create({
    name: 'Aluminum Sheets',
    sku: 'ALM-002',
    category: catMetals.name,
    categoryId: catMetals._id,
    unitOfMeasure: 'KG',
    reorderLevel: 20,
    preferredReorderQuantity: 60,
    costPerUnit: 22.0,
    initialStock: 65,
    description: 'Aircraft-grade anodized aluminum alloy sheets 2mm',
    active: true,
  });

  const pMcu = await Product.create({
    name: 'Microcontrollers',
    sku: 'MCU-003',
    category: catElectronics.name,
    categoryId: catElectronics._id,
    unitOfMeasure: 'PCS',
    reorderLevel: 50,
    preferredReorderQuantity: 200,
    costPerUnit: 8.75,
    initialStock: 420,
    description: '32-bit ARM Cortex M4 embedded industrial control chip',
    active: true,
  });

  const pBox = await Product.create({
    name: 'Heavy Duty Pallet Box',
    sku: 'BOX-004',
    category: catPackaging.name,
    categoryId: catPackaging._id,
    unitOfMeasure: 'BOX',
    reorderLevel: 15,
    preferredReorderQuantity: 50,
    costPerUnit: 12.0,
    initialStock: 80,
    description: 'Triple-wall corrugated export storage box',
    active: true,
  });

  const pSensor = await Product.create({
    name: 'Industrial Sensor',
    sku: 'SNR-005',
    category: catElectronics.name,
    categoryId: catElectronics._id,
    unitOfMeasure: 'PCS',
    reorderLevel: 10,
    preferredReorderQuantity: 25,
    costPerUnit: 45.0,
    initialStock: 5, // Low stock on purpose
    description: 'High-precision photoelectric proximity sensor',
    active: true,
  });

  console.log('✅ Created products');

  // 6. Inventories
  await Inventory.create([
    {
      productId: pSteel._id,
      warehouseId: wh1._id,
      locationId: loc1._id,
      onHandQuantity: 100,
      reservedQuantity: 0,
      freeToUseQuantity: 100,
      reorderLevel: 25,
    },
    {
      productId: pSteel._id,
      warehouseId: wh2._id,
      locationId: loc3._id,
      onHandQuantity: 50,
      reservedQuantity: 0,
      freeToUseQuantity: 50,
      reorderLevel: 25,
    },
    {
      productId: pAluminum._id,
      warehouseId: wh1._id,
      locationId: loc2._id,
      onHandQuantity: 65,
      reservedQuantity: 5,
      freeToUseQuantity: 60,
      reorderLevel: 20,
    },
    {
      productId: pMcu._id,
      warehouseId: wh1._id,
      locationId: loc1._id,
      onHandQuantity: 420,
      reservedQuantity: 20,
      freeToUseQuantity: 400,
      reorderLevel: 50,
    },
    {
      productId: pBox._id,
      warehouseId: wh1._id,
      locationId: loc2._id,
      onHandQuantity: 80,
      reservedQuantity: 0,
      freeToUseQuantity: 80,
      reorderLevel: 15,
    },
    {
      productId: pSensor._id,
      warehouseId: wh1._id,
      locationId: loc1._id,
      onHandQuantity: 5,
      reservedQuantity: 0,
      freeToUseQuantity: 5,
      reorderLevel: 10,
    },
  ]);
  console.log('✅ Seeded location-aware inventories');

  // 7. Initial Ledger Entries
  await StockLedger.create([
    {
      productId: pSteel._id,
      productName: pSteel.name,
      sku: pSteel.sku,
      warehouseId: wh1._id,
      locationId: loc1._id,
      movementType: 'RECEIPT',
      quantity: 100,
      quantityBefore: 0,
      quantityAfter: 100,
      referenceType: 'RECEIPT',
      referenceId: 'RCP-001',
      performedBy: 'Marcus Vance',
      source: 'MANUAL',
      reason: 'Initial Bulk Stock Procurement',
    },
    {
      productId: pSteel._id,
      productName: pSteel.name,
      sku: pSteel.sku,
      warehouseId: wh2._id,
      locationId: loc3._id,
      movementType: 'INTERNAL_TRANSFER',
      quantity: 50,
      quantityBefore: 0,
      quantityAfter: 50,
      fromWarehouseId: wh1._id,
      fromLocationId: loc1._id,
      fromLocationName: 'Main Rack',
      toWarehouseId: wh2._id,
      toLocationId: loc3._id,
      toLocationName: 'Production Floor Rack',
      referenceType: 'INTERNAL_TRANSFER',
      referenceId: 'TRF-001',
      performedBy: 'Sarah Connor',
      source: 'MANUAL',
      reason: 'Shift allocation for fabrication plant',
    },
    {
      productId: pMcu._id,
      productName: pMcu.name,
      sku: pMcu.sku,
      warehouseId: wh1._id,
      locationId: loc1._id,
      movementType: 'RECEIPT',
      quantity: 420,
      quantityBefore: 0,
      quantityAfter: 420,
      referenceType: 'RECEIPT',
      referenceId: 'RCP-002',
      performedBy: 'Marcus Vance',
      source: 'MANUAL',
      reason: 'Supplier Intake Batch A-4',
    },
  ]);

  // 8. Sample Receipts, Deliveries, Transfers, Adjustments
  await Receipt.create({
    reference: 'WH/IN/0001',
    supplier: 'ABC Steelworks Corp',
    warehouseId: wh1._id,
    locationId: loc1._id,
    status: 'DONE',
    lines: [
      {
        productId: pSteel._id,
        productName: pSteel.name,
        sku: pSteel.sku,
        quantity: 100,
        receivedQuantity: 100,
        unitOfMeasure: 'KG',
      },
    ],
    responsibleName: 'Marcus Vance',
    source: 'MANUAL',
    validatedAt: new Date(),
  });

  await Receipt.create({
    reference: 'WH/IN/0002',
    supplier: 'Apex Silicon Tech',
    warehouseId: wh1._id,
    locationId: loc1._id,
    status: 'READY',
    lines: [
      {
        productId: pMcu._id,
        productName: pMcu.name,
        sku: pMcu.sku,
        quantity: 200,
        receivedQuantity: 0,
        unitOfMeasure: 'PCS',
      },
    ],
    responsibleName: 'Dave Bowman',
    source: 'MANUAL',
  });

  await Delivery.create({
    reference: 'WH/OUT/0001',
    customer: 'Tesla Gigafactory 4',
    deliveryAddress: 'Assembly Gate 3, Fremont CA',
    warehouseId: wh1._id,
    locationId: loc1._id,
    status: 'READY',
    stage: 'PICKING',
    lines: [
      {
        productId: pSteel._id,
        productName: pSteel.name,
        sku: pSteel.sku,
        quantity: 20,
        unitOfMeasure: 'KG',
      },
    ],
    responsibleName: 'Marcus Vance',
    source: 'MANUAL',
  });

  await Transfer.create({
    reference: 'WH/INT/0001',
    fromWarehouseId: wh1._id,
    fromLocationId: loc1._id,
    toWarehouseId: wh2._id,
    toLocationId: loc3._id,
    lines: [
      {
        productId: pSteel._id,
        productName: pSteel.name,
        sku: pSteel.sku,
        quantity: 30,
        unitOfMeasure: 'KG',
      },
    ],
    status: 'DONE',
    responsibleName: 'Sarah Connor',
    source: 'MANUAL',
    validatedAt: new Date(),
  });

  await Adjustment.create({
    reference: 'WH/ADJ/0001',
    productId: pSensor._id,
    productName: pSensor.name,
    sku: pSensor.sku,
    warehouseId: wh1._id,
    locationId: loc1._id,
    systemQuantity: 8,
    countedQuantity: 5,
    difference: -3,
    reason: 'Damaged in transit audit',
    status: 'DONE',
    responsibleName: 'Dave Bowman',
    source: 'MANUAL',
    validatedAt: new Date(),
  });

  // 9. Alert for sensor
  await Alert.create({
    type: 'LOW_STOCK',
    title: `Low Stock Alert: ${pSensor.name}`,
    message: `${pSensor.name} (SKU: ${pSensor.sku}) has 5 PCS on hand, below the threshold of 10 PCS.`,
    productId: pSensor._id,
    productName: pSensor.name,
    sku: pSensor.sku,
    severity: 'warning',
    isRead: false,
  });

  // 10. OmniDimension Config & Sample Call Log
  await OmniDimAgentConfig.create({
    agentId: '241840',
    name: 'StockSense Voice Assistant',
    status: 'active',
    primaryLanguage: 'en-US',
    toolToken: 'stocksense-omnidim-tool-secret-token-2026',
    webhookUrl: 'http://localhost:5000/api/webhooks/omnidim',
  });

  await OmniDimCallLog.create({
    externalCallId: 'call_demo_001',
    agentId: '241840',
    userName: 'Marcus Vance',
    startedAt: new Date(Date.now() - 3600000),
    endedAt: new Date(Date.now() - 3500000),
    duration: 100,
    status: 'completed',
    transcript: 'User: What is the stock of Steel Rods? Agent: Current stock for Steel Rods is 150 KG. User: Thank you.',
    summary: 'Queried stock of Steel Rods. Reported 150 KG across Main Store and Production Floor.',
    intent: 'QUERY_STOCK',
    sourceActions: ['QUERY_STOCK'],
  });

  console.log('✅ Seeded OmniDimension configuration and demo call log');
  console.log('🎉 Database seeding complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
