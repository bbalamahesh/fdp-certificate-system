import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { logAuditDb } from '@/lib/audit/logAuditDb'
import { SECURITY_QUESTIONS } from '@/lib/auth/securityQuestions'

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  securityQuestion: z.enum(SECURITY_QUESTIONS),
  securityAnswer: z.string().min(2),
}).refine((data) => data.password === data.confirmPassword, {
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
      const fieldErrors = parsed.error.flatten().fieldErrors
      const firstError = Object.values(fieldErrors).flat()[0]
      return NextResponse.json(
        {
          error: firstError || 'Invalid payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const {
      firstName,
      lastName,
      username,
      email,
      password,
      securityQuestion,
      securityAnswer,
    } = parsed.data

    const existing = await db.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const securityAnswerHash = await hashPassword(
      normalizeSecurityAnswer(securityAnswer)
    )
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        passwordHash,
        securityQuestion: securityQuestion.trim(),
        securityAnswerHash,
        role: 'ADMIN',
      },
      select: { id: true, username: true, role: true },
    })

    await logAuditDb({
      action: 'ADMIN_REGISTERED',
      targetType: 'User',
      targetId: user.id,
      actorId: user.id,
      metadata: { username: user.username },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('REGISTER_ADMIN_ERROR', error)
    return NextResponse.json(
      { error: 'Failed to register admin' },
      { status: 500 }
    )
  }
}
