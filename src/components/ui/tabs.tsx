import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

type TabsVariant = 'line' | 'enclosed'

const Tabs = TabsPrimitive.Root

function TabsList({
  className,
  variant = 'line',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex items-center',
        variant === 'line' && 'gap-4 border-b',
        variant === 'enclosed' && 'bg-muted gap-1 rounded-md p-1',
        className,
      )}
      {...props}
    />
  )
}

/*
 * 활성 표시는 line과 enclosed에서 자리가 다르다.
 * line은 트리거 아래에 별도의 밑줄 요소(span)를 그려 넣고, 트리거 자신의
 * 테두리는 항상 투명하게 둔다 — 그래야 '탭'과 '활성 표시'가 서로 다른
 * 요소로 남아 구조도가 둘을 따로 가리킬 수 있다. enclosed는 밑줄 대신
 * 트리거 자신의 배경과 그림자가 활성 표시를 겸한다. 이 컴포넌트는
 * 문서 시스템의 표시가 무엇인지 알 필요가 없다 — 무대는 line만 쓴다.
 *
 * hover는 활성과 같은 text-foreground를 쓴다 — 값이 같아서 활성 탭
 * 위에서는 눈에 보이는 변화가 없다(Checkbox의 hover가 checked 위에서
 * 보이지 않는 것과 같은 모양). line·enclosed 모두 이 규칙을 그대로 쓴다.
 */
function TabsTrigger({
  className,
  variant = 'line',
  children,
  indicatorProps,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  variant?: TabsVariant
  /*
   * 밑줄(span)은 트리거 안에 있어 소비자가 직접 닿을 수 없다.
   * 임의의 속성을 그대로 전달하는 통로만 열어 둔다 — 무엇을 전달할지는
   * 소비자가 정하므로 이 컴포넌트는 그 내용을 알지 못한다.
   */
  indicatorProps?: React.ComponentProps<'span'> & { [dataAttr: `data-${string}`]: string }
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        /*
         * 높이는 밀도 축(h-control-sm)에서 가져온다. 예전에는 py-1.5와 본문
         * 줄 간격(12+20)이 우연히 32px를 만들었는데, 그러면 본문 줄 간격을
         * 손댈 때마다 탭 높이가 따라 움직인다 — 실제로 줄 간격을 24px로
         * 올리자 36px가 됐다. 탭은 컨트롤이므로 다른 컨트롤과 같은 축에 둔다.
         */
        'group text-muted-foreground relative inline-flex h-control-sm items-center justify-center gap-1.5 rounded-sm text-16 font-medium whitespace-nowrap outline-none transition',
        'hover:text-foreground',
        'data-[state=active]:text-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'line' && 'px-1',
        variant === 'enclosed' &&
          'px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs',
        className,
      )}
      {...props}
    >
      {children}
      {variant === 'line' && (
        <span
          data-slot="tabs-indicator"
          aria-hidden
          {...indicatorProps}
          className={cn(
            'bg-transparent group-data-[state=active]:bg-primary pointer-events-none absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-colors',
            indicatorProps?.className,
          )}
        />
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'pt-3 text-16 outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:rounded-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsVariant }
