import { useState } from 'react'
import { ARTICLES } from '../data'

const CATS = [
  { label: '질환 정보',       subs: ['허리디스크', '척추관협착증', '척추전방전위증'] },
  { label: '운동·재활 가이드', subs: ['신전 운동', '코어 강화', '보행 훈련'] },
  { label: '생활습관 관리',    subs: ['자세 교정', '수면 관리', '체중 관리'] },
  { label: '통증 관리',        subs: ['통증 평가', '물리 치료', '약물 관리'] },
]

const CAT_COLOR = {
  '질환 정보':       ['#eff6ff', '#1d4ed8'],
  '운동·재활 가이드':['#f0fdf4', '#16a34a'],
  '생활습관 관리':   ['#faf5ff', '#7c3aed'],
  '통증 관리':       ['#fff7ed', '#c2410c'],
}

function Card({ a, onClick }) {
  const [bg, text] = CAT_COLOR[a.category]
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '18px 20px', cursor: 'pointer', transition: 'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.09)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {a.featured && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-block', marginBottom: 8 }}>추천 콘텐츠</span>}
      <h3 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 15, margin: '0 0 8px', lineHeight: 1.4, color: 'var(--text)' }}>{a.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.summary}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: bg, color: text }}>{a.category}</span>
          {a.disease.slice(0,1).map(d => <span key={d} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'var(--bg)', color: 'var(--text-muted)' }}>{d}</span>)}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>🕐 {a.readMin}분</span>
      </div>
    </button>
  )
}

function Detail({ a, onBack }) {
  const related = ARTICLES.filter(x => x.id !== a.id && (x.category === a.category || x.disease.some(d => a.disease.includes(d)))).slice(0, 3)
  const [bg, text] = CAT_COLOR[a.category]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="lg:grid-cols-[1fr_260px]">
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid var(--border)', padding: '20px 28px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            목록으로 돌아가기
          </button>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: bg, color: text }}>{a.category}</span>
            {a.disease.map(d => <span key={d} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: 'var(--bg)', color: 'var(--text-muted)' }}>{d}</span>)}
          </div>
          <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 700, lineHeight: 1.3, margin: '0 0 8px' }}>{a.title}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{a.date} · 읽기 {a.readMin}분</p>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 20 }}>{a.summary}</p>
          <p style={{ lineHeight: 1.8, marginBottom: 16 }}>척추 건강을 위한 올바른 이해는 효과적인 재활과 통증 관리의 첫 걸음입니다. 이 콘텐츠에서는 {a.subCategory}에 대한 핵심 정보를 체계적으로 정리했습니다.</p>
          <h3 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>주요 내용</h3>
          <ul style={{ paddingLeft: 0, listStyle: 'none', margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['정의 및 발생 기전 이해', '증상 확인 및 자가 평가 방법', '보존적 치료와 운동 접근법', '일상에서 실천 가능한 관리 방법'].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 8 }} />
                {item}
              </li>
            ))}
          </ul>
          
          {/* Oñemoĩjey upe aviso médico */}
          <div style={{ padding: '14px 16px', background: 'var(--primary-light)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>의료 면책 고지</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>이 콘텐츠는 일반적인 건강 정보 제공을 목적으로 하며 의학적 진단이나 치료를 대체하지 않습니다. 정확한 진단과 치료 계획은 반드시 전문 의료인과 상담하세요.</p>
          </div>
        </div>
      </div>
      <aside className="hidden lg:block" style={{ position: 'sticky', top: 88 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '18px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>관련 콘텐츠</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {related.map(r => (
              <button key={r.id} onClick={onBack} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, margin: '0 0 3px' }}>{r.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{r.category} · {r.readMin}분</p>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default function ContentLibrary() {
  const [cat, setCat] = useState(null)
  const [sub, setSub] = useState(null)
  const [q, setQ] = useState('')
  const [article, setArticle] = useState(null)

  if (article) return <Detail a={article} onBack={() => setArticle(null)} />

  const filtered = ARTICLES.filter(a => {
    if (cat && a.category !== cat) return false
    if (sub && a.subCategory !== sub) return false
    if (q && !a.title.includes(q) && !a.summary.includes(q)) return false
    return true
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="lg:grid-cols-[200px_1fr]">

      {/* Sidebar */}
      <aside className="hidden lg:block" style={{ position: 'sticky', top: 88 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>카테고리</p>
          </div>
          <div style={{ padding: 8 }}>
            <button onClick={() => { setCat(null); setSub(null) }}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', marginBottom: 2, background: !cat ? 'var(--primary-light)' : 'transparent', color: !cat ? 'var(--primary)' : 'var(--text-muted)' }}>
              전체 ({ARTICLES.length})
            </button>
            {CATS.map(c => (
              <div key={c.label}>
                <button onClick={() => { setCat(c.label); setSub(null) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', background: cat === c.label && !sub ? 'var(--primary-light)' : 'transparent', color: cat === c.label ? 'var(--text)' : 'var(--text-muted)' }}>
                  {c.label}
                </button>
                {cat === c.label && (
                  <div style={{ marginLeft: 10, marginBottom: 4 }}>
                    {c.subs.map(s => (
                      <button key={s} onClick={() => setSub(sub === s ? null : s)}
                        style={{ width: '100%', textAlign: 'left', padding: '6px 12px', borderRadius: 7, fontSize: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: sub === s ? 'var(--primary)' : 'var(--text-muted)', fontWeight: sub === s ? 600 : 400 }}>
                        — {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 26, fontWeight: 700, margin: '0 0 3px' }}>{cat ?? '전체 콘텐츠'}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{filtered.length}개 아티클</p>
          </div>
          
          {/* Oñemoĩjey Icono SVG ha focus style buscador pe */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="5" stroke="var(--text-muted)" strokeWidth="1.3"/>
              <path d="M10 10l2.5 2.5" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text" placeholder="제목 검색…" value={q} onChange={e => setQ(e.target.value)}
              style={{ paddingLeft: 30, paddingRight: 14, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: '1px solid var(--border)', background: 'white', fontSize: 14, outline: 'none', width: 220 }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>

        {!cat && !q && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {ARTICLES.filter(a => a.featured).map(a => <Card key={a.id} a={a} onClick={() => setArticle(a)} />)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.filter(a => cat || !a.featured).map(a => <Card key={a.id} a={a} onClick={() => setArticle(a)} />)}
        </div>

        {/* Oñemoĩjey pantalla vacío ndoikói jave la busqueda */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 17, marginBottom: 6 }}>검색 결과가 없습니다</p>
            <p style={{ fontSize: 13 }}>다른 키워드나 카테고리를 선택해 보세요</p>
          </div>
        )}
      </div>
    </div>
  )
}