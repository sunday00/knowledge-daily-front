import { findBrandIcon } from '../lib/brandIcon'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  href: string
  size?: number
}

// 0..255 perceived brightness (YIQ)
function brightness(hex: string): number {
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000
}

function resolveFill(hex: string, isDark: boolean): string {
  const y = brightness(hex)
  // 다크모드 + 아주 어두운 로고 → 흰색으로 반전
  if (isDark && y < 50) return '#f3f4f6'
  // 라이트모드 + 아주 밝은 로고 → 어두운 색으로 반전
  if (!isDark && y > 215) return '#111827'
  return `#${hex}`
}

export function BrandIcon({ href, size = 16 }: Props) {
  const { theme } = useTheme()
  const icon = findBrandIcon(href)

  if (!icon) {
    return (
      <span
        role="img"
        aria-label="link"
        className="inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size, fontSize: size }}
      >
        🔗
      </span>
    )
  }

  const fill = resolveFill(icon.hex, theme === 'dark')

  return (
    <svg
      role="img"
      aria-label={icon.title}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      className="shrink-0"
    >
      <path d={icon.path} />
    </svg>
  )
}
