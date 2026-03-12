'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const phoneRegex = /^[6-9]\d{9}$/

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  mobileNo: z
    .string()
    .regex(phoneRegex, 'Enter a valid 10-digit mobile number'),
  whatsappNo: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || phoneRegex.test(value), {
      message: 'Enter a valid 10-digit WhatsApp number',
    }),
  instituteName: z.string().optional(),
  roleLabel: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type EventInfo = {
  id: string
  name: string
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  fromDate: string
  toDate: string
  posterUrl?: string | null
  meetingLink?: string | null
  contactEmail: string
  contactMobile: string
}

export default function EventRegistrationPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [event, setEvent] = useState<EventInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      mobileNo: '',
      whatsappNo: '',
      instituteName: '',
      roleLabel: '',
    },
  })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/events/${slug}`)
        if (!res.ok) {
          throw new Error('Event not found')
        }
        const data = await res.json()
        setEvent(data.event)
      } catch (error) {
        console.error(error)
        toast.error('Failed to load event')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }

      toast.success('Registration successful. Confirmation email sent.')
      form.reset()
      setRegistered(true)
    } catch (error) {
      console.error(error)
      toast.error('Registration failed')
    } finally {
      setSubmitting(false)
    }
  })

  if (loading) {
    return <main className="p-10">Loading...</main>
  }

  if (!event) {
    return <main className="p-10">Event not found</main>
  }

  if (registered) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Registration Confirmed</CardTitle>
            <CardDescription>
              You have successfully registered for {event.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent. Please keep your email and
              phone accessible for event updates.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/">
                <Button>Return to Home</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setRegistered(false)}
              >
                Register Another Participant
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>
            {event.mode} | {new Date(event.fromDate).toLocaleDateString()} - {new Date(event.toDate).toLocaleDateString()}
          </CardDescription>
          {event.meetingLink ? (
            <p className="text-sm">
              Meeting Link:{' '}
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {event.meetingLink}
              </a>
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Use valid email, mobile, and WhatsApp numbers. These are used for
              confirmation and event communication.
            </div>

            <div>
              <Label>Full Name</Label>
              <Input {...form.register('fullName')} />
              {form.formState.errors.fullName?.message ? (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.fullName.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" {...form.register('email')} />
              <p className="mt-1 text-xs text-muted-foreground">
                Email will receive registration confirmation and event updates.
              </p>
              {form.formState.errors.email?.message ? (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label>Mobile No</Label>
              <Input
                maxLength={10}
                placeholder="10-digit mobile number"
                {...form.register('mobileNo')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Primary contact number for event reminders.
              </p>
              {form.formState.errors.mobileNo?.message ? (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.mobileNo.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label>WhatsApp No</Label>
              <Input
                maxLength={10}
                placeholder="10-digit WhatsApp number (optional)"
                {...form.register('whatsappNo')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional, but recommended for quick event communication.
              </p>
              {form.formState.errors.whatsappNo?.message ? (
                <p className="mt-1 text-xs text-red-600">
                  {form.formState.errors.whatsappNo.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label>Institute Name</Label>
              <Input {...form.register('instituteName')} />
            </div>
            <div>
              <Label>Role (Student/Professor/etc)</Label>
              <Input {...form.register('roleLabel')} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
