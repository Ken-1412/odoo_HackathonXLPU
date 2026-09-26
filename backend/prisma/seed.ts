// ─── AssetFlow Database Seed ────────────────────────────────────────────────
// Seeds system roles, asset categories, demo organization, departments, employees, and available assets.

import { PrismaClient, UserStatus, AssetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const DEFAULT_ASSET_CATEGORIES = [
  { name: 'Laptop', description: 'Laptops, notebooks, and portable workstations', iconName: 'Laptop' },
  { name: 'Desktop', description: 'Desktop computers, towers, and all-in-one workstations', iconName: 'Monitor' },
  { name: 'Monitor', description: 'Displays, external monitors, and presentation screens', iconName: 'Monitor' },
  { name: 'Printer', description: 'Printers, scanners, and multi-function copiers', iconName: 'Printer' },
  { name: 'Projector', description: 'Projectors and audiovisual presentation equipment', iconName: 'Projector' },
  { name: 'Mobile Phone', description: 'Smartphones and mobile communication devices', iconName: 'Smartphone' },
  { name: 'Tablet', description: 'Tablets, iPads, and handheld touch devices', iconName: 'Tablet' },
  { name: 'Server', description: 'Rack servers, blade servers, and datacenter hardware', iconName: 'Server' },
  { name: 'Networking Equipment', description: 'Routers, switches, access points, and network hardware', iconName: 'Network' },
  { name: 'Furniture', description: 'Desks, chairs, conference tables, and office furnishings', iconName: 'Armchair' },
  { name: 'Vehicle', description: 'Company cars, vans, and transport fleet vehicles', iconName: 'Car' },
  { name: 'Other', description: 'Miscellaneous equipment, tools, and accessories', iconName: 'Package' },
];

async function main() {
  console.log('🌱 Seeding AssetFlow system configuration & demo data...\n');

  // ─── 1. System Roles ────────────────────────────────────────────────────────
  console.log('  → Creating system roles...');
  const [adminRole, managerRole, headRole, empRole] = await Promise.all([
    prisma.role.upsert({ where: { name: 'Administrator' }, update: {}, create: { name: 'Administrator' } }),
    prisma.role.upsert({ where: { name: 'Asset Manager' }, update: {}, create: { name: 'Asset Manager' } }),
    prisma.role.upsert({ where: { name: 'Department Head' }, update: {}, create: { name: 'Department Head' } }),
    prisma.role.upsert({ where: { name: 'Employee' }, update: {}, create: { name: 'Employee' } }),
  ]);

  // ─── 2. Default Asset Categories ───────────────────────────────────────────
  console.log('  → Creating default asset categories...');
  const categoriesMap = new Map<string, string>();

  for (const cat of DEFAULT_ASSET_CATEGORIES) {
    let existing = await prisma.assetCategory.findFirst({
      where: { name: { equals: cat.name } },
    });

    if (!existing) {
      existing = await prisma.assetCategory.create({
        data: {
          name: cat.name,
          description: cat.description,
          iconName: cat.iconName,
          status: 'ACTIVE',
        },
      });
      console.log(`    ✓ Created category: ${cat.name}`);
    } else {
      console.log(`    - Category already exists: ${existing.name}`);
    }
    categoriesMap.set(cat.name, existing.id);
  }

  // ─── 3. Demo Organization & Departments ─────────────────────────────────────
  console.log('  → Creating demo organization and departments...');
  let org = await prisma.organization.findFirst({ where: { name: 'Acme Global Solutions' } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Acme Global Solutions',
        slug: 'acme-global',
        industry: 'Technology',
        companySize: '100-500',
        country: 'United States',
        onboardingCompleted: true,
        onboardingStep: 'COMPLETED',
      },
    });
    console.log(`    ✓ Created organization: Acme Global Solutions`);
  }

  const deptNames = ['Engineering', 'Product & Design', 'IT & Operations', 'Sales & Marketing', 'HR & Finance'];
  const deptsMap = new Map<string, string>();
  for (const dName of deptNames) {
    let dept = await prisma.department.findFirst({ where: { name: dName } });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          name: dName,
          description: `${dName} Department`,
          status: 'ACTIVE',
          organizationId: org.id,
        },
      });
      console.log(`    ✓ Created department: ${dName}`);
    }
    deptsMap.set(dName, dept.id);
  }

  // ─── 4. Demo Users ─────────────────────────────────────────────────────────
  console.log('  → Creating demo users...');
  const hashedPasswordAdmin = await bcrypt.hash('Admin@123', 10);
  const hashedPasswordEmp = await bcrypt.hash('Employee@123', 10);

  const usersData = [
    {
      name: 'System Admin',
      email: 'admin@assetflow.com',
      password: hashedPasswordAdmin,
      roleId: adminRole.id,
      departmentId: deptsMap.get('IT & Operations'),
      organizationId: org.id,
      isOrganizationOwner: true,
      employeeId: 'EMP-001',
      designation: 'IT Director',
    },
    {
      name: 'Priya Sharma',
      email: 'priya@systems.core',
      password: hashedPasswordEmp,
      roleId: empRole.id,
      departmentId: deptsMap.get('Engineering'),
      organizationId: org.id,
      employeeId: 'EMP-002',
      designation: 'Senior Software Engineer',
    },
    {
      name: 'Rahul Verma',
      email: 'rahul@engineering.core',
      password: hashedPasswordEmp,
      roleId: empRole.id,
      departmentId: deptsMap.get('Engineering'),
      organizationId: org.id,
      employeeId: 'EMP-003',
      designation: 'Full Stack Developer',
    },
    {
      name: 'Ananya Roy',
      email: 'ananya@design.core',
      password: hashedPasswordEmp,
      roleId: empRole.id,
      departmentId: deptsMap.get('Product & Design'),
      organizationId: org.id,
      employeeId: 'EMP-004',
      designation: 'Lead Product Designer',
    },
  ];

  const userRecordsMap = new Map<string, string>();
  for (const u of usersData) {
    let existingUser = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existingUser) {
      existingUser = await prisma.user.create({ data: u });
      console.log(`    ✓ Created user: ${u.name} (${u.email})`);
    } else {
      console.log(`    - User already exists: ${u.email}`);
    }
    userRecordsMap.set(u.email, existingUser.id);
  }

  // ─── 5. Demo Assets ────────────────────────────────────────────────────────
  console.log('  → Creating demo assets...');

  const sampleAssets = [
    {
      tag: 'AF-1001',
      name: 'MacBook Pro 16" M3 Max',
      type: 'Laptop',
      manufacturer: 'Apple',
      model: 'MacBook Pro 16-inch 2023',
      serialNumber: 'C02G1234MD6R',
      barcode: 'AF1001BC',
      qrCode: 'AF1001QR',
      description: 'High performance M3 Max laptop with 36GB RAM and 1TB SSD',
      status: AssetStatus.AVAILABLE,
      location: 'IT Storage Bay A',
      building: 'Main Building',
      floor: '3rd Floor',
      room: 'Room 302',
      purchaseCost: 3499.00,
      currentValue: 3200.00,
      vendor: 'Apple Store for Enterprise',
      categoryId: categoriesMap.get('Laptop')!,
      departmentId: deptsMap.get('IT & Operations'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1002',
      name: 'Dell XPS 15 Workstation',
      type: 'Laptop',
      manufacturer: 'Dell',
      model: 'XPS 15 9530',
      serialNumber: '9X87Y123',
      barcode: 'AF1002BC',
      qrCode: 'AF1002QR',
      description: 'Core i9, 32GB RAM, RTX 4060 graphics laptop',
      status: AssetStatus.AVAILABLE,
      location: 'IT Storage Bay B',
      building: 'Main Building',
      floor: '3rd Floor',
      room: 'Room 302',
      purchaseCost: 2399.00,
      currentValue: 2100.00,
      vendor: 'Dell Technologies',
      categoryId: categoriesMap.get('Laptop')!,
      departmentId: deptsMap.get('Engineering'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1003',
      name: 'LG UltraFine 27" 4K Monitor',
      type: 'Monitor',
      manufacturer: 'LG',
      model: '27MD5KL-B',
      serialNumber: '304NTBK123',
      barcode: 'AF1003BC',
      qrCode: 'AF1003QR',
      description: '27-inch 5K/4K IPS Display with Thunderbolt 3',
      status: AssetStatus.AVAILABLE,
      location: 'Main Office Floor 2',
      building: 'Main Building',
      floor: '2nd Floor',
      room: 'Room 205',
      purchaseCost: 1299.00,
      currentValue: 1100.00,
      vendor: 'Amazon Business',
      categoryId: categoriesMap.get('Monitor')!,
      departmentId: deptsMap.get('Product & Design'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1004',
      name: 'Herman Miller Aeron Ergonomic Chair',
      type: 'Furniture',
      manufacturer: 'Herman Miller',
      model: 'Aeron Size B',
      serialNumber: 'HM-AERON-882',
      barcode: 'AF1004BC',
      qrCode: 'AF1004QR',
      description: 'Fully adjustable posturefit SL ergonomic executive chair',
      status: AssetStatus.AVAILABLE,
      location: 'Executive Suite 3A',
      building: 'Main Building',
      floor: '3rd Floor',
      room: 'Room 310',
      purchaseCost: 1495.00,
      currentValue: 1350.00,
      vendor: 'Herman Miller Direct',
      categoryId: categoriesMap.get('Furniture')!,
      departmentId: deptsMap.get('HR & Finance'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1005',
      name: 'iPad Pro 12.9" M2 256GB',
      type: 'Tablet',
      manufacturer: 'Apple',
      model: 'iPad Pro 6th Gen',
      serialNumber: 'DMPX99881122',
      barcode: 'AF1005BC',
      qrCode: 'AF1005QR',
      description: 'Liquid Retina XDR display with Apple Pencil 2 support',
      status: AssetStatus.AVAILABLE,
      location: 'Mobile Lab Locker 2',
      building: 'Main Building',
      floor: '2nd Floor',
      room: 'Room 212',
      purchaseCost: 1099.00,
      currentValue: 950.00,
      vendor: 'Apple Store',
      categoryId: categoriesMap.get('Tablet')!,
      departmentId: deptsMap.get('Product & Design'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1006',
      name: 'Cisco Catalyst 9300 48-Port Switch',
      type: 'Networking Equipment',
      manufacturer: 'Cisco',
      model: 'C9300-48P',
      serialNumber: 'FOC2233L0AA',
      barcode: 'AF1006BC',
      qrCode: 'AF1006QR',
      description: '48-port PoE+ enterprise network switch',
      status: AssetStatus.AVAILABLE,
      location: 'Server Room Rack 4',
      building: 'Data Center',
      floor: 'Basement',
      room: 'Room B01',
      purchaseCost: 4500.00,
      currentValue: 4000.00,
      vendor: 'CDW Enterprise',
      categoryId: categoriesMap.get('Networking Equipment')!,
      departmentId: deptsMap.get('IT & Operations'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1007',
      name: 'Canon ImageRUNNER ADVANCE Printer',
      type: 'Printer',
      manufacturer: 'Canon',
      model: 'C3530i III',
      serialNumber: 'CN-IR-99120',
      barcode: 'AF1007BC',
      qrCode: 'AF1007QR',
      description: 'Multi-function color laser printer and scanner station',
      status: AssetStatus.AVAILABLE,
      location: 'Floor 1 Print Station',
      building: 'Main Building',
      floor: '1st Floor',
      room: 'Hallway 1A',
      purchaseCost: 2800.00,
      currentValue: 2400.00,
      vendor: 'Canon Business Solutions',
      categoryId: categoriesMap.get('Printer')!,
      departmentId: deptsMap.get('IT & Operations'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1008',
      name: 'Epson Pro 4K Laser Projector',
      type: 'Projector',
      manufacturer: 'Epson',
      model: 'EB-PU1007W',
      serialNumber: 'EP-PRO-4421',
      barcode: 'AF1008BC',
      qrCode: 'AF1008QR',
      description: '7,000 Lumens 4K Enhancement Laser Projector for Conference Rooms',
      status: AssetStatus.AVAILABLE,
      location: 'Conference Room B',
      building: 'Main Building',
      floor: '2nd Floor',
      room: 'Room 201',
      purchaseCost: 3200.00,
      currentValue: 2900.00,
      vendor: 'B&H Photo Video',
      categoryId: categoriesMap.get('Projector')!,
      departmentId: deptsMap.get('Sales & Marketing'),
      organizationId: org.id,
    },
    {
      tag: 'AF-1009',
      name: 'ThinkPad P1 Gen 6 Mobile Workstation',
      type: 'Laptop',
      manufacturer: 'Lenovo',
      model: 'ThinkPad P1 Gen 6',
      serialNumber: 'TP-P1-90812',
      barcode: 'AF1009BC',
      qrCode: 'AF1009QR',
      description: 'Core i7 13th Gen, 64GB RAM, RTX A2000 workstation laptop',
      status: AssetStatus.AVAILABLE,
      location: 'IT Storage Bay B',
      building: 'Main Building',
      floor: '3rd Floor',
      room: 'Room 302',
      purchaseCost: 2799.00,
      currentValue: 2600.00,
      vendor: 'Lenovo Commercial',
      categoryId: categoriesMap.get('Laptop')!,
      departmentId: deptsMap.get('Engineering'),
      organizationId: org.id,
    },
  ];

  for (const assetData of sampleAssets) {
    const existingAsset = await prisma.asset.findUnique({ where: { tag: assetData.tag } });
    if (!existingAsset) {
      await prisma.asset.create({ data: assetData });
      console.log(`    ✓ Created asset: ${assetData.name} (${assetData.tag})`);
    } else {
      console.log(`    - Asset already exists: ${assetData.tag}`);
    }
  }

  console.log('\n✅ System configuration & demo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
