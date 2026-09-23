import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { PAIN_HISTORY, PAIN_HISTORY_3M, painColor, painLabel } from '../data'

const periodData = {
  '1주':   PAIN_HISTORY.slice(-7),
  '1개월': PAIN_HISTORY,
  '3개월': PAIN_HISTORY_3M,
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</p>
      <span style={{ fontSize: 13, fontWeight: 600, color: painColor(d.score) }}>{painLabel(d.score)}</span>
    </div>
  )
}

const Dot = (props) => {
  const { cx, cy, payload } = props
  return <circle cx={cx} cy={cy} r={5} fill={painColor(payload.score)} stroke="white" strokeWidth={2} />
}

export default function PainTrend() {
  const [period, setPeriod] = useState('1개월')
  const data = periodData[period]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 4, gap: 2 }}>
        {['1주','1개월','3개월'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 14, border: 'none', background: period === p ? 'var(--primary)' : 'transparent', color: period === p ? 'white' : 'var(--text-muted)' }}
          >{p}</button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: '24px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 12, right: 30, left: -15, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis domain={[0,10]} tickLine={false} axisLine={false} />
            <Tooltip content={<Tip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
            <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={<Dot />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}