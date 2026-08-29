import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * 뼈대는 눈으로만 보는 자리 표시다. 불러오는 중이라는 사실은 스크린
 * 리더에 role="status" 문구가 따로 전하므로, 이 컴포넌트는 스스로
 * aria-hidden을 달아 접근성 트리에서 빠진다.
 */
const skeletonVariants = cva('animate-pulse bg-muted', {
  variants: {
    shape: {
      text: 'h-4 w-full rounded',
      title: 'h-6 w-1/2 rounded',
      block: 'h-24 w-full rounded-md',
      circle: 'size-10 rounded-full',
    },
  },
  defaultVariants: { shape: 'text' },
})

type SkeletonProps = React.ComponentProps<'div'> & VariantProps<typeof skeletonVariants>

function Skeleton({ className, shape = 'text', ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(skeletonVariants({ shape, className }))}
      {...props}
    />
  )
}

export { Skeleton, skeletonVariants }
