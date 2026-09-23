import { useState } from 'react'
import { PAIN_LOCATIONS, PAIN_TYPES, SYMPTOM_OPTIONS, painColor, painLabel } from '../data'

export default function PainRecord({ onNav }) {
  const [score, setScore] = useState(4)
  const [locations, setLocations] = useState([])
  const [types, setTypes] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [saved, setSaved] = useState(false)

  const toggle = (arr, set, val) => set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const pColor = painColor(score)

  if (saved) return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>기록 저장 완료</h2>
      <button onClick={() => onNav('exercise')} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>오늘의 추천 운동 →</button>
    </div>
  )

  const card = (children) => <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '24px 28px' }}>{children}</div>
  const cardTitle = (title) => <h2 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>{title}</h2>

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {card(
        <>
          {cardTitle('통증 강도')}
          <input type="range" min={0} max={10} step={1} value={score} onChange={e => setScore(+e.target.value)}
            style={{ width: '100%', background: `linear-gradient(to right, ${pColor} ${score*10}%, var(--border) ${score*10}%)` }} />
        </>
      )}
      {card(
        <>
          {cardTitle('통증 위치')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PAIN_LOCATIONS.map(loc => {
              const on = locations.includes(loc)
              return <button key={loc} onClick={() => toggle(locations, setLocations, loc)} style={{ padding: '11px 14px', borderRadius: 10, border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'var(--primary-light)' : 'white', cursor: 'pointer', textAlign: 'left' }}>{loc}</button>
            })}
          </div>
        </>
      )}
      <button onClick={() => setSaved(true)} style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg, #0C6B7A, #2BA8B5)', color: 'white', fontSize: 16, border: 'none', cursor: 'pointer' }}>기록 저장하기</button>
    </div>
  )
}