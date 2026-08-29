import * as React from 'react'
import { Lock, MailQuestion } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { setRememberMe } from '@/lib/supabase'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/*
 * 관리자 1인 전용 로그인. 회원가입 화면은 없다 — 계정은 Supabase
 * 대시보드에서 미리 1회 만들어둔다(공개 가입을 열어둘 이유가 없는
 * 내부 도구라서). "비밀번호를 잊으셨나요?"는 로그인 폼의 이메일을
 * 재사용하지 않고 완전히 별도 화면(ResetPasswordView)으로 전환한다 —
 * 처음엔 재사용했다가, 로그인 이메일을 안 채운 채 누르면 "로그인할 수
 * 없습니다"라는 엉뚱한 알럿이 뜨는 문제를 겪었다(재설정 시도인데 로그인
 * 실패처럼 보임). 화면을 분리하면 그 문맥 자체가 안 생긴다.
 */
export function LoginPage() {
  const [mode, setMode] = React.useState<'login' | 'reset'>('login')
  const [prefillEmail, setPrefillEmail] = React.useState('')

  if (mode === 'reset') {
    return (
      <ResetPasswordView
        initialEmail={prefillEmail}
        onBack={(email) => {
          setPrefillEmail(email)
          setMode('login')
        }}
      />
    )
  }

  return (
    <LoginView
      initialEmail={prefillEmail}
      onForgotPassword={(email) => {
        setPrefillEmail(email)
        setMode('reset')
      }}
    />
  )
}

function LoginView({
  initialEmail,
  onForgotPassword,
}: {
  initialEmail: string
  onForgotPassword: (email: string) => void
}) {
  const auth = useAuth()
  const { signIn } = auth
  // error는 signed-out 상태에서만 존재하는 판별 유니온 필드라 narrowing 먼저.
  const authError = auth.status === 'signed-out' ? auth.error : undefined

  const [email, setEmail] = React.useState(initialEmail)
  const [emailTouched, setEmailTouched] = React.useState(false)
  const [password, setPassword] = React.useState('')
  const [remember, setRemember] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)

  const error = localError ?? authError
  const emailInvalid = emailTouched && email.length > 0 && !EMAIL_PATTERN.test(email)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailTouched(true)
    if (!EMAIL_PATTERN.test(email)) {
      setLocalError('올바른 이메일 형식이 아닙니다.')
      return
    }
    setLocalError(null)
    setSubmitting(true)
    try {
      // 로그인 API를 부르기 전에 세션을 어디에 쓸지부터 정한다 — 응답이
      // 오는 순간 storage에 곧바로 쓰이기 시작하므로 순서가 중요하다.
      setRememberMe(remember)
      await signIn(email, password)
    } catch {
      // useAuth 쪽 state.error에 이미 메시지가 담김 — 여기선 재던지지 않음.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard icon={<Lock className="size-4" aria-hidden />} title="모먹지 애널리틱스" description="관리자 전용 대시보드입니다. 허용된 계정만 로그인할 수 있습니다.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium">
            이메일
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={emailInvalid || undefined}
            aria-describedby={emailInvalid ? 'login-email-error' : undefined}
          />
          {emailInvalid && (
            <p id="login-email-error" className="text-destructive-on-tint text-xs">
              올바른 이메일 형식이 아닙니다.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-sm font-medium">
            비밀번호
          </label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="login-remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
          <label htmlFor="login-remember" className="text-sm">
            로그인 상태 유지
          </label>
        </div>

        {error && (
          <Alert variant="destructive">
            <div>
              <AlertTitle>로그인할 수 없습니다</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
        <Button type="button" variant="link" size="sm" onClick={() => onForgotPassword(email)} className="self-center">
          비밀번호를 잊으셨나요?
        </Button>
      </form>
    </AuthCard>
  )
}

function ResetPasswordView({ initialEmail, onBack }: { initialEmail: string; onBack: (email: string) => void }) {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = React.useState(initialEmail)
  const [emailTouched, setEmailTouched] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)

  const emailInvalid = emailTouched && email.length > 0 && !EMAIL_PATTERN.test(email)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailTouched(true)
    if (!EMAIL_PATTERN.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard icon={<MailQuestion className="size-4" aria-hidden />} title="비밀번호 재설정" description="가입한 이메일로 재설정 링크를 보내드립니다.">
      {sent ? (
        <div className="flex flex-col gap-4">
          <Alert variant="info">
            <div>
              <AlertTitle>재설정 메일 발송됨</AlertTitle>
              <AlertDescription>{email}로 비밀번호 재설정 링크를 보냈습니다. 메일함을 확인하세요.</AlertDescription>
            </div>
          </Alert>
          <Button type="button" variant="outline" className="w-full" onClick={() => onBack(email)}>
            로그인으로 돌아가기
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-email" className="text-sm font-medium">
              이메일
            </label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              aria-invalid={emailInvalid || undefined}
              aria-describedby={emailInvalid ? 'reset-email-error' : undefined}
            />
            {emailInvalid && (
              <p id="reset-email-error" className="text-destructive-on-tint text-xs">
                올바른 이메일 형식이 아닙니다.
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <div>
                <AlertTitle>재설정 메일을 보낼 수 없습니다</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? '보내는 중…' : '재설정 메일 보내기'}
          </Button>
          <Button type="button" variant="link" size="sm" onClick={() => onBack(email)} className="self-center">
            로그인으로 돌아가기
          </Button>
        </form>
      )}
    </AuthCard>
  )
}

function AuthCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-md">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
