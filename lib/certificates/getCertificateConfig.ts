import type { CertificateConfig } from './renderCertificate'
import { google } from 'googleapis'
import { db } from '@/lib/db'

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

function sanitizeConfig(input: Partial<CertificateConfig> | null | undefined): CertificateConfig {
    const base = input || {}
    const signatureCount = Number(base.signatureCount)
    return {
        ...DEFAULT_CONFIG,
        ...base,
        orientation: base.orientation === 'portrait' ? 'portrait' : 'landscape',
        signatureCount: [0, 1, 2].includes(signatureCount)
            ? (signatureCount as 0 | 1 | 2)
            : DEFAULT_CONFIG.signatureCount,
        watermarkEnabled:
            typeof base.watermarkEnabled === 'boolean'
                ? base.watermarkEnabled
                : DEFAULT_CONFIG.watermarkEnabled,
        showQrCode:
            typeof base.showQrCode === 'boolean'
                ? base.showQrCode
                : DEFAULT_CONFIG.showQrCode,
        logoPosition: base.logoPosition === 'right' ? 'right' : 'left',
        backgroundTemplate: base.backgroundTemplate || 'none',
        customBackgroundUrl: base.customBackgroundUrl || '',
        textStyles: base.textStyles || {},
    }
}

export async function getCertificateConfigForOrg(
    eventId?: string
): Promise<CertificateConfig> {
    try {
        if (eventId) {
            const existing = await db.certificateConfig.findUnique({
                where: { eventId },
                select: { data: true },
            })
            if (existing?.data) {
                return sanitizeConfig(existing.data as Partial<CertificateConfig>)
            }
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        const sheets = google.sheets({ version: 'v4', auth })
        const spreadsheetId = process.env.GOOGLE_SHEET_ID!

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'CertificateConfig!A:B',
        })

        const rows = res.data.values ?? []

        // Expecting:
        // key | value
        const map = Object.fromEntries(rows.slice(1))
        let textStyles: CertificateConfig['textStyles'] = {}
        try {
            textStyles = map.textStyles ? JSON.parse(map.textStyles) : {}
        } catch {
            textStyles = {}
        }

        return sanitizeConfig({
            title: map.title || DEFAULT_CONFIG.title,
            eventType: map.eventType || '',
            subtitle1: map.subtitle1 || '',
            subtitle2: map.subtitle2 || '',
            orientation: map.orientation === 'portrait' ? 'portrait' : 'landscape',
            signatureCount: [0, 1, 2].includes(Number(map.signatureCount))
                ? (Number(map.signatureCount) as 0 | 1 | 2)
                : DEFAULT_CONFIG.signatureCount,
            watermarkEnabled: map.watermarkEnabled !== 'false',
            showQrCode: map.showQrCode !== 'false',
            logoPosition: map.logoPosition === 'right' ? 'right' : 'left',
            backgroundTemplate: map.backgroundTemplate || 'none',
            customBackgroundUrl: map.customBackgroundUrl || '',
            textStyles,
        })
    } catch (error) {
        console.warn(
            '[CertificateConfig] Falling back to defaults',
            error
        )

        return DEFAULT_CONFIG
    }
}
