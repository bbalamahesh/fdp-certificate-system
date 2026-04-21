import { NextResponse } from 'next/server'
import type { CertificateConfig } from '@/lib/certificates/renderCertificate'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

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
      typeof base.showQrCode === 'boolean' ? base.showQrCode : DEFAULT_CONFIG.showQrCode,
    logoPosition: base.logoPosition === 'right' ? 'right' : 'left',
    backgroundTemplate: base.backgroundTemplate || 'none',
    customBackgroundUrl: base.customBackgroundUrl || '',
    textStyles: base.textStyles || {},
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const existing = await db.certificateConfig.findUnique({
      where: { eventId: params.eventId },
      select: { data: true },
    })

    return NextResponse.json({
      success: true,
      config: sanitizeConfig((existing?.data as Partial<CertificateConfig>) || {}),
    })
  } catch (error) {
    console.error('GET_EVENT_CERT_CONFIG_ERROR', error)
    return NextResponse.json({ error: 'Failed to fetch certificate config' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const payload = (await req.json()) as Partial<CertificateConfig>
    const config = sanitizeConfig(payload)

    await db.certificateConfig.upsert({
      where: { eventId: params.eventId },
      create: {
        eventId: params.eventId,
        data: config as unknown as Prisma.InputJsonValue,
      },
      update: {
        data: config as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SAVE_EVENT_CERT_CONFIG_ERROR', error)
    return NextResponse.json({ error: 'Failed to save certificate config' }, { status: 500 })
  }
}
