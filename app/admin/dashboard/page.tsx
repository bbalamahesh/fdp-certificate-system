'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Eye } from 'lucide-react'

import RegistrationsTable from '@/components/admin/RegistrationsTable'
import CertificatePreviewFrame from '@/components/admin/CertificatePreviewFrame'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [previewKey, setPreviewKey] = useState(0)
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Registrations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Registrations</h2>
          </div>

          <RegistrationsTable />
        </Card>

        {/* Certificate Preview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                Live Certificate Preview
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  '/api/admin/certificate/preview?eventId=default-event',
                  '_blank'
                )
              }
            >
              Open in new tab
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            This preview reflects the latest saved certificate settings and
            event-specific content.
          </p>

          <CertificatePreviewFrame eventId="default-event" refreshKey={previewKey} />
        </Card>
      </main>
    </div>
  )
}
