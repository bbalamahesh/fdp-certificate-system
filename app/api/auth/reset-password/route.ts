import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { comparePassword, hashPassword } from '@/lib/auth/password'
import { logAuditDb } from '@/lib/audit/logAuditDb'

const schema = z
  .object({
    username: z.string().min(1),
    securityAnswer: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

function normalizeSecurityAnswer(value: string) {
  return value.trim().toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { username, securityAnswer, newPassword } = parsed.data

    const user = await db.user.findUnique({
      where: { username: username.trim() },
      select: {
        id: true,
        role: true,
        securityAnswerHash: true,
      },
    })

    if (!user || user.role !== 'ADMIN' || !user.securityAnswerHash) {
      return NextResponse.json(
        { error: 'Reset password is not available for this account.' },
        { status: 404 }
      )
    }

    const isValidAnswer = await comparePassword(
      normalizeSecurityAnswer(securityAnswer),
      user.securityAnswerHash
    )

    if (!isValidAnswer) {
      return NextResponse.json(
        { error: 'Security answer is incorrect.' },
        { status: 401 }
      )
    }

    const passwordHash = await hashPassword(newPassword)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    await logAuditDb({
      action: 'ADMIN_PASSWORD_RESET',
      targetType: 'User',
      targetId: user.id,
      actorId: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('RESET_PASSWORD_ERROR', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
