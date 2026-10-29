import wasmUrl from '@jsquash/webp/codec/enc/webp_enc.wasm?url'
import simdWasmUrl from '@jsquash/webp/codec/enc/webp_enc_simd.wasm?url'

// canvas.toBlob('image/webp') 는 Safari 에서 webp 를 만들지 못해(PNG 로 대체) wasm 인코더를 쓴다.
// 인코더는 업로드할 때만 불러온다. wasm 주소는 Vite 가 내보낸 파일로 직접 알려준다.
let encoderReady: Promise<typeof import('@jsquash/webp/encode.js')> | null = null
function loadEncoder() {
  encoderReady ??= import('@jsquash/webp/encode.js').then(async (mod) => {
    await mod.init({
      locateFile: (path: string) => (path.endsWith('_simd.wasm') ? simdWasmUrl : wasmUrl),
    })
    return mod
  })
  return encoderReady
}

/** 이미지 파일을 긴 변이 maxSide 이하가 되도록 줄여 webp 로 만든다. (더 작으면 그대로 크기 유지) */
export async function toWebp(
  file: File,
  maxSide: number,
  quality = 75,
): Promise<{ blob: Blob; width: number; height: number }> {
  const [encoder, bitmap] = await Promise.all([loadEncoder(), createImageBitmap(file)])
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('이미지를 변환할 수 없습니다.')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const buffer = await encoder.default(ctx.getImageData(0, 0, width, height), { quality })
    return { blob: new Blob([buffer], { type: 'image/webp' }), width, height }
  } finally {
    bitmap.close()
  }
}
