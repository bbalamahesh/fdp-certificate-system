'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Loader2,
  Search,
  Trash2,
  RefreshCcw,
  Pencil,
  Save,
} from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CertificatePreviewFrame from './CertificatePreviewFrame'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

interface Registration {
  id: number
  sheetRow: number
  timestamp: string
  title: string
  name: string
  email: string
  phone: string
  organization: string

  // existing (keep it if backend still sends this)
  certificateId?: string

  // NEW (used for View / Download)
  certificate_id?: string
  certificate_issued_at?: string
}

const PAGE_SIZE = 10

export default function RegistrationsTable() {
  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk' | null>(null)
  const [rowToDelete, setRowToDelete] = useState<Registration | null>(null)

  // selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // pagination
  const [page, setPage] = useState(1)

  // single edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<Registration>>({})
  const [originalRow, setOriginalRow] =
    useState<Registration | null>(null)


  const [pendingDeletes, setPendingDeletes] = useState<Registration[]>([])

  const [previewCertificateId, setPreviewCertificateId] =
    useState<string | null>(null)
  /* -------------------- DATA -------------------- */
  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    const res = await fetch('/api/admin/registrations')
    const data = await res.json()
    setRegistrations(data.registrations || [])
    setLoading(false)
  }

  /* -------------------- FILTER + PAGINATION -------------------- */
  const filtered = registrations.filter((r) =>
    [
      r.name,
      r.email,
      r.phone,
      r.organization,
      r.title,
      r.certificateId,
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  /* -------------------- SELECTION -------------------- */
  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pageIds = paginated.map((r) => r.id)
    const allSelected = pageIds.every((id) =>
      selectedIds.includes(id)
    )

    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...prev, ...pageIds.filter((id) => !prev.includes(id))]
    )
  }

  const selectedRows = registrations.filter((r) =>
    selectedIds.includes(r.id)
  )

  /* -------------------- SINGLE EDIT -------------------- */
  const startEdit = (row: Registration) => {
    setEditingId(row.id)
    setEditValues(row)
    setOriginalRow(row)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
    setOriginalRow(null)
  }

  const saveEdit = async () => {
    if (!originalRow || !editingId) return

    setSaving(true)

    // Optimistic UI
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === editingId ? { ...r, ...editValues } : r
      )
    )

    try {
      const payload = {
        sheetRow: originalRow.sheetRow,
        title: editValues.title ?? originalRow.title,
        name: editValues.name ?? originalRow.name,
        email: editValues.email ?? originalRow.email,
        phone: editValues.phone ?? originalRow.phone,
        organization:
          editValues.organization ?? originalRow.organization,
      }

      const res = await fetch('/api/admin/update-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success('Changes saved')

      setEditingId(null)
      setEditValues({})
      setOriginalRow(null)

      loadRegistrations()
    } catch {
      // rollback
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === originalRow.id ? originalRow : r
        )
      )
      toast.error('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* -------------------- DELETE -------------------- */
  const removeWithUndo = (
    row: Registration,
    showToast: boolean = true
  ) => {
    // remove from UI
    setRegistrations((prev) =>
      prev.filter((r) => r.id !== row.id)
    )

    const timeoutId = setTimeout(async () => {
      await fetch('/api/admin/delete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: row.email }),
      })
    }, 5000)

    if (showToast) {
      toast.message('Registration deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            clearTimeout(timeoutId)
            setRegistrations((prev) =>
              [...prev, row].sort((a, b) => a.id - b.id)
            )
          },
        },
      })
    }

    return timeoutId
  }

  const confirmDelete = () => {
    if (deleteMode === 'single' && rowToDelete) {
      removeWithUndo(rowToDelete)
    }

    if (deleteMode === 'bulk') {
      bulkDelete()
    }

    setConfirmOpen(false)
    setRowToDelete(null)
    setDeleteMode(null)
  }

  const bulkDelete = () => {
    const rows = selectedRows
    setSelectedIds([])

    const timeouts = rows.map((row) =>
      removeWithUndo(row, false) // 👈 NO per-row toast
    )

    toast.message(`${rows.length} registrations deleted`, {
      action: {
        label: 'Undo',
        onClick: () => {
          timeouts.forEach(clearTimeout)

          setRegistrations((prev) => {
            const restored = [...prev, ...rows]
            return restored.sort((a, b) => a.id - b.id)
          })
        },
      },
    })
  }



  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const generateCertificate = async (row: Registration) => {
    if (!row.email || !row.email.includes('@')) {
      toast.error('Invalid email address')
      return
    }
    try {
      setGeneratingId(row.id)

      const res = await fetch('/api/admin/certificate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetRow: row.sheetRow,
          name: row.name,
          email: row.email,
          eventId: 'default-event',
        }),
      })

      if (!res.ok) {
        const data = await res.json()

        if (res.status === 409) {
          toast.error(
            'Certificate already issued. You can view or download it.'
          )
          loadRegistrations()
          return
        }

        throw new Error(data?.error || 'Failed to generate certificate')
      }

      toast.success('Certificate generated')
      loadRegistrations()
    } catch (e: any) {
      console.error('Generate failed:', e)

      toast.error(
        e?.message?.replace(/^Error:\s*/, '') ||
        'Failed to generate certificate'
      )
    } finally {
      setGeneratingId(null)
    }
  }

  const bulkGenerateCertificates = async () => {
    const rows = selectedRows.map((r) => ({
      sheetRow: r.sheetRow,
      name: r.name,
      email: r.email,
    }))

    if (rows.length === 0) return

    const toastId = toast.loading(
      `Generating ${rows.length} certificates...`
    )

    try {
      const res = await fetch('/api/admin/certificate/bulk-generate', { ... })

      const data = await res.json()

      toast.dismiss(toastId)

      toast.success(
        `Done! Generated: ${data.summary.generated}, Skipped: ${data.summary.skipped}, Failed: ${data.summary.failed}`
      )

      loadRegistrations()
      setSelectedIds([])
    } catch (e: any) {
      toast.dismiss(toastId)
      toast.error(e.message || 'Bulk generation failed')
    }

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.error || 'Bulk failed')
    }

    toast.success(
      `Done! Generated: ${data.summary.generated}, Skipped: ${data.summary.skipped}, Failed: ${data.summary.failed}`
    )

    loadRegistrations()
    setSelectedIds([])
  } catch (e: any) {
    toast.error(e.message || 'Bulk generation failed')
  }
}


