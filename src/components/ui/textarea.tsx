import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { inputVariants } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/*
 * 가로 크기 조절은 막는다. 폭이 바뀌면 옆 요소가 밀려 폼의 정렬이 무너진다.
 * 세로는 사용자가 늘릴 수 있게 두고, auto는 내용에 따라 자란다.
 */
const resizeVariants = cva('min-h-20 py-2', {
  variants: {
    resize: {
      none: 'resize-none',
      vertical: 'resize-y',
      auto: 'resize-none field-sizing-content',
    },
  },
  defaultVariants: { resize: 'vertical' },
})

type TextareaProps = Omit<React.ComponentProps<'textarea'>, 'size'> &
  VariantProps<typeof resizeVariants>

/*
 * inputVariants를 size 없이 부른다 — controlShellVariants는 size에
 * defaultVariants가 없어서 h-control-* 중 어느 것도 붙지 않는다.
 * 예전처럼 h-auto로 그 높이를 되짚어 덮을 필요가 없다. placeholder:·
 * selection:·readonly 스타일은 Textarea도 실제 텍스트 필드라 그대로 쓴다.
 */
function Textarea({ className, resize, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputVariants({}), resizeVariants({ resize }), className)}
      {...props}
    />
  )
}

export { Textarea }
