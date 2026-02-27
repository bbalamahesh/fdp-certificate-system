import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import type { CertificateConfig } from '@/lib/certificates/renderCertificate'

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const spreadsheetId = process.env.GOOGLE_SHEET_ID!

const SHEET_NAME = 'CertificateConfig'
const DEFAULT_CONFIG: CertificateConfig = {
    title: 'Certificate of Participation',
    eventType: '',
    subtitle1: '',
    subtitle2: '',
    orientation: 'landscape',
    signatureCount: 2,
    watermarkEnabled: true,
    showQrCode: true,
    logoPosition: 'left',
    backgroundTemplate: 'none',
    customBackgroundUrl: '',
    textStyles: {},
}

function isMissingRangeError(error: any) {
    const message = error?.message || ''
    const gaxiosMessage = error?.errors?.[0]?.message || ''
    return (
        message.includes('Unable to parse range') ||
        gaxiosMessage.includes('Unable to parse range')
    )
}

async function createConfigSheetIfMissing() {
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: { title: SHEET_NAME },
                        },
                    },
                ],
            },
        })
    } catch (error: any) {
        const msg = error?.message || error?.errors?.[0]?.message || ''
        if (!msg.toLowerCase().includes('already exists')) {
            throw error
        }
    }
}

async function saveConfig(config: CertificateConfig) {
    const values = [
        ['key', 'value'],
        ['title', config.title],
        ['eventType', config.eventType],
        ['subtitle1', config.subtitle1 || ''],
        ['subtitle2', config.subtitle2 || ''],
        ['orientation', config.orientation],
        ['signatureCount', String(config.signatureCount)],
        ['watermarkEnabled', String(config.watermarkEnabled)],
        ['showQrCode', String(config.showQrCode)],
        ['logoPosition', config.logoPosition || 'left'],
        ['backgroundTemplate', config.backgroundTemplate || 'none'],
        ['customBackgroundUrl', config.customBackgroundUrl || ''],
        ['textStyles', JSON.stringify(config.textStyles || {})],
    ]

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A:B`,
        valueInputOption: 'RAW',
        requestBody: { values },
    })
}

/* -------------------- GET -------------------- */
export async function GET() {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_NAME}!A:B`,
        })

        const rows = res.data.values ?? []

        if (rows.length <= 1) {
            return NextResponse.json({ success: true, config: DEFAULT_CONFIG })
        }

        const map = Object.fromEntries(rows.slice(1))
        let textStyles: CertificateConfig['textStyles'] = {}
        try {
            textStyles = map.textStyles ? JSON.parse(map.textStyles) : {}
        } catch {
            textStyles = {}
        }

        const config: CertificateConfig = {
            title: map.title || DEFAULT_CONFIG.title,
            eventType: map.eventType || DEFAULT_CONFIG.eventType,
            subtitle1: map.subtitle1 || '',
            subtitle2: map.subtitle2 || '',
            orientation:
                map.orientation === 'portrait'
                    ? 'portrait'
                    : DEFAULT_CONFIG.orientation,
            signatureCount: [0, 1, 2].includes(Number(map.signatureCount))
                ? (Number(map.signatureCount) as 0 | 1 | 2)
                : DEFAULT_CONFIG.signatureCount,
            watermarkEnabled:
                map.watermarkEnabled === 'true'
                    ? true
                    : map.watermarkEnabled === 'false'
                        ? false
                        : DEFAULT_CONFIG.watermarkEnabled,
            showQrCode: map.showQrCode !== 'false',
            logoPosition: map.logoPosition === 'right' ? 'right' : 'left',
            backgroundTemplate: map.backgroundTemplate || 'none',
            customBackgroundUrl: map.customBackgroundUrl || '',
            textStyles,
        }

        return NextResponse.json({
            success: true,
            config,
        })
    } catch (error) {
        if (isMissingRangeError(error)) {
            return NextResponse.json({ success: true, config: DEFAULT_CONFIG })
        }
        console.error('GET CERT CONFIG ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to fetch certificate config' },
            { status: 500 }
        )
    }
}

/* -------------------- POST -------------------- */
export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Partial<CertificateConfig>
        const config: CertificateConfig = {
            ...DEFAULT_CONFIG,
            ...body,
        }
        try {
            await saveConfig(config)
        } catch (error) {
            if (!isMissingRangeError(error)) {
                throw error
            }
            await createConfigSheetIfMissing()
            await saveConfig(config)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('SAVE CERT CONFIG ERROR:', error)
        return NextResponse.json(
            { error: 'Failed to save certificate config' },
            { status: 500 }
        )
    }
}
