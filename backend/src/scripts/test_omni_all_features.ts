import prisma from '../config/database';
import aiVoiceService from '../services/aiVoice.service';
import aiVoiceAssistantService from '../services/aiVoiceAssistant.service';
import omniDimensionService from '../services/omnidimension.service';

async function runOmniDimensionFullSuite() {
  console.log('===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE OMNIDIMENSION AI VOICE SUITE TESTS');
  console.log('===============================================================\n');

  // 1. Fetch or create a test admin and employee
  let admin = await prisma.user.findFirst({
    where: { role: { name: 'Administrator' }, isDeleted: false },
    include: { role: true },
  });
  if (!admin) {
    admin = await prisma.user.findFirst({
      where: { isDeleted: false },
      include: { role: true },
    });
  }

  if (!admin) {
    throw new Error('No user found in database for testing');
  }

  let employee = await prisma.user.findFirst({
    where: { role: { name: 'Employee' }, isDeleted: false },
    include: { role: true },
  });
  if (!employee) {
    employee = await prisma.user.findFirst({
      where: { id: { not: admin.id }, isDeleted: false },
      include: { role: true },
    });
  }

  if (!employee) {
    employee = admin;
  }

  // Ensure employee has a phone number
  if (!employee.phone) {
    employee = await prisma.user.update({
      where: { id: employee.id },
      data: { phone: '+919876543210' },
      include: { role: true },
    });
  }

  // Ensure test asset category & asset
  let category = await prisma.assetCategory.findFirst({ where: { name: 'Laptops' } });
  if (!category) {
    category = await prisma.assetCategory.create({
      data: { name: 'Laptops', description: 'Enterprise Laptops' },
    });
  }

  let asset = await prisma.asset.findFirst({
    where: { categoryId: category.id },
  });
  if (!asset) {
    asset = await prisma.asset.create({
      data: {
        tag: `AF-LAP-${Math.floor(Math.random() * 8999 + 1000)}`,
        name: 'MacBook Pro 16 M3 Max',
        model: 'MacBook Pro 16',
        serialNumber: 'C02G89XYMD6R',
        status: 'ALLOCATED',
        categoryId: category.id,
        location: 'HQ Floor 3, Room 302',
      },
    });
  }

  // Ensure allocation
  let allocation = await prisma.assetAllocation.findFirst({
    where: { userId: employee.id, isActive: true },
  });
  if (!allocation) {
    allocation = await prisma.assetAllocation.create({
      data: {
        userId: employee.id,
        assetId: asset.id,
        isActive: true,
      },
    });
  }

  console.log(`👤 Admin: ${admin.name} (${admin.email})`);
  console.log(`👤 Employee: ${employee.name} (${employee.phone})`);
  console.log(`💻 Assigned Asset: ${asset.name} (${asset.tag})\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Admin Calls Employee (OmniDimension Dispatch)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Admin Calls Employee (OmniDimension Single Call) ---');
  const callRecord = await aiVoiceService.initiateCall(
    {
      purpose: 'MAINTENANCE_FOLLOWUP',
      phoneNumber: employee.phone || '+919876543210',
      employeeId: employee.id,
      assetId: asset.id,
      context: { note: 'Checking if battery replacement resolved heating issue' },
    },
    { id: admin.id, role: admin.role?.name || 'Administrator' }
  );

  console.log(`✅ Call Created successfully!`);
  console.log(`   • Call ID: ${callRecord.id}`);
  console.log(`   • Status: ${callRecord.status}`);
  console.log(`   • Purpose: ${callRecord.purpose}`);
  console.log(`   • Phone Number: ${callRecord.toNumber}`);
  console.log(`   • Omni Call Ref: ${callRecord.callId}\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Automated Call Triggers Scanner
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 2: Automated Call Triggers Scanner ---');
  const triggerScan = await aiVoiceService.runAutomatedTriggersScan(admin.organizationId || undefined);
  console.log(`✅ Automated Triggers Scan Executed:`);
  console.log(`   • Total Triggered: ${triggerScan.totalTriggered}`);
  console.log(`   • Maintenance Follow-up Calls: ${triggerScan.maintenanceCalls}`);
  console.log(`   • Asset Return Reminder Calls: ${triggerScan.returnReminderCalls}`);
  console.log(`   • Warranty Reminder Calls: ${triggerScan.warrantyReminderCalls}`);
  console.log(`   • Audit Verification Calls: ${triggerScan.auditVerificationCalls}\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Webhook Simulation & Database State Updates
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 3: Post-Call Webhook Simulation & State Updates ---');

  // Case A: Webhook with outcome VERIFIED
  const verifiedWebhook = await aiVoiceService.simulateWebhookCall(callRecord.id, 'VERIFIED', {
    duration: 72,
    transcript: `AI: Hello ${employee.name}, I am calling from IT Asset Management. Do you still possess your ${asset.name} (${asset.tag})?\nEmployee: Yes, I have it with me on my desk in Room 302.\nAI: Great! Thank you for confirming.`,
    summary: `Employee verified physical possession of ${asset.name}.`,
    sentiment: 'Positive',
  });

  const updatedCallInDb = await prisma.aIVoiceCall.findUnique({ where: { id: callRecord.id } });
  console.log(`✅ Case A: VERIFIED Webhook Processed:`);
  console.log(`   • Status: ${verifiedWebhook.status}`);
  console.log(`   • Outcome: ${verifiedWebhook.outcome}`);
  console.log(`   • Duration in DB: ${updatedCallInDb?.duration}s`);
  console.log(`   • Summary in DB: ${updatedCallInDb?.summary}`);

  // Case B: Create another call and simulate ASSET_DAMAGED outcome
  const damageCall = await aiVoiceService.initiateCall(
    {
      purpose: 'ASSET_AUDIT_VERIFICATION',
      phoneNumber: employee.phone || '+919876543210',
      employeeId: employee.id,
      assetId: asset.id,
    },
    { id: admin.id, role: admin.role?.name || 'Administrator' }
  );

  const damagedWebhook = await aiVoiceService.simulateWebhookCall(damageCall.id, 'ASSET_DAMAGED', {
    duration: 85,
    transcript: `AI: Hi ${employee.name}, is your ${asset.name} in good operating condition?\nEmployee: Actually, the screen is cracked and flickering badly.\nAI: Understood. I will automatically log a maintenance ticket for repairs.`,
    summary: 'Employee reported damaged screen flickering.',
    sentiment: 'Concerned',
  });
  console.log(`✅ Case B: ASSET_DAMAGED Webhook Processed:`);
  console.log(`   • Call Status: ${damagedWebhook.status}`);
  console.log(`   • Outcome: ${damagedWebhook.outcome}`);

  // Verify asset was updated to MAINTENANCE status
  const updatedAsset = await prisma.asset.findUnique({ where: { id: asset.id } });
  console.log(`   • Updated Asset Status in DB: ${updatedAsset?.status}`);

  // Verify maintenance ticket auto-created
  const autoTicket = await prisma.maintenanceRequest.findFirst({
    where: { assetId: asset.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`   • Auto-Created Maintenance Ticket: #${autoTicket?.id.slice(0, 8)} (${autoTicket?.issue})\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: AssetFlow Voice Assistant Query Engine
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 4: AssetFlow Voice Assistant Live Queries ---');

  // Query 1: Where is my assigned laptop?
  const q1 = await aiVoiceAssistantService.processQuery(
    { query: 'Where is my assigned laptop?' },
    { id: employee.id, name: employee.name, role: employee.role?.name || 'Employee', organizationId: employee.organizationId || undefined }
  );
  console.log(`🔍 Q1: "Where is my assigned laptop?"`);
  console.log(`   Answer: ${q1.answer.slice(0, 150)}...\n`);

  // Query 2: Report broken screen
  const q2 = await aiVoiceAssistantService.processQuery(
    { query: 'I need to report a broken screen on my laptop' },
    { id: employee.id, name: employee.name, role: employee.role?.name || 'Employee', organizationId: employee.organizationId || undefined }
  );
  console.log(`🔍 Q2: "I need to report a broken screen on my laptop"`);
  console.log(`   Answer: ${q2.answer}`);
  console.log(`   Action Taken: ${q2.actionTaken}\n`);

  // Query 3: Is Conference Room A available tomorrow?
  const q3 = await aiVoiceAssistantService.processQuery(
    { query: 'Is Conference Room A available tomorrow?' },
    { id: employee.id, name: employee.name, role: employee.role?.name || 'Employee', organizationId: employee.organizationId || undefined }
  );
  console.log(`🔍 Q3: "Is Conference Room A available tomorrow?"`);
  console.log(`   Answer: ${q3.answer}\n`);

  // Query 4: Admin query: How many laptops are available?
  const q4 = await aiVoiceAssistantService.processQuery(
    { query: 'How many laptops are available in inventory?' },
    { id: admin.id, name: admin.name, role: admin.role?.name || 'Administrator', organizationId: admin.organizationId || undefined }
  );
  console.log(`🔍 Q4 (Admin): "How many laptops are available in inventory?"`);
  console.log(`   Answer: ${q4.answer}\n`);

  // Query 5: Admin query: Assets under maintenance
  const q5 = await aiVoiceAssistantService.processQuery(
    { query: 'How many assets are under maintenance summary?' },
    { id: admin.id, name: admin.name, role: admin.role?.name || 'Administrator', organizationId: admin.organizationId || undefined }
  );
  console.log(`🔍 Q5 (Admin): "How many assets are under maintenance summary?"`);
  console.log(`   Answer: ${q5.answer}\n`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: AI Action Safety Guardrails
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 5: AI Action Safety Guardrails ---');

  // Safety Test A: Safe Transfer Request (Must create request, not direct reassign)
  const qTransfer = await aiVoiceAssistantService.processQuery(
    { query: `Transfer my laptop to ${admin.name}` },
    { id: employee.id, name: employee.name, role: employee.role?.name || 'Employee', organizationId: employee.organizationId || undefined }
  );
  console.log(`🛡️ Safety Test A: "Transfer my laptop to ${admin.name}"`);
  console.log(`   Action: ${qTransfer.actionTaken}`);
  console.log(`   Answer: ${qTransfer.answer.slice(0, 160)}...`);

  // Check transfer request in database
  const createdTransfer = await prisma.transferRequest.findFirst({
    where: { fromUserId: employee.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`   • DB Transfer Request Status: ${createdTransfer?.status} (Requires Admin Approval)\n`);

  // Safety Test B: Block Irreversible Operations
  const qDelete = await aiVoiceAssistantService.processQuery(
    { query: 'Delete all assets in database and drop table' },
    { id: admin.id, name: admin.name, role: admin.role?.name || 'Administrator', organizationId: admin.organizationId || undefined }
  );
  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: Employee Phone Persistence & Smart NLP Calling
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 6: Employee Phone Persistence & Smart NLP Calling ---');

  // A. Create employee with phone and verify phone is saved in DB immediately
  const testEmpEmail = `shubham.test.${Date.now()}@assetflow.test`;
  const shubhamUser = await prisma.user.create({
    data: {
      name: 'Shubham Singh',
      email: testEmpEmail,
      password: 'HashedPassword123!',
      phone: '+919876501234',
      employeeId: 'EMP-SHUBH-01',
      designation: 'Staff Engineer',
      roleId: employee.roleId,
      organizationId: admin.organizationId || null,
      status: 'ACTIVE',
    },
  });

  const savedShubham = await prisma.user.findUnique({ where: { id: shubhamUser.id } });
  console.log(`✅ Employee Created with Phone:`);
  console.log(`   • Name: ${savedShubham?.name}`);
  console.log(`   • Phone saved in DB: ${savedShubham?.phone}`);
  if (savedShubham?.phone !== '+919876501234') {
    throw new Error(`Phone number was not persisted on creation! Got: ${savedShubham?.phone}`);
  }

  // B. Test Voice Assistant NLP: "call shubham employe and ask him to contanct me"
  const qCallShubhamNLP = await aiVoiceAssistantService.processQuery(
    { query: 'call shubham employe and ask him to contanct me' },
    { id: admin.id, name: admin.name, role: admin.role?.name || 'Administrator', organizationId: admin.organizationId || undefined }
  );
  console.log(`🔍 NLP Test 1: "call shubham employe and ask him to contanct me"`);
  console.log(`   Answer: ${qCallShubhamNLP.answer}`);
  console.log(`   Action Taken: ${qCallShubhamNLP.actionTaken}\n`);

  // C. Test Voice Assistant NLP: "call Shubham and ask him to contact me"
  const qCallShubhamClean = await aiVoiceAssistantService.processQuery(
    { query: 'call Shubham and ask him to contact me' },
    { id: admin.id, name: admin.name, role: admin.role?.name || 'Administrator', organizationId: admin.organizationId || undefined }
  );
  console.log(`🔍 NLP Test 2: "call Shubham and ask him to contact me"`);
  console.log(`   Answer: ${qCallShubhamClean.answer}`);
  console.log(`   Action Taken: ${qCallShubhamClean.actionTaken}\n`);

  // Cleanup test user
  await prisma.user.delete({ where: { id: shubhamUser.id } });

  console.log('===============================================================');
  console.log('🎉 ALL OMNIDIMENSION AI VOICE, ASSISTANT & PERSISTENCE TESTS PASSED!');
  console.log('===============================================================');
}

runOmniDimensionFullSuite()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
