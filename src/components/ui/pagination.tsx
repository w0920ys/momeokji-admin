import * as React from 'react'
import { cn } from '@/lib/utils'

/*
 * Button을 그대로 재사용한다. 새 버튼을 만들지 않으므로 이전·다음·페이지 번호는
 * 모두 페이지가 <Button>으로 직접 구성한다. 여기 두는 것은 그 버튼들을 감싸는
 * 뼈대와, 전체 개수·페이지당 개수를 보이는 텍스트뿐이다.
 */
function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label="페이지 이동"
      data-slot="pagination"
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
      {...props}
    />
  )
}

/** 페이지 번호 버튼들을 묶는 자리. 이전·다음은 이 바깥에 놓인다 */
function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" className={className} {...props} />
}

/** 전체 개수·페이지당 개수를 보이는 자리. 값은 페이지가 정한다 */
function PaginationInfo({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="pagination-info"
      className={cn('text-muted-foreground text-16', className)}
      {...props}
    />
  )
}

export { Pagination, PaginationContent, PaginationItem, PaginationInfo }
