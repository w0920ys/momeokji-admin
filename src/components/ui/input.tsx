import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * 테두리 있는 컨트롤(Input, Select trigger, Textarea)이 공유하는 껍데기다.
 * hover는 배경이 아니라 테두리로 나타낸다 — 배경은 이미 readonly가,
 * 불투명도는 disabled가 쓰고 있어서 hover까지 배경을 두고 다투면 하나만
 * 남는다. 테두리도 focus·aria-invalid와 겹치지만 이 둘은 hover보다
 * 강한 상태라 소스 순서로 이긴다(둘 다 이 문자열에서 hover 뒤에 온다).
 * bg-background는 입력 전용이 아니라 여기 둔다 — Select trigger의 기본
 * 배경이 Input의 기본 배경과 같아야 하기 때문이다.
 *
 * 좌우 패딩(px-3)은 기본값으로 base 문자열에 둔다 — size 변형 자체를
 * 선택하지 않는 소비자(Textarea)도 반드시 패딩을 받아야 하기 때문이다.
 * sm·lg는 그 기본값과 다른 자기 몫의 px를 그대로 들고 있고, cn()이
 * tailwind-merge를 거치므로 나중에 오는 size 쪽 px가 base의 px-3을
 * 이긴다 — Input·SelectTrigger의 sm·lg 렌더링은 그대로다.
 *
 * size 변형에는 defaultVariants를 두지 않는다. Textarea처럼 높이가
 * 필요 없는 소비자는 size를 아예 넘기지 않아 h-control-* 클래스가
 * 붙지 않고, 그러면 h-auto로 되짚어 덮을 필요가 없다. Input·SelectTrigger는
 * 각자 size 파라미터에 자체 기본값 'default'를 둔다.
 */
const controlShellVariants = cva(
  'flex w-full min-w-0 rounded-md border border-input bg-background px-3 text-16 shadow-xs transition outline-none hover:border-ring/60 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:bg-input/30',
  {
    variants: {
      size: {
        sm: 'h-control-sm px-2.5',
        default: 'h-control',
        lg: 'h-control-lg px-3.5',
      },
    },
  },
)

/*
 * 텍스트를 직접 입력하는 필드(Input, Textarea)에만 뜻이 있는 것을 얹는다.
 * placeholder:·selection:은 native <input>/<textarea>에만 있는 의사
 * 요소이고, readonly는 이 시스템에서 Select에는 없는 상태다(state 축에
 * readonly가 없다). [readonly]는 실제 readonly 어트리뷰트만 본다 —
 * :read-only 의사 클래스를 썼다면 CSS 명세상 disabled 입력도 걸려
 * "비활성과 읽기 전용은 다르다"는 약속이 무너진다.
 * size 기본값은 여기서 주지 않는다 — Textarea가 size 없이 이 함수를
 * 그대로 불러 h-control-*을 받지 않아야 하기 때문이다. Input이 자기
 * 몫의 기본값 'default'를 스스로 챙긴다.
 */
function inputVariants({
  size,
  className,
}: VariantProps<typeof controlShellVariants> & { className?: string } = {}) {
  return cn(
    controlShellVariants({ size }),
    'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground [&[readonly]]:bg-muted [&[readonly]]:text-muted-foreground',
    className,
  )
}

/*
 * 네이티브 input에도 size 속성이 있고 그것은 숫자다.
 * 변형 이름과 겹치므로 네이티브 쪽을 걷어낸다 — 이 시스템에서 폭은 부모가 정한다.
 */
type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof controlShellVariants>

function Input({ className, size = 'default', type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={inputVariants({ size, className })}
      {...props}
    />
  )
}

export { Input, inputVariants, controlShellVariants }
