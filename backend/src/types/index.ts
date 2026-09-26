// ─── Shared TypeScript Types ────────────────────────────────────────────────

export type RoleName = 'Administrator' | 'Asset Manager' | 'Department Head' | 'Employee';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: RoleName;
}

export interface PaginatedQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DashboardStats {
  availableHardware: number;
  allocated: number;
  availableRooms: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
  maintenanceToday: number;
}

export interface AdminStats {
  departmentCount: number;
  employeeCount: number;
  categoryCount: number;
  activeUsersCount: number;
  deptHeadsCount: number;
  assetManagersCount: number;
  administratorsCount: number;
}
