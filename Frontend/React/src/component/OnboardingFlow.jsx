import React, { useState } from 'react';

// 마스터 데이터 (이전 SQL 시드 데이터 기반)
const CONDITIONS = [
  { id: 1, name: '허리디스크', desc: '디스크가 돌출되어 신경을 압박하고 요통 및 방사통을 유발합니다.', hasGrade: false },
  { id: 2, name: '척추관협착증', desc: '척추관이 좁아져 신경을 압박하고 보행 시 통증이 나타납니다.', hasGrade: false },
  { id: 3, name: '척추전방전위증', desc: '척추뼈가 앞으로 밀려나가 신경을 자극하고 척추 불안정성을 만듭니다.', hasGrade: true },
  { id: 4, name: '척추측만증', desc: '척추가 정면에서 보았을 때 옆으로 S자형 혹은 C자형으로 휘어집니다.', hasGrade: false },
  { id: 5, name: '척추분리증', desc: '척추뼈 뒤쪽의 협부 관절 부위에 결손이 생기거나 뼈가 끊어집니다.', hasGrade: false },
  { id: 6, name: '강직성 척추염', desc: '척추 마디가 굳어지는 만성 염증성 질환으로 초기 아침 강직감이 큽니다.', hasGrade: false },
  { id: 7, name: '요추 염좌', desc: '허리 주변의 근육과 인대가 미세하게 손상되어 급성 통증이 생깁니다.', hasGrade: false }
];

const SYMPTOMS = [
  { id: 1, name: '허리 통증', desc: '허리 부위의 지속적 또는 간헐적 통증' },
  { id: 2, name: '다리 저림/방사통', desc: '허리에서 다리로 퍼지는 저림이나 통증' },
  { id: 3, name: '보행 시 통증', desc: '걸을 때 악화되는 통증' },
  { id: 4, name: '앉아 있을 때 악화', desc: '오래 앉아 있으면 심해지는 증상' },
  { id: 5, name: '아침 뻣뻣함', desc: '기상 시 허리가 굳는 느낌' },
  { id: 6, name: '허리 불안정감', desc: '허리에 힘이 빠지는 느낌' },
  { id: 7, name: '엉덩이/골반 통증', desc: '엉덩이나 골반 주변 통증' },
  { id: 8, name: '야간 통증', desc: '밤에 심해지는 통증' }
];

