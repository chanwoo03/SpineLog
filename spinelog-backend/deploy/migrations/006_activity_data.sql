-- =====================================================================
-- 006_activity_data.sql : 활동 기록에 쓸 기본 데이터 (카테고리 5 · 활동 12 · 태그 연결)
-- ---------------------------------------------------------------------
-- 언제 실행?  005 다음에 한 번 (내 PC MySQL, NAS MySQL 각각)
-- 왜?         activity_categories · activity_types · activity_type_tags 표가 비어 있어서
--             GET /api/activity-options에 고를 활동이 없음 → 활동 기록을 못 함
-- 결정        찬우 2026-11-04 "일단 저것들만" (목록 12개, 태그는 movement_tags 1~10 중에서)
-- 공통 활동   user_id = NULL → 모든 사용자에게 보임 (사용자가 만든 활동은 user_id가 들어감)
-- 안전장치    번호를 직접 정하고 INSERT IGNORE → 두 번 실행해도 결과가 같음
-- =====================================================================

SET NAMES utf8mb4;
START TRANSACTION;

-- ① 카테고리
INSERT IGNORE INTO activity_categories (category_id, category_label) VALUES
    (1, '집안일'),
    (2, '업무·공부'),
    (3, '이동'),
    (4, '운동·여가'),
    (5, '휴식');

-- ② 활동 종류 (user_id 비움 = 공통 활동)
INSERT IGNORE INTO activity_types (activity_type_id, category_id, type_label, user_id) VALUES
    (1,  1, '설거지',                  NULL),
    (2,  1, '바닥 청소',               NULL),
    (3,  1, '높은 선반 정리',          NULL),
    (4,  1, '요리',                    NULL),
    (5,  2, '책상에서 공부·사무',      NULL),
    (6,  2, '서서 일하기',             NULL),
    (7,  2, '물건 나르기 (택배·이사)', NULL),
    (8,  3, '운전',                    NULL),
    (9,  3, '장보기 (짐 들기)',        NULL),
    (10, 4, '달리기',                  NULL),
    (11, 4, '골프',                    NULL),
    (12, 5, '오래 누워 있기',          NULL);

-- ③ 활동 ↔ 동작 태그 (판정 코드가 이 연결로 "최근에 한 동작"을 알아냄)
--    태그 번호: 1 앞으로 숙이기 · 2 뒤로 젖히기 · 3 허리 비틀기 · 4 무거운 것 들기 · 5 장시간 앉기
--               6 장시간 서 있기 · 7 충격 · 8 반복 동작 · 9 진동 · 10 오래 움직이지 않기
INSERT IGNORE INTO activity_type_tags (activity_type_id, tag_id) VALUES
    (1, 1),           -- 설거지: 앞으로 숙이기
    (2, 1), (2, 8),   -- 바닥 청소: 앞으로 숙이기, 반복 동작
    (3, 2),           -- 높은 선반 정리: 뒤로 젖히기
    (4, 6),           -- 요리: 장시간 서 있기
    (5, 5),           -- 책상에서 공부·사무: 장시간 앉기
    (6, 6),           -- 서서 일하기: 장시간 서 있기
    (7, 4), (7, 1),   -- 물건 나르기: 무거운 것 들기, 앞으로 숙이기
    (8, 5), (8, 9),   -- 운전: 장시간 앉기, 진동
    (9, 4),           -- 장보기: 무거운 것 들기
    (10, 7),          -- 달리기: 충격
    (11, 3),          -- 골프: 허리 비틀기
    (12, 10);         -- 오래 누워 있기: 오래 움직이지 않기

-- ④ 적용 기록
INSERT IGNORE INTO schema_migrations (version) VALUES (6);

COMMIT;

-- 확인: 활동 · 카테고리 · 태그를 한 줄씩 (12줄)
SELECT t.activity_type_id, c.category_label, t.type_label,
       GROUP_CONCAT(m.tag_label ORDER BY m.tag_id SEPARATOR ', ') AS tags
FROM activity_types t
JOIN activity_categories c ON c.category_id = t.category_id
LEFT JOIN activity_type_tags a ON a.activity_type_id = t.activity_type_id
LEFT JOIN movement_tags m ON m.tag_id = a.tag_id
WHERE t.user_id IS NULL
GROUP BY t.activity_type_id, c.category_label, t.type_label
ORDER BY t.activity_type_id;
