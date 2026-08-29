import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitive.Provider

/*
 * 뷰포트는 화면에 고정된 채 앱 전체에 하나만 둔다 — TooltipProvider와
 * 같은 이유로 AppShell에 둔다. 오른쪽 아래 구석에 두면 왼쪽의 LNB와는
 * 애초에 겹치지 않는다. 쌓임 순서는 z-toast(50)로 이 시스템에서 가장
 * 위다 — 열려 있는 목록(z-popover, 40) 위에서도 상태를 알려야 하는
 * 것이 Toast의 역할이기 때문이다. 실제 Toast는 잠깐 나타났다 사라지는
 * 물건이라 평소에는 이 자리가 비어 있고, 뜬 순간에만 오른쪽 아래
 * 한 칸을 차지한다.
 */
function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        'fixed right-4 bottom-4 z-toast flex w-full max-w-sm flex-col gap-2 outline-none',
        className,
      )}
      {...props}
    />
  )
}

/*
 * variant는 Badge·Alert와 같은 상태 색 체계를 쓰되 아이콘은 두지 않는다
 * — Toast의 구조에는 icon이 없다. 테두리와 배경 색조만으로 구분한다.
 */
const toastVariants = cva(
  'bg-popover text-popover-foreground pointer-events-auto relative flex w-full items-start gap-3 rounded-md border p-4 text-16 shadow-md',
  {
    variants: {
      variant: {
        default: '',
        success: 'border-success/30 bg-success/10',
        destructive: 'border-destructive/30 bg-destructive/10',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Toast({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
}

/** 구조에서 말하는 '메시지'. Radix의 Title을 그대로 쓴다 — 스크린리더가 알림을 읽는 기준이 된다 */
function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn('flex-1 text-16', className)}
      {...props}
    />
  )
}

function ToastAction({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn(
        'shrink-0 rounded-xs text-16 font-medium underline underline-offset-4 outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  )
}

/*
 * Toast 루트는 items-start다 — Description·Action까지 쌓인 여러 줄
 * 구성에서는 닫기 버튼이 첫 줄에 붙어야 하므로 items-center로 통째
 * 바꿀 수 없다. 문제는 제목 한 줄짜리 Toast에서 생긴다: ToastTitle의
 * 줄 높이(--text-16--line-height, 28px)는 닫기 아이콘(16px) 그대로라
 * items-start가 둘의 '위'만 맞추고, 아이콘이 자기 줄의 세로 중심보다
 * 위로 붙어 보였다 — size-7(28px, 제목 한 줄 높이와 같다)에 flex
 * items-center justify-center로 아이콘을 그 상자 한가운데 두면,
 * items-start로 위를 맞춰도 상자 자체가 첫 줄과 같은 높이라 아이콘이
 * 그 줄의 중심에 온다. 클릭 영역이 16px에서 28px로 넓어지는 것은 덤이다.
 */
function ToastClose({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      className={cn(
        'text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-xs outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
        className,
      )}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">닫기</span>
    </ToastPrimitive.Close>
  )
}

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastAction, ToastClose, toastVariants }
