import { Link, useParams } from 'react-router-dom'
import { SenseOneView } from '@/components/SenseArticle.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'
import { senseListPath } from '@/lib/senseListReturn.ts'

export default function SenseDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  return (
    <SenseOneView id={id}>
      {(sense) => (
        <TargetThreads
          target={{ entity: 'Sense', id: sense._id, path: `/sense/${sense._id}` }}
          backLink={
            <Link
              to={senseListPath()}
              className="text-sm text-neutral-500 hover:text-brand-600 no-underline"
            >
              ← 상식 목록으로
            </Link>
          }
        />
      )}
    </SenseOneView>
  )
}
