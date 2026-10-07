import { ApiError } from '../common/utils/ApiError.js'

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const amountPattern = /^\d{1,10}(\.\d{1,2})?$/
const mimeTypes = {
  photo: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'],
}
const maxFileBytes = 8 * 1024 * 1024
const maxTotalBytes = 16 * 1024 * 1024

export function assertUuid(value) {
  if (!uuidPattern.test(value || '')) throw new ApiError(400, 'Invalid ID.')
  return value
}

function text(value, label, min, max) {
  if (typeof value !== 'string') throw new ApiError(400, `${label} is required.`)
  const clean = value.trim()
  if (clean.length < min || clean.length > max) throw new ApiError(400, `${label} must be ${min}–${max} characters.`)
  return clean
}

function amount(value, label) {
  const result = String(value ?? '')
  if (!amountPattern.test(result)) throw new ApiError(400, `${label} must be a valid amount with up to two decimals.`)
  return result
}

function exactFields(input, allowed) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !allowed.includes(key))) {
    throw new ApiError(400, 'Invalid details supplied.')
  }
}

export function validateRequirement(input) {
  exactFields(input, ['title', 'category', 'description', 'budgetMin', 'budgetMax', 'status', 'media'])
  const budgetMin = amount(input.budgetMin, 'Minimum budget')
  const budgetMax = amount(input.budgetMax, 'Maximum budget')
  if (Number(budgetMax) < Number(budgetMin)) throw new ApiError(400, 'Maximum budget must be at least the minimum budget.')
  const status = input.status ?? 'open'
  if (!['open', 'closed'].includes(status)) throw new ApiError(400, 'Choose Open or Closed status.')
  return {
    title: text(input.title, 'Title', 5, 160),
    category: text(input.category, 'Category', 2, 80),
    description: text(input.description, 'Description', 20, 5000),
    budgetMin, budgetMax, status,
    media: input.media === undefined ? undefined : validateMedia(input.media),
  }
}

export function validateProposal(input) {
  exactFields(input, ['coverLetter', 'bidAmount', 'deliveryDays'])
  const days = String(input.deliveryDays ?? '')
  if (!/^[1-9]\d{0,2}$/.test(days) || Number(days) > 365) throw new ApiError(400, 'Delivery time must be 1–365 days.')
  return {
    coverLetter: text(input.coverLetter, 'Proposal', 30, 3000),
    bidAmount: amount(input.bidAmount, 'Bid'),
    deliveryDays: Number(days),
  }
}

export function validateMedia(files) {
  if (!Array.isArray(files) || files.length > 3) throw new ApiError(400, 'Attach up to three files.')
  let total = 0
  return files.map((file) => {
    if (!file || typeof file !== 'object' || !mimeTypes[file.kind]?.includes(file.mimeType)) {
      throw new ApiError(400, 'Choose a supported photo, video or audio file.')
    }
    const fileName = text(file.fileName, 'File name', 1, 180)
    if (/[\\/\x00-\x1f]/.test(fileName)) throw new ApiError(400, 'Invalid file name.')
    if (typeof file.base64 !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.base64)) {
      throw new ApiError(400, 'Invalid attachment data.')
    }
    if (file.base64.length > Math.ceil(maxFileBytes / 3) * 4 + 4) throw new ApiError(400, 'Each attachment must be at most 8 MB.')
    const content = Buffer.from(file.base64, 'base64')
    if (!content.length || content.length > maxFileBytes) throw new ApiError(400, 'Each attachment must be 1 byte to 8 MB.')
    total += content.length
    if (total > maxTotalBytes) throw new ApiError(400, 'Attachments must total at most 16 MB.')
    return { kind: file.kind, mimeType: file.mimeType, fileName, content }
  })
}
