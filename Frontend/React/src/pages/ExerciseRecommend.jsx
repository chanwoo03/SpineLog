import { useState } from 'react'
import { EXERCISES, painColor, painLabel } from '../data'

const todayScore = 3

const RS = {
  recommended:    { bg: '#f0fdf4', border: '#86efac', badgeBg: '#16a34a', label: '추천' },
  caution:        { bg: '#fffbeb', border: '#fcd34d', badgeBg: '#d97706', label: '주의' },
  contraindicated:{ bg: '#fef2f2', border: '#fca5a5', badgeBg: '#dc2626', label: '금기' },
}

function Badge({ rating }) {
  const s = RS[rating]
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 99, background: s.badgeBg, color: 'white', whiteSpace: 'nowrap' }}>{s.label}</span>
}

function Modal({ ex, onClose }) {
  const s = RS[ex.rating]
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(13,31,45,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 18, maxWidth: 500, width: '100%', overflow: 'hidden', borderTop: `4px solid ${s.border}` }}>
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{ex.emoji}</div>
              <div>
                <h3 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>{ex.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge rating={ex.rating} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ex.difficulty} · {ex.duration}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', border: 'none', cursor: 'pointer' }}>X</button>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 16, background: s.bg }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: s.badgeBg, marginBottom: 6 }}>판정 근거</p>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{ex.rationale}</p>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>닫기</button>
        </div>
      </div>
    </div>
  )
}

function Card({ ex, onClick }) {
  const s = RS[ex.rating]
  const contra = ex.rating === 'contraindicated'
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 14px 14px', borderRadius: 14, border: `2px solid ${s.border}`, background: s.bg, cursor: 'pointer', textAlign: 'left', opacity: contra ? 0.75 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{ex.emoji}</div>
        <Badge rating={ex.rating} />
      </div>
      <div>
        <p style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 14, margin: '0 0 3px', textDecoration: contra ? 'line-through' : 'none', color: contra ? 'var(--text-muted)' : 'var(--text)' }}>{ex.name}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{ex.category} · {ex.difficulty}</p>
      </div>
    </button>
  )
}

function Section({ label, color, count, children }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block' }} />
        <h2 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 17, margin: 0 }}>{label}</h2>
        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: color+'22', color }}>{count}개</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>{children}</div>
    </section>
  )
}

export default function ExerciseRecommend() {
  const [modal, setModal] = useState(null)
  const rec   = EXERCISES.filter(e => e.rating === 'recommended')
  const caut  = EXERCISES.filter(e => e.rating === 'caution')
  const cont  = EXERCISES.filter(e => e.rating === 'contraindicated')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 24px' }}>
        <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 24, fontWeight: 700, margin: '0 0 16px' }}>오늘의 운동 추천</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[['추천', rec.length, '#22c55e', '#dcfce7'], ['주의', caut.length, '#d97706', '#fef9c3'], ['금기', cont.length, '#dc2626', '#fee2e2']].map(([label, count, color, bg]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 8, background: bg }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{label} {count}개</span>
            </div>
          ))}
        </div>
      </div>

      <Section label="추천 운동" color="#22c55e" count={rec.length}>
        {rec.map(ex => <Card key={ex.id} ex={ex} onClick={() => setModal(ex)} />)}
      </Section>
      <Section label="주의 운동" color="#f59e0b" count={caut.length}>
        {caut.map(ex => <Card key={ex.id} ex={ex} onClick={() => setModal(ex)} />)}
      </Section>
      <Section label="금기 운동" color="#ef4444" count={cont.length}>
        {cont.map(ex => <Card key={ex.id} ex={ex} onClick={() => setModal(ex)} />)}
      </Section>

      {modal && <Modal ex={modal} onClose={() => setModal(null)} />}
    </div>
  )
}