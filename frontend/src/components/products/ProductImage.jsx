import { useEffect, useState } from 'react'
import { Icon } from '../common/Icon.jsx'
import { getAccessToken } from '../../redux/Api/auth/AuthApi.js'

export function ProductImage({ product, className = '' }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!product?.hasImage) return undefined
    const controller = new AbortController()
    let objectUrl
    fetch(`/v1/products/${product.id}/image`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      signal: controller.signal,
    }).then((response) => {
      if (!response.ok) throw new Error('Image unavailable')
      return response.blob()
    }).then((blob) => {
      if (controller.signal.aborted) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(() => {})
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [product?.id, product?.hasImage, product?.updatedAt])

  return <div className={`seller-product-image ${className}`}>{product.hasImage && url ? <img src={url} alt={product.title}/> : <span><Icon name="image" size={34}/></span>}</div>
}
