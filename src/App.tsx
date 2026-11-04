import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import UserSettingsPage from './pages/user/UserSettingsPage'
import UserSettingsEditPage from './pages/user/UserSettingsEditPage'
import NotifyInterestEditPage from './pages/user/NotifyInterestEditPage'
import EmbedApplyPage from './pages/user/EmbedApplyPage'
import { EMBED_APPLY_PATH } from './components/paid/PaidServices'
import KakaoCallbackPage from './pages/auth/KakaoCallbackPage'
import MySensePage from './pages/sense/MySensePage'
import TagsPage from './pages/tag/TagsPage'
import BoardLayout from './pages/board/BoardLayout'
import BoardPage from './pages/board/BoardPage'
import BoardWritePage from './pages/board/BoardWritePage'
import { BoardItemPage, BoardThreadPage } from './pages/board/BoardItemPages'
import ArticleEditPage from './pages/board/ArticleEditPage'
import { NoticeDetailPage, NoticePage, NoticeThreadPage } from './pages/board/NoticePages'
import { Navigator } from './components/Navigator'
import { Footer } from './components/Footer'
import { ScrollTopButton } from './components/ScrollTopButton'
import { documentPath } from './lib/documents'
import { CAMPAIGN_PATH } from './lib/campaign'
import CampaignListPage from './pages/campaign/CampaignListPage'
import { SiteTitle } from './components/SiteTitle'
import { useFcmTokenSync } from './hooks/useFcmTokenSync'
import { ErrorBanner } from './components/ErrorBanner'
import { LoadingSpinner } from '@/components/LoadingSpinner.tsx'

// 마크다운 라이브러리가 커서 상세 페이지를 열 때만 따로 불러온다.
const SenseDetailPage = lazy(() => import('./pages/sense/SenseDetailPage'))
// 대화록 상세(의견 목록)도 들어갈 때만 불러온다.
const ThreadOpinionsPage = lazy(() => import('./pages/sense/ThreadOpinionsPage'))
// 개인정보처리방침, 이용약관, 소개 등 문서도 마크다운이라 들어갈 때만 불러온다.
const DocumentPage = lazy(() => import('./pages/document/DocumentPage'))
// 캠페인 상세도 마크다운이라 들어갈 때만 불러온다.
const CampaignDetailPage = lazy(() =>
  import('./pages/campaign/CampaignPages').then((m) => ({ default: m.CampaignDetailPage })),
)
const CampaignThreadPage = lazy(() =>
  import('./pages/campaign/CampaignPages').then((m) => ({ default: m.CampaignThreadPage })),
)

// 예전 태그 주소(/sense/tag/:tag)는 태그 메뉴로 보낸다.
function LegacyTagRedirect() {
  const { tag = '' } = useParams<{ tag: string }>()
  return <Navigate to={`/tags/${encodeURIComponent(tag)}`} replace />
}

const pageFallback = <LoadingSpinner />

export default function App() {
  useFcmTokenSync()

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <ErrorBanner />
      <header className="space-y-4">
        <Navigator />
        <SiteTitle />
      </header>
      <main className="pt-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/documents/:slug"
            element={
              <Suspense fallback={pageFallback}>
                <DocumentPage />
              </Suspense>
            }
          />
          <Route path={CAMPAIGN_PATH} element={<CampaignListPage />} />
          <Route
            path="/campaign/:type/:id"
            element={
              <Suspense fallback={pageFallback}>
                <CampaignDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/campaign/:type/:id/threads/:threadId"
            element={
              <Suspense fallback={pageFallback}>
                <CampaignThreadPage />
              </Suspense>
            }
          />
          <Route path="/about" element={<Navigate to={documentPath('about')} replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/user/settings" element={<UserSettingsPage />} />
          <Route path="/user/settings/edit" element={<UserSettingsEditPage />} />
          <Route path="/user/settings/interest/edit" element={<NotifyInterestEditPage />} />
          <Route path={EMBED_APPLY_PATH} element={<EmbedApplyPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route path="/sense/my-sense" element={<MySensePage />} />
          <Route path="/tags/:tag?" element={<TagsPage />} />
          {/* 공지사항은 공용 설정의 게시판이 아니라 따로 둔다. (정적 경로라 :slug 보다 먼저 맞는다) */}
          <Route path="/board/notice" element={<BoardLayout />}>
            <Route index element={<NoticePage />} />
            <Route path=":id" element={<NoticeDetailPage />} />
            <Route path=":id/threads/:threadId" element={<NoticeThreadPage />} />
          </Route>
          <Route path="/board/:slug" element={<BoardLayout />}>
            <Route index element={<BoardPage />} />
            <Route path="write" element={<BoardWritePage />} />
            <Route path=":id" element={<BoardItemPage />} />
            <Route path=":id/edit" element={<ArticleEditPage />} />
            <Route path=":id/threads/:threadId" element={<BoardThreadPage />} />
          </Route>
          <Route path="/sense/tag/:tag" element={<LegacyTagRedirect />} />
          <Route
            path="/sense/:id"
            element={
              <Suspense fallback={pageFallback}>
                <SenseDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/sense/:id/threads/:threadId"
            element={
              <Suspense fallback={pageFallback}>
                <ThreadOpinionsPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <ScrollTopButton />
    </div>
  )
}
