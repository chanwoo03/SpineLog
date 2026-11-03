-- =====================================================================
-- 003_api_support.sql : 나머지 API(활동 기록 등)를 위한 구조 보완
-- ---------------------------------------------------------------------
-- 언제 실행?  활동 기록 API(POST /api/activity-logs)를 쓰기 전에 한 번
-- 어디에?     내 PC MySQL에 먼저 → 나중에 NAS MySQL에도 같은 파일을 실행
-- 왜?         덤프(spinelog.sql) 기준으로 확인한 문제 2가지
--   ① activity_logs.idx에 AUTO_INCREMENT가 없음
--      → API가 INSERT할 때 번호를 직접 정해야 해서 저장이 안 됨
--   ② activity_logs.activity_type_id에 외래키가 없음
--      → 없는 활동 종류 번호도 저장됨. 판정 코드가 이 칸으로 동작 태그를 JOIN하므로 FK로 막음
-- 주의        한 번만 실행. ②를 두 번 실행하면 "Duplicate foreign key" 에러 (이미 적용됐다는 뜻)
--             activity_logs에 이미 데이터가 있고 없는 activity_type_id가 섞여 있으면 ②가 실패함
-- =====================================================================

-- ① 활동 기록 번호 자동 증가
ALTER TABLE activity_logs
    MODIFY idx INT NOT NULL AUTO_INCREMENT;

-- ② 활동 종류 외래키 (활동 종류를 지우면 기록은 남기고 종류 칸만 비움)
ALTER TABLE activity_logs
    ADD CONSTRAINT fk_activity_logs_type
        FOREIGN KEY (activity_type_id) REFERENCES activity_types (activity_type_id)
        ON DELETE SET NULL;

