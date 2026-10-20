import { useParams } from 'react-router-dom'

export default function TagSensePage() {
  const { tag } = useParams<{ tag: string }>()
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">
        태그: <span className="text-brand-600">#{tag}</span>
      </h2>
      <p className="text-neutral-500">(추후 추가 예정)</p>
    </section>
  )
}
