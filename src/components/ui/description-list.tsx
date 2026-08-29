import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * <dt>·<dd>는 마크업 그 자체로 키와 값이라는 뜻을 가진다. 여러 항목을
 * <dl> 안에 늘어놓을 때 <dt>와 <dd>를 <div>로 감싸는 것은 HTML이
 * 허용한다 — DescriptionItem이 그 <div>다. columns가 격자를 만들려면
 * 항목이 하나의 요소로 묶여 있어야 각 항목이 격자의 한 칸을 차지한다.
 *
 * layout은 Card의 padding과 같은 구조다 — DescriptionList가 정하고
 * DescriptionItem·DescriptionTerm·DescriptionDetail이 Context로
 * 읽는다. 항목마다 다시 넘기지 않는다.
 */
type DescriptionLayout = 'stacked' | 'horizontal'

const DescriptionLayoutContext = React.createContext<DescriptionLayout>('stacked')

const descriptionListVariants = cva('grid gap-x-8 gap-y-5', {
  variants: {
    columns: {
      one: 'grid-cols-1',
      two: 'grid-cols-2',
      three: 'grid-cols-3',
    },
  },
  defaultVariants: { columns: 'one' },
})

type DescriptionListProps = React.ComponentProps<'dl'> &
  VariantProps<typeof descriptionListVariants> & {
    /** 라벨을 위에 두고 값을 아래에 둘지, 라벨을 왼쪽 고정 폭에 두고 값을 오른쪽에 둘지 정한다 */
    layout?: DescriptionLayout
  }

function DescriptionList({
  className,
  layout = 'stacked',
  columns = 'one',
  ...props
}: DescriptionListProps) {
  return (
    <DescriptionLayoutContext.Provider value={layout}>
      <dl
        data-slot="description-list"
        className={cn(descriptionListVariants({ columns, className }))}
        {...props}
      />
    </DescriptionLayoutContext.Provider>
  )
}

/*
 * <dt>·<dd>를 감싸 격자의 한 칸으로 만든다. layout이 horizontal이면
 * 안에서 dt·dd를 가로로 놓고, stacked면 세로로 쌓는다.
 *
 * layout이 horizontal이고 columns가 three이면 한 칸의 폭 자체가
 * 좁아져 dt의 고정 폭과 부딪힌다. 이 조합을 막지 않는다 — 격자에
 * 정직하게 보이는 두 축이 실제로 만나는 자리이고, Cases의
 * '좁은 화면'이 그 결과를 그대로 보인다.
 */
function DescriptionItem({ className, ...props }: React.ComponentProps<'div'>) {
  const layout = React.useContext(DescriptionLayoutContext)
  return (
    <div
      data-slot="description-item"
      className={cn(layout === 'horizontal' ? 'flex gap-4' : 'flex flex-col gap-1', className)}
      {...props}
    />
  )
}

function DescriptionTerm({ className, ...props }: React.ComponentProps<'dt'>) {
  const layout = React.useContext(DescriptionLayoutContext)
  return (
    <dt
      data-slot="description-term"
      className={cn(
        'text-muted-foreground text-16',
        layout === 'horizontal' && 'w-32 shrink-0',
        className,
      )}
      {...props}
    />
  )
}

/*
 * 값이 없을 때 '—'를 넣는 것은 호출하는 쪽의 일이다. 여기서 빈
 * children을 보고 대신 채우면 값이 없는 것과 빈 문자열을 구별할 수
 * 없다.
 */
function DescriptionDetail({ className, ...props }: React.ComponentProps<'dd'>) {
  const layout = React.useContext(DescriptionLayoutContext)
  return (
    <dd
      data-slot="description-detail"
      className={cn('text-16', layout === 'horizontal' && 'min-w-0 flex-1', className)}
      {...props}
    />
  )
}

export { DescriptionList, DescriptionItem, DescriptionTerm, DescriptionDetail, descriptionListVariants }
