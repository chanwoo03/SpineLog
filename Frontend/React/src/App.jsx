import { useState } from 'react'
import Header from './components/Header'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import PainRecord from './pages/PainRecord'
import ExerciseRecommend from './pages/ExerciseRecommend'
import PainTrend from './pages/PainTrend'
import ContentLibrary from './pages/ContentLibrary'
import MyPage from './pages/MyPage'

export default function App() {
  const [onboarded, setOnboarded] = useState(false)
  const [page, setPage] = useState('home')

  const nav = (p) => setPage(p)

  const renderPage = () => {
    if (!onboarded) return <Onboarding onComplete={() => { setOnboarded(true); setPage('home') }} />
    switch (page) {
      case 'home':     return <Dashboard onNav={nav} />
      case 'record':   return <PainRecord onNav={nav} />
      case 'exercise': return <ExerciseRecommend onNav={nav} />
      case 'trend':    return <PainTrend onNav={nav} />
      case 'content':  return <ContentLibrary onNav={nav} />
      case 'mypage':   return <MyPage onNav={nav} />
      default:         return <Dashboard onNav={nav} />
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {onboarded && <Header current={page} onNav={nav} />}
      <main style={{ 
        marginLeft: onboarded ? '260px' : '0', 
        maxWidth: 1200, 
        margin: onboarded ? '0 auto 0 260px' : '0 auto', 
        padding: '40px 32px 60px' 
      }}>
        {renderPage()}
      </main>
    </div>
  )
}