return (

  <div className="space-y-4">
    {/* Search */}
    <div className="flex justify-between">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        <Input
          className="pl-9"
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <Button variant="outline" onClick={loadRegistrations}>
        <RefreshCcw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>

    {/* Bulk bar */}
    <div className="flex gap-3 items-center p-3 border rounded-md bg-muted">
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>

      <Button
        variant="destructive"
        disabled={selectedIds.length < 2 || saving || editingId !== null}
        onClick={() => {
          setDeleteMode('bulk')
          setConfirmOpen(true)
        }}
      >
        Bulk Delete
      </Button>

      <Button
        disabled={
          selectedIds.length === 0 ||
          saving ||
          editingId !== null
        }
        onClick={bulkGenerateCertificates}
      >
        Bulk Generate Certificates
      </Button>

      {selectedIds.length === 1 && (
        <span className="text-xs text-muted-foreground">
          Select at least 2 rows for bulk delete
        </span>
      )}

    </div>

    {/* Table */}
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={
                  paginated.length > 0 &&
                  paginated.every((r) =>
                    selectedIds.includes(r.id)
                  )
                }
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Org</TableHead>
            <TableHead>Edit</TableHead>
            <TableHead>Certificate</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead>Certificate Id</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginated.map((r) => {
            const certId = r.certificateId

            return (
              <TableRow key={r.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(r.id)}
                    onCheckedChange={() => toggleRow(r.id)}
                    disabled={editingId !== null || saving}
                  />
                </TableCell>

                {(['name', 'email', 'title', 'phone', 'organization'] as const).map(
                  (field) => (
                    <TableCell key={field}>
                      {editingId === r.id ? (
                        <Input
                          value={(editValues[field] as string) || ''}
                          onChange={(e) =>
                            setEditValues((v) => ({
                              ...v,
                              [field]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        r[field] || '—'
                      )}
                    </TableCell>
                  )
                )}

                <TableCell>
                  {editingId === r.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(r)}
                      disabled={saving}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {!certId ? (
                    <Button
                      size="sm"
                      onClick={() => generateCertificate(r)}
                      disabled={generatingId === r.id}
                    >
                      {generatingId === r.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        'Generate'
                      )}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewCertificateId(certId)}
                      >
                        View
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          window.open(`/api/admin/certificate/${certId}`, '_blank')
                        }
                      >
                        Download
                      </Button>
                      {certId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await fetch('/api/admin/resend-certificate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ certificate_id: certId }),
                              })

                              toast.success('Certificate email re-sent')
                            } catch (e: any) {
                              if (e?.message?.includes('already issued')) {
                                toast.error(
                                  'Certificate already generated. You can view or download it.'
                                )
                                loadRegistrations()
                              } else {
                                toast.error('Failed to generate certificate')
                              }
                            }
                          }}
                        >
                          Resend Email
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={saving}
                    onClick={() => {
                      setDeleteMode('single')
                      setRowToDelete(r)
                      setConfirmOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {certId || '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>

    {/* Pagination */}
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={page === 1}
        onClick={() => setPage((p) => p - 1)}
      >
        Prev
      </Button>

      <span className="text-sm px-2 flex items-center">
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
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleteMode === 'bulk'
              ? 'Delete registrations?'
              : 'Delete registration?'}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {deleteMode === 'bulk'
              ? `Are you sure you want to delete ${selectedIds.length} registrations? This action can be undone for a short time.`
              : 'Are you sure you want to delete this registration? This action can be undone for a short time.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={confirmDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <Dialog
      open={!!previewCertificateId}
      onOpenChange={() => setPreviewCertificateId(null)}
    >
      <DialogContent className="max-w-5xl">
        {previewCertificateId && (
          <CertificatePreviewFrame
            certificate_id={previewCertificateId}
          />
        )}
      </DialogContent>
    </Dialog>
  </div>
)
}
