import { useState, useEffect, useCallback } from 'react';
import type { StockSenseTab } from './components/stocksense/layout/StockSenseSidebar';
import { StockSenseLayout } from './components/stocksense/layout/StockSenseLayout';
import { StockSenseDashboard } from './components/stocksense/pages/StockSenseDashboard';
import { StockSenseProducts } from './components/stocksense/pages/StockSenseProducts';
import { StockSenseCategories } from './components/stocksense/pages/StockSenseCategories';
import { StockSenseReorderRules } from './components/stocksense/pages/StockSenseReorderRules';
import { StockSenseReceipts } from './components/stocksense/pages/StockSenseReceipts';
import { StockSenseDeliveries } from './components/stocksense/pages/StockSenseDeliveries';
import { StockSenseTransfers } from './components/stocksense/pages/StockSenseTransfers';
import { StockSenseAdjustments } from './components/stocksense/pages/StockSenseAdjustments';
import { StockSenseLedger } from './components/stocksense/pages/StockSenseLedger';
import { StockSenseWarehouses } from './components/stocksense/pages/StockSenseWarehouses';
import { StockSensePeople } from './components/stocksense/pages/StockSensePeople';
import { StockSenseReports } from './components/stocksense/pages/StockSenseReports';
import { StockSenseSettings } from './components/stocksense/pages/StockSenseSettings';
import { StockSenseProfile } from './components/stocksense/pages/StockSenseProfile';
import { StockSenseOmniDim } from './components/stocksense/pages/StockSenseOmniDim';
import { StockSenseLanding } from './components/stocksense/pages/StockSenseLanding';

// Dedicated Auth Pages
import { StockSenseLoginPage } from './components/stocksense/auth/StockSenseLoginPage';
import { StockSenseSignupPage } from './components/stocksense/auth/StockSenseSignupPage';
import { StockSenseForgotPasswordPage } from './components/stocksense/auth/StockSenseForgotPasswordPage';
import { StockSenseResetPasswordPage } from './components/stocksense/auth/StockSenseResetPasswordPage';

import {
  authService,
  isLoggedIn,
  getCachedUser,
  cacheUser,
  handleGoogleCallback,
  type UserResponse,
} from './lib/auth';

const tabToPathMap: Record<StockSenseTab, string> = {
  dashboard: '/dashboard',
  products: '/products',
  stock: '/stock',
  warehouses: '/warehouse',
  locations: '/locations',
  receipts: '/receipts',
  deliveries: '/deliveries',
  transfers: '/transfers',
  adjustments: '/adjustments',
  'move-history': '/move-history',
  ledger: '/move-history',
  alerts: '/alerts',
  omnidim: '/omnidimension',
  profile: '/profile',
  settings: '/settings',
  categories: '/categories',
  'reorder-rules': '/reorder-rules',
  people: '/people',
  reports: '/reports',
};

const pathToTabMap: Record<string, StockSenseTab> = {
  '/dashboard': 'dashboard',
  '/products': 'products',
  '/stock': 'stock',
  '/warehouse': 'warehouses',
  '/warehouses': 'warehouses',
  '/locations': 'locations',
  '/receipts': 'receipts',
  '/deliveries': 'deliveries',
  '/transfers': 'transfers',
  '/adjustments': 'adjustments',
  '/move-history': 'move-history',
  '/ledger': 'move-history',
  '/alerts': 'alerts',
  '/omnidimension': 'omnidim',
  '/omnidim': 'omnidim',
  '/profile': 'profile',
  '/settings': 'settings',
  '/categories': 'categories',
  '/reorder-rules': 'reorder-rules',
  '/people': 'people',
  '/reports': 'reports',
};

