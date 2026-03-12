import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const schema = z.object({
  username: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const username = parsed.data.username.trim()
    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        role: true,
        securityQuestion: true,
      },
    })

    if (!user || user.role !== 'ADMIN' || !user.securityQuestion) {
      return NextResponse.json(
        { error: 'Security question is not available for this account.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      securityQuestion: user.securityQuestion,
    })
  } catch (error) {
    console.error('GET_SECURITY_QUESTION_ERROR', error)
    return NextResponse.json(
      { error: 'Failed to fetch security question' },
      { status: 500 }
    )
  }
}
