import * as React from 'react'
import { cn } from '@/lib/utils'

/*
 * 로고 + 섹션 내비 + (선택) 우측 하단 액션(테마 토글 등)을 담는 레이아웃
 * 셸. adminds에 사이드바/앱셸이 없어 새로 더한다.
 *
 * 별도 오버레이 상태 없이 반응형을 해결한다 — md 이상은 좌측 고정
 * 사이드바, 그 아래 폭에서는 상단 바 + 가로 스크롤 내비로 바뀐다. Dialog급
 * 슬라이드오버는 이 셸의 책임이 아니다(필요해지면 그때 더한다, YAGNI).
 */
export interface AppShellNavItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

export function AppShell({
  brand,
  nav,
  activeId,
  onNavigate,
  actions,
  children,
}: {
  brand: React.ReactNode
  nav: AppShellNavItem[]
  activeId?: string
  onNavigate?: (id: string) => void
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    // md 이상에서만 뷰포트 높이로 못 박는다(md:h-svh) — 그래야 아래 main의
    // overflow-y-auto가 실제로 갇힌 컨테이너를 갖고 내부 스크롤을 한다.
    // min-h-svh였을 때는 콘텐츠가 넘치면 셸 자체가 그만큼 늘어나 버려
    // main이 "넘칠 일 없는 상자"가 되고, overflow-y-auto가 죽은 채로
    // 문서 전체가 스크롤됐다 — 네비 클릭 시 main.scrollTop이 0에
    // 고정되는 형태로 드러났다. 모바일은 그대로 셸 전체가 페이지처럼
    // 자연스럽게 스크롤되는 편이 사이드바 없는 레이아웃에 더 맞는다.
    <div className="bg-background text-foreground flex flex-col md:h-svh md:flex-row">
      <aside className="hidden shrink-0 flex-col border-r md:flex md:w-56">
        <div className="flex h-14 items-center gap-2 px-4 font-semibold">{brand}</div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2" aria-label="대시보드 섹션">
          {nav.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === activeId} onClick={() => onNavigate?.(item.id)} />
          ))}
        </nav>
        {actions && <div className="border-t p-2">{actions}</div>}
      </aside>

      <header className="border-b md:hidden">
        <div className="flex h-14 items-center justify-between px-4 font-semibold">
          {brand}
          {actions}
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2" aria-label="대시보드 섹션">
          {nav.map((item) => (
            <NavButton key={item.id} item={item} active={item.id === activeId} onClick={() => onNavigate?.(item.id)} compact />
          ))}
        </nav>
      </header>

      <main className="min-h-0 min-w-0 flex-1 md:overflow-y-auto">{children}</main>
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
  compact,
}: {
  item: AppShellNavItem
  active: boolean
  onClick: () => void
  compact?: boolean
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-2',
        compact && 'px-2.5 py-1.5 text-xs',
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {item.label}
    </button>
  )
}
