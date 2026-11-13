import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { ReactionEmojiGrid } from '@/components/ReactionEmojiGrid.tsx'
import { TAG_ASIDE_CLASS, TAG_LIST_CLASS, TagNavLink } from '@/components/TagSidebar.tsx'
import {
  MyArticleList,
  MyAskList,
  MyOpinionList,
  MyQuizList,
  MyReactedList,
  MyTriedQuizList,
} from '@/components/record/RecordLists.tsx'
import { reactionOf } from '@/lib/reactions.ts'
import { RECORD_MENU, type RecordMenuKey, type RecordType } from '@/lib/myRecord.ts'

const TAB_PARAM = 'tab'
const TYPE_PARAM = 'type'
const REACTION_PARAM = 'r'

/**
 * /user/record — 기록. 왼쪽 메뉴(내 게시글 / 내 의견 / 내 반응 / 내 퀴즈), 오른쪽은 그 아래 탭 + 목록.
 * 내 반응은 이모지를 고르면 그 반응을 남긴 것만 본다(여러 개면 그중 하나라도). 메뉴·탭·이모지는 주소(?tab=&type=&r=a,b)에 둔다.
 */
export default function MyRecordPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const menu = RECORD_MENU.find((m) => m.key === params.get(TAB_PARAM)) ?? RECORD_MENU[0]
  const subs: readonly { key: string; label: string }[] = menu.subs
  const sub = (subs.find((t) => t.key === params.get(TYPE_PARAM)) ?? subs[0]).key
  const reactions = (params.get(REACTION_PARAM) ?? '').split(',').filter(Boolean)

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-xl font-semibold">기록</h2>
      {/* 왼쪽: 메뉴 (좁은 화면에선 위), 오른쪽: 그 아래 탭 + 목록 */}
      <div className="flex flex-col gap-6 md:flex-row">
        <aside className={TAG_ASIDE_CLASS}>
          <ul aria-label="기록 분류" className={TAG_LIST_CLASS}>
            {RECORD_MENU.map((m) => (
              <li key={m.key}>
                <TagNavLink
                  to={`${pathname}?${new URLSearchParams({ [TAB_PARAM]: m.key }).toString()}`}
                  label={m.label}
                  active={m.key === menu.key}
                />
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          <Tabs
            label={`${menu.label} 분류`}
            items={subs}
            current={sub}
            toParams={(key) => ({ [TAB_PARAM]: menu.key, [TYPE_PARAM]: key })}
          />

          {menu.key === 'post' && sub === 'article' && <MyArticleList />}
          {menu.key === 'post' && sub === 'ask' && <MyAskList />}

          {menu.key === 'opinion' && (
            // 탭마다 목록을 새로 그려 커서·스크롤 감지가 섞이지 않게 한다
            <MyOpinionList key={sub} tab={sub} />
          )}

          {menu.key === 'reaction' && (
            <>
              <ReactionFilter tab={menu.key} type={sub as RecordType} current={reactions} />
              {/* 분류 / 반응마다 목록을 새로 그려 커서·스크롤 감지가 섞이지 않게 한다 */}
              <MyReactedList
                key={`${sub}:${reactions.join(',')}`}
                type={sub as RecordType}
                names={reactions}
              />
            </>
          )}

          {menu.key === 'quiz' && sub === 'made' && <MyQuizList />}
          {menu.key === 'quiz' && sub === 'tried' && <MyTriedQuizList />}
        </div>
      </div>
    </section>
  )
}

function Tabs<K extends string>({
  label,
  items,
  current,
  toParams,
}: {
  label: string
  items: readonly { key: K; label: string }[]
  current: K
  toParams: (key: K) => Record<string, string>
}) {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800"
    >
      {items.map((t) => {
        const active = t.key === current
        const to = `${pathname}?${new URLSearchParams(toParams(t.key)).toString()}`
        return (
          <Link
            key={t.key}
            to={to}
            replace
            aria-current={active ? 'page' : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm no-underline transition-colors ${
              active
                ? 'border-brand-600 font-medium text-brand-600 dark:border-indigo-300 dark:text-indigo-300'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** 내 반응: 이모지를 여러 개 고를 수 있다(그중 하나라도 남긴 것). 고른 걸 다시 누르면 해제 */
function ReactionFilter({
  tab,
  type,
  current,
}: {
  tab: RecordMenuKey
  type: RecordType
  current: string[]
}) {
  const [, setParams] = useSearchParams()
  const pick = (code: string) => {
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code]
    setParams(
      {
        [TAB_PARAM]: tab,
        [TYPE_PARAM]: type,
        ...(next.length > 0 && { [REACTION_PARAM]: next.join(',') }),
      },
      { replace: true },
    )
  }
  return (
    <div className="space-y-1.5">
      <div className="inline-block rounded-lg border border-neutral-200 p-1 dark:border-neutral-800">
        <ReactionEmojiGrid
          label="반응으로 거르기"
          isActive={(code) => current.includes(code)}
          onPick={pick}
        />
      </div>
      <p className="text-xs text-neutral-500">
        {current.length > 0
          ? `${current.map((c) => reactionOf(c).emoji).join(' ')} 중 하나라도 남긴 것만 보는 중 · 고른 걸 다시 누르면 해제`
          : '이모지를 누르면 그 반응을 남긴 것만 볼 수 있어요. 여러 개 고를 수 있어요.'}
      </p>
    </div>
  )
}
