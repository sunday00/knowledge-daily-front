import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider.tsx'
import { TAG_ASIDE_CLASS, TAG_LIST_CLASS, TagNavLink } from '@/components/TagSidebar.tsx'
import { UnderlineTabs } from '@/components/UnderlineTabs.tsx'
import { MyBlockList, MySuspectList } from '@/components/villain/VillainLists.tsx'
import { SUSPECT_TABS, VILLAIN_MENU, type BlockEntity } from '@/lib/villainManage.ts'

const TAB_PARAM = 'tab'
const TYPE_PARAM = 'type'

/**
 * /user/villain — 차단 / 신고 관리. 왼쪽 메뉴(차단 / 신고), 오른쪽은 그 아래 탭 + 목록.
 * 차단: 유저 / 게시글 / 의견 / 퀴즈, 신고: 전체 / 접수됨 / 진행 중 / 처리됨. 메뉴·탭은 주소(?tab=&type=)에 둔다.
 */
export default function VillainManagePage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const menu = VILLAIN_MENU.find((m) => m.key === params.get(TAB_PARAM)) ?? VILLAIN_MENU[0]
  const subs: readonly { key: string; label: string }[] = menu.subs
  const sub = (subs.find((t) => t.key === params.get(TYPE_PARAM)) ?? subs[0]).key

  if (!user) return <Navigate to="/login" replace />

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-xl font-semibold">차단 / 신고 관리</h2>
      <div className="flex flex-col gap-6 md:flex-row">
        <aside className={TAG_ASIDE_CLASS}>
          <ul aria-label="차단 / 신고" className={TAG_LIST_CLASS}>
            {VILLAIN_MENU.map((m) => (
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
          <UnderlineTabs
            label={`${menu.label} 분류`}
            items={subs}
            current={sub}
            toParams={(key) => ({ [TAB_PARAM]: menu.key, [TYPE_PARAM]: key })}
          />
          {/* 탭마다 목록을 새로 그려 커서·스크롤 감지가 섞이지 않게 한다 */}
          {menu.key === 'block' && <MyBlockList key={sub} entity={sub as BlockEntity} />}
          {menu.key === 'suspect' && (
            <MySuspectList
              key={sub}
              status={SUSPECT_TABS.find((t) => t.key === sub)?.status ?? null}
            />
          )}
        </div>
      </div>
    </section>
  )
}
