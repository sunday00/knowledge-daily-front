import type { ReactNode } from 'react'

type Props = {
  label: string
  children: ReactNode
  mono?: boolean
}

export function InfoRow({ label, children, mono }: Props) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-28 shrink-0 text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={mono ? 'min-w-0 font-mono text-sm break-all' : 'min-w-0'}>{children}</dd>
    </div>
  )
}
