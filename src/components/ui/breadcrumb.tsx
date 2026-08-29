import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="현재 위치" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        'text-muted-foreground flex flex-wrap items-center gap-1.5 text-16',
        className,
      )}
      {...props}
    />
  )
}

/*
 * min-w-0을 기본으로 둔다 — BreadcrumbList가 flex-wrap이라 항목 여러
 * 개가 한 줄에 안 들어가면 항목째로 다음 줄에 내려가지만, 항목 하나의
 * 글자 자체가 컨테이너보다 길면(예: 긴 레코드 이름) min-w-0 없이는
 * 그 항목이 줄어들 수 없어 글자가 항목 박스 안에서 두 줄로 접혔다.
 * BreadcrumbLink·BreadcrumbPage의 기본 truncate와 짝이다 — 부모가
 * 줄어들 수 있어야 자식의 truncate가 실제로 발동한다.
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn('inline-flex min-w-0 items-center gap-1.5', className)}
      {...props}
    />
  )
}

/*
 * 라우터를 알지 않는다. 기본은 <a>이고, asChild를 켜면 자식이 그 자리를 대신한다 —
 * react-router의 Link든 next/link든 쓰는 쪽이 넣는다. Button이 쓰는 방식과 같다.
 *
 * truncate를 기본으로 둔다 — 길이 제한이 없으면 대부분은 아무 효과가
 * 없지만(내용이 이미 한 줄에 들어가므로), 이름이 긴 항목이 좁은 자리에
 * 놓이면 줄바꿈 대신 끝을 줄임표로 자른다. 이전에는 이 클래스를 페이지마다
 * 손으로 달아야 했다 — 실제 소비처(DetailPatternPage 등)는 대부분
 * 달지 않았고, 그 자리에서 긴 이름이 오면 그대로 줄바꿈됐다.
 */
function BreadcrumbLink({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'a'
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn('hover:text-foreground truncate transition-colors', className)}
      {...props}
    />
  )
}

/* 마지막 항목은 링크가 아니다. 지금 위치는 이동할 곳이 없으므로 span에 aria-current만 단다 */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn('text-foreground truncate font-medium', className)}
      {...props}
    />
  )
}

/* 구분자는 장식이다. 스크린리더가 항목 사이마다 읽지 않도록 aria-hidden을 단다 */
function BreadcrumbSeparator({ className, children, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

/* 계층이 넷을 넘어 가운데를 줄일 때, 접힌 항목들의 자리를 나타낸다 */
function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-control-sm items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">가운데 항목 줄임</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
