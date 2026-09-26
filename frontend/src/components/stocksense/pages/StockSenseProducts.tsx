import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Package,
  Search,
  Plus,
  Filter,
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';

interface StockSenseProductsProps {
  onOpenQuickAction: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product', prefill?: unknown) => void;
  initialSelectedId?: string | null;
}

interface StockProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  unitCost: number;
  onHand: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  iconType: string;
  locationsBreakdown: { location: string; onHand: number; reserved: number; available: number }[];
  movements: { id: string; type: string; delta: string; date: string }[];
}

export const StockSenseProducts: React.FC<StockSenseProductsProps> = ({
  onOpenQuickAction: _onOpenQuickAction,
  initialSelectedId,
}) => {
  const { createAdjustment } = useStockSense();

  // Primary dataset matching Image 1 & Image 2
  const [productList, setProductList] = useState<StockProductRow[]>([
    {
      id: 'prod-001',
      sku: 'DSK-001',
      name: 'Office Desk',
      category: 'Furniture',
      location: 'A-01-01',
      unitCost: 3000,
      onHand: 50,
      reserved: 5,
      available: 45,
      reorderPoint: 10,
      status: 'In Stock',
      iconType: 'desk',
      locationsBreakdown: [
        { location: 'A-01-01', onHand: 30, reserved: 3, available: 27 },
        { location: 'A-01-02', onHand: 20, reserved: 2, available: 18 },
      ],
      movements: [
        { id: 'RCP-042', type: 'Receipt', delta: '+20', date: 'Today, 10:30 AM' },
        { id: 'TRF-018', type: 'Transfer', delta: '-5', date: 'Yesterday, 03:20 PM' },
        { id: 'DLV-091', type: 'Delivery', delta: '-10', date: '12 Aug 2024, 11:10 AM' },
        { id: 'ADJ-007', type: 'Adjustment', delta: '+3', date: '10 Aug 2024, 09:45 AM' },
      ],
    },
    {
      id: 'prod-002',
      sku: 'CH-002',
      name: 'Office Chair',
      category: 'Furniture',
      location: 'A-01-02',
      unitCost: 2500,
      onHand: 120,
      reserved: 20,
      available: 100,
      reorderPoint: 15,
      status: 'In Stock',
      iconType: 'chair',
      locationsBreakdown: [
        { location: 'A-01-02', onHand: 80, reserved: 15, available: 65 },
        { location: 'A-02-01', onHand: 40, reserved: 5, available: 35 },
      ],
      movements: [
        { id: 'RCP-039', type: 'Receipt', delta: '+50', date: 'Yesterday, 04:00 PM' },
        { id: 'DLV-088', type: 'Delivery', delta: '-15', date: '2 days ago' },
      ],
    },
    {
      id: 'prod-003',
      sku: 'TB-003',
      name: 'Meeting Table',
      category: 'Furniture',
      location: 'A-02-01',
      unitCost: 5000,
      onHand: 8,
      reserved: 2,
      available: 6,
      reorderPoint: 10,
      status: 'Low Stock',
      iconType: 'table',
      locationsBreakdown: [
        { location: 'A-02-01', onHand: 8, reserved: 2, available: 6 },
      ],
      movements: [
        { id: 'DLV-085', type: 'Delivery', delta: '-4', date: 'Yesterday, 11:30 AM' },
      ],
    },
    {
      id: 'prod-004',
      sku: 'LPT-004',
      name: 'Laptop ThinkPad T14',
      category: 'Electronics',
      location: 'B-01-01',
      unitCost: 45000,
      onHand: 25,
      reserved: 5,
      available: 20,
      reorderPoint: 10,
      status: 'In Stock',
      iconType: 'laptop',
      locationsBreakdown: [
        { location: 'B-01-01', onHand: 25, reserved: 5, available: 20 },
      ],
      movements: [
        { id: 'RCP-035', type: 'Receipt', delta: '+10', date: '3 days ago' },
      ],
    },
    {
      id: 'prod-005',
      sku: 'MON-005',
      name: 'Monitor 24" IPS',
      category: 'Electronics',
      location: 'B-01-02',
      unitCost: 12000,
      onHand: 2,
      reserved: 1,
      available: 1,
      reorderPoint: 5,
      status: 'Out of Stock',
      iconType: 'monitor',
      locationsBreakdown: [
        { location: 'B-01-02', onHand: 2, reserved: 1, available: 1 },
      ],
      movements: [
        { id: 'DLV-082', type: 'Delivery', delta: '-8', date: 'Yesterday, 02:15 PM' },
      ],
    },
    {
      id: 'prod-006',
      sku: 'KB-006',
      name: 'Mechanical Keyboard',
      category: 'Accessories',
      location: 'B-02-01',
      unitCost: 1200,
      onHand: 200,
      reserved: 50,
      available: 150,
      reorderPoint: 30,
      status: 'In Stock',
      iconType: 'keyboard',
      locationsBreakdown: [
        { location: 'B-02-01', onHand: 200, reserved: 50, available: 150 },
      ],
      movements: [
        { id: 'RCP-031', type: 'Receipt', delta: '+100', date: '4 days ago' },
      ],
    },
    {
      id: 'prod-007',
      sku: 'MS-007',
      name: 'Wireless Mouse',
      category: 'Accessories',
      location: 'B-02-01',
      unitCost: 800,
      onHand: 180,
      reserved: 20,
      available: 160,
      reorderPoint: 25,
      status: 'In Stock',
      iconType: 'mouse',
      locationsBreakdown: [
        { location: 'B-02-01', onHand: 180, reserved: 20, available: 160 },
      ],
      movements: [
        { id: 'RCP-029', type: 'Receipt', delta: '+80', date: '5 days ago' },
      ],
    },
    {
      id: 'prod-008',
      sku: 'PRN-008',
      name: 'Laser Printer HP',
      category: 'Electronics',
      location: 'C-01-01',
      unitCost: 18000,
      onHand: 12,
      reserved: 2,
      available: 10,
      reorderPoint: 5,
      status: 'In Stock',
      iconType: 'printer',
      locationsBreakdown: [
        { location: 'C-01-01', onHand: 12, reserved: 2, available: 10 },
      ],
      movements: [
        { id: 'DLV-079', type: 'Delivery', delta: '-3', date: '1 week ago' },
      ],
    },
    {
      id: 'prod-009',
      sku: 'STL-009',
      name: 'Steel Rod 20mm',
      category: 'Raw Material',
      location: 'R-01-01',
      unitCost: 120,
      onHand: 1000,
      reserved: 200,
      available: 800,
      reorderPoint: 300,
      status: 'In Stock',
      iconType: 'steel',
      locationsBreakdown: [
        { location: 'R-01-01', onHand: 1000, reserved: 200, available: 800 },
      ],
      movements: [
        { id: 'RCP-042', type: 'Receipt', delta: '+100', date: 'Today, 10:42 AM' },
      ],
    },
    {
      id: 'prod-010',
      sku: 'AL-010',
      name: 'Aluminum Sheet 4x8',
      category: 'Raw Material',
      location: 'R-01-02',
      unitCost: 250,
      onHand: 75,
      reserved: 10,
      available: 65,
      reorderPoint: 50,
      status: 'Low Stock',
      iconType: 'aluminum',
      locationsBreakdown: [
        { location: 'R-01-02', onHand: 75, reserved: 10, available: 65 },
      ],
      movements: [
        { id: 'ADJ-007', type: 'Adjustment', delta: '-3', date: 'Today, 11:58 AM' },
      ],
    },
  ]);

  // Selected Product for Right Drawer
  const [selectedProduct, setSelectedProduct] = useState<StockProductRow | null>(() => {
    if (initialSelectedId) {
      return productList.find((p) => p.id === initialSelectedId || p.sku === initialSelectedId) || productList[0];
    }
    return productList[0];
  });

  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'locations' | 'movements' | 'reorder'>('overview');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('Main Warehouse');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State for Image 2 Requirement: "User must be able to update the stock from here"
  const [isUpdateStockModalOpen, setIsUpdateStockModalOpen] = useState(false);
  const [updateQty, setUpdateQty] = useState<number>(0);
  const [updateReason, setUpdateReason] = useState('Physical Inventory Count');
  const [updateNotes, setUpdateNotes] = useState('');

  const handleOpenUpdateModal = (product: StockProductRow) => {
    setSelectedProduct(product);
    setUpdateQty(product.onHand);
    setUpdateReason('Physical Inventory Count');
    setUpdateNotes('');
    setIsUpdateStockModalOpen(true);
  };

  const handleApplyStockUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const newOnHand = Number(updateQty);
    const newAvailable = Math.max(0, newOnHand - selectedProduct.reserved);
    let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (newOnHand === 0) newStatus = 'Out of Stock';
    else if (newOnHand <= selectedProduct.reorderPoint) newStatus = 'Low Stock';

    const delta = newOnHand - selectedProduct.onHand;
    const deltaString = delta >= 0 ? `+${delta}` : `${delta}`;

    // Update product list state
    setProductList((prev) =>
      prev.map((p) => {
        if (p.id === selectedProduct.id) {
          const updated: StockProductRow = {
            ...p,
            onHand: newOnHand,
            available: newAvailable,
            status: newStatus,
            movements: [
              {
                id: `ADJ-${Math.floor(100 + Math.random() * 900)}`,
                type: 'Adjustment',
                delta: deltaString,
                date: 'Just now',
              },
              ...p.movements,
            ],
            locationsBreakdown: p.locationsBreakdown.map((loc, idx) =>
              idx === 0 ? { ...loc, onHand: newOnHand, available: newAvailable } : loc
            ),
          };
          setSelectedProduct(updated);
          return updated;
        }
        return p;
      })
    );

    // Call store createAdjustment
    createAdjustment({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      warehouseId: 'WH-01',
      location: selectedProduct.location,
      systemQuantity: selectedProduct.onHand,
      physicalCount: newOnHand,
      uom: 'PCS',
      reason: 'Cycle Count',
      operator: 'John Doe',
      reference: `ADJ-${Date.now().toString().slice(-4)}`,
      notes: `${updateReason}: ${updateNotes || 'Manual stock update'}`,
    });

    setIsUpdateStockModalOpen(false);
  };

  // Filter products
  const filteredProducts = productList.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'In Stock' && p.status === 'In Stock') ||
      (statusFilter === 'Low Stock' && p.status === 'Low Stock') ||
      (statusFilter === 'Out of Stock' && p.status === 'Out of Stock');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMB (MATCHING IMAGE 1) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>Inventory</span>
          <span>&gt;</span>
          <span>Products</span>
          <span>&gt;</span>
          <span className="text-slate-800 font-semibold">Stock</span>
        </div>
        <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
          Stock
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View and manage product stock across warehouses and locations.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. 4 TOP KPI CARDS WITH SPARKLINES */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Products */}
        <div className="stocksense-card p-4.5 flex flex-col justify-between hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              <span className="w-1 bg-blue-100 rounded-t h-2" />
              <span className="w-1 bg-blue-200 rounded-t h-3.5" />
              <span className="w-1 bg-blue-200 rounded-t h-3" />
              <span className="w-1 bg-blue-500 rounded-t h-5" />
              <span className="w-1 bg-blue-600 rounded-t h-6" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">Total Products</div>
            <div className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              12,482
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              ↑ +4.8%
            </div>
          </div>
        </div>

        {/* Card 2: Low Stock */}
        <div className="stocksense-card p-4.5 flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              <span className="w-1 bg-amber-100 rounded-t h-4" />
              <span className="w-1 bg-amber-200 rounded-t h-3" />
              <span className="w-1 bg-amber-200 rounded-t h-5" />
              <span className="w-1 bg-amber-500 rounded-t h-3" />
              <span className="w-1 bg-amber-600 rounded-t h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">Low Stock</div>
            <div className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              37
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Needs attention</span>
            </div>
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div className="stocksense-card p-4.5 flex flex-col justify-between hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              <span className="w-1 bg-rose-100 rounded-t h-2" />
              <span className="w-1 bg-rose-200 rounded-t h-4" />
              <span className="w-1 bg-rose-300 rounded-t h-3" />
              <span className="w-1 bg-rose-500 rounded-t h-5" />
              <span className="w-1 bg-rose-600 rounded-t h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">Out of Stock</div>
            <div className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              12
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>No stock</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Stock Value */}
        <div className="stocksense-card p-4.5 flex flex-col justify-between hover:border-sky-300 transition">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
              <Package className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              <span className="w-1 bg-sky-100 rounded-t h-3" />
              <span className="w-1 bg-sky-200 rounded-t h-2" />
              <span className="w-1 bg-sky-300 rounded-t h-4" />
              <span className="w-1 bg-sky-500 rounded-t h-5" />
              <span className="w-1 bg-sky-600 rounded-t h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">Total Stock Value</div>
            <div className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              ₹ 8.42M
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across all warehouses
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER BAR & ACTIONS */}
      {/* ========================================================================= */}
      <div className="stocksense-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product, SKU..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Furniture">Furniture</option>
              <option value="Electronics">Electronics</option>
              <option value="Accessories">Accessories</option>
              <option value="Raw Material">Raw Material</option>
            </select>
          </div>

          {/* Warehouse Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
            <span className="text-slate-400">Warehouse:</span>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Production Floor">Production Floor</option>
              <option value="Secondary Warehouse">Secondary Warehouse</option>
            </select>
          </div>

          {/* Stock Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
            <span className="text-slate-400">Stock Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Filter button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          {/* + Adjust Stock Action Button */}
          <button
            type="button"
            onClick={() => handleOpenUpdateModal(selectedProduct || productList[0])}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN SPLIT: PRODUCTS STOCK TABLE + PRODUCT DETAILS DRAWER */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Container */}
        <div className={`stocksense-card p-5 space-y-4 ${selectedProduct ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
              Products Stock <span className="text-slate-400 font-normal text-xs">(12,482)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 pb-2">
                  <th className="py-2.5 px-3 w-8">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  <th className="py-2.5 px-2">SKU</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-2">Category</th>
                  <th className="py-2.5 px-2">Location</th>
                  <th className="py-2.5 px-2">Unit Cost</th>
                  <th className="py-2.5 px-2">On Hand</th>
                  <th className="py-2.5 px-2">Reserved</th>
                  <th className="py-2.5 px-2">Available</th>
                  <th className="py-2.5 px-2">Reorder</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/60 border-l-2 border-blue-600' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(p);
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-900">{p.sku}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <Boxes className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-sans font-medium text-slate-900 truncate max-w-[120px]">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-sans">{p.category}</td>
                      <td className="py-3 px-2 text-slate-600">{p.location}</td>
                      <td className="py-3 px-2 font-medium">₹ {p.unitCost.toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                          {p.onHand}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500">{p.reserved}</td>
                      <td className="py-3 px-2 font-bold text-slate-800">{p.available}</td>
                      <td className="py-3 px-2 text-slate-500">{p.reorderPoint}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'In Stock'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'Low Stock'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.status === 'In Stock' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {p.status === 'Low Stock' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {p.status === 'Out of Stock' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          <span>{p.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUpdateModal(p);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition cursor-pointer"
                          title="Update stock"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
            <div>Showing 1 to 10 of 12,482 products</div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 rounded hover:bg-slate-100 cursor-pointer">&lt;</button>
              <button className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold cursor-pointer">1</button>
              <button className="px-2.5 py-1 rounded hover:bg-slate-100 cursor-pointer">2</button>
              <button className="px-2.5 py-1 rounded hover:bg-slate-100 cursor-pointer">3</button>
              <button className="px-2.5 py-1 rounded hover:bg-slate-100 cursor-pointer">4</button>
              <button className="px-2.5 py-1 rounded hover:bg-slate-100 cursor-pointer">5</button>
              <span className="px-1">...</span>
              <button className="px-2 py-1 rounded hover:bg-slate-100 cursor-pointer">1,249</button>
              <button className="px-2 py-1 rounded hover:bg-slate-100 cursor-pointer">&gt;</button>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <span className="font-semibold text-slate-800">10 ▾</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. RIGHT PRODUCT DETAILS DRAWER (MATCHING IMAGE 1) */}
        {/* ========================================================================= */}
        {selectedProduct && (
          <div className="lg:col-span-4 stocksense-card p-5 space-y-5">
            {/* Drawer Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                  Product Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Identity Banner */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 font-sans truncate">
                    {selectedProduct.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    {selectedProduct.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  SKU: {selectedProduct.sku}
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  Category: {selectedProduct.category}
                </div>
              </div>
            </div>

            {/* Drawer Tabs: Overview, Locations, Movements, Reorder */}
            <div className="flex items-center border-b border-slate-100 text-xs font-medium text-slate-500">
              {(['overview', 'locations', 'movements', 'reorder'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDrawerTab(tab)}
                  className={`capitalize px-3 py-2 border-b-2 transition cursor-pointer ${
                    activeDrawerTab === tab
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview Content */}
            {activeDrawerTab === 'overview' && (
              <div className="space-y-5">
                {/* 6-cell stat grid */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400">Unit Cost</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      ₹ {selectedProduct.unitCost.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400">On Hand</div>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedProduct.onHand}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400">Reserved</div>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedProduct.reserved}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400">Available</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{selectedProduct.available}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400">Reorder Point</div>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedProduct.reorderPoint}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400">Stock Value</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      ₹ {(selectedProduct.unitCost * selectedProduct.onHand).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Primary Action Button: Update Stock */}
                <button
                  type="button"
                  onClick={() => handleOpenUpdateModal(selectedProduct)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Stock</span>
                </button>

                {/* Location-wise Stock */}
                <div className="space-y-2 pt-1">
                  <div className="font-['Space_Grotesk'] text-xs font-bold text-slate-800">
                    Location-wise Stock
                  </div>
                  <div className="rounded-xl border border-slate-100 overflow-hidden text-xs font-mono">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 border-b border-slate-100">
                          <th className="py-2 px-3">Location</th>
                          <th className="py-2 px-2">On Hand</th>
                          <th className="py-2 px-2">Reserved</th>
                          <th className="py-2 px-2 text-right">Available</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedProduct.locationsBreakdown.map((loc) => (
                          <tr key={loc.location}>
                            <td className="py-2 px-3 font-semibold">{loc.location}</td>
                            <td className="py-2 px-2">{loc.onHand}</td>
                            <td className="py-2 px-2 text-slate-500">{loc.reserved}</td>
                            <td className="py-2 px-2 text-right font-bold text-emerald-700">
                              {loc.available}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                          <td className="py-2 px-3">Total</td>
                          <td className="py-2 px-2">{selectedProduct.onHand}</td>
                          <td className="py-2 px-2 text-slate-500">{selectedProduct.reserved}</td>
                          <td className="py-2 px-2 text-right text-emerald-700">
                            {selectedProduct.available}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Movements */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-['Space_Grotesk'] text-xs font-bold text-slate-800">
                      Recent Movements
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveDrawerTab('movements')}
                      className="text-[10px] font-mono text-blue-600 hover:underline cursor-pointer"
                    >
                      View all &rarr;
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    {selectedProduct.movements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{m.id}</span>
                          <span className="text-[10px] text-slate-500">{m.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              m.delta.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {m.delta}
                          </span>
                          <span className="text-[10px] text-slate-400">{m.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Locations */}
            {activeDrawerTab === 'locations' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="text-[11px] text-slate-500 font-sans">
                  Active spatial racks and bin allocations for {selectedProduct.sku}.
                </div>
                {selectedProduct.locationsBreakdown.map((loc) => (
                  <div key={loc.location} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>LOCATION: {loc.location}</span>
                      <span className="text-blue-600">ZONE A</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>On Hand: {loc.onHand}</span>
                      <span>Free to Use: {loc.available}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Movements */}
            {activeDrawerTab === 'movements' && (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-[11px] text-slate-500 font-sans">
                  Full chronological ledger events for this SKU.
                </div>
                {selectedProduct.movements.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{m.id} · {m.type}</div>
                      <div className="text-[10px] text-slate-400">{m.date}</div>
                    </div>
                    <span className={`text-sm font-bold ${m.delta.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.delta}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Reorder */}
            {activeDrawerTab === 'reorder' && (
              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-1.5">
                  <div className="font-bold text-blue-900">Automated Replenishment Rule</div>
                  <div className="text-slate-600 text-[11px]">
                    Safety Threshold: <span className="font-bold text-slate-900">{selectedProduct.reorderPoint} units</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Lead Time: <span className="font-bold text-slate-900">3 Days</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Vendor: <span className="font-bold text-slate-900">Apex Industrial Corp</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. STOCK UPDATE / ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {isUpdateStockModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-slate-900">
                  Update Stock
                </h3>
                <div className="text-xs font-mono text-slate-500">
                  {selectedProduct.sku} · {selectedProduct.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateStockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyStockUpdate} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400">Current On Hand</div>
                  <div className="text-base font-bold text-slate-900">{selectedProduct.onHand}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Reserved for Orders</div>
                  <div className="text-base font-bold text-slate-900">{selectedProduct.reserved}</div>
                </div>
              </div>

              {/* Counted / New Quantity Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-semibold">
                  New Counted Physical Quantity:
                </label>
                <input
                  type="number"
                  min="0"
                  value={updateQty}
                  onChange={(e) => setUpdateQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
                  required
                />
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500">
                    Net Delta: <strong className={updateQty - selectedProduct.onHand >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {updateQty - selectedProduct.onHand >= 0 ? `+${updateQty - selectedProduct.onHand}` : updateQty - selectedProduct.onHand}
                    </strong>
                  </span>
                  <span className="text-slate-500">
                    New Free to Use: <strong className="text-emerald-700">{Math.max(0, updateQty - selectedProduct.reserved)}</strong>
                  </span>
                </div>
              </div>

              {/* Adjustment Reason */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-semibold">
                  Adjustment Reason:
                </label>
                <select
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs cursor-pointer"
                >
                  <option value="Physical Inventory Count">Physical Inventory Count</option>
                  <option value="Damaged Stock Discovered">Damaged Stock Discovered</option>
                  <option value="Supplier Discrepancy Correction">Supplier Discrepancy Correction</option>
                  <option value="Found Unrecorded Stock">Found Unrecorded Stock</option>
                </select>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-semibold">
                  Operator Notes:
                </label>
                <textarea
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="e.g., Cycle count confirmed on Rack A-01-01..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateStockModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
