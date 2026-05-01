export const NICARAGUA_TIME_ZONE = 'America/Managua'

type SupportedRange = 'daily' | 'weekly' | 'monthly'

type DateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NICARAGUA_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const displayFormatter = new Intl.DateTimeFormat('es-NI', {
  timeZone: NICARAGUA_TIME_ZONE,
  dateStyle: 'short',
  timeStyle: 'medium',
})

function getNicaraguaDateParts(date: Date) {
  const parts = dateTimeFormatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== 'literal') {
      accumulator[part.type] = part.value
    }

    return accumulator
  }, {})

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

function getNicaraguaOffsetInMinutes(date: Date) {
  const parts = getNicaraguaDateParts(date)
  const utcTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)

  return (utcTime - date.getTime()) / 60000
}

function shiftDateParts(parts: DateParts, { days = 0, months = 0 }: { days?: number; months?: number }) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))

  if (days !== 0) shifted.setUTCDate(shifted.getUTCDate() + days)
  if (months !== 0) shifted.setUTCMonth(shifted.getUTCMonth() + months)

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  }
}

function getNicaraguaMidnightUtc({ year, month, day }: { year: number; month: number; day: number }) {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0)
  const offset = getNicaraguaOffsetInMinutes(new Date(utcGuess))

  return new Date(utcGuess - offset * 60000)
}

export function getStartOfNicaraguaDay(date = new Date()) {
  const { year, month, day } = getNicaraguaDateParts(date)

  return getNicaraguaMidnightUtc({ year, month, day }).toISOString()
}

export function getStartOfNicaraguaRange(range: SupportedRange, date = new Date()) {
  const currentDate = getNicaraguaDateParts(date)

  if (range === 'daily') {
    return getStartOfNicaraguaDay(date)
  }

  if (range === 'weekly') {
    const weeklyStart = shiftDateParts(currentDate, { days: -6 })
    return getNicaraguaMidnightUtc(weeklyStart).toISOString()
  }

  const monthlyStart = shiftDateParts(currentDate, { months: -1 })
  return getNicaraguaMidnightUtc(monthlyStart).toISOString()
}

export function formatNicaraguaDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return displayFormatter.format(date)
}

export function formatNicaraguaDateForFileName(date = new Date()) {
  const { year, month, day } = getNicaraguaDateParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
