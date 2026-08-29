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
        /*
         * overflow-x-auto를 기본으로 둔다 — 폭이 정해지지 않은 부모 안에서는
         * inline-flex가 내용만큼 늘어나 아무 효과가 없지만, 부모가 폭을
         * 정하는 실제 화면(좁은 헤더·사이드 패널)에서 탭이 일곱 개를
         * 넘어가면 이게 없이는 탭이 그냥 잘리거나 줄바꿈됐다 — 눌러도
         * 반응이 없어 보이는 탭은 대개 화면 밖으로 밀려나 안 보이는 탭이다.
         * TabsTrigger의 shrink-0과 짝이다 — 이게 없으면 넘치는 대신
         * 트리거들이 찌그러들어 스크롤이 생기지 않는다. overflow-y는
         * 명시적으로 hidden을 함께 준다 — overflow-x만 auto로 두고
         * overflow-y를 기본값(visible)으로 남기면 스펙상 브라우저가
         * overflow-y도 auto로 강제 승격시켜(두 축 중 하나만 visible이 아닐
         * 수 없다는 규칙), 세로로는 넘칠 일이 없는데도 세로 스크롤바
         * 자리가 늘 옆에 붙어 있었다. max-w-full도 함께 준다 — inline-flex는
         * 내용 크기만큼 스스로 자라는 상자라 overflow-x-auto만으로는 자기
         * 자신이 부모보다 넓어질 뿐 스크롤 영역이 생기지 않는다. max-w-full로
         * 부모 폭에서 멈추게 해야 그 다음에야 넘친 내용이 auto를 만나
         * 실제로 스크롤된다.
         */
        'inline-flex max-w-full items-center overflow-x-auto overflow-y-hidden',
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
        /*
         * shrink-0 — TabsList의 overflow-x-auto와 짝이다. 기본
         * flex-shrink(1)를 그대로 두면 컨테이너가 좁아질 때 트리거가
         * 스스로 찌그러들어 넘치지 않으므로 오히려 스크롤이 필요한
         * 상황 자체가 생기지 않는다.
         */
        'group text-muted-foreground relative inline-flex h-control-sm shrink-0 items-center justify-center gap-1.5 rounded-sm text-16 font-medium whitespace-nowrap outline-none transition',
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
