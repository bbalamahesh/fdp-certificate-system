'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  Search,
  Mail,
  Trash2,
  RefreshCcw,
  Copy,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Registration {
  id: number
  timestamp: string
  title: string
  name: string
  email: string
  phone: string
  organization: string
  certificate_id: string
}

const PAGE_SIZE = 10

export default function RegistrationsTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // pagination
  const [page, setPage] = useState(1)

  /* -------------------- DATA -------------------- */
  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    try {
      const res = await fetch('/api/admin/registrations')
      const data = await res.json()
      if (data.success) {
        setRegistrations(data.registrations)
      }
    } finally {
      setLoading(false)
    }
  }

  /* -------------------- FILTER + PAGINATION -------------------- */
  const filteredData = registrations.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.certificate_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)

  const paginatedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  /* -------------------- SELECTION -------------------- */
  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map((r) => r.id)
    const allSelected = pageIds.every((id) => selectedIds.includes(id))

    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...prev, ...pageIds.filter((id) => !prev.includes(id))]
    )
  }

  const selectedRegistrations = registrations.filter((r) =>
    selectedIds.includes(r.id)
  )

  /* -------------------- ACTIONS -------------------- */
  const resend = async (email: string) => {
    await fetch('/api/admin/resend-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  }

  const remove = async (email: string) => {
    await fetch('/api/admin/delete-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    loadRegistrations()
  }

  const bulkResend = async () => {
    for (const r of selectedRegistrations) await resend(r.email)
    setSelectedIds([])
  }

  const bulkDelete = async () => {
    for (const r of selectedRegistrations) await remove(r.email)
    setSelectedIds([])
  }

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value)
  }

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-9"
            placeholder="Search name, email, or certificate ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRegistrations}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setSelectedIds([])}>
            Deselect All
          </Button>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.length > 0 && (
        <div className="flex gap-3 items-center p-3 border rounded-md bg-muted">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <Button variant="outline" onClick={bulkResend}>
            Bulk Resend
          </Button>
          <Button variant="destructive" onClick={bulkDelete}>
            Bulk Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    paginatedData.length > 0 &&
                    paginatedData.every((r) =>
                      selectedIds.includes(r.id)
                    )
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>#</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Certificate ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(r.id)}
                    onCheckedChange={() => toggleRow(r.id)}
                  />
                </TableCell>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.timestamp}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.email}</TableCell>

                {/* Certificate ID */}
                <TableCell className="font-mono text-xs flex items-center gap-2">
                  {r.certificate_id}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(r.certificate_id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TableCell>

                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resend(r.email)}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(r.email)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </Button>

        <span className="text-sm px-2">
          Page {page} of {totalPages}
        </span>

        <Button
          size="sm"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
