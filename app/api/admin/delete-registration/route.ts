import { NextResponse } from 'next/server'
import { deleteRegistrationByEmail } from '@/lib/googleSheets'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 })
        }

        await deleteRegistrationByEmail(email)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete failed:', error)
        return NextResponse.json(
            { message: 'Failed to delete registration' },
            { status: 500 }
        )
    }
}
