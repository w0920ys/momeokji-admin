import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
 * Dialog와 같은 Radix primitive(@radix-ui/react-dialog) 위에, 화면 중앙이
 * 아니라 한쪽 가장자리에서 슬라이드해 들어오는 패널만 다르게 그린 것 —
 * "모달이되 화면 밖에서 밀고 들어온다"는 점만 Dialog와 다르다. 좁은
 * 화면에서 항목 수가 많은 목록(예: AppShell 모바일 내비)을 옆으로
 * 스크롤시키지 않고 세로로 쭉 나열해서 보여줄 자리가 필요해 추가한다.
 */
const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn('fixed inset-0 z-overlay bg-black/50', className)}
      {...props}
    />
  )
}

const sheetContentVariants = cva('fixed z-overlay flex h-full flex-col bg-background outline-none', {
  variants: {
    side: {
      left: 'inset-y-0 left-0 w-72 max-w-[85vw] border-r',
      right: 'inset-y-0 right-0 w-72 max-w-[85vw] border-l',
    },
  },
  defaultVariants: { side: 'left' },
})

function SheetContent({
  className,
  side,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetContentVariants> & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content data-slot="sheet-content" className={cn(sheetContentVariants({ side }), className)} {...props}>
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
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-header" className={cn('flex h-14 shrink-0 items-center border-b px-4', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="sheet-title" className={cn('text-14 font-semibold', className)} {...props} />
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle }
