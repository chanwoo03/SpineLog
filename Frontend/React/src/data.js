// src/data.js

export const DISEASES = [
  { id: 'herniated', label: '허리디스크', icon: '🦴', hasGrade: false },
  { id: 'stenosis', label: '척추관협착증', icon: '🚶', hasGrade: false },
  { id: 'spondylolisthesis', label: '척추전방전위증', icon: '⚡', hasGrade: true },
  { id: 'scoliosis', label: '척추측만증', icon: '〰️', hasGrade: false },
];

export const SYMPTOM_OPTIONS = [
  { id: 's1', label: '허리 통증' },
  { id: 's2', label: '다리 저림/방사통' },
  { id: 's3', label: '보행 시 통증' },
  { id: 's4', label: '아침 뻣뻣함' },
];

export const PAIN_LOCATIONS = ['허리(요부)', '골반/엉덩이', '허벅지', '종아리', '발끝'];
export const PAIN_TYPES = ['둔통(뻐근함)', '찌릿함(방사통)', '타는 듯한 느낌', '욱신거림'];

export const painColor = (score) => {
  if (score <= 3) return '#22c55e'; // 초록 (경도)
  if (score <= 6) return '#f59e0b'; // 주황 (중등도)
  return '#ef4444'; // 빨강 (중증)
};

export const painLabel = (score) => {
  if (score === 0) return '통증 없음';
  if (score <= 3) return '경도';
  if (score <= 6) return '중등도';
  return '중증';
};

// 통계 차트용 임시 시계열 데이터
export const PAIN_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  date: `9.${i + 1}`,
  score: Math.floor(Math.random() * 5) + 2,
  symptoms: i % 3 === 0 ? ['허리 통증', '다리 저림'] : ['허리 통증'],
}));

export const PAIN_HISTORY_3M = PAIN_HISTORY;

export const EXERCISES = [
  {
    id: 'e1', rating: 'recommended', emoji: '🧘‍♂️', name: '맥켄지 신전 운동', category: '스트레칭',
    difficulty: '초급', duration: '5분', rationale: '허리디스크 압력을 낮추고 방사통을 완화하는 데 매우 효과적입니다.',
    description: '엎드린 상태에서 팔꿈치를 바닥에 대고 천천히 상체를 들어 올립니다.', caution: '엉덩이나 다리로 통증이 뻗어나가면 즉시 중단하세요.'
  },
  {
    id: 'e2', rating: 'caution', emoji: '🚶', name: '평지 걷기', category: '유산소',
    difficulty: '초급', duration: '20분', rationale: '코어 근육 활성화에 좋으나, 현재 통증 점수를 고려해 무리하지 않아야 합니다.',
    description: '가슴을 펴고 시선은 정면을 향한 채 가볍게 걷습니다.'
  },
  {
    id: 'e3', rating: 'contraindicated', emoji: '⚠️', name: '윗몸 일으키기', category: '코어',
    difficulty: '중급', duration: '5분', rationale: '척추 굴곡을 유발하여 디스크 내압을 급격히 상승시킵니다.',
    description: '현재 상태에서는 절대 수행하지 마세요.'
  }
];

export const ARTICLES = [
  {
    id: 'a1', category: '질환 정보', subCategory: '허리디스크', disease: ['허리디스크'], featured: true,
    title: '허리디스크 환자가 절대 피해야 할 3가지 자세', summary: '일상생활 속에서 무심코 하는 자세가 디스크 파열을 유발할 수 있습니다.',
    readMin: 5, date: '2026.09.20'
  },
  {
    id: 'a2', category: '운동·재활 가이드', subCategory: '코어 강화', disease: ['허리디스크', '척추전방전위증'], featured: false,
    title: '안전한 코어 운동: 버드독 자세 가이드', summary: '척추에 무리를 주지 않으면서 심부 코어 근육을 단련하는 방법을 알아봅니다.',
    readMin: 3, date: '2026.09.18'
  }
];