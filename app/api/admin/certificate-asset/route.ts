import { NextResponse } from 'next/server'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import crypto from 'crypto'

function parseDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return null
    return { mime: match[1], base64: match[2] }
}

function extFromMime(mime: string) {
    if (mime.includes('png')) return 'png'
    if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
    if (mime.includes('webp')) return 'webp'
    return 'png'
}

export async function POST(req: Request) {
    try {
        const { dataUrl, kind = 'asset' } = await req.json()

        if (!dataUrl || typeof dataUrl !== 'string') {
            return NextResponse.json(
                { error: 'dataUrl is required' },
                { status: 400 }
            )
        }

        const parsed = parseDataUrl(dataUrl)
        if (!parsed) {
            return NextResponse.json(
                { error: 'Invalid image data URL' },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(parsed.base64, 'base64')
        if (buffer.length > 600_000) {
            return NextResponse.json(
                { error: 'Image is too large' },
                { status: 400 }
            )
        }

        const ext = extFromMime(parsed.mime)
        const safeKind =
            kind === 'logo' ||
            kind === 'coordinator-signature' ||
            kind === 'hod-signature' ||
            kind === 'background'
                ? kind
                : 'asset'
        const fileName = `${safeKind}-${crypto.randomUUID()}.${ext}`
        const relativeDir = 'uploads/certificate-assets'
        const absoluteDir = path.join(process.cwd(), 'public', relativeDir)
        await mkdir(absoluteDir, { recursive: true })
        await writeFile(path.join(absoluteDir, fileName), buffer)

        return NextResponse.json({
            success: true,
            url: `/${relativeDir}/${fileName}`,
        })
    } catch (error: any) {
        return NextResponse.json(
            {
                error: 'Failed to upload asset',
                details: error?.message || 'Unknown error',
            },
            { status: 500 }
        )
    }
}
