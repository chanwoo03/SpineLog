import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { PAIN_HISTORY, EXERCISES, painColor, painLabel } from '../data'

const latest = PAIN_HISTORY[PAIN_HISTORY.length - 1]
const prev = PAIN_HISTORY[PAIN_HISTORY.length - 4]
const trend = latest.score - prev.score
const mini = PAIN_HISTORY.slice(-7)

const ratingStyle = {
  recommended: { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', label: '추천' },
  caution:     { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', label: '주의' },
  contraindicated: { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', label: '금기' },
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const s = payload[0].value
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontWeight: 600, color: painColor(s) }}>통증 {s}점 ({painLabel(s)})</p>
    </div>
  )
}

export default function Dashboard({ onNav }) {
  const todayRecorded = false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* CTA banner */}
      {!todayRecorded ? (
        <div style={{ borderRadius: 18, padding: '28px 32px', background: 'linear-gradient(135deg, #0C6B7A 0%, #2BA8B5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginBottom: 6 }}>2026년 9월 23일 수요일</p>
            <h2 style={{ fontFamily: 'Instrument Sans', color: 'white', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.2 }}>오늘의 통증을 기록해 보세요</h2>
            <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, margin: 0 }}>꾸준한 기록이 더 정확한 운동 추천의 기반이 됩니다</p>
          </div>
          <button onClick={() => onNav('record')} style={{ padding: '12px 24px', borderRadius: 12, background: 'white', color: 'var(--primary)', fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>기록하기 →</button>
        </div>
      ) : (
        <div style={{ borderRadius: 14, padding: '16px 20px', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
          <div>
            <p style={{ fontFamily: 'Instrument Sans', fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>오늘의 통증 기록 완료</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: '오늘 통증 점수', val: `${latest.score}점`, sub: painLabel(latest.score), color: painColor(latest.score), icon: '📊' },
          { label: '3일 전 대비', val: trend > 0 ? `+${trend}점` : trend < 0 ? `${trend}점` : '변화 없음', sub: trend < 0 ? '호전 중' : trend > 0 ? '악화 주의' : '유지 중', color: trend <= 0 ? '#16a34a' : '#dc2626', icon: trend < 0 ? '📉' : '📈' },
          { label: '이번 달 기록 일수', val: '14일', sub: '23일 중', color: 'var(--primary)', icon: '📅' },
          { label: '이번 달 운동 완료', val: '31회', sub: '목표 대비 87%', color: '#7c3aed', icon: '✅' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '18px 20px' }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <p style={{ fontFamily: 'Instrument Sans', fontSize: 28, fontWeight: 700, color: s.color, margin: '10px 0 2px' }}>{s.val}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: s.color, margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="lg:grid-cols-[1fr_320px]">
        {/* Exercises */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 16, margin: '0 0 3px' }}>오늘의 추천 운동</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>통증 점수 {latest.score}점 · 허리디스크 기준</p>
            </div>
            <button onClick={() => onNav('exercise')} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>전체 보기 →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {EXERCISES.filter(e => e.rating === 'recommended').map(ex => {
              const s = ratingStyle[ex.rating]
              return (
                <div key={ex.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 14px 12px', borderRadius: 12, border: `2px solid ${s.border}`, background: s.bg, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{ex.emoji}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 99, background: s.badge, color: 'white' }}>{s.label}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 13, margin: '0 0 2px' }}>{ex.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{ex.difficulty} · {ex.duration}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mini chart */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 16, margin: '0 0 2px' }}>통증 추이</h3>
            <button onClick={() => onNav('trend')} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>상세 →</button>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={mini} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0,10]} ticks={[0,5,10]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5}
                dot={(p) => <circle key={p.payload.date} cx={p.cx} cy={p.cy} r={5} fill={painColor(p.payload.score)} stroke="white" strokeWidth={2} />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}