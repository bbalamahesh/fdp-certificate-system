export function slugifyEventName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function uniqueEventSlug(base: string) {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`
}

export function toIcsDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds()
  )}Z`
}

export function buildEventIcs(args: {
  uid: string
  title: string
  description: string
  location?: string
  start: Date
  end: Date
}) {
  const now = toIcsDate(new Date())
  const start = toIcsDate(args.start)
  const end = toIcsDate(args.end)
  const location = (args.location || '').replace(/\n/g, ' ')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Certifyed//Event Registration//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${args.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${args.title}`,
    `DESCRIPTION:${args.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
