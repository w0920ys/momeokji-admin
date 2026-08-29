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

const dialogContentVariants = cva('w-full rounded-lg border bg-background p-6 shadow-lg outline-none', {
  variants: {
    size: {
      sm: 'max-w-sm',
      default: 'max-w-md',
      lg: 'max-w-2xl',
    },
  },
  defaultVariants: { size: 'default' },
})

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
      className={cn('text-lg font-semibold', className)}
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
      className={cn('text-muted-foreground text-sm', className)}
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
