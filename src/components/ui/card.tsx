import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * padding은 Card가 정하고 CardContent가 읽는다 — Table의 density가
 * TableRow로 내려가는 것과 같은 구조다. padding이 none일 때 여백을
 * 없애는 대상은 CardContent 하나뿐이다. CardHeader·CardHeader의
 * Title·Description·Action과 CardFooter는 padding 값과 무관하게 자기
 * 여백(px-6)을 그대로 유지한다 — 표를 통째로 담아 CardContent의
 * 여백을 없애도 제목과 바닥 동작까지 화면 가장자리에 붙으면 안 되기
 * 때문이다.
 */
type CardPadding = 'default' | 'none'

const CardPaddingContext = React.createContext<CardPadding>('default')

/*
 * 어드민 화면은 카드가 여럿 나란히 놓이는 일이 많고, 그림자가 여럿이면
 * 화면이 들뜬다 — 그래서 outlined가 기본이다. elevated는 배경 위에
 * 홀로 떠 있어야 하는 카드에 쓴다.
 *
 * elevated의 shadow-sm은 라이트에서는 보이지만(브라우저로 확인함),
 * 다크에서는 색이 rgba(0,0,0,0.1)이라 이미 어두운 배경에 묻혀
 * 보이지 않는다(마찬가지로 브라우저로 확인함). 다크에서 outlined에
 * 테두리를 더해 메우면 outlined도 이미 테두리를 가지고 있어 두 값이
 * 오히려 같아진다 — 축의 두 칸이 똑같이 보이는 결함(Input·Select의
 * hover에서 이미 한 번 고쳤다)을 새로 만드는 셈이라 쓰지 않는다.
 * 대신 다크에서는 밝기로 떠 있음을 말한다 — elevated는 다크에서 한
 * 단계 밝은 표면(--surface-raised)에 얹히고 그림자·테두리 둘 다
 * 두지 않는다. outlined는 라이트·다크 모두 테두리 + bg-card로 고정이다.
 *
 * min-w-0: Card는 grid/flex 칸(예: KPI 타일 그리드)의 자식으로도 자주
 * 쓰인다. 기본 min-width:auto 상태로는 내부에 줄바꿈 없는 텍스트가
 * 하나만 있어도(예: "Spin→Confirm") 그 텍스트 폭만큼 칸을 억지로
 * 넓혀 부모 그리드 전체가 가로로 넘친다 — min-w-0로 칸을 실제
 * 콘텐츠 폭 이하로도 줄어들 수 있게 허용해 이 종류의 넘침을 원천
 * 차단한다. 단독으로 쓰일 때는 어차피 부모가 폭을 정해주므로 아무
 * 영향이 없다.
 */
const cardVariants = cva('flex min-w-0 flex-col gap-6 rounded-lg py-6 text-card-foreground', {
  variants: {
    variant: {
      outlined: 'border bg-card',
      elevated: 'bg-card shadow-sm dark:bg-surface-raised dark:shadow-none',
    },
  },
  defaultVariants: { variant: 'outlined' },
})

type CardProps = React.ComponentProps<'div'> &
  VariantProps<typeof cardVariants> & {
    /** CardContent의 좌우 여백. none은 표처럼 스스로 여백을 가진 내용을 담을 때 쓴다 */
    padding?: CardPadding
  }

function Card({ className, variant = 'outlined', padding = 'default', ...props }: CardProps) {
  return (
    <CardPaddingContext.Provider value={padding}>
      <div data-slot="card" className={cn(cardVariants({ variant, className }))} {...props} />
    </CardPaddingContext.Provider>
  )
}

/*
 * CardAction이 있으면 두 번째 열을 만들어 오른쪽 끝에 고정한다.
 * Title·Description은 첫 번째 열(1fr)에 쌓이고 Action은 두 열에 걸쳐
 * 위쪽에 붙는다 — 제목이 길어져 col-1이 늘어나도 col-2는 auto 폭 그대로라
 * Action이 밀려나지 않는다.
 *
 * [로컬 수정] 원본은 grid-cols-[1fr_auto]를 무조건 걸어두고 "Action이
 * 없으면 두 번째 열 폭이 0이 되어 Title·Description이 전체 폭을 쓴다"고
 * 가정하지만, 실제 CSS Grid는 그렇게 동작하지 않는다 — Title·Description
 * 둘 다 명시적 grid-column이 없으면 auto-placement가 그냥 행을 채우는
 * 순서(row flow)대로 배치해, Action이 없을 때도 Title이 1열에 Description이
 * 곧바로 2열(auto)에 나란히 앉는다. auto열 폭은 Description 글자 길이만큼
 * 생기고, 거기 밀려 남은 1열이 Title 하나 들어가기에도 좁아지면 Title이
 * 한 글자씩 세로로 줄바꿈되는 형태로 깨진다("유입 경로 구성"처럼 짧은
 * 제목 + 카드 폭이 좁은 사이드 카드에서 실제로 재현됨).
 *
 * has-[]: 조건부 variant로 card-action 자손이 있을 때만 2열 grid를 걸어
 * 원래 의도대로 고친다 — Action이 없으면 grid-cols-[1fr_auto] 자체가
 * 안 붙으므로 auto-placement가 둘 다 1열에 세로로 쌓는다. adminds
 * 원본(card.json)의 알려진 결함이라, 동기화 때마다 이 has-[]: 부분만
 * 다시 넣어야 한다.
 */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'grid grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[[data-slot=card-action]]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-18 leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-16', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  const padding = React.useContext(CardPaddingContext)
  return (
    <div
      data-slot="card-content"
      className={cn(padding === 'default' && 'px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-footer" className={cn('flex items-center px-6', className)} {...props} />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, cardVariants }
