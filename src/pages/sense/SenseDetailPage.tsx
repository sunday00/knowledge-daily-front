import { Link, useParams } from 'react-router-dom'
import { SenseOneView } from '@/components/SenseArticle.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { quizSearchPath } from '@/lib/quiz.ts'

export default function SenseDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  return (
    <SenseOneView
      id={id}
      // 이 상식을 문항에 쓴 퀴즈만 (퀴즈 목록 통합 검색에 상식 id)
      tagsAction={(sense) => (
        <Link
          to={quizSearchPath(sense._id)}
          title="이 상식이 들어간 퀴즈"
          className="btn text-xs px-2 py-1 no-underline"
        >
          Quiz
        </Link>
      )}
    >
      {(sense) => (
        <TargetThreads target={{ entity: 'Sense', id: sense._id, path: `/sense/${sense._id}` }} />
      )}
    </SenseOneView>
  )
}
