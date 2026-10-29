import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloError, ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './lib/apollo'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './auth/AuthProvider'
import { reportError } from './lib/errorReporter'
import { ensureSharedConfigs } from './lib/sharedConfigs'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import './index.css'

window.addEventListener('error', (e) => {
  reportError(`[Error] ${e.message}`, e.error)
})
window.addEventListener('unhandledrejection', (e) => {
  // API 에러는 apollo errorLink 에서 이미 보고됨
  if (e.reason instanceof ApolloError) return
  reportError(
    `[Unhandled] ${e.reason instanceof Error ? e.reason.message : String(e.reason)}`,
    e.reason,
  )
})

// 로컬에 공용 설정이 없으면 시작하자마자 받아 둔다. (API 요청 때도 없으면 먼저 받는다)
void ensureSharedConfigs()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  </StrictMode>,
)
