import type { Request } from 'express';
import type { Prisma, PrismaClient, AuditEventType } from '@prisma/client';

type AuditClient = PrismaClient | Prisma.TransactionClient;

interface WriteAuditLogInput {
  userId?: string | null;
  eventType: AuditEventType;
  req?: Request;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(client: AuditClient, input: WriteAuditLogInput): Promise<void> {
  await client.auditLog.create({
    data: {
      userId: input.userId ?? null,
      eventType: input.eventType,
      ipAddress: input.req?.ip,
      userAgent: input.req?.get('user-agent') ?? undefined,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
