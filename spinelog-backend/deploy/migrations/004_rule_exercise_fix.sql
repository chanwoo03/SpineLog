-- =====================================================================
-- 004_rule_exercise_fix.sql : 규칙의 운동 번호를 안내 문구에 맞춤
-- ---------------------------------------------------------------------
-- 언제 실행?  003 다음에 한 번 (내 PC MySQL, NAS MySQL 각각)
-- 왜?         규칙 19개 중 13개가 exercise_id와 guide_message가 서로 다른 운동을 가리킴
--             (맞는 번호가 모두 1~2 작음 → 운동을 추가하면서 번호가 밀린 것으로 보임)
--             예) 규칙 2: 문구는 "굴곡 운동 금기"인데 3번 저강도 플랭크가 금기로 나감
-- 결정        찬우 2026-11-02 "A안" = 문구·근거(rationale)는 그대로, exercise_id만 문구에 맞춤
--             규칙 17(고양이-소)은 운동 목록에 없어서 13번 운동을 새로 추가해 연결
-- 안전장치    UPDATE마다 "지금 번호가 예전 번호일 때만" 바꿈 → 두 번 실행해도 결과가 같음
--             지난 통증 기록의 판정(pain_log_guide)은 그때 받은 그대로 둠 (바꾸지 않음)
-- =====================================================================

SET NAMES utf8mb4;          -- 한글이 깨지거나 "Data too long"이 나지 않게 (글자 단위로 셈)
START TRANSACTION;

-- ① 새 운동: 고양이-소 스트레칭 (설명 · 주의 문구는 Claude 초안 → 찬우 검토 필요)
--    category 4 = 스트레칭/가동성, caution 칸은 최대 50자
INSERT INTO exercises (exercise_id, exercise_name, description, difficulty, caution, category_id)
SELECT 13, '고양이-소 스트레칭',
       '네발 기기 자세에서 등을 둥글게 말았다가 천천히 펴는 척추 가동성 스트레칭',
       1, '통증이 심해지는 범위까지 움직이지 않기', 4
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE exercise_id = 13 OR exercise_name = '고양이-소 스트레칭');

-- ② 규칙의 운동 번호 고치기 (지금 번호 → 문구가 말하는 운동)
UPDATE exercise_guide_rules SET exercise_id = 2  WHERE rule_id = 2  AND exercise_id = 3;   -- 허리디스크 금기: 굴곡 운동 → 무릎대흉부 스트레칭
UPDATE exercise_guide_rules SET exercise_id = 9  WHERE rule_id = 3  AND exercise_id = 11;  -- 허리디스크 추천: 가벼운 걷기
UPDATE exercise_guide_rules SET exercise_id = 2  WHERE rule_id = 5  AND exercise_id = 3;   -- 협착증 추천: 무릎을 가슴으로 당기는 스트레칭
UPDATE exercise_guide_rules SET exercise_id = 10 WHERE rule_id = 6  AND exercise_id = 12;  -- 협착증 추천: 수중 운동
UPDATE exercise_guide_rules SET exercise_id = 2  WHERE rule_id = 8  AND exercise_id = 3;   -- 전방전위증 추천: 가벼운 굴곡 스트레칭
UPDATE exercise_guide_rules SET exercise_id = 3  WHERE rule_id = 9  AND exercise_id = 4;   -- 전방전위증 추천: 저강도 코어
UPDATE exercise_guide_rules SET exercise_id = 5  WHERE rule_id = 10 AND exercise_id = 6;   -- 전방전위증 주의: 브릿지
UPDATE exercise_guide_rules SET exercise_id = 8  WHERE rule_id = 11 AND exercise_id = 10;  -- 측만증 추천: 옆구리 스트레칭
UPDATE exercise_guide_rules SET exercise_id = 6  WHERE rule_id = 12 AND exercise_id = 7;   -- 측만증 추천: 버드독
UPDATE exercise_guide_rules SET exercise_id = 2  WHERE rule_id = 14 AND exercise_id = 3;   -- 분리증 추천: 굴곡 기반 스트레칭
UPDATE exercise_guide_rules SET exercise_id = 3  WHERE rule_id = 15 AND exercise_id = 4;   -- 분리증 추천: 저강도 코어
UPDATE exercise_guide_rules SET exercise_id = 13 WHERE rule_id = 17 AND exercise_id = 8;   -- 강직성 척추염 추천: 고양이-소 (새 운동)
UPDATE exercise_guide_rules SET exercise_id = 3  WHERE rule_id = 18 AND exercise_id = 4;   -- 요추 염좌 추천: 저강도 플랭크
UPDATE exercise_guide_rules SET exercise_id = 9  WHERE rule_id = 19 AND exercise_id = 11;  -- 요추 염좌 추천: 가볍게 걷기

COMMIT;

-- ③ 확인: 규칙 · 연결된 운동 · 문구를 나란히 봄 (19줄)
SELECT r.rule_id, r.exercise_id, e.exercise_name, LEFT(r.guide_message, 30) AS message
FROM exercise_guide_rules r JOIN exercises e ON e.exercise_id = r.exercise_id
ORDER BY r.rule_id;
