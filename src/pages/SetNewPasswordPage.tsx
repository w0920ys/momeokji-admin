import * as React from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const MIN_LENGTH = 8

/*
 * 비밀번호 재설정 메일 링크를 눌러 들어온 경우에만 뜨는 화면
 * (auth 상태가 'password-recovery'일 때 App.tsx가 이걸 렌더한다).
 * 여기서 새 비밀번호를 실제로 설정해야만 대시보드로 넘어간다 — 그냥
 * 로그인된 세션으로 흘려보내면 다음에 또 같은(모르는) 비밀번호로
 * 막히는 문제가 반복된다.
 */
export function SetNewPasswordPage() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_LENGTH) {
      setError(`비밀번호는 최소 ${MIN_LENGTH}자 이상이어야 합니다.`)
      return
    }
    if (password !== confirm) {
      setError('두 비밀번호가 서로 다릅니다.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await updatePassword(password)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-background flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 flex size-9 items-center justify-center rounded-md">
            <KeyRound className="size-4" aria-hidden />
          </div>
          <CardTitle>새 비밀번호 설정</CardTitle>
          <CardDescription>다음부터 기억할 수 있는 새 비밀번호를 설정하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className="text-14 font-medium">
                새 비밀번호
              </label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                required
                minLength={MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-14 font-medium">
                새 비밀번호 확인
              </label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={confirm.length > 0 && confirm !== password ? true : undefined}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <div>
                  <AlertTitle>설정할 수 없습니다</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </div>
              </Alert>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? '저장 중…' : '비밀번호 설정하고 들어가기'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
