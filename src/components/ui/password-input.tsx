import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { VariantProps } from 'class-variance-authority'
import { Input, controlShellVariants } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/*
 * 눈 아이콘으로 평문/마스킹을 토글하는 비밀번호 입력. 로그인·비밀번호
 * 재설정·비밀번호 변경 세 곳에서 똑같은 "Input + 우측 토글 버튼" 조합을
 * 반복해서 짤 뻔했다 — Input 자체는 트레일링 아이콘을 모르는(범용)
 * 컴포넌트라 그 조합만 여기서 승격했다.
 *
 * 보이기 상태는 내부에서만 관리한다(비제어) — 소비자가 알 필요 없는
 * 순수 UI 상태라서 TrendBadge가 방향 아이콘을 내부에서 고르는 것과
 * 같은 이유다.
 */
type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type' | 'size'> &
  VariantProps<typeof controlShellVariants>

function PasswordInput({ className, size, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false)
  const id = React.useId()
  const inputId = props.id ?? id

  return (
    <div className="relative">
      <Input
        {...props}
        id={inputId}
        type={visible ? 'text' : 'password'}
        size={size}
        className={cn('pr-9', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
        aria-controls={inputId}
        aria-pressed={visible}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  )
}

export { PasswordInput }
