const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const textOf = (value) => String(value ?? '').trim()

const toError = (error) => {
  return error instanceof Error
    ? error.message
    : String(error?.message || error || 'unknown error')
}

const toJson = (value) => {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const parseJson = (raw) => {
  if (isRecord(raw)) return raw
  if (typeof raw !== 'string') return null
  try {
    let parsed = JSON.parse(raw)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

const pickOptions = (source, keys) => {
  return Object.fromEntries(
    keys.flatMap((key) => source?.[key] === undefined ? [] : [[key, source[key]]])
  )
}

export { isRecord, textOf, toError, toJson, parseJson, pickOptions }