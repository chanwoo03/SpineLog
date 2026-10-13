-- =====================================================================
-- 002_demo_user_context.sql : 시연용 사용자 맥락 (질환·증상)
-- ---------------------------------------------------------------------
-- 왜?  지금 user_conditions, user_symptoms가 비어 있음.
--      규칙 19개가 전부 특정 질환(target_condition_id)을 대상으로 해서,
--      질환 정보가 없으면 어떤 통증을 넣어도 판정이 NO_MATCH가 됨.
-- 누구? user01 을 시연 사용자로 사용 (다른 사용자로 하려면 아래 'user01'만 바꾸기)
-- 내용: 척추전방전위증(condition 3) Meyerding 2등급 + 다리 저림(symptom 1)
--       → 규칙 7(맥켄지 신전 금기), 9(저강도 플랭크 추천), 10(브릿지 주의) 등이 걸림
-- =====================================================================

INSERT INTO user_conditions (user_id, condition_id, disease_grade, goal_text)
VALUES ('Chan', 3, 2, '허리 통증 없이 30분 걷기');

INSERT INTO user_symptoms (user_id, symptom_id, severity_level)
VALUES ('Chan', 1, 2);
