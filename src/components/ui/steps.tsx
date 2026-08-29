import * as React from 'react'
import { cva } from 'class-variance-authority'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepsOrientation = 'horizontal' | 'vertical'
type StepState = 'pending' | 'current' | 'complete' | 'error'

/*
 * orientation은 Steps가 정하고 Step·StepIndicator·StepLabel·StepDescription이
 * Context로 읽는다 — EmptyState의 variant·size가 EmptyStateIcon으로 내려가는
 * 것과 같은 구조다. 각 부위가 자기 orientation을 스스로 읽어 자리를 잡으므로
 * Step은 children의 타입을 들여다보지 않는다 — Steps가 자식 수를 세지 않는
 * 것과 같은 이유로, Step도 자식의 종류를 몰라야 한다.
 *
 * state는 Step 하나의 상태라서 Steps가 계산하지 않는다 — 현재 단계
 * 번호로 자식들의 상태를 계산하면 error를 표현할 자리가 없어진다. 각
 * Step이 자기 state를 직접 받고, 그 값만 StepIndicator에게 Context로
 * 내려준다.
 */
const StepsOrientationContext = React.createContext<StepsOrientation>('horizontal')
const StepStateContext = React.createContext<StepState>('pending')

const stepsVariants = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

type StepsProps = React.ComponentProps<'ol'> & {
  orientation?: StepsOrientation
}

function Steps({ className, orientation = 'horizontal', ...props }: StepsProps) {
  return (
    <StepsOrientationContext.Provider value={orientation}>
      <ol
        data-slot="steps"
        className={cn(stepsVariants({ orientation, className }))}
        {...props}
      />
    </StepsOrientationContext.Provider>
  )
}

/*
 * 네 상태 모두 배경을 불투명하게 채운다 — pending도 bg-background를
 * 깔아 둔다. 그래야 Connector가 원 뒤로 지나가도 원이 선을 가린다.
 *
 * error는 Button의 destructive와 같은 자리다 — 칩처럼 옅게 탄 배경이
 * 아니라 Button처럼 불투명하게 채운 원이라, Badge·Alert의 /15 tint +
 * *-on-tint 패턴이 아니라 Button의 dark:bg-destructive/60 + text-white
 * 패턴을 그대로 따른다. dark의 --destructive(0.704)는 --destructive-foreground
 * (0.985)와 짝지으면 2.77:1로 3:1 아이콘 최저선에도 못 미친다 — /60으로
 * 배경 위에 얹어 어둡게 하고 text-white로 짝짓는다.
 */
const stepIndicatorVariants = cva(
  'bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
  {
    variants: {
      state: {
        pending: 'border text-muted-foreground',
        current: 'bg-primary text-primary-foreground border-transparent',
        complete: 'bg-primary text-primary-foreground border-transparent',
        error: 'bg-destructive text-white border-transparent dark:bg-destructive/60',
      },
    },
    defaultVariants: { state: 'pending' },
  },
)

/*
 * 숫자는 호출하는 쪽이 children으로 넣는다. complete·error는 그
 * children을 각각 Check·X 아이콘으로 대신한다 — 상태가 바뀌면 숫자
 * 대신 아이콘이 나타난다.
 *
 * 세로 방향에서는 커넥터가 지나가는 첫 칸(auto 폭)을 차지한다 — Step이
 * grid로 자리를 나누고, 각 부위가 orientation을 읽어 자기 자리를 스스로
 * 맡는다.
 */
function StepIndicator({ className, children, ...props }: React.ComponentProps<'span'>) {
  const state = React.useContext(StepStateContext)
  const orientation = React.useContext(StepsOrientationContext)
  return (
    <span
      data-slot="step-indicator"
      className={cn(
        stepIndicatorVariants({ state }),
        orientation === 'vertical' && 'col-start-1 row-start-1',
        className,
      )}
      {...props}
    >
      {state === 'complete' && <Check className="size-4" aria-hidden />}
      {state === 'error' && <X className="size-4" aria-hidden />}
      {state !== 'complete' && state !== 'error' && children}
    </span>
  )
}

function StepLabel({ className, ...props }: React.ComponentProps<'p'>) {
  const orientation = React.useContext(StepsOrientationContext)
  return (
    <p
      data-slot="step-label"
      className={cn(
        'text-sm font-medium',
        orientation === 'vertical' && 'col-start-2 row-start-1',
        className,
      )}
      {...props}
    />
  )
}

function StepDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const orientation = React.useContext(StepsOrientationContext)
  return (
    <p
      data-slot="step-description"
      className={cn(
        'text-muted-foreground text-xs',
        orientation === 'vertical' && 'col-start-2 row-start-2',
        className,
      )}
      {...props}
    />
  )
}

type StepProps = React.ComponentProps<'li'> & {
  state?: StepState
  /*
   * Connector(span)는 Step 안에 있어 소비자가 직접 닿을 수 없다. 임의의
   * 속성을 그대로 전달하는 통로만 열어 둔다 — TabsTrigger의
   * indicatorProps와 같은 자리다.
   */
  connectorProps?: React.ComponentProps<'span'> & { [dataAttr: `data-${string}`]: string }
}

/*
 * 마지막 단계 뒤에는 선이 없다. Steps가 자식 수를 세어 마지막을 판단하지
 * 않는다 — Step 자신이 :last-child일 때만 커넥터를 감추는 CSS(last:)만으로
 * 처리한다. 그래서 Step 하나는 자기가 몇 번째인지, 전체가 몇 개인지 몰라도
 * 된다.
 *
 * children을 들여다보지 않는다. 가로는 flex-col로 순서대로 쌓기만 하면
 * Indicator·Label·Description이 이미 원하는 모양(위→아래)이 되고,
 * 세로는 grid grid-cols-[auto_1fr]로 칸만 나눠 두면 각 부위가 스스로
 * (StepIndicator·StepLabel·StepDescription의 orientation 분기) 자기
 * 칸을 찾아간다 — Step은 children이 몇 개인지, 무슨 타입인지 몰라도 된다.
 */
function Step({ className, state = 'pending', children, connectorProps, ...props }: StepProps) {
  const orientation = React.useContext(StepsOrientationContext)

  return (
    <StepStateContext.Provider value={state}>
      <li
        data-slot="step"
        data-state={state}
        aria-current={state === 'current' ? 'step' : undefined}
        className={cn(
          'group/step relative',
          orientation === 'horizontal'
            ? 'flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center'
            : 'grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 pb-8 last:pb-0',
          className,
        )}
        {...props}
      >
        {children}
        <span
          data-slot="steps-connector"
          aria-hidden
          {...connectorProps}
          className={cn(
            'bg-border absolute -z-10 group-last/step:hidden',
            orientation === 'horizontal' ? 'top-4 left-1/2 h-px w-full' : 'top-8 bottom-0 left-4 w-px',
            connectorProps?.className,
          )}
        />
      </li>
    </StepStateContext.Provider>
  )
}

export { Steps, Step, StepIndicator, StepLabel, StepDescription }
export type { StepsOrientation, StepState }
