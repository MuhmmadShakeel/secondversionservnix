import { useState } from 'react'
import { SurfaceModal } from '../common/UiParts.jsx'
import { Icon } from '../common/Icon.jsx'
import { authErrorMessage } from '../../redux/Api/auth/AuthApi.js'
import { ProductImage } from './ProductImage.jsx'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageBytes = 5 * 1024 * 1024

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ fileName: file.name, mimeType: file.type, base64: String(reader.result).split(',')[1] })
    reader.onerror = () => reject(new Error('Could not read the image. Please try another file.'))
    reader.readAsDataURL(file)
  })
}

export function ProductForm({ product, onClose, onSave, isSaving }) {
  const [error, setError] = useState('')
  const [image, setImage] = useState(undefined)
  const [removeImage, setRemoveImage] = useState(false)
  const [status, setStatus] = useState(product?.status || 'draft')

  async function chooseImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    if (!allowedTypes.includes(file.type)) return setError('Choose a JPEG, PNG, or WebP image.')
    if (file.size > maxImageBytes) return setError('Image must be at most 5 MB.')
    try { setImage(await readImage(file)); setRemoveImage(false) }
    catch (failure) { setError(failure.message) }
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const quantity = Number(form.get('quantity'))
    const hasImage = Boolean(image || (product?.hasImage && !removeImage))
    if (status === 'active' && (!hasImage || quantity === 0)) return setError('Add a product image and at least one item in stock before publishing.')
    const details = {
      title: form.get('title').trim(),
      category: form.get('category').trim(),
      description: form.get('description').trim(),
      price: form.get('price'),
      quantity,
      status,
    }
    if (image) details.image = image
    else if (removeImage) details.image = null
    try { await onSave(details) } catch (failure) { setError(authErrorMessage(failure)) }
  }

  return <SurfaceModal title={product ? 'Edit product' : 'Add a product'} onClose={onClose}>
    <form className="product-form" onSubmit={submit}>
      <div className="product-form-intro"><span className="product-form-step">01 / PRODUCT DETAILS</span><p>Show buyers exactly what they will receive. Save a draft while you prepare your listing.</p></div>
      <label>Product name<input name="title" defaultValue={product?.title || ''} minLength="3" maxLength="160" placeholder="e.g. Handcrafted ceramic mug" required /></label>
      <label>Category<input name="category" defaultValue={product?.category || ''} minLength="2" maxLength="80" list="product-categories" placeholder="Choose or enter a category" required /><datalist id="product-categories"><option value="Home & Living"/><option value="Electronics"/><option value="Fashion"/><option value="Beauty"/><option value="Accessories"/><option value="Other"/></datalist></label>
      <label>Description<textarea name="description" defaultValue={product?.description || ''} minLength="10" maxLength="3000" rows="5" placeholder="Materials, size, condition, and what makes this product special" required /></label>
      <div className="product-form-row"><label>Price (Rs.)<input name="price" type="number" min="0" max="9999999999.99" step="0.01" defaultValue={product?.price ?? ''} placeholder="0.00" required /></label><label>Items in stock<input name="quantity" type="number" min="0" max="999999" step="1" defaultValue={product?.quantity ?? 1} required /></label></div>
      <div className="product-image-field"><div><span className="product-form-step">02 / PRODUCT IMAGE</span><p>Use a clear JPEG, PNG, or WebP image, up to 5 MB.</p></div><div className="product-image-preview">{image ? <img src={`data:${image.mimeType};base64,${image.base64}`} alt="New product preview"/> : product?.hasImage && !removeImage ? <ProductImage product={product}/> : <div className="product-image-empty"><Icon name="image" size={30}/><span>Your product image will appear here</span></div>}</div><div className="product-image-controls"><label className="product-upload-button"><Icon name="image" size={16}/>{product?.hasImage || image ? 'Replace image' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage}/></label>{(image || (product?.hasImage && !removeImage)) && <button type="button" onClick={() => { setImage(undefined); setRemoveImage(true) }}>Remove image</button>}</div></div>
      <label>Listing status<select name="status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">Draft — only you can see it</option><option value="active">Active — ready for the marketplace</option></select></label>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="product-form-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" disabled={isSaving}><Icon name="check" size={17}/>{isSaving ? 'Saving...' : product ? 'Save changes' : 'Create product'}</button></div>
    </form>
  </SurfaceModal>
}
