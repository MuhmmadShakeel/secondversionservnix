const allowed = {
  'image/jpeg': 'photo', 'image/png': 'photo', 'image/webp': 'photo',
  'video/mp4': 'video', 'video/webm': 'video',
  'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/webm': 'audio', 'audio/ogg': 'audio',
}

export async function filesToMedia(files) {
  const items = Array.from(files)
  if (items.length > 3) throw new Error('Attach up to three files.')
  const total = items.reduce((sum, file) => sum + file.size, 0)
  if (total > 16 * 1024 * 1024) throw new Error('Attachments must total at most 16 MB.')
  return Promise.all(items.map((file) => {
    if (!allowed[file.type]) throw new Error('Choose PNG, JPG, WEBP, MP4, WEBM, MP3, WAV or OGG files.')
    if (!file.size || file.size > 8 * 1024 * 1024) throw new Error('Each file must be 1 byte to 8 MB.')
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
      reader.onload = () => resolve({ kind: allowed[file.type], mimeType: file.type, fileName: file.name, base64: String(reader.result).split(',')[1] })
      reader.readAsDataURL(file)
    })
  }))
}
