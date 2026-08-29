import type { ReactNode } from 'react'

/*
 * 페이지 상단 타이틀 영역. 기간 선택 같은 액션은 기존 Tabs 컴포넌트를
 * actions 슬롯에 그대로 꽂아 쓴다 — 이 컴포넌트가 그 UI를 알 필요는 없다.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
