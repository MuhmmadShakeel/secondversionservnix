import { ApiError } from '../common/utils/ApiError.js'

export const productIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const maxImageBytes = 5 * 1024 * 1024

function requiredText(value, label, min, max) {
  if (typeof value !== 'string') throw new ApiError(400, `${label} is required.`)
  const text = value.trim().replace(/\s+/g, ' ')
  if (text.length < min || text.length > max) throw new ApiError(400, `${label} must be between ${min} and ${max} characters.`)
  return text
}

export function validateProductImage(value) {
  if (value === null) return null
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !['fileName', 'mimeType', 'base64'].includes(key))) {
    throw new ApiError(400, 'Choose a valid product image.')
  }
  const fileName = requiredText(value.fileName, 'Image name', 1, 180)
  if (/[\\/\x00-\x1f]/.test(fileName)) throw new ApiError(400, 'Invalid image name.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(value.mimeType)) throw new ApiError(400, 'Use a JPEG, PNG, or WebP image.')
  if (typeof value.base64 !== 'string' || value.base64.length > Math.ceil(maxImageBytes / 3) * 4 + 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.base64)) {
    throw new ApiError(400, 'Image data is invalid or too large.')
  }
  const content = Buffer.from(value.base64, 'base64')
  if (!content.length || content.length > maxImageBytes) throw new ApiError(400, 'Image must be at most 5 MB.')
  const valid = value.mimeType === 'image/png'
    ? content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : value.mimeType === 'image/jpeg'
      ? content[0] === 0xff && content[1] === 0xd8 && content.at(-2) === 0xff && content.at(-1) === 0xd9
      : content.toString('ascii', 0, 4) === 'RIFF' && content.toString('ascii', 8, 12) === 'WEBP'
  if (!valid) throw new ApiError(400, 'Image file does not match its format.')
  return { fileName, mimeType: value.mimeType, content }
}

export function validateProduct(input) {
  const fields = ['title', 'category', 'description', 'price', 'quantity', 'status', 'image']
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !fields.includes(key))) {
    throw new ApiError(400, 'Enter valid product details.')
  }
  const price = String(input.price ?? '')
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(price)) throw new ApiError(400, 'Price must be a non-negative amount with up to two decimal places.')
  const quantityText = String(input.quantity ?? '')
  if (!/^(0|[1-9]\d{0,5})$/.test(quantityText)) throw new ApiError(400, 'Quantity must be between 0 and 999999.')
  const status = input.status ?? 'draft'
  if (!['draft', 'active'].includes(status)) throw new ApiError(400, 'Choose Draft or Active status.')
  return {
    title: requiredText(input.title, 'Title', 3, 160),
    category: requiredText(input.category, 'Category', 2, 80),
    description: requiredText(input.description, 'Description', 10, 3000),
    price,
    quantity: Number(quantityText),
    status,
    image: input.image === undefined ? undefined : validateProductImage(input.image),
  }
}