const GOAL_KEYWORDS = ['#통증 감소', '#통증 없는 수면', '#약 의존도 줄이기', '#유연성 향상', '#보행 거리 늘리기', '#코어 근력 강화', '#자세 교정'];

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    conditions: [], // 선택된 질환 ID 배열
    grades: {}, // { conditionId: gradeValue }
    symptoms: [], // 선택된 증상 ID 배열
    goalText: ''
  });

  // 배열 토글 핸들러 (질환 및 증상 다중 선택용)
  const toggleSelection = (field, id) => {
    setFormData(prev => {
      const isSelected = prev[field].includes(id);
      return {
        ...prev,
        [field]: isSelected ? prev[field].filter(item => item !== id) : [...prev[field], id]
      };
    });
  };

  const setGrade = (conditionId, grade) => {
    setFormData(prev => ({ ...prev, grades: { ...prev.grades, [conditionId]: grade } }));
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  // 1단계: 질환 선택 렌더링
  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">어떤 척추 질환을 가지고 계신가요?</h2>
      <p className="text-gray-500">해당하는 질환을 선택해주세요. 복수 선택이 가능합니다.</p>
      <div className="grid grid-cols-2 gap-4">
        {CONDITIONS.map(cond => {
          const isSelected = formData.conditions.includes(cond.id);
          return (
            <div key={cond.id} className={`border p-4 rounded-lg cursor-pointer ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`} onClick={() => toggleSelection('conditions', cond.id)}>
              <h3 className={`font-bold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>{cond.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{cond.desc}</p>
              
              {/* Grade 선택 UI (척추전방전위증 등) */}
              {isSelected && cond.hasGrade && (
                <div className="mt-3 pt-3 border-t border-blue-200" onClick={e => e.stopPropagation()}>
                  <p className="text-xs font-semibold mb-2">Grade 선택 (의사 진단 기준)</p>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map(g => (
                      <button key={g} onClick={() => setGrade(cond.id, g)} className={`px-3 py-1 text-xs rounded-full ${formData.grades[cond.id] === g ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                        G{g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // 2단계: 증상 선택 렌더링
  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">어떤 증상이 있으신가요?</h2>
      <p className="text-gray-500">해당하는 증상을 모두 선택해주세요. 복수 선택이 가능합니다.</p>
      <div className="grid grid-cols-2 gap-4">
        {SYMPTOMS.map(symp => {
          const isSelected = formData.symptoms.includes(symp.id);
          return (
            <div key={symp.id} className={`border p-4 rounded-lg cursor-pointer flex items-center justify-between ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'}`} onClick={() => toggleSelection('symptoms', symp.id)}>
              <div>
                <h3 className={`font-bold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>{symp.name}</h3>
                <p className="text-xs text-gray-500">{symp.desc}</p>
              </div>
              {isSelected && <span className="text-green-500">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  // 3단계: 목표 설정 렌더링
  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">관리 목표를 알려주세요</h2>
      <p className="text-gray-500">목표를 설정하면 맞춤 운동을 더 정확하게 추천해 드려요. (선택사항)</p>
      
      <textarea 
        className="w-full border border-gray-300 rounded-lg p-4 h-32 focus:outline-none focus:border-blue-500"
        placeholder="예: 통증 없이 30분 걸을 수 있게 되고 싶어요"
        value={formData.goalText}
        onChange={e => setFormData({...formData, goalText: e.target.value})}
      />
      
      <div>
        <p className="text-sm font-bold mb-2">추천 목표 키워드</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_KEYWORDS.map(keyword => (
            <button key={keyword} onClick={() => setFormData({...formData, goalText: formData.goalText + (formData.goalText ? ' ' : '') + keyword})} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-blue-100">
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 4단계: 완료 및 데이터 전송 렌더링
  const renderStep4 = () => (
    <div className="text-center space-y-6 py-10">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full text-3xl">✓</div>
      <h2 className="text-2xl font-bold">등록이 완료되었습니다!</h2>
      <p className="text-gray-600">척추 프로필이 안전하게 저장되었어요.<br/>지금부터 맞춤 건강 관리가 시작됩니다.</p>
      
      <div className="bg-gray-50 p-6 rounded-lg text-left max-w-sm mx-auto space-y-3">
        <p><strong>선택 질환:</strong> {formData.conditions.length}개 선택됨</p>
        <p><strong>선택 증상:</strong> {formData.symptoms.length}개 선택됨</p>
        <p><strong>관리 목표:</strong> {formData.goalText || '미입력'}</p>
      </div>

      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
        onClick={() => submitToBackend(formData)}>
        맞춤 운동 추천받기
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
      {/* 프로그레스 바 (Progress Bar) */}
      <div className="flex justify-between mb-8 text-sm font-bold text-gray-400">
        {[1, 2, 3, 4].map(num => (
          <span key={num} className={step >= num ? 'text-blue-600' : ''}>{num}. {['질환 선택', '증상 선택', '목표 설정', '완료'][num-1]}</span>
        ))}
      </div>

      {/* 동적 렌더링 영역 */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* 하단 네비게이션 버튼 (4단계 제외) */}
      {step < 4 && (
        <div className="flex justify-between mt-8 pt-4 border-t">
          <button onClick={handlePrev} disabled={step === 1} className="px-6 py-2 text-gray-500 disabled:opacity-0">이전 단계로</button>
          <button onClick={handleNext} disabled={step === 1 && formData.conditions.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:bg-gray-300">
            다음 단계로 &gt;
          </button>
        </div>
      )}
    </div>
  );
}

// 백엔드(FastAPI) 전송 모의 함수
const submitToBackend = async (data) => {
  console.log("Transmitting to FastAPI Backend:", JSON.stringify(data, null, 2));
  /* 실제 구현 시 fetch API 활용
  await fetch('/users/current_user_id/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  */
};