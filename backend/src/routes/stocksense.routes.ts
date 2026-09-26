import { Router } from 'express';
import { stockSenseAuthController } from '../controllers/stockSenseAuth.controller';
import { productController } from '../controllers/product.controller';
import { categoryController } from '../controllers/category.controller';
import { warehouseController } from '../controllers/warehouse.controller';
import { locationController } from '../controllers/location.controller';
import { inventoryController } from '../controllers/inventory.controller';
import { receiptController } from '../controllers/receipt.controller';
import { deliveryController } from '../controllers/delivery.controller';
import { transferController } from '../controllers/transfer.controller';
import { adjustmentController } from '../controllers/adjustment.controller';
import { moveHistoryController } from '../controllers/moveHistory.controller';
import { dashboardController } from '../controllers/dashboard.controller';
import { alertController } from '../controllers/alert.controller';
import { omniDimController } from '../controllers/omnidim.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// ─── Health Check ───────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'StockSense Enterprise API is running',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
    voiceAI: 'OmniDimension Integrated',
  });
});

// ─── Authentication & OTP (EmailJS) ─────────────────────────────────────────
router.post('/auth/register', (req, res, next) => stockSenseAuthController.register(req, res, next));
router.post('/auth/login', (req, res, next) => stockSenseAuthController.login(req, res, next));
router.post('/auth/logout', (req, res) => stockSenseAuthController.logout(req, res));
router.get('/auth/me', authenticate, (req, res, next) => stockSenseAuthController.me(req, res, next));
router.post('/auth/forgot-password', (req, res, next) => stockSenseAuthController.forgotPassword(req, res, next));
router.post('/auth/verify-otp', (req, res, next) => stockSenseAuthController.verifyOtp(req, res, next));
router.post('/auth/reset-password', (req, res, next) => stockSenseAuthController.resetPassword(req, res, next));

// ─── User Profile ───────────────────────────────────────────────────────────
router.get('/profile', authenticate, (req, res, next) => stockSenseAuthController.getProfile(req, res, next));
router.put('/profile', authenticate, (req, res, next) => stockSenseAuthController.updateProfile(req, res, next));

// ─── Products ───────────────────────────────────────────────────────────────
router.get('/products', (req, res, next) => productController.getProducts(req, res, next));
router.post('/products', (req, res, next) => productController.createProduct(req, res, next));
router.get('/products/:id', (req, res, next) => productController.getProductById(req, res, next));
router.put('/products/:id', (req, res, next) => productController.updateProduct(req, res, next));
router.delete('/products/:id', (req, res, next) => productController.deleteProduct(req, res, next));

