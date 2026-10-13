-- =====================================================================
-- 001_assessment_history.sql : 판정 이력 컬럼 추가
-- ---------------------------------------------------------------------
-- 언제 실행?  통증 기록 API(POST /api/pain-logs)를 만들기 전에 한 번
-- 어디에?     내 PC MySQL에 먼저 → 나중에 NAS MySQL에도 같은 파일을 실행
-- 왜?         통증 기록 API가 판정 상태와 '당시 안내 문구'를 저장해야 하는데,
--             지금 DB에는 그 컬럼이 없음 (ChatGPT와 정한 ②③④)
-- 주의        한 번만 실행. 두 번 실행하면 "Duplicate column" 에러 (이미 적용됐다는 뜻)
-- =====================================================================

-- ② 판정 상태 + 빠진 맥락
--   assessment_status : COMPLETED(판정 완료) / PARTIAL(빠진 맥락 있음) / NO_MATCH(맞는 규칙 없음)
--                       NULL = 이 컬럼이 생기기 전의 예전 기록 (당시 상태를 알 수 없음)
--   missing_context   : 판정 당시 빠진 자료 목록. 예) ["MORNING_CHECKIN"], 없으면 []
ALTER TABLE pain_logs
    ADD COLUMN assessment_status VARCHAR(20) NULL
        COMMENT 'COMPLETED / PARTIAL / NO_MATCH; NULL은 기존 미분류 기록',
    ADD COLUMN missing_context JSON NULL
        COMMENT '판정 당시 누락 항목 배열; 새 기록은 누락 없으면 []',
    ADD CONSTRAINT chk_pain_logs_assessment_status
        CHECK (assessment_status IS NULL
               OR assessment_status IN ('COMPLETED', 'PARTIAL', 'NO_MATCH'));

-- ③ 같은 기록 안에서 같은 운동은 판정 1개만 + 당시 안내 문구 스냅샷
--   guide_message : 나중에 규칙 문구를 고쳐도 '그날 받은 문구'는 그대로 남게
ALTER TABLE pain_log_guide
    ADD CONSTRAINT uq_pain_log_guide_log_exercise UNIQUE (log_id, exercise_id),
    ADD COLUMN guide_message TEXT NULL
        COMMENT '판정 당시 사용자에게 제공한 안내 문구';

-- ④ 규칙 범위 검사 (최솟값 ≤ 최댓값, NULL은 '조건 없음'이라 통과)
ALTER TABLE exercise_guide_rules
    ADD CONSTRAINT chk_rules_min_pain
        CHECK (min_pain_score IS NULL OR min_pain_score BETWEEN 0 AND 10),
    ADD CONSTRAINT chk_rules_max_pain
        CHECK (max_pain_score IS NULL OR max_pain_score BETWEEN 0 AND 10),
    ADD CONSTRAINT chk_rules_pain_order
        CHECK (min_pain_score IS NULL OR max_pain_score IS NULL
               OR min_pain_score <= max_pain_score),
    ADD CONSTRAINT chk_rules_stage_order
        CHECK (min_stage_level IS NULL OR max_stage_level IS NULL
               OR min_stage_level <= max_stage_level),
    ADD CONSTRAINT chk_rules_sleep_nonnegative
        CHECK (max_sleep_minutes IS NULL OR max_sleep_minutes >= 0);
