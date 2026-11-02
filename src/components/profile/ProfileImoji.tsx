// IMOJI 의 code(tiger, rabbit ...) 를 화면에 그릴 이모지. 목록에 없는 code 는 글자 그대로 보인다.
const IMOJI: Record<string, string> = {
  rat: '🐭',
  ox: '🐮',
  tiger: '🐯',
  rabbit: '🐰',
  cat: '🐱',
  dog: '🐶',
  bear: '🐻',
  fox: '🦊',
  panda: '🐼',
  koala: '🐨',
  lion: '🦁',
  monkey: '🐵',
  pig: '🐷',
  cow: '🐮',
  mouse: '🐭',
  hamster: '🐹',
  frog: '🐸',
  rooster: '🐔',
  snake: '🐍',
  horse: '🐴',
  sheep: '🐑',
  elephant: '🐘',
  whale: '🐳',
  penguin: '🐧',
  owl: '🦉',
  unicorn: '🦄',
  dragon: '🐲',
}

export type ProfileImg = { code: string; type?: string | null }

/** 프로필 이모지 한 개. CUSTOM 은 code 가 이미지 주소다. */
export function ProfileImoji({ img, size = 40 }: { img: ProfileImg; size?: number }) {
  if (img.type === 'CUSTOM') {
    return (
      <img
        src={img.code}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  const emoji = IMOJI[img.code.toLowerCase()]
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center leading-none"
      style={{ width: size, height: size, fontSize: emoji ? size * 0.8 : size * 0.3 }}
    >
      {emoji ?? img.code}
    </span>
  )
}
