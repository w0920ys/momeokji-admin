import * as React from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { ADMIN_EMAIL, supabase } from '@/lib/supabase'

/*
 * 관리자 1인 전용 인증. Supabase Auth는 "로그인 성공"까지만 보장하고,
 * "허용된 이메일인가"는 이 앱의 책임이다 — 그래서 로그인 성공 콜백 안에서
 * 곧바로 화이트리스트를 검사하고, 아니면 세션을 만들자마자 지운다(허용
 * 안 된 계정의 세션이 로컬에 잠깐이라도 남아있지 않게).
 *
 * 'password-recovery' 상태가 따로 있는 이유: 비밀번호 재설정 메일의
 * 링크를 누르면 Supabase가 PASSWORD_RECOVERY 이벤트와 함께 유효한
 * 세션을 만들어준다. 이 세션을 signed-in과 똑같이 취급하면 새 비밀번호를
 * 한 번도 입력하지 않고 바로 대시보드로 들어가 버려서(다음에 또 같은
 * 비밀번호를 몰라 못 들어오는 문제가 반복된다) — 그래서 이 이벤트만
 * 따로 잡아 "새 비밀번호를 설정해야 통과하는" 별도 상태로 둔다.
 */

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out'; error?: string }
  | { status: 'password-recovery'; user: User }
  | { status: 'signed-in'; user: User }

// interface는 유니온 타입을 extends할 수 없어(TS2312) type 교차로 만든다 —
// AuthState의 판별 유니온(status로 좁혀지는 구조)을 그대로 유지해야
// App.tsx에서 auth.status로 좁힌 뒤 auth.user에 안전하게 접근할 수 있다.
type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function isAllowed(email: string | null | undefined): boolean {
  if (!ADMIN_EMAIL) return false
  return (email ?? '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({ status: 'loading' })
  // PASSWORD_RECOVERY 이후에 오는 일반 SIGNED_IN/INITIAL_SESSION 이벤트가
  // recovery 상태를 조용히 덮어써 버리지 않게 플래그로 기억해둔다 —
  // updatePassword가 성공적으로 끝났을 때만 이 플래그를 내려 정상 로그인
  // 상태로 넘어간다.
  const inRecovery = React.useRef(false)

  const applySession = React.useCallback(async (session: Session | null, event?: string) => {
    if (event === 'PASSWORD_RECOVERY') {
      if (session?.user) {
        inRecovery.current = true
        setState({ status: 'password-recovery', user: session.user })
      }
      return
    }
    if (inRecovery.current) {
      // 새 비밀번호를 설정하는 동안 발생하는 다른 이벤트에 밀려나지 않는다.
      return
    }
    if (!session?.user) {
      setState({ status: 'signed-out' })
      return
    }
    if (!isAllowed(session.user.email)) {
      // 허용되지 않은 계정 — 세션을 즉시 지우고 로그인 화면으로.
      await supabase.auth.signOut()
      setState({ status: 'signed-out', error: '이 계정은 이 대시보드에 접근할 권한이 없습니다.' })
      return
    }
    setState({ status: 'signed-in', user: session.user })
  }, [])

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => applySession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      applySession(session, event)
    })
    return () => sub.subscription.unsubscribe()
  }, [applySession])

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setState({ status: 'signed-out', error: error.message })
      throw error
    }
    // onAuthStateChange가 applySession을 이어서 호출한다(화이트리스트 검사 포함).
  }, [])

  const signOut = React.useCallback(async () => {
    inRecovery.current = false
    await supabase.auth.signOut()
  }, [])

  const requestPasswordReset = React.useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }, [])

  const updatePassword = React.useCallback(async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    inRecovery.current = false
    if (data.user) {
      // 화이트리스트를 거쳐 정상 로그인 상태로 전환한다 — 새 세션을
      // 다시 가져오지 않고 이미 가진 user로 바로 판정해도 된다(recovery
      // 세션도 결국 같은 계정의 세션이라 email이 이미 확인돼 있다).
      if (isAllowed(data.user.email)) setState({ status: 'signed-in', user: data.user })
      else {
        await supabase.auth.signOut()
        setState({ status: 'signed-out', error: '이 계정은 이 대시보드에 접근할 권한이 없습니다.' })
      }
    }
  }, [])

  const value: AuthContextValue = { ...state, signIn, signOut, requestPasswordReset, updatePassword }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있다')
  return ctx
}
