import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { comparePassword } from '@/lib/auth/password'
import { signAuthToken } from '@/lib/auth/jwt'
import { hashPassword } from '@/lib/auth/password'

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { username, password } = parsed.data

    const superUsername = process.env.SUPER_ADMIN_USERNAME
    const superPassword = process.env.SUPER_ADMIN_PASSWORD

    if (superUsername && superPassword && username === superUsername) {
      if (password !== superPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const passwordHash = await hashPassword(superPassword)
      const superAdmin = await db.user.upsert({
        where: { username: superUsername },
        update: {
          role: 'SUPER_ADMIN',
          passwordHash,
          isActive: true,
        },
        create: {
          username: superUsername,
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        select: { id: true, username: true, role: true },
      })

      const token = signAuthToken({
        userId: superAdmin.id,
        username: superAdmin.username,
        role: superAdmin.role,
      })

      const res = NextResponse.json({
        success: true,
        token,
        user: { username: superAdmin.username, role: superAdmin.role },
      })

      res.cookies.set('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })

      return res
    }

    const user = await db.user.findUnique({ where: { username } })
    if (
      !user ||
      !user.isActive ||
      (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signAuthToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    const res = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })

    res.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return res
  } catch (error) {
    console.error('AUTH_LOGIN_ERROR', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
