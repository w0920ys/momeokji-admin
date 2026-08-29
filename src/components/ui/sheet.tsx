import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

export type SheetSide = 'right' | 'left' | 'top' | 'bottom'

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn('fixed inset-0 z-overlay bg-black/50', className)}
      {...props}
    />
  )
}

/*
 * 덮개를 그대로 그릇으로 쓴다 — Dialog가 place-items-center로 가운데에
 * 놓는 자리에서, Sheet는 방향에 따라 flex의 축과 끝을 바꿔 한쪽 변에
 * 붙인다. 늘어나는 쪽은 flex의 기본 stretch가 맡으므로 h-full·w-full을
 * 방향마다 따로 적지 않아도 된다.
 */
const SHEET_ALIGN: Record<SheetSide, string> = {
  right: 'flex-row justify-end',
  left: 'flex-row justify-start',
  top: 'flex-col justify-start',
  bottom: 'flex-col justify-end',
}

/*
 * 좌우는 너비를, 위아래는 높이를 막는다. 어느 쪽도 고정 값이 아니라
 * max-*이므로 화면이 그보다 좁거나 낮으면 컨테이너가 따라 줄어든다.
 */
const sheetContentVariants = cva(
  'relative flex w-full flex-col gap-4 overflow-y-auto border bg-background p-6 shadow-lg outline-none',
  {
    variants: {
      side: {
        right: 'border-l',
        left: 'border-r',
        top: 'border-b',
        bottom: 'border-t',
      },
      size: {
        sm: '',
        default: '',
        lg: '',
      },
    },
    compoundVariants: [
      { side: ['right', 'left'], size: 'sm', class: 'max-w-xs' },
      { side: ['right', 'left'], size: 'default', class: 'max-w-sm' },
      { side: ['right', 'left'], size: 'lg', class: 'max-w-xl' },
      { side: ['top', 'bottom'], size: 'sm', class: 'max-h-40' },
      { side: ['top', 'bottom'], size: 'default', class: 'max-h-64' },
      { side: ['top', 'bottom'], size: 'lg', class: 'max-h-96' },
    ],
    defaultVariants: { side: 'right', size: 'default' },
  },
)

function SheetContent({
  className,
  side = 'right',
  size,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetContentVariants> & { side?: SheetSide; showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <div className={cn('fixed inset-0 z-overlay flex', SHEET_ALIGN[side])}>
        <DialogPrimitive.Content
          data-slot="sheet-content"
          data-side={side}
          className={cn(sheetContentVariants({ side, size }), className)}
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

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-header" className={cn('flex shrink-0 flex-col gap-1.5', className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-20 font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-16', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
