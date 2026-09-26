// ─── Notification Repository ────────────────────────────────────────────────
import prisma from '../config/database';

class NotificationRepository {
  async findByUser(userId: string, skip = 0, take = 50) {
    const [data, total] = await Promise.all([
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async create(data: { type: string; message: string; userId: string }) {
    return prisma.notification.create({ data: data as any });
  }

  async markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }
}

export default new NotificationRepository();
