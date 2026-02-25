const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

const parseJson = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const toJson = (value) => {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export { isRecord, parseJson, toJson }