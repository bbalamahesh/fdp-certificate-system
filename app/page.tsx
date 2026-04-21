'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type EventCard = {
  id: string
  slug: string
  name: string
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  fromDate: string
  toDate: string
  posterUrl: string | null
  organizerInstitute: string | null
}

export default function HomePage() {
  const [events, setEvents] = useState<EventCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ; (async () => {
      try {
        const res = await fetch('/api/events')
        const data = await res.json()
        setEvents(data.events || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upcoming Events & Programs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Only super-admin approved events are listed here.
            </p>
          </div>

          <Link href="/admin/events/new">
            <Button>Create Event (Admin)</Button>
          </Link>
        </div>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No approved events yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                {event.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.posterUrl}
                    alt={event.name}
                    className="h-44 w-full object-cover"
                  />
                ) : null}
                <CardHeader className='py-4'>
                  <CardTitle className="line-clamp-2 uppercase">{event.name}</CardTitle>
                  <Separator className="my-4" />
                </CardHeader>
                <CardContent className="space-y-3 text-sm gap-2 flex flex-col">
                  <p className='!mt-0'><strong>Mode:</strong> {event.mode}</p>
                  <p className='!mt-0'>
                    <strong>Dates:</strong> {new Date(event.fromDate).toLocaleDateString()} -{' '}
                    {new Date(event.toDate).toLocaleDateString()}
                  </p>
                  {event.organizerInstitute ? (
                    <p className='!mt-0'><strong>Institute:</strong> {event.organizerInstitute}</p>
                  ) : null}
                  <Link href={`/events/${event.slug}`}>
                    <Button className="w-full">Register</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
