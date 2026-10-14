import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import UserSettingsPage from './pages/user/UserSettingsPage'
import UserSettingsEditPage from './pages/user/UserSettingsEditPage'
import KakaoCallbackPage from './pages/auth/KakaoCallbackPage'
import { Navigator } from './components/Navigator'

export default function App() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <Navigator />
      <main className="pt-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/user/settings" element={<UserSettingsPage />} />
          <Route path="/user/settings/edit" element={<UserSettingsEditPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