// ─── Categories ─────────────────────────────────────────────────────────────
router.get('/categories', (req, res, next) => categoryController.getCategories(req, res, next));
router.post('/categories', (req, res, next) => categoryController.createCategory(req, res, next));
router.put('/categories/:id', (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete('/categories/:id', (req, res, next) => categoryController.deleteCategory(req, res, next));

// ─── Warehouses ─────────────────────────────────────────────────────────────
router.get('/warehouses', (req, res, next) => warehouseController.getWarehouses(req, res, next));
router.post('/warehouses', (req, res, next) => warehouseController.createWarehouse(req, res, next));
router.get('/warehouses/:id', (req, res, next) => warehouseController.getWarehouseById(req, res, next));
router.put('/warehouses/:id', (req, res, next) => warehouseController.updateWarehouse(req, res, next));
router.delete('/warehouses/:id', (req, res, next) => warehouseController.deleteWarehouse(req, res, next));

// ─── Locations ──────────────────────────────────────────────────────────────
router.get('/locations', (req, res, next) => locationController.getLocations(req, res, next));
router.post('/locations', (req, res, next) => locationController.createLocation(req, res, next));
router.get('/locations/:id', (req, res, next) => locationController.getLocationById(req, res, next));
router.put('/locations/:id', (req, res, next) => locationController.updateLocation(req, res, next));
router.delete('/locations/:id', (req, res, next) => locationController.deleteLocation(req, res, next));

// ─── Location-Aware Inventory & Reorder Rules ───────────────────────────────
router.get('/inventory', (req, res, next) => inventoryController.getInventory(req, res, next));
router.get('/inventory/low-stock', (req, res, next) => inventoryController.getLowStock(req, res, next));
router.get('/inventory/out-of-stock', (req, res, next) => inventoryController.getOutOfStock(req, res, next));
router.get('/inventory/product/:id', (req, res, next) => inventoryController.getProductStock(req, res, next));

// ─── Receipts ───────────────────────────────────────────────────────────────
router.get('/receipts', (req, res, next) => receiptController.getReceipts(req, res, next));
router.post('/receipts', (req, res, next) => receiptController.createReceipt(req, res, next));
router.get('/receipts/:id', (req, res, next) => receiptController.getReceiptById(req, res, next));
router.post('/receipts/:id/validate', (req, res, next) => receiptController.validateReceipt(req, res, next));
router.post('/receipts/:id/cancel', (req, res, next) => receiptController.cancelReceipt(req, res, next));

// ─── Deliveries ─────────────────────────────────────────────────────────────
router.get('/deliveries', (req, res, next) => deliveryController.getDeliveries(req, res, next));
router.post('/deliveries', (req, res, next) => deliveryController.createDelivery(req, res, next));
router.get('/deliveries/:id', (req, res, next) => deliveryController.getDeliveryById(req, res, next));
router.post('/deliveries/:id/pick', (req, res, next) => deliveryController.pickDelivery(req, res, next));
router.post('/deliveries/:id/pack', (req, res, next) => deliveryController.packDelivery(req, res, next));
router.post('/deliveries/:id/validate', (req, res, next) => deliveryController.validateDelivery(req, res, next));
router.post('/deliveries/:id/cancel', (req, res, next) => deliveryController.cancelDelivery(req, res, next));

// ─── Internal Transfers ─────────────────────────────────────────────────────
router.get('/transfers', (req, res, next) => transferController.getTransfers(req, res, next));
router.post('/transfers', (req, res, next) => transferController.createTransfer(req, res, next));
router.get('/transfers/:id', (req, res, next) => transferController.getTransferById(req, res, next));
router.post('/transfers/:id/validate', (req, res, next) => transferController.validateTransfer(req, res, next));
router.post('/transfers/:id/cancel', (req, res, next) => transferController.cancelTransfer(req, res, next));

// ─── Inventory Adjustments ──────────────────────────────────────────────────
router.get('/adjustments', (req, res, next) => adjustmentController.getAdjustments(req, res, next));
router.post('/adjustments', (req, res, next) => adjustmentController.createAdjustment(req, res, next));
router.get('/adjustments/:id', (req, res, next) => adjustmentController.getAdjustmentById(req, res, next));
router.post('/adjustments/:id/validate', (req, res, next) => adjustmentController.validateAdjustment(req, res, next));
router.post('/adjustments/:id/cancel', (req, res, next) => adjustmentController.cancelAdjustment(req, res, next));

// ─── Move History / Stock Ledger ────────────────────────────────────────────
router.get('/move-history', (req, res, next) => moveHistoryController.getMoveHistory(req, res, next));

// ─── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', (req, res, next) => dashboardController.getDashboard(req, res, next));

// ─── Alerts & Notifications ─────────────────────────────────────────────────
router.get('/alerts', (req, res, next) => alertController.getAlerts(req, res, next));
router.put('/alerts/read-all', (req, res, next) => alertController.markAllAsRead(req, res, next));
router.put('/alerts/:id/read', (req, res, next) => alertController.markAsRead(req, res, next));

// ─── OmniDimension Voice Agent Management & Sessions ────────────────────────
router.get('/omnidim/health', (req, res) => omniDimController.getHealth(req, res));
router.post('/omnidim/session', (req, res, next) => omniDimController.createSession(req, res, next));
router.get('/omnidim/agent', (req, res, next) => omniDimController.getAgent(req, res, next));
router.put('/omnidim/agent', (req, res, next) => omniDimController.updateAgent(req, res, next));
router.get('/omnidim/calls', (req, res, next) => omniDimController.getCalls(req, res, next));
router.get('/omnidim/calls/:id', (req, res, next) => omniDimController.getCallDetails(req, res, next));
router.post('/omnidim/calls/dispatch', (req, res, next) => omniDimController.dispatchCall(req, res, next));

// ─── OmniDimension Telephony & Phone Numbers ────────────────────────────────
router.get('/omnidim/phone-numbers', (req, res, next) => omniDimController.getPhoneNumbers(req, res, next));

// ─── OmniDimension Knowledge Base & SOP Documentation ───────────────────────
router.get('/omnidim/knowledge-base', (req, res, next) => omniDimController.getKnowledgeBase(req, res, next));
router.post('/omnidim/knowledge-base', (req, res, next) => omniDimController.uploadKnowledgeBase(req, res, next));
router.post('/omnidim/knowledge-base/:id/attach', (req, res, next) => omniDimController.attachKnowledgeBase(req, res, next));
router.post('/omnidim/knowledge-base/:id/detach', (req, res, next) => omniDimController.detachKnowledgeBase(req, res, next));

// ─── OmniDimension Agent Simulations & Testing ──────────────────────────────
router.post('/omnidim/simulations/run', (req, res, next) => omniDimController.runSimulation(req, res, next));

// ─── OmniDimension Custom API Tools (Token Protected + Write Confirmation) ──
router.get('/omnidim/tools/stock', (req, res) => omniDimController.toolStock(req, res));
router.get('/omnidim/tools/low-stock', (req, res) => omniDimController.toolLowStock(req, res));
router.get('/omnidim/tools/dashboard', (req, res) => omniDimController.toolDashboard(req, res));
router.post('/omnidim/tools/receipt', (req, res) => omniDimController.toolReceipt(req, res));
router.post('/omnidim/tools/delivery', (req, res) => omniDimController.toolDelivery(req, res));
router.post('/omnidim/tools/transfer', (req, res) => omniDimController.toolTransfer(req, res));
router.post('/omnidim/tools/adjustment', (req, res) => omniDimController.toolAdjustment(req, res));
router.get('/omnidim/tools/move-history', (req, res) => omniDimController.toolMoveHistory(req, res));

// ─── OmniDimension Webhook ──────────────────────────────────────────────────
router.post('/webhooks/omnidim', (req, res) => omniDimController.handleWebhook(req, res));

export default router;
