-- =====================================================================
-- 005_schema_migrations.sql : 이 DB에 적용한 마이그레이션 번호를 기록하는 표
-- ---------------------------------------------------------------------
-- 왜?     지금까지는 "어느 파일까지 실행했는지"를 사람이 기억해야 했음
--         → DB 안에 목록을 남겨서 다음부터는 이 표를 보고 판단
-- 설계    찬우 2026-11-03: version INT + PRIMARY KEY(같은 번호 두 번 금지),
--         applied_at 자동 시각, 이 파일(005)까지 기록
--         (IF NOT EXISTS · INSERT IGNORE 는 Claude가 추가: 두 번 실행해도 에러 없음)
-- 어디에? NAS: 001~004가 적용된 상태라 그대로 실행
--         내 PC: 003·004를 먼저 실행한 뒤에 이 파일 실행 (안 그러면 기록이 틀림)
-- 주의    001~004의 applied_at은 진짜 날짜가 아니라 이 표를 만든 시각
--         (실제 날짜: 001·002 10/13, 003 10/27, 004 11/2)
-- =====================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INT,                                  -- 마이그레이션 번호 (001 → 1)
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 적용한 시각 (자동)
    PRIMARY KEY (version)                            -- 같은 번호는 한 번만
);

-- 이미 있는 번호는 건너뜀 (IGNORE)
INSERT IGNORE INTO schema_migrations (version) VALUES (1), (2), (3), (4), (5);

-- 확인
SELECT version, applied_at FROM schema_migrations ORDER BY version;
