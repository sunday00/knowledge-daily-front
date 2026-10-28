# knowledge-daily-front

## 소통 규칙

- 설명, 요약, 보고는 **한글 위주**로 작성한다. 사용자가 다른 언어를 요청하기 전까지 유지한다.
- 코드, 명령어, 파일 경로, 식별자는 원문 그대로 둔다.

## 스택

- React 18 + Vite 5 + TypeScript, UnoCSS, Apollo Client (GraphQL), react-router-dom v6
- 마크다운 렌더링: `react-markdown` + `remark-gfm` (`src/components/MarkdownView.tsx`)
- 인증: Kakao OAuth, HttpOnly 서버 쿠키 (프론트에서 토큰 저장 안 함, Authorization 헤더로 바꾸지 말 것)
- 푸시: Firebase Cloud Messaging

## 명령어

패키지 매니저는 **pnpm** 만 사용한다 (npm/yarn 금지).

- `pnpm dev` — 개발 서버 (포트 **5080** 고정, macOS AirPlay 가 5000 을 점유)
- `pnpm dev --force` — Vite 의존성 캐시를 다시 생성하며 실행
- `pnpm lint` — 타입 체크 (`tsc -b --noEmit`)
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm codegen` — GraphQL 타입 생성

## 구조

- `src/pages` — 라우트 페이지
- `src/components` — 공용 컴포넌트
- `src/actions` — 뮤테이션 등 서버 호출 로직
- `src/graphql` — GraphQL 문서 및 생성된 타입
- `src/auth` — `AuthProvider`
- 경로 별칭: `@` → `src`

## 환경 변수

`.env.example` 참고 (`VITE_GRAPHQL_ENDPOINT`, Kakao, Firebase 키 등). 실제 값은 `.env.local`.
