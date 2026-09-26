/**
 * React Hook for StockSense Operational Store
 * Provides full reactive access to inventory state and transactional workflows.
 */

import { useState, useEffect, useCallback } from 'react';
import { stockSenseStore } from './stockSenseStore';
import type { Product } from '../types/stockSense';

export function useStockSense() {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Subscribe to store mutations
    const unsubscribe = stockSenseStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const products = stockSenseStore.getProducts();
  const receipts = stockSenseStore.getReceipts();
  const deliveries = stockSenseStore.getDeliveries();
  const transfers = stockSenseStore.getTransfers();
  const adjustments = stockSenseStore.getAdjustments();
  const ledger = stockSenseStore.getLedger();
  const warehouses = stockSenseStore.getWarehouses();
  const stats = stockSenseStore.getStats();

  const getProductById = useCallback((id: string) => stockSenseStore.getProductById(id), []);

  const createProduct = useCallback(
    (data: Parameters<typeof stockSenseStore.createProduct>[0]) => stockSenseStore.createProduct(data),
    []
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => stockSenseStore.updateProduct(id, updates),
    []
  );

  const createReceipt = useCallback(
    (data: Parameters<typeof stockSenseStore.createReceipt>[0]) => stockSenseStore.createReceipt(data),
    []
  );

  const validateReceipt = useCallback(
    (id: string) => stockSenseStore.validateReceipt(id),
    []
  );

  const createDelivery = useCallback(
    (data: Parameters<typeof stockSenseStore.createDelivery>[0]) => stockSenseStore.createDelivery(data),
    []
  );

  const validateDelivery = useCallback(
    (id: string) => stockSenseStore.validateDelivery(id),
    []
  );

  const createTransfer = useCallback(
    (data: Parameters<typeof stockSenseStore.createTransfer>[0]) => stockSenseStore.createTransfer(data),
    []
  );

  const createAdjustment = useCallback(
    (data: Parameters<typeof stockSenseStore.createAdjustment>[0]) => stockSenseStore.createAdjustment(data),
    []
  );

  const resetToDefaults = useCallback(() => stockSenseStore.resetToDefaults(), []);

  return {
    products,
    receipts,
    deliveries,
    transfers,
    adjustments,
    ledger,
    warehouses,
    stats,
    getProductById,
    createProduct,
    updateProduct,
    createReceipt,
    validateReceipt,
    createDelivery,
    validateDelivery,
    createTransfer,
    createAdjustment,
    resetToDefaults,
  };
}
