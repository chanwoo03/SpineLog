-- =====================================================================
-- 008_medical_content.sql : 의학 콘텐츠 첫 1편(허리디스크) + O/X 퀴즈 3개 + 규칙 20·21 근거
-- ---------------------------------------------------------------------
-- 언제 실행?  007 다음에 한 번 (내 PC MySQL, NAS MySQL 각각)
-- 왜?         content_categories · medical_contents · content_quizzes 표가 비어 있어서
--             GET /api/contents 정보 목록과 퀴즈가 빈 화면
-- 출처        질병관리청 국가건강정보포털 「추간판탈출증(디스크)」 (cntnts_sn=3348)
--             공공누리 "출처표시+상업적이용금지+변경금지" → 원문을 옮기지 않고 요점만 우리 말로 정리, 출처 표시
-- 작성        2026-11-04 Claude가 출처를 읽고 정리 (찬우 요청) → 찬우가 원문과 대조 검토 필요
-- 안전장치    번호를 직접 정하고 INSERT IGNORE / UPDATE는 같은 값 → 두 번 실행해도 결과가 같음
-- =====================================================================

SET NAMES utf8mb4;
START TRANSACTION;

-- ① 콘텐츠 카테고리 (상위 1개 · 하위 2개)
INSERT IGNORE INTO content_categories (category_id, category_name, broader_category_id) VALUES
    (1, '질환 정보', NULL),
    (2, '증상과 원인', 1),
    (3, '생활 관리', 1);

-- ② 콘텐츠 1편: 허리디스크 (condition_id 1)
INSERT IGNORE INTO medical_contents (content_id, title, summary, body, category_id, condition_id, source_url) VALUES
(1,
 '허리디스크(추간판탈출증) 기본 알기',
 '척추뼈 사이 디스크 안쪽의 물렁한 부분이 밀려 나와 신경을 누르는 병입니다. 대부분은 수술 없이 좋아지지만, 다리 힘이 빠지거나 대소변에 문제가 생기면 바로 병원에 가야 합니다.',
 '■ 어떤 병인가요?
척추뼈 사이에는 충격을 흡수하는 디스크(추간판)가 있습니다. 바깥 껍질(섬유륜)이 찢어지면 안쪽의 젤리 같은 수핵이 밀려 나와 신경을 누르고, 이때 통증이 생깁니다. 허리(요추 4-5번, 5번-천추 1번 사이)에서 가장 많이 생깁니다.

■ 주요 증상
- 허리나 엉덩이 통증
- 엉덩이에서 다리 쪽으로 뻗치는 저리고 당기는 통증 (좌골신경통)
- 다리에 힘이 빠지거나, 양쪽 다리 감각이 다르게 느껴짐

■ 왜 생기나요? (위험 요인)
- 나이가 들며 디스크가 탄력을 잃는 퇴행성 변화
- 구부정한 자세로 무거운 물건을 자주 들기, 진동·하중이 가해지는 일
- 오랜 시간 구부정하게 앉아 있는 습관, 비만, 흡연

■ 어떻게 관리하나요?
- 대부분은 약물, 짧은 휴식, 운동치료 같은 비수술 치료로 4~6주 안에 좋아집니다.
- 누워만 있는 기간은 급성기 2~3일을 넘기지 않는 것이 좋습니다.
- 디스크 압력을 높이는 자세는 피하고, 허리 주변·복부 근육 운동을 꾸준히 합니다.

■ 바로 병원에 가야 하는 경우
- 다리 힘이 점점 빠지거나 발을 끌며 걷게 될 때
- 소변·대변을 보기 어렵거나 조절이 안 될 때
- 6주 넘게 치료해도 나아지지 않을 때

※ 이 내용은 참고용이며, 진단과 치료는 전문의와 상담하세요.',
 2, 1,
 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=3348');

-- ③ O/X 퀴즈 3개 (correct_answer: 1 = O, 0 = X)
INSERT IGNORE INTO content_quizzes (quiz_id, content_id, question, correct_answer, explanation) VALUES
(1, 1, '허리디스크는 대부분 수술을 해야 낫는다.', 0,
 'X. 대부분은 약물·휴식·운동치료 같은 비수술 치료로 4~6주 안에 좋아집니다. 수술은 근력이 계속 떨어지거나 대소변 장애가 있을 때 등에 고려합니다.'),
(2, 1, '다리 힘이 점점 빠지거나 대소변 조절이 안 되면 바로 병원에 가야 한다.', 1,
 'O. 신경이 심하게 눌리고 있다는 신호일 수 있어, 기다리지 말고 바로 진료를 받아야 합니다.'),
(3, 1, '디스크 통증이 심할 때는 몇 주 동안 계속 누워 있는 것이 가장 좋다.', 0,
 'X. 침상 안정은 급성기 2~3일을 넘기지 않는 것이 좋습니다. 오래 누워 있으면 오히려 통증이 계속되거나 나빠질 수 있습니다.');

-- ④ 규칙 20·21의 근거 채우기 (007에서 "[근거 확인 필요]"로 넣었던 칸)
UPDATE exercise_guide_rules
   SET rationale = '오랜 시간 구부정하게 앉는 습관은 추간판탈출증 위험 요인 (질병관리청 국가건강정보포털 추간판탈출증)'
 WHERE rule_id = 20;
UPDATE exercise_guide_rules
   SET rationale = '구부정한 자세로 무거운 물건을 드는 것은 요추 추간판탈출증 위험 요인 (질병관리청 국가건강정보포털 추간판탈출증)'
 WHERE rule_id = 21;

-- ⑤ 적용 기록
INSERT IGNORE INTO schema_migrations (version) VALUES (8);

COMMIT;

-- 확인
SELECT content_id, title, LEFT(summary, 30) AS summary FROM medical_contents;
SELECT quiz_id, question, IF(correct_answer = 1, 'O', 'X') AS answer FROM content_quizzes;
SELECT rule_id, LEFT(rationale, 40) AS rationale FROM exercise_guide_rules WHERE rule_id IN (20, 21);
