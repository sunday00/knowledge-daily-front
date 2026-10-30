import { useLocation, useSearchParams } from 'react-router-dom'
import { CATEGORY_PARAM, withCategory } from '@/components/board/CategoryTabs.tsx'

/**
 * 같은 글 안에서 옮겨 다닐 때(상세 ↔ 대화 페이지 등) 목록 맥락을 이어 준다.
 * - ?category=: 분류 탭에서 들어왔으면 이전/다음글을 계속 그 분류 안에서 찾도록
 * - state.from: "← 목록" 이 처음 보던 목록 페이지로 돌아가도록
 * keep(path) 로 주소를 만들고, Link/navigate 에 state 를 함께 넘긴다.
 */
export function useKeepListContext() {
  const category = useSearchParams()[0].get(CATEGORY_PARAM) ?? undefined
  const from = (useLocation().state as { from?: string } | null)?.from
  return {
    keep: (path: string) => withCategory(path, category),
    state: from ? { from } : undefined,
  }
}
