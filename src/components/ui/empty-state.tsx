import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * 아이콘은 컴포넌트가 고르지 않는다. EmptyStateIcon은 감싸개일 뿐이고
 * 어떤 아이콘을 넣을지는 호출하는 쪽이 정한다 — Alert가 [&>svg]로
 * 색만 물려주는 것과 같은 방식이다. variant가 정하는 것은 아이콘의
 * 색과 배경(옅게 탄 원형)이지 아이콘의 모양이 아니다.
 *
 * variant와 size는 EmptyState가 정하고 EmptyStateIcon이 Context로
 * 읽는다 — DescriptionList의 layout이 DescriptionItem으로 내려가는
 * 것과 같은 구조다.
 */
type EmptyStateVariant = 'empty' | 'no-results' | 'error' | 'no-permission'
type EmptyStateSize = 'default' | 'compact'

type EmptyStateContextValue = {
  variant: EmptyStateVariant
  size: EmptyStateSize
}

const EmptyStateContext = React.createContext<EmptyStateContextValue>({
  variant: 'empty',
  size: 'default',
})

const emptyStateVariants = cva('flex flex-col items-center text-center', {
  variants: {
    size: {
      default: 'gap-4 py-12',
      compact: 'gap-2 py-6',
    },
  },
  defaultVariants: { size: 'default' },
})

type EmptyStateProps = React.ComponentProps<'div'> & {
  variant?: EmptyStateVariant
  size?: EmptyStateSize
}

function EmptyState({ className, variant = 'empty', size = 'default', ...props }: EmptyStateProps) {
  return (
    <EmptyStateContext.Provider value={{ variant, size }}>
      <div
        data-slot="empty-state"
        className={cn(emptyStateVariants({ size, className }))}
        {...props}
      />
    </EmptyStateContext.Provider>
  )
}

/*
 * empty와 no-results가 같은 색(text-muted-foreground · bg-muted)인
 * 것은 의도다 — 둘 다 오류가 아니다. 구별은 문구가 한다. error와
 * no-permission은 옅게 탄 배경(/10) 위에 아이콘을 얹으므로 Alert와
 * 같은 이유로 *-on-tint 토큰을 쓴다 — 원래 색을 그대로 얹으면
 * 대비가 낮아진다.
 */
const emptyStateIconVariants = cva('flex shrink-0 items-center justify-center rounded-full', {
  variants: {
    variant: {
      empty: 'bg-muted text-muted-foreground',
      'no-results': 'bg-muted text-muted-foreground',
      error: 'bg-destructive/10 text-destructive-on-tint',
      'no-permission': 'bg-warning/10 text-warning-on-tint',
    },
    size: {
      default: 'size-16 [&>svg]:size-8',
      compact: 'size-12 [&>svg]:size-6',
    },
  },
  defaultVariants: { variant: 'empty', size: 'default' },
})

function EmptyStateIcon({ className, ...props }: React.ComponentProps<'div'>) {
  const { variant, size } = React.useContext(EmptyStateContext)
  return (
    <div
      data-slot="empty-state-icon"
      className={cn(emptyStateIconVariants({ variant, size, className }))}
      {...props}
    />
  )
}

function EmptyStateTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p data-slot="empty-state-title" className={cn('text-16 font-semibold', className)} {...props} />
  )
}

function EmptyStateDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-state-description"
      className={cn('text-muted-foreground max-w-sm text-16', className)}
      {...props}
    />
  )
}

/*
 * 할 수 있는 일이 있을 때만 쓴다 — 없다면 아예 렌더링하지 않는 것이
 * 호출하는 쪽의 일이다. 동작이 둘일 수 있어 gap을 두고 나란히 놓는다.
 */
function EmptyStateAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-state-action"
      className={cn('flex flex-wrap items-center justify-center gap-2', className)}
      {...props}
    />
  )
}

export {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateAction,
  emptyStateVariants,
  emptyStateIconVariants,
}
export type { EmptyStateVariant, EmptyStateSize }
