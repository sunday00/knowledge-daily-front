import { Link, useParams } from 'react-router-dom'
import { SenseOneView } from '@/components/SenseArticle.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { quizSearchPath } from '@/lib/quiz.ts'

export default function SenseDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  return (
    <SenseOneView id={id}>
      {(sense) => (
        <>
          {/* 이 상식을 문항에 쓴 퀴즈만 (퀴즈 목록 통합 검색에 상식 id) */}
          <div className="flex justify-end">
            <Link to={quizSearchPath(sense._id)} className="btn text-sm no-underline">
              이 상식이 들어간 퀴즈 보기
            </Link>
          </div>
          <TargetThreads target={{ entity: 'Sense', id: sense._id, path: `/sense/${sense._id}` }} />
        </>
      )}
    </SenseOneView>
  )
}
