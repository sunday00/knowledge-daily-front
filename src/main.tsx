import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloError, ApolloProvider } from '@apollo/client'
import App from './App'
import { apolloClient } from './lib/apollo'
import { ThemeProvider } from './theme/ThemeProvider'
import { AuthProvider } from './auth/AuthProvider'
import { reportError } from './lib/errorReporter'
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
