import type { ReactNode } from 'react'

export function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">{icon}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
