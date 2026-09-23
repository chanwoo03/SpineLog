import { useState } from 'react'

const NAV = [
  { label: '홈', page: 'home', icon: <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 7L8.5 2l6.5 5v8a1 1 0 01-1 1H3a1 1 0 01-1-1V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 16v-5h5v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
  { label: '기록', page: 'record', icon: <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="2.5" y="2" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 6h6M5.5 9h6M5.5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { label: '추천', page: 'exercise', icon: <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 2l1.7 3.4 3.8.55-2.75 2.68.65 3.77L8.5 10.5l-3.4 1.9.65-3.77L3 6.95l3.8-.55L8.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
  { label: '추이', page: 'trend', icon: <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M2 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label: '콘텐츠', page: 'content', icon: <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="2" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 7h6M5.5 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { label: '마이페이지', page: 'mypage', icon: <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="6" r="2.8" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 15c0-3.038 2.686-5.5 6-5.5s6 2.462 6 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
]

export default function Header({ current, onNav }) {
  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: '260px',
      backgroundColor: 'white',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      zIndex: 100,
      boxShadow: '2px 0 8px rgba(0,0,0,.03)'
    }}>
      {/* 로고 영역 */}
      <button onClick={() => onNav('home')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 36, padding: 0, textAlign: 'left' }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M9 2v14M9 9H5M9 9h4M5 5.5h8M5 12.5h8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'Instrument Sans', fontWeight: 700, color: 'var(--primary)', fontSize: 20, letterSpacing: '-0.02em' }}>SpineWell</span>
      </button>

      {/* 세로 메뉴 리스트 */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {NAV.map(item => {
          const active = current === item.page
          return (
            <button
              key={item.page}
              onClick={() => onNav(item.page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .15s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* 하단 프로필 영역 */}
      <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6.5" r="3" stroke="var(--primary)" strokeWidth="1.5"/><path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text)' }}>김척추 님</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>허리디스크 관리중</p>
        </div>
      </div>
    </aside>
  )
}