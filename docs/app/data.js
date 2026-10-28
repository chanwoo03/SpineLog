/* =====================================================================
   data.js — SpineLog 기준 데이터 (실제 MySQL DB에서 그대로 뽑은 값)
   질환 7 · 증상 8 · 운동 12 · 판정 단계 3 · 규칙 19 · 통증 점수 설명 11
   통증 위치 17 · 통증 유형 10 · 동작 태그 10
   ※ 규칙 데이터는 점검 중 (운동 번호와 문구가 어긋난 규칙이 있음)
   ===================================================================== */
const REF = {
 "conditions": [
  {
   "id": 1,
   "name": "허리디스크(추간판탈출증)",
   "description": "추간판이 탈출하여 신경을 압박하는 질환. 급성기 통증이 심할 수 있음"
  },
  {
   "id": 2,
   "name": "척추관협착증",
   "description": "척추관이 좁아져 신경을 압박. 걷거나 서있을 때 증상이 심해지는 신경성 파행이 특징"
  },
  {
   "id": 3,
   "name": "척추전방전위증",
   "description": "척추뼈가 앞으로 밀려나는 질환. Meyerding 분류 Grade 1~4로 중증도 구분"
  },
  {
   "id": 4,
   "name": "척추측만증",
   "description": "척추가 옆으로 휘어진 상태. 근육 불균형 동반 가능"
  },
  {
   "id": 5,
   "name": "척추분리증",
   "description": "척추뼈 후방 관절 부위가 분리된 상태. 신전 동작 시 스트레스 증가"
  },
  {
   "id": 6,
   "name": "강직성 척추염",
   "description": "염증성 척추 질환. 아침 강직이 특징이며 가동성 운동이 오히려 도움이 되는 경우가 많음"
  },
  {
   "id": 7,
   "name": "요추 염좌(급성 요통)",
   "description": "외상/과사용으로 인한 급성 허리 통증. 대개 단기간 내 회복"
  }
 ],
 "symptoms": [
  {
   "id": 1,
   "name": "다리 저림(방사통)"
  },
  {
   "id": 2,
   "name": "허리 통증"
  },
  {
   "id": 3,
   "name": "감각 이상"
  },
  {
   "id": 4,
   "name": "근력 약화"
  },
  {
   "id": 5,
   "name": "뻣뻣함(강직)"
  },
  {
   "id": 6,
   "name": "앉아있을 때 악화"
  },
  {
   "id": 7,
   "name": "걷거나 서있을 때 악화(신경성 파행)"
  },
  {
   "id": 8,
   "name": "아침 통증 및 강직"
  }
 ],
 "exercises": [
  {
   "id": 1,
   "name": "맥켄지 프레스업(신전운동)",
   "description": "엎드린 자세에서 상체를 들어올리는 신전 운동",
   "caution": "급성 통증 심할 때 및 전방전위증 Grade 2 이상 주의"
  },
  {
   "id": 2,
   "name": "무릎대흉부 스트레칭",
   "description": "누운 자세에서 무릎을 가슴 쪽으로 당기는 굴곡 스트레칭",
   "caution": "급성 허리디스크 (수핵탈출증) 환자 중 굴곡 악화형 및 심한 염증기일 땐 주의"
  },
  {
   "id": 3,
   "name": "저강도 플랭크",
   "description": "무릎을 대고 하는 코어 안정화 운동",
   "caution": null
  },
  {
   "id": 4,
   "name": "고강도 플랭크",
   "description": "팔꿈치와 발끝으로 버티는 코어 안정화 운동",
   "caution": "급성기/고통증 시 무리하지 않도록 주의"
  },
  {
   "id": 5,
   "name": "브릿지 운동",
   "description": "누운 자세에서 골반을 들어올리는 운동",
   "caution": "과도한 허리 신전 주의"
  },
  {
   "id": 6,
   "name": "버드독 운동",
   "description": "팔다리를 교차로 뻗는 코어+균형 운동",
   "caution": null
  },
  {
   "id": 7,
   "name": "흉추 신전 스트레칭",
   "description": "흉추를 펴주는 가동성 운동",
   "caution": null
  },
  {
   "id": 8,
   "name": "옆구리(측면) 스트레칭",
   "description": "측면 근육을 늘려주는 스트레칭",
   "caution": null
  },
  {
   "id": 9,
   "name": "걷기(저강도)",
   "description": "평지를 천천히 걷는 유산소 운동",
   "caution": null
  },
  {
   "id": 10,
   "name": "수중 운동",
   "description": "부력을 이용해 척추 부담을 줄이는 유산소 운동",
   "caution": null
  },
  {
   "id": 11,
   "name": "데드버그",
   "description": "허리로 바닥을 강하게 누른 상태에서 반대쪽 팔과 다리를 교차로 천천히 내렸다 올리는 운동",
   "caution": null
  },
  {
   "id": 12,
   "name": "벽 스쿼트",
   "description": "허리를 벽에 빈틈없이 기댄 상태에서 무릎이 90도가 될 때까지 내려가 버티는 엉덩이, 하체 운동",
   "caution": null
  }
 ],
 "levels": [
  {
   "id": 1,
   "code": "RECOMMENDED",
   "label": "추천"
  },
  {
   "id": 2,
   "code": "CAUTION",
   "label": "주의"
  },
  {
   "id": 3,
   "code": "CONTRAINDICATED",
   "label": "금기"
  }
 ],
 "rules": [
  {
   "rule_id": 1,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "신전 운동으로 밀려난 디스크를 앞쪽으로 되돌려 통증을 줄여보세요.",
   "priority": 1,
   "exercise_id": 1,
   "target_condition_id": 1,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 2,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 3,
   "guide_message": "허리를 굽히는 굴곡 운동은 디스크 압박을 높이므로 절대 피하세요.",
   "priority": 1,
   "exercise_id": 3,
   "target_condition_id": 1,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 3,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "견딜 만한 통증이라면 가벼운 걷기가 혈류 개선에 도움이 됩니다.",
   "priority": 1,
   "exercise_id": 11,
   "target_condition_id": 1,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 4,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 3,
   "guide_message": "허리를 뒤로 젖히면 파행(걷기 힘든 증상)이 악화될 수 있어 피하세요.",
   "priority": 1,
   "exercise_id": 1,
   "target_condition_id": 2,
   "target_symptom_id": 7,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 5,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "무릎을 가슴으로 당기는 스트레칭이 신경 공간 확보에 도움이 됩니다.",
   "priority": 1,
   "exercise_id": 3,
   "target_condition_id": 2,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 6,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "수중 운동은 허리에 부담을 주지 않으면서 걷기 능력을 유지해 줍니다.",
   "priority": 1,
   "exercise_id": 12,
   "target_condition_id": 2,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 7,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 3,
   "guide_message": "척추전방전위증 환자는 허리를 젖히는 신전 운동을 피해야 합니다.",
   "priority": 1,
   "exercise_id": 1,
   "target_condition_id": 3,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": 1,
   "max_stage_level": 3,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 8,
   "min_pain_score": 0,
   "max_pain_score": 5,
   "guide_level_id": 1,
   "guide_message": "아침 기상 시 발 저림이 있을 때 가벼운 굴곡 스트레칭이 좋습니다.",
   "priority": 1,
   "exercise_id": 3,
   "target_condition_id": 3,
   "target_symptom_id": 8,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 9,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "통증이 잦아든 상태에서 저강도 코어 운동으로 지지력을 기르세요.",
   "priority": 1,
   "exercise_id": 4,
   "target_condition_id": 3,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 10,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 2,
   "guide_message": "브릿지 시 엉덩이를 너무 높이 들어 허리가 꺾이지 않도록 주의하세요.",
   "priority": 1,
   "exercise_id": 6,
   "target_condition_id": 3,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 11,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "통증이 심하지 않을 때 옆구리 근육을 늘려 불균형을 개선해 보세요.",
   "priority": 1,
   "exercise_id": 10,
   "target_condition_id": 4,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 12,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "버드독 운동으로 무너진 코어의 좌우 밸런스를 잡아줍니다.",
   "priority": 1,
   "exercise_id": 7,
   "target_condition_id": 4,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 13,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 3,
   "guide_message": "허리를 뒤로 꺾는 운동은 척추뼈의 끊어진 부위에 큰 부담을 줍니다.",
   "priority": 1,
   "exercise_id": 1,
   "target_condition_id": 5,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 14,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "통증이 견딜 만할 때 굴곡 기반 스트레칭으로 부하를 줄여줍니다.",
   "priority": 1,
   "exercise_id": 3,
   "target_condition_id": 5,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 15,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "저강도 코어 안정화로 척추뼈가 겉돌지 않게 보호하세요.",
   "priority": 1,
   "exercise_id": 4,
   "target_condition_id": 5,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 16,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "아침 조조강직 시 엎드려 상체를 들어 올리는 신전 스트레칭이 효과적입니다.",
   "priority": 1,
   "exercise_id": 1,
   "target_condition_id": 6,
   "target_symptom_id": 8,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 17,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "고양이-소 스트레칭으로 척추 굳어짐을 예방하세요.",
   "priority": 1,
   "exercise_id": 8,
   "target_condition_id": 6,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 18,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "급성 통증이 잦아들었다면 저강도 플랭크를 시작하세요.",
   "priority": 1,
   "exercise_id": 4,
   "target_condition_id": 7,
   "target_symptom_id": 2,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  },
  {
   "rule_id": 19,
   "min_pain_score": 0,
   "max_pain_score": 6,
   "guide_level_id": 1,
   "guide_message": "견딜 만한 통증이라면 가볍게 걷는 것이 회복에 가장 좋습니다.",
   "priority": 1,
   "exercise_id": 11,
   "target_condition_id": 7,
   "target_symptom_id": null,
   "target_tag_id": null,
   "min_stage_level": null,
   "max_stage_level": null,
   "max_sleep_minutes": null
  }
 ],
 "scale": [
  {
   "score": 0,
   "level_name": "무통",
   "action_guide": "현재 상태를 유지하며 평소 관리 루틴을 이어가세요.",
   "severity_label": "NONE",
   "nrs_range": "0"
  },
  {
   "score": 1,
   "level_name": "매우 경미함",
   "action_guide": "별도 조치는 필요 없으나 바른 자세를 유지하세요.",
   "severity_label": "MILD",
   "nrs_range": "1~3"
  },
  {
   "score": 2,
   "level_name": "인지 시작 단계",
   "action_guide": "장시간 앉아있었다면 5분 정도 일어나 스트레칭하세요.",
   "severity_label": "MILD",
   "nrs_range": "1~3"
  },
  {
   "score": 3,
   "level_name": "인내 한계 근접",
   "action_guide": "작업을 잠시 멈추고 가볍게 움직이세요. 필요하면 진통제 복용을 고려해보세요.",
   "severity_label": "MILD",
   "nrs_range": "1~3"
  },
  {
   "score": 4,
   "level_name": "기능 방해 시작",
   "action_guide": "진통제 복용을 고려하고, 10~15분 누워서 허리 부담을 줄이는 휴식을 취하세요.",
   "severity_label": "MODERATE",
   "nrs_range": "4~6"
  },
  {
   "score": 5,
   "level_name": "활동 제한",
   "action_guide": "고강도 운동은 중단하고, 가벼운 걷기 정도만 유지하세요.",
   "severity_label": "MODERATE",
   "nrs_range": "4~6"
  },
  {
   "score": 6,
   "level_name": "심한 방해",
   "action_guide": "무리한 움직임은 피하고, 증상이 지속되면 의료진 상담을 고려하세요.",
   "severity_label": "MODERATE",
   "nrs_range": "4~6"
  },
  {
   "score": 7,
   "level_name": "극심한 통증",
   "action_guide": "모든 운동을 중단하고 편안한 자세로 안정을 취하세요.",
   "severity_label": "SEVERE",
   "nrs_range": "7~10"
  },
  {
   "score": 8,
   "level_name": "격렬한 통증",
   "action_guide": "절대 안정을 취하고, 증상이 지속되면 병원 내원을 고려하세요.",
   "severity_label": "SEVERE",
   "nrs_range": "7~10"
  },
  {
   "score": 9,
   "level_name": "참기 힘든 통증",
   "action_guide": "가능한 빨리 의료진의 진료를 받으세요.",
   "severity_label": "SEVERE",
   "nrs_range": "7~10"
  },
  {
   "score": 10,
   "level_name": "최악의 통증",
   "action_guide": "즉시 응급 의료 지원을 요청하세요.",
   "severity_label": "SEVERE",
   "nrs_range": "7~10"
  }
 ],
 "locations": [
  {
   "id": 1,
   "name": "허리 중앙"
  },
  {
   "id": 2,
   "name": "허리 양 옆"
  },
  {
   "id": 3,
   "name": "엉덩이 중심부"
  },
  {
   "id": 4,
   "name": "엉치"
  },
  {
   "id": 5,
   "name": "꼬리뼈 주변"
  },
  {
   "id": 6,
   "name": "허벅지 안 쪽"
  },
  {
   "id": 7,
   "name": "허벅지 앞 쪽"
  },
  {
   "id": 8,
   "name": "허벅지 뒤 쪽"
  },
  {
   "id": 9,
   "name": "허벅지 바깥 쪽"
  },
  {
   "id": 10,
   "name": "종아리 바깥 쪽"
  },
  {
   "id": 11,
   "name": "종아리 뒤 쪽"
  },
  {
   "id": 12,
   "name": "다리 전체 측면"
  },
  {
   "id": 13,
   "name": "발등"
  },
  {
   "id": 14,
   "name": "엄지발가락"
  },
  {
   "id": 15,
   "name": "새끼발가락 및 나머지 발가락"
  },
  {
   "id": 16,
   "name": "발목"
  },
  {
   "id": 17,
   "name": "발바닥"
  }
 ],
 "types": [
  {
   "id": 1,
   "name": "찌르는 듯한"
  },
  {
   "id": 2,
   "name": "저릿한"
  },
  {
   "id": 3,
   "name": "둔한"
  },
  {
   "id": 4,
   "name": "화끈거리는"
  },
  {
   "id": 5,
   "name": "쑤시는"
  },
  {
   "id": 6,
   "name": "힘이 빠지는"
  },
  {
   "id": 7,
   "name": "터질듯한"
  },
  {
   "id": 8,
   "name": "쥐어짜는듯한"
  },
  {
   "id": 9,
   "name": "뻐근하고 뭉친듯한"
  },
  {
   "id": 10,
   "name": "남의 살같이 둔감한"
  }
 ],
 "tags": [
  {
   "id": 1,
   "code": "FLEXION",
   "label": "앞으로 숙이기",
   "description": "설거지, 신발 끈 묶기, 바닥 청소"
  },
  {
   "id": 2,
   "code": "EXTENSION",
   "label": "뒤로 젖히기",
   "description": "높은 선반 정리, 천장 작업"
  },
  {
   "id": 3,
   "code": "ROTATION",
   "label": "허리 비틀기",
   "description": "골프, 물건을 옆으로 옮기기"
  },
  {
   "id": 4,
   "code": "LIFTING",
   "label": "무거운 것 들기",
   "description": "장보기, 이사, 택배"
  },
  {
   "id": 5,
   "code": "PROLONGED_SITTING",
   "label": "장시간 앉기",
   "description": "사무 업무, 공부, 운전"
  },
  {
   "id": 6,
   "code": "PROLONGED_STANDING",
   "label": "장시간 서 있기",
   "description": "서비스직, 요리"
  },
  {
   "id": 7,
   "code": "IMPACT",
   "label": "충격",
   "description": "달리기, 점프, 계단 뛰어 내려가기"
  },
  {
   "id": 8,
   "code": "REPETITIVE",
   "label": "반복 동작",
   "description": "공장 작업, 반복적인 물건 정리"
  },
  {
   "id": 9,
   "code": "VIBRATION",
   "label": "진동",
   "description": "장거리 운전, 오토바이"
  },
  {
   "id": 10,
   "code": "IMMOBILITY",
   "label": "오래 움직이지 않기",
   "description": "장시간 누워 있기, 긴 비행"
  }
 ]
};
