import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn('fixed inset-0 z-overlay bg-black/50', className)}
      {...props}
    />
  )
}

/*
 * 바깥 그릇이 p-4(위아래 합 2rem)만큼 여백을 먹으므로, 내용이 그
 * 남은 높이(100svh - 2rem)를 넘으면 컨테이너 자체가 세로로 스크롤한다.
 * 이게 없으면 화면보다 긴 다이얼로그(예: 유저 상세)는 아래쪽 내용이
 * 그냥 넘쳐서 잘리고, 바깥 덮개는 고정(fixed)이라 스크롤할 방법이
 * 없어진다 — 헤더/푸터를 스크롤 밖으로 고정하는 대신 전체를 한
 * 스크롤 컨테이너로 두는 쪽을 택했다(Sheet와 같은 방식).
 *
 * overflow-x-hidden: 다이얼로그는 세로로만 스크롤해야 한다 — 가로
 * 스크롤은 절대 생기면 안 된다. overflow-y를 auto로 두면 CSS 스펙상
 * overflow-x가 visible이어도 auto로 강제 승격되는데(둘 중 하나가
 * visible이 아니면 나머지도 auto가 됨), 안에 줄바꿈 없는 텍스트나
 * 좁은 grid 칸(예: 3열 KPI 타일)이 있으면 그 승격된 overflow-x가
 * 실제로 가로 스크롤바를 만들어 버린다. 내용 쪽(각 컴포넌트에
 * min-w-0 등)도 넘치지 않게 고치는 게 우선이지만, 그것과 별개로
 * 다이얼로그 자체는 항상 overflow-x-hidden으로 가로 스크롤을 원천
 * 차단한다 — 못 고친 콘텐츠가 있어도 최소한 스크롤바는 안 생기고
 * 조용히 줄바꿈되거나 잘리는 쪽을 택한다.
 */
const dialogContentVariants = cva(
  'max-h-[calc(100svh-2rem)] w-full overflow-y-auto overflow-x-hidden rounded-lg border bg-background p-6 shadow-lg outline-none',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-md',
        lg: 'max-w-2xl',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

/*
 * calc()로 뷰포트 폭에서 여백을 빼는 대신, 덮개를 그대로 중앙 정렬
 * 그릇으로 쓴다 — inset-0 + grid place-items-center + p-4로 화면
 * 가장자리 여백을 만들고, 컨테이너는 w-full과 size별 max-w로만
 * 너비를 정한다. 임의 값 대괄호를 쓰지 않고도 좁은 화면에서
 * 컨테이너가 뷰포트에 닿지 않는다.
 */
function DialogContent({
  className,
  size,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogContentVariants> & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <div className="fixed inset-0 z-overlay grid place-items-center p-4">
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn('relative flex flex-col gap-4', dialogContentVariants({ size }), className)}
          {...props}
        >
          {children}
          {showClose && (
            <DialogPrimitive.Close
              className={cn(
                'absolute top-4 right-4 rounded-xs opacity-70 outline-none transition-opacity hover:opacity-100',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2',
                'disabled:pointer-events-none',
              )}
            >
              <X className="size-4" />
              <span className="sr-only">닫기</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-1.5', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-20 font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-16', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
