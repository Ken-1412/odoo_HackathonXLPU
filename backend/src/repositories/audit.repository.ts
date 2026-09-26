// ─── Audit Repository ───────────────────────────────────────────────────────
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

class AuditRepository {
  async findAll(params: { skip?: number; take?: number; where?: Prisma.AuditCycleWhereInput; orderBy?: Prisma.AuditCycleOrderByWithRelationInput }) {
    const [data, total] = await Promise.all([
      prisma.auditCycle.findMany({ ...params, include: { auditors: { select: { id: true, name: true } }, _count: { select: { items: true } } } }),
      prisma.auditCycle.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.auditCycle.findUnique({ where: { id }, include: { auditors: { select: { id: true, name: true } }, items: { include: { asset: { select: { id: true, tag: true, name: true, location: true } } } } } });
  }

  async create(data: { name: string; department: string; startDate: Date; endDate: Date; assetIds?: string[]; auditorIds?: string[] }) {
    return prisma.auditCycle.create({
      data: {
        name: data.name, department: data.department, startDate: data.startDate, endDate: data.endDate,
        ...(data.auditorIds?.length && { auditors: { connect: data.auditorIds.map(id => ({ id })) } }),
        ...(data.assetIds?.length && { items: { create: data.assetIds.map(assetId => ({ assetId, status: 'VERIFIED' as const })) } }),
      },
      include: { auditors: { select: { id: true, name: true } }, items: { include: { asset: { select: { id: true, tag: true, name: true, location: true } } } } },
    });
  }

  async updateItem(itemId: string, status: 'VERIFIED' | 'MISSING' | 'DAMAGED') {
    return prisma.auditItem.update({ where: { id: itemId }, data: { status }, include: { asset: { select: { id: true, tag: true, name: true, location: true } } } });
  }

  async closeCycle(id: string) {
    return prisma.auditCycle.update({ where: { id }, data: { isOpen: false }, include: { items: { include: { asset: { select: { id: true, tag: true, name: true, location: true } } } } } });
  }

  async getDiscrepancyReport(id: string) {
    const items = await prisma.auditItem.findMany({
      where: { auditCycleId: id, status: { in: ['MISSING', 'DAMAGED'] } },
      include: { asset: { select: { id: true, tag: true, name: true, location: true, status: true } } },
    });
    return items;
  }
}

export default new AuditRepository();
