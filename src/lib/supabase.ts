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
 * "로그인 상태 유지" 체크박스는 커스텀 storage 어댑터로 구현하지 않는다
 * — 실제로 시도해봤더니(이 파일의 이전 버전) signInWithPassword가 세션을
 * 돌려주고도 storage.setItem이 한 번도 반영되지 않아 getSession()이 늘
 * null을 보는 조용한 로그인 실패로 이어졌다. supabase-js가 커스텀
 * storage를 생성 시점에 자체 검증하면서 우리 어댑터를 신뢰 못 할 storage로
 * 판단해 내부적으로 memoryStorage로 조용히 대체해버리는 것으로 보인다
 * (같은 문제를 jeomechu/index.html에서도 한 번 겪었다 — 그때도 원인과
 * 해결책이 같았다).
 *
 * 그래서 여기도 jeomechu와 똑같이: Supabase 클라이언트는 기본 storage
 * (항상 localStorage)를 그대로 쓰고, "유지 안 함"은 로그인이 완전히
 * 끝난 뒤 SDK가 이미 localStorage에 써둔 세션 키를 sessionStorage로
 * 옮기는 후처리로만 구현한다(applyRememberMe, LoginPage에서 signIn
 * 성공 직후 호출). 로그인 도중에는 손대지 않으므로 SDK 내부 동기화
 * 타이밍을 방해할 여지가 없다.
 */
const SB_PROJECT_REF = (url ?? '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? ''
const SB_SESSION_KEY = SB_PROJECT_REF ? `sb-${SB_PROJECT_REF}-auth-token` : null

export function applyRememberMe(remember: boolean) {
  if (!SB_SESSION_KEY) return
  if (remember) {
    const s = sessionStorage.getItem(SB_SESSION_KEY)
    if (s) {
      localStorage.setItem(SB_SESSION_KEY, s)
      sessionStorage.removeItem(SB_SESSION_KEY)
    }
  } else {
    const v = localStorage.getItem(SB_SESSION_KEY)
    if (v) {
      sessionStorage.setItem(SB_SESSION_KEY, v)
      localStorage.removeItem(SB_SESSION_KEY)
    }
  }
}

export const supabase = createClient(url ?? '', anonKey ?? '')

/** 로그인 성공 후에도 이 이메일이 아니면 즉시 로그아웃시키는 관리자 1인 게이트. */
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined
