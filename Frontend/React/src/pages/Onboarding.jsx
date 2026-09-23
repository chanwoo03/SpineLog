import { useState } from 'react'
import { DISEASES, SYMPTOM_OPTIONS } from '../data'

const STEPS = ['질환 선택', '증상 선택', '목표 설정']

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [diseases, setDiseases] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [goal, setGoal] = useState('')

  const toggle = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  const canNext = step === 0 ? diseases.length > 0 : true

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '32px 32px 28px' }}>
          
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>진단받은 척추 질환을 선택하세요</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {DISEASES.map(d => {
                  const on = diseases.includes(d.id)
                  return (
                    <button key={d.id} onClick={() => setDiseases(toggle(diseases, d.id))}
                      style={{ padding: '14px', borderRadius: 12, textAlign: 'left', border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'var(--primary-light)' : 'white', cursor: 'pointer' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: on ? 'var(--primary)' : 'var(--text)', margin: 0 }}>{d.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>현재 겪고 있는 증상을 선택하세요</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {SYMPTOM_OPTIONS.map(s => {
                  const on = symptoms.includes(s.id)
                  return (
                    <button key={s.id} onClick={() => setSymptoms(toggle(symptoms, s.id))}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'var(--primary-light)' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: on ? 'var(--primary)' : 'var(--text)' }}>{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'Instrument Sans', fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>관리 목표를 알려주세요</h2>
              <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={4}
                style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: '2px solid var(--border)', fontSize: 14 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ padding: '10px 20px', borderRadius: 10, background: 'white', border: '1px solid var(--border)' }}>이전</button>
            <button onClick={() => step < 2 ? setStep(s => s + 1) : onComplete()} disabled={!canNext} style={{ padding: '10px 20px', borderRadius: 10, background: canNext ? 'var(--primary)' : 'var(--border)', color: 'white', border: 'none' }}>
              {step === 2 ? '시작하기' : '다음'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}