-- =====================================================================
-- 007_tag_rules.sql : 활동(동작 태그)으로 판정이 바뀌는 규칙 2개
-- ---------------------------------------------------------------------
-- 언제 실행?  006 다음에 한 번 (내 PC MySQL, NAS MySQL 각각)
-- 왜?         활동을 기록해도 target_tag_id를 쓰는 규칙이 0개라 판정이 안 바뀌었음
--             판정 코드(rule_engine.match_rules)는 이미 "어제~오늘 한 동작 태그"를 보고 있음 → 데이터만 추가
-- 결정        찬우 2026-11-04 "쓰자" (Claude 초안 A·B 그대로)
--             안내 문구 = Claude 초안, 근거(rationale) = 찬우가 출처 확인 후 채울 예정
-- 안전장치    같은 (질환, 태그, 운동) 규칙이 이미 있으면 넣지 않음 → 두 번 실행해도 결과가 같음
-- =====================================================================

SET NAMES utf8mb4;
START TRANSACTION;

-- A. 허리디스크(1) + 최근 장시간 앉기(태그 5) → 흉추 신전 스트레칭(7) 추천(1)
INSERT INTO exercise_guide_rules
    (min_pain_score, max_pain_score, guide_level_id, guide_message, rationale, priority,
     exercise_id, target_condition_id, target_tag_id)
SELECT 0, 6, 1,
       '오래 앉아 있었다면 등을 펴는 스트레칭으로 굳은 자세를 풀어 주세요.',
       '[근거 확인 필요 - 검토 예정]', 1,
       7, 1, 5
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM exercise_guide_rules
                  WHERE target_condition_id = 1 AND target_tag_id = 5 AND exercise_id = 7);

-- B. 허리디스크(1) + 최근 무거운 것 들기(태그 4) → 저강도 플랭크(3) 주의(2)
INSERT INTO exercise_guide_rules
    (min_pain_score, max_pain_score, guide_level_id, guide_message, rationale, priority,
     exercise_id, target_condition_id, target_tag_id)
SELECT 0, 6, 2,
       '무거운 것을 든 날에는 코어 운동 강도를 낮추고, 통증이 생기면 멈추세요.',
       '[근거 확인 필요 - 검토 예정]', 1,
       3, 1, 4
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM exercise_guide_rules
                  WHERE target_condition_id = 1 AND target_tag_id = 4 AND exercise_id = 3);

-- 적용 기록
INSERT IGNORE INTO schema_migrations (version) VALUES (7);

COMMIT;

-- 확인: 태그 조건이 있는 규칙 (2줄)
SELECT r.rule_id, m.tag_label, e.exercise_name, g.level_label, r.guide_message
FROM exercise_guide_rules r
JOIN movement_tags m ON m.tag_id = r.target_tag_id
JOIN exercises e     ON e.exercise_id = r.exercise_id
JOIN guide_levels g  ON g.guide_level_id = r.guide_level_id
ORDER BY r.rule_id;
