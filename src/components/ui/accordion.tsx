import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type AccordionVariant = 'bordered' | 'plain'

const Accordion = AccordionPrimitive.Root

/*
 * variant는 Item마다 다시 적는다 — Tabs의 TabsList·TabsTrigger가 각각
 * variant를 받는 것과 같은 자리다. 이 값이 바꾸는 것은 Item 하나의
 * 테두리 모양뿐이라 Context로 내려보낼 이유가 없다.
 *
 * plain은 항목 사이를 구분선(border-b) 하나로 정리해 한 줄기로 읽히고,
 * bordered는 항목마다 테두리 상자를 둘러 서로 떨어져 보인다.
 */
function AccordionItem({
  className,
  variant = 'plain',
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item> & { variant?: AccordionVariant }) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        variant === 'plain' && 'border-b last:border-b-0',
        variant === 'bordered' && 'mb-2 rounded-lg border px-4 last:mb-0',
        className,
      )}
      {...props}
    />
  )
}

/*
 * Radix가 <h3>를 그리고 그 안에 버튼(Trigger)을 둔다 — 그래서
 * AccordionHeader가 밖을 감싼다. 화살표는 부위로 두지 않는다. Trigger
 * 안쪽에서 그려지므로 밖에서 지시선을 붙일 자리가 없고, 붙이려면 이
 * 컴포넌트가 문서 시스템의 표시를 알아야 한다 — Select의 화살표와 같은
 * 처리다.
 */
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium outline-none transition-all',
          'hover:underline',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:rounded-sm',
          'disabled:pointer-events-none disabled:opacity-50',
          '[&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden
          className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn('text-muted-foreground pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
export type { AccordionVariant }
