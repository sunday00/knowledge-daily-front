import { useState, type ImgHTMLAttributes } from 'react'

export const MISSING_IMAGE_SRC = '/missing-image.svg'

/**
 * 비상용 이미지: 주소가 비었거나 불러오기에 실패하면(유실, 주소 손상) 대체 그림을 보여준다.
 * 대체 그림으로 바뀐 뒤에는 다시 실패해도 되돌리지 않아 무한 반복하지 않는다.
 */
export function SafeImage({
  src,
  alt = '',
  title,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  // 실패한 주소를 기억해 두면 src 가 바뀌었을 때 자연스럽게 다시 시도한다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const missing = !src || failedSrc === src

  return (
    <img
      {...props}
      src={missing ? MISSING_IMAGE_SRC : src}
      alt={missing ? `${alt ? `${alt} - ` : ''}이미지를 불러올 수 없습니다` : alt}
      title={missing ? '이미지를 불러올 수 없습니다' : title}
      data-missing={missing || undefined}
      onError={(e) => {
        if (!missing && src) setFailedSrc(src)
        onError?.(e)
      }}
    />
  )
}
