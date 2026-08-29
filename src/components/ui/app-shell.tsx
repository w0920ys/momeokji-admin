import * as React from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

/*
 * 로고 + 섹션 내비 + (선택) 우측 하단 액션(테마 토글 등)을 담는 레이아웃
 * 셸. adminds에 사이드바/앱셸이 없어 새로 더한다.
 *
 * 별도 오버레이 상태 없이 반응형을 해결한다 — md 이상은 좌측 고정
 * 사이드바, 그 아래 폭에서는 상단 바 + 햄버거로 여는 슬라이드 메뉴로
 * 바뀐다.
 *
 * [실패 모드 기록] 처음엔 모바일에서 nav를 상단에 가로 스크롤 필(pill)
 * 목록으로 그렸다 — 항목이 5~6개일 땐 괜찮았는데, 실제로 11개짜리 nav가
 * 생기니 한 화면에 2~3개만 보이고 나머지는 옆으로 밀어야만 찾을 수 있어
 * 오히려 desktop 사이드바보다 훨씬 불편해졌다(전체 목록이 한눈에 안
 * 보임 · 작은 탭 영역 · 가로 스크롤은 스크린리더/키보드 내비에도 약함).
 * 항목 수가 늘어도 무너지지 않는 표준 모바일 패턴(햄버거 → 세로 목록
 * Sheet)으로 바꿨다 — desktop 사이드바와 똑같은 세로 나열이라 nav가
 * 몇 개든 스크롤 하나로 전부 보인다.
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
  /**
   * 로고 자리. 정적 텍스트뿐 아니라 상위 모드 전환 드롭다운처럼 인터랙티브한
   * 조합도 여기 넣을 수 있다 — 이 셸은 그 안에 뭐가 있는지 알 필요가 없다.
   */
  brand: React.ReactNode
  nav: AppShellNavItem[]
  activeId?: string
  onNavigate?: (id: string) => void
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  // 모바일 슬라이드 메뉴 열림 상태 — 여기서 들고 있어야 항목 클릭 시
  // onNavigate를 부른 다음 메뉴를 곧바로 닫을 수 있다(안 닫으면 페이지만
  // 바뀌고 메뉴가 그대로 덮고 있어서 바뀐 걸 못 봄).
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  const handleMobileNavigate = (id: string) => {
    onNavigate?.(id)
    setMobileNavOpen(false)
  }

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
        {nav.length > 0 && (
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2" aria-label="대시보드 섹션">
            {nav.map((item) => (
              <NavButton key={item.id} item={item} active={item.id === activeId} onClick={() => onNavigate?.(item.id)} />
            ))}
          </nav>
        )}
        {actions && <div className={cn('border-t p-2', nav.length === 0 && 'mt-auto')}>{actions}</div>}
      </aside>

      <header className="border-b md:hidden">
        <div className="flex h-14 items-center gap-2 px-4 font-semibold">
          {nav.length > 0 && (
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2 shrink-0" aria-label="메뉴 열기">
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader>
                  <SheetTitle>메뉴</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="대시보드 섹션">
                  {nav.map((item) => (
                    <NavButton key={item.id} item={item} active={item.id === activeId} onClick={() => handleMobileNavigate(item.id)} />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          )}
          <div className="flex flex-1 items-center justify-between gap-2">
            {brand}
            {actions}
          </div>
        </div>
      </header>

      <main className="min-h-0 min-w-0 flex-1 md:overflow-y-auto">{children}</main>
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: AppShellNavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-14 font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-2',
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {item.label}
    </button>
  )
}
