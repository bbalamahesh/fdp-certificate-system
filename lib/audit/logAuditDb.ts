import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

type AuditArgs = {
  action: string
  targetType: string
  targetId: string
  actorId?: string
  metadata?: Record<string, unknown>
}

export async function logAuditDb(args: AuditArgs) {
  try {
    await db.auditLog.create({
      data: {
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId,
        actorId: args.actorId,
        metadata: (args.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.error('AUDIT_DB_ERROR', error)
  }
}
