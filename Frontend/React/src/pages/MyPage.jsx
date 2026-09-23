import { useState } from 'react'
import { DISEASES, SYMPTOM_OPTIONS, PAIN_HISTORY, painColor, painLabel } from '../data'

export default function MyPage() {
  const [tab, setTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [myDiseases, setMyDiseases] = useState(['herniated'])
  const [mySymptoms, setMySymptoms] = useState(['s1', 's2', 's3'])
  const [grade, setGrade] = useState(0)

  const toggle = (arr, set, id) => set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 24px' }}>
        <h1 style={{ fontFamily: 'Instrument Sans', fontSize: 20, fontWeight: 700 }}>김척추 님</h1>
      </div>

      <div style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content', gap: 4 }}>
        {[['profile','내 정보 관리'],['history','기록 히스토리']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', background: tab === key ? 'var(--primary)' : 'transparent', color: tab === key ? 'white' : 'var(--text-muted)' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 17, margin: 0 }}>등록된 질환</h2>
              <button onClick={() => setEditMode(e => !e)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', background: editMode ? 'var(--primary)' : 'var(--primary-light)', color: editMode ? 'white' : 'var(--primary)' }}>{editMode ? '저장' : '수정'}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {DISEASES.map(d => {
                const on = myDiseases.includes(d.id)
                return (
                  <button key={d.id} onClick={() => editMode && toggle(myDiseases, setMyDiseases, d.id)} disabled={!editMode}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'var(--primary-light)' : 'var(--bg)', cursor: editMode ? 'pointer' : 'default', textAlign: 'left' }}>
                    <span style={{ fontSize: 18 }}>{d.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--primary)' : 'var(--text-muted)' }}>{d.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'Instrument Sans', fontWeight: 700, fontSize: 17, margin: 0 }}>전체 통증 기록</h2>
          </div>
          {[...PAIN_HISTORY].reverse().map((e, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 100px 1fr', gap: 16, alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{e.date}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: painColor(e.score) }}>{painLabel(e.score)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}