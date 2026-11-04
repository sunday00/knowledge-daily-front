import { useParams } from 'react-router-dom'
import { SenseOneView } from '@/components/SenseArticle.tsx'
import { TargetThreads } from '@/components/TargetThreads.tsx'

export default function SenseDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  return (
    <SenseOneView id={id}>
      {(sense) => (
        <TargetThreads target={{ entity: 'Sense', id: sense._id, path: `/sense/${sense._id}` }} />
      )}
    </SenseOneView>
  )
}
