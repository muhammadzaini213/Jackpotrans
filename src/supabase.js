import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Kecilkan gambar (maks 1000px) lalu unggah ke bucket "images". Mengembalikan URL publik.
export async function uploadImage(file) {
  const bitmap = await createImageBitmap(file)
  const k = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * k)
  canvas.height = Math.round(bitmap.height * k)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.8))
  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from('images')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}