const publicRoutes = new Set(['/', '/login', '/signup', '/forgot-password', '/reset-password']);

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isLoggedIn());
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(() => getCachedUser());
  const [username, setUsername] = useState<string | null>(() => {
    const u = getCachedUser();
    return u?.username || u?.name || null;
  });
  const [userRole, setUserRole] = useState<string | null>(() => {
    const u = getCachedUser();
    return u?.role || null;
  });

  // Active Tab & Spatial Context
  const [activeTab, setActiveTab] = useState<StockSenseTab>(() => {
    const initialPath = window.location.pathname || '/';
    return pathToTabMap[initialPath] || 'dashboard';
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('WH-01');
  const [targetId, setTargetId] = useState<string | null>(null);

  // Client-side navigation helper with history push
  const navigateTo = useCallback((path: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    const cleanPath = path.split('?')[0];
    setCurrentPath(cleanPath);

    if (pathToTabMap[cleanPath]) {
      setActiveTab(pathToTabMap[cleanPath]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to popstate (back/forward browser buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
      if (pathToTabMap[path]) {
        setActiveTab(pathToTabMap[path]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check auth state & deep links on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const authError = params.get('auth_error');

    if (token && token.startsWith('ey')) {
      handleGoogleCallback(token)
        .then((user) => {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setUsername(user.username || user.name || null);
          setUserRole(user.role || null);
          navigateTo('/dashboard', true);
        })
        .catch(() => {
          navigateTo('/login', true);
        });
      return;
    }

    if (token || authError) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (isLoggedIn()) {
      setIsAuthenticated(true);
      const user = getCachedUser();
      if (user) {
        setCurrentUser(user);
        setUsername(user.username || user.name || 'Marcus Vance');
        setUserRole(user.role || 'Administrator');
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [navigateTo]);

  // Auth Guard enforcement
  useEffect(() => {
    const isPublic = publicRoutes.has(currentPath);

    if (!isAuthenticated && !isPublic) {
      // User trying to access protected route while unauthenticated -> Redirect to /login
      const redirectUrl = currentPath !== '/' ? `/login?redirect=${encodeURIComponent(currentPath)}` : '/login';
      navigateTo(redirectUrl, true);
    } else if (isAuthenticated && (currentPath === '/login' || currentPath === '/signup')) {
      // Authenticated user trying to access /login or /signup -> Redirect to dashboard
      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get('redirect') || '/dashboard';
      navigateTo(redirectTarget, true);
    }
  }, [currentPath, isAuthenticated, navigateTo]);

  const handleAuthSuccess = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setUsername(user.username || user.name || 'User');
    setUserRole(user.role || 'Inventory Manager');

    const params = new URLSearchParams(window.location.search);
    const redirectTarget = params.get('redirect') || '/dashboard';
    navigateTo(redirectTarget, true);
  };

  const handleEnterDemo = () => {
    const demoUser: UserResponse = {
      id: 'demo-admin-01',
      username: 'Marcus Vance',
      name: 'Marcus Vance',
      email: 'marcus.vance@stocksense.io',
      role: 'Administrator',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('dare_token', 'demo-token-stocksense-2026');
    cacheUser(demoUser);
    setIsAuthenticated(true);
    setCurrentUser(demoUser);
    setUsername(demoUser.username);
    setUserRole(demoUser.role || null);
    navigateTo('/dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsername(null);
    setUserRole(null);
    navigateTo('/');
  };

  const handleTabChange = (tab: StockSenseTab, filterId?: string) => {
    setActiveTab(tab);
    if (filterId) {
      setTargetId(filterId);
    } else {
      setTargetId(null);
    }
    const targetPath = tabToPathMap[tab] || '/dashboard';
    navigateTo(targetPath);
  };

  const handleOpenQuickAction = (
    action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product',
    prefill?: any
  ) => {
    const actionTabMap: Record<string, StockSenseTab> = {
      receipt: 'receipts',
      delivery: 'deliveries',
      transfer: 'transfers',
      adjustment: 'adjustments',
      product: 'products',
    };
    const tab = actionTabMap[action] || 'dashboard';
    handleTabChange(tab, prefill?.id);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. PUBLIC ROUTING
  // ─────────────────────────────────────────────────────────────

  // LANDING PAGE (at /)
  if (currentPath === '/') {
    return (
      <StockSenseLanding
        onOpenLogin={() => navigateTo('/login')}
        onOpenRegister={() => navigateTo('/signup')}
        onEnterDemo={handleEnterDemo}
      />
    );
  }

  // LOGIN PAGE (at /login)
  if (currentPath === '/login') {
    return (
      <StockSenseLoginPage
        onNavigateToSignup={() => navigateTo('/signup')}
        onNavigateToForgotPassword={() => navigateTo('/forgot-password')}
        onLoginSuccess={handleAuthSuccess}
      />
    );
  }

  // SIGNUP PAGE (at /signup)
  if (currentPath === '/signup') {
    return (
      <StockSenseSignupPage
        onNavigateToLogin={() => navigateTo('/login')}
        onSignupSuccess={handleAuthSuccess}
      />
    );
  }

  // FORGOT PASSWORD PAGE (at /forgot-password)
  if (currentPath === '/forgot-password') {
    return (
      <StockSenseForgotPasswordPage
        onNavigateToLogin={() => navigateTo('/login')}
        onNavigateToReset={(email) => navigateTo(`/reset-password?email=${encodeURIComponent(email)}`)}
      />
    );
  }

  // RESET PASSWORD PAGE (at /reset-password)
  if (currentPath === '/reset-password') {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') || '';
    return (
      <StockSenseResetPasswordPage
        initialEmail={emailParam}
        onNavigateToLogin={() => navigateTo('/login')}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. PROTECTED ROUTING (Authenticated Dashboard & Modules)
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    // Fallback if not authenticated: redirect to login
    return (
      <StockSenseLoginPage
        onNavigateToSignup={() => navigateTo('/signup')}
        onNavigateToForgotPassword={() => navigateTo('/forgot-password')}
        onLoginSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <StockSenseLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
      username={username}
      userRole={userRole}
      onOpenQuickAction={handleOpenQuickAction}
      selectedWarehouse={selectedWarehouse}
      onSelectWarehouse={setSelectedWarehouse}
    >
      {activeTab === 'dashboard' && (
        <StockSenseDashboard
          onNavigate={handleTabChange}
          onOpenQuickAction={handleOpenQuickAction}
          selectedWarehouse={selectedWarehouse}
        />
      )}

      {activeTab === 'products' && (
        <StockSenseProducts
          onOpenQuickAction={handleOpenQuickAction}
          initialSelectedId={targetId}
        />
      )}

      {activeTab === 'categories' && <StockSenseCategories />}

      {activeTab === 'reorder-rules' && (
        <StockSenseReorderRules onOpenQuickAction={handleOpenQuickAction} />
      )}

      {activeTab === 'alerts' && (
        <StockSenseReorderRules onOpenQuickAction={handleOpenQuickAction} />
      )}

      {activeTab === 'receipts' && (
        <StockSenseReceipts
          onOpenQuickAction={handleOpenQuickAction}
          initialSelectedId={targetId}
        />
      )}

      {activeTab === 'deliveries' && (
        <StockSenseDeliveries
          onOpenQuickAction={handleOpenQuickAction}
          initialSelectedId={targetId}
        />
      )}

      {activeTab === 'transfers' && (
        <StockSenseTransfers
          onOpenQuickAction={handleOpenQuickAction}
          initialSelectedId={targetId}
        />
      )}

      {activeTab === 'adjustments' && (
        <StockSenseAdjustments
          onOpenQuickAction={handleOpenQuickAction}
          initialSelectedId={targetId}
        />
      )}

      {(activeTab === 'ledger' || activeTab === 'stock' || activeTab === 'move-history') && (
        <StockSenseLedger initialEventId={targetId} />
      )}

      {activeTab === 'omnidim' && <StockSenseOmniDim />}

      {(activeTab === 'warehouses' || activeTab === 'locations') && (
        <StockSenseWarehouses
          selectedWhId={selectedWarehouse}
          onSelectWarehouse={setSelectedWarehouse}
          onNavigateToProduct={(prodId) => handleTabChange('products', prodId)}
        />
      )}

      {activeTab === 'people' && <StockSensePeople />}

      {activeTab === 'reports' && <StockSenseReports />}

      {activeTab === 'settings' && <StockSenseSettings />}

      {activeTab === 'profile' && (
        <StockSenseProfile username={username || currentUser?.name || currentUser?.username} userRole={userRole || currentUser?.role} />
      )}
    </StockSenseLayout>
  );
}
