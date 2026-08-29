import { createClient } from '@supabase/supabase-js'

/*
 * 모먹지(index.html)와 같은 Supabase 프로젝트를 인증 전용으로 재사용한다.
 * 새 인프라를 만들지 않는다 — 이 앱은 그 프로젝트의 auth.users 풀에서
 * "관리자 이메일 화이트리스트"만 통과시키는 별도 게이트일 뿐이다.
 *
 * 모먹지의 index.html은 값을 코드에 그대로 박아뒀지만(단일 정적 파일이라
 * 그게 최선), 이 앱은 Vite 빌드라 .env로 분리한다 — 값 자체는 publishable
 * anon 키라 번들에 노출돼도 안전(RLS가 실제 방어선)하고, 그럼에도 분리해
 * 두면 프로젝트를 바꿔 낄 때(예: 대시보드 전용 프로젝트로 분리) 코드
 * 수정 없이 .env만 바꾸면 된다.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // 개발 중 .env.local을 안 채웠을 때 조용히 실패하지 않고 바로 알려준다.
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다. .env.example을 참고해 .env.local을 채우세요.')
}

/*
 * "로그인 상태 유지" 체크박스 — 껐다 켰다 하는 진짜 자리는 세션을 어느
 * storage에 쓰느냐다. localStorage는 브라우저를 껐다 켜도 남고,
 * sessionStorage는 이 탭이 닫히면 사라진다. Supabase 클라이언트는 앱
 * 전체에서 하나만 써야 하므로(alerts.ts 등 여러 곳이 이 인스턴스를
 * import한다), storage 자체를 두 곳을 오가는 얇은 어댑터로 만들고
 * 로그인 직전에 setRememberMe로 목적지만 바꾼다.
 *
 * 새로고침 직후에는 이 변수가 기본값(local)으로 되돌아간다 — 그래서
 * "유지 안 함"으로 로그인해도 sessionStorage에 실제로 쓰여 있는 세션은
 * 그대로 읽힌다(같은 탭을 새로고침하는 동안은 로그인 유지, 탭/브라우저를
 * 완전히 닫으면 sessionStorage가 비어 로그아웃 상태로 시작).
 */
let rememberSession = true
export function setRememberMe(remember: boolean) {
  rememberSession = remember
}

const dynamicStorage = {
  getItem: (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key: string, value: string) => {
    ;(rememberSession ? localStorage : sessionStorage).setItem(key, value)
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: { storage: dynamicStorage },
})

/** 로그인 성공 후에도 이 이메일이 아니면 즉시 로그아웃시키는 관리자 1인 게이트. */
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined
