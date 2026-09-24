# S/W  project week 4

#### users (사용자 테이블)

user_id(pk) : 사용자 id

email : 사용자 email

password_hash : 사용자 비밀번호

created_at : 생성 날짜

updated_at : 수정날짜

username : user 이름

---

#### activity_logs (활동 기록 테이블)

idx(pk) : 활동 기록 id

user_id (fk) : 기록한 사용자 id

~~step_count : 걸음 수 → 따로 빼는게 좋을 듯~~ 

recorded_at : 기록 시간

activity_name : 활동 종류 → activity_type_id(fk)로 또 참조해서 늘리기 = 활동 종류 id

started_at : 활동 시작 시각

duration_minutes : 활동 시간 (분)

intensity : 체감 강도 check나 제약 조건을 걸어 강도를 숫자로 받기

memo : 본인이 작성하고 싶은 메모 내용

#### 신규 activity_types(활동 종류 테이블)

activity_type_id (pk) : 활동 종류 id

category_id : 대분류 id

type_label : 활동 이름

created_at : 생성 날짜 

user_id : 만든 사용자 id

#### 신규 : movement_tags ( 동작, 부하 특성 태그 마스터 테이블 )

tag_id (pk) : 태그 id

tag_label  : 태그 이름 (장시간 앉기, 오래 서 있기, 숙이기, 들기, 비틀기, 반복 동작, 충격)

#### 신규 : activity_type_tags (활동 별칭 테이블)

activity_type_id (pk,fk) : 활동 종류 id

tag_id (pk, fk) : 태그 id

#### 신규 : activity_categories(활동 카테고리 마스터 테이블)

category_id (pk) : 대분류 ID

category_label : 대분류 이름 (일, 업무, 집안일 등)

#### morning_checkins (매일 아침 사용자가 전날 걸음 수와 지난밤 수면 시간을 입력하는 체크인 테이블)

idx (pk) : 체크인 테이블 id

user_id(fk) : 입력한 사용자 id

checkin_date : 체크인한 날짜

prev_day_steps : 전날 총 걸음 수

sleep_minutes : 지난밤 수면 시간

created_at : 입력 시간

---

#### pain_logs( 통증 기록 테이블 )

log_id(pk) : 기록 id

recorded_at : 기록 날짜

user_id(fk) : 기록한 환자 id

pain_location_id(fk) : 통증 위치

pain_type(fk) : 통증 타입

pain_score(fk) : 통증 점수

#### pain_locations ( 통증 위치 테이블, 어디가 아픈지)

location_id(pk) : 통증 위치 id

location_name : 통증 위치 이름

part_of_location_id(fk) : 통증 위치 (part_of 관계)

— `pain_locations` 테이블 (`part_of_location_id`): PART-OF (해부학적 포함) 계층. (예: '하체'  ← '다리' ← '종아리')  

#### pain_types (통증 양상, 타입 어떻게 아픈가)

pain_type_id(pk) : 통증 양상 id

pain_type_name : 통증 양상 이름

#### pain_scale_dictionary ( 통증 점수에 대한 구체적인 설명 및 행동 반응 및 대처 가이드를 제공하는 사전 테이블)

pain_score (pk) : 통증 점수 id

severity_id (fk) : 심각도 범주 id

level_name : 통증 레벨, 점수에 대한 한 줄 설명 → 이름 바꾸기 (score_summary)

cognitive_impact : 통증이 인지·정서에 미치는 영향 (집중력, 사고, 감정 상태 등)

physical_impact : 통증이 신체에 미치는 영향 및 관찰되는 신체 반응 (표정, 자세, 움직임 제한 등)

action_guide : 각 점수에 추천할 수 있는 행동 가이드

#### pain_severity_categories ( 통증의 심각도 범주, VAS(시각통증척도) 범위, 설명 등을 관리하는 마스터 테이블 )

severity_id(pk) :  범주 id

severity_name : 범주 라벨, 범주 자체를 나눠주는 설명 → 이름 바꾸기 (severity_label)

vas_range : (visual analogue scale) 잘못된 칼럼, 기준을  nrs로 할 생각이었는데 → nrs_range

description : 범주에 대한 설명

#### pain_log_recommendations ( 사용자의 통증 기록을 기준으로, 규칙에 따라 각 운동의 적합도를 추천·주의·금기로 판정한 결과를 기록하는 이력 테이블)

idx(pk) : 판정 이력 id

log_id : 판정의 기준 통증 기록 인덱스

exercise_id : 판정 대상 운동 id

recommendation_level_id : 적합도 레벨 id → guide_level_id(fk)

rule_id : 판정을 생성한 규칙id

generated_at : 판정 생성 시각

#### recommendation_level → exercise_guide_levels 레벨 테이블)

(칼럼 이름 변경)guide_level_id (pk) : 적합도 레벨 id

(신규 칼럼) level_code : 코드용 값 

(신규 칼럼) level_label : 화면 표시용 라벨

(칼럼 이름 변경)description : 레벨 설명, ( 추천, 주의, 금기 등으로 추천해도 괜찮은지에 대한 내용이 담긴 칼럼)

#### user_symptoms (사용자 증상 테이블)

idx (pk) : 사용자 증상 id

user_id (fk) : 사용자 id

symptom_id : 증상 id

severity_level : 심각도 레벨( 증상의 심각도를 본인이 선택, pain_severity랑은 다른 칼럼 ) → symptom_severity 

created_at : 생성 시각

#### symptoms (증상 테이블, 어떻게 어디가 아픈지)

symptom_id (pk) : 증상 id

symptom_name : 증상 종류 이름

description : 증상 설명

broader_symptom_id : is_a 관게로 증상 중 하위 분류 증상으로 하나의 테이블에서 순환 구조

#### user_conditions (사용자 상태 테이블)

idx (pk) : 사용자 상태 id

disease_grade : 증상 정도 (전방전위증같이 단계가 있는 것들)

goal_text : 목표 글

user_id (fk)  :  사용자 id

condition_id (fk) : 증상 id

#### conditions (상태 테이블)

condition_id (pk) : 상태 id

disease_name : 상태 이름, 질환 이름

description : 질환 설명

broader_condition_id : is_a 관계로 상태 중 하위 분류 질환으로, 전방전위증 - 퇴행성 등

#### condition_symptom_relations (상태, 증상 관계에 대한 테이블)

condition_id : 상태, 질환 id

symptom_id : 증상 id

relation_type_id (pk) : 관게 타입 id

rationale : 근본적 이유, 이론적 해석

#### symptom_relations_type (증상 관계 타입 테이블)??

relation_type_id : 관계 타입 id

type_description : 타입 설명

#### exercises (운동 테이블)

exercise_id (pk) : 운동 id

exercise_name : 운동 이름

description : 운동 설명

difficulty : 운동 난이더

caution : 주의점

category_id : 운동 카테고리 id 

difficulty_difficulty_id : 중복된 테이블

#### exercise_categories (운동 카테고리)

category_id : 운동 카테고리 id

category_name : 카테고리 이름

broader_category_id : is_a 관계로 운동 카테고리 세분화, 어깨-측면 등

#### difficulty (운동 난이도 테이블)

difficulty_id : 난이도 id

description : 난이도 설명

level_name : 난이도 레벨 이름 (쉬움, 어려움, 매우 어려움 등)

#### exercise_recommendation_rules → exercise_guide_rules ( 통증 점수·질환·증상 조건에 따라 운동의 적합도를 판정하는 규칙 테이블)

rule_id (pk) : 규칙 id

exercise_id : 대상 운동 id

guide_level_id : 판정 결과 적합도 레벨 ( fk로 다시 연결해야함 )

min_pain_score : 적용 최소 nrs 점수

max_pain_score : 적용 최대 nrs 점수

target_condition_id (fk) : 대상 질환, 상태 id

target_symptom_id (fk) : 대상 증상 id

min_stage_level : 적용 최소 단계

max_stage_level : 적용 최대 단계

guide_message : 사용자에게 보일 안내 문구

rationale : 규칙 근거

priority : 규칙 충돌 시 우선순위

#### medical_contents (통증·질환 관련 의료 정보 콘텐츠 테이블)

content_id (pk) : 의학적 콘텐츠 id

title : 의학적 콘텐츠 제목, 이름

summary : 요약

body : 본문

source_name : 출처 이름

source_url : 출처 링크

created_at : 작성 시각

updated_at : 수정 시각

#### content_categories (콘텐츠 카테고리 테이블)

category_id (pk) : 카테고리 id

category_name → category_label : 카테고리 이름

broader_category_id : is_a 규칙으로 카테고리

#### content_conditions (콘텐츠-질환 매핑 테이블, 여러 질환에 연결될 경우)

content_id (pk, fk) : 콘텐츠 id

condition_id (pk, fk) : 질환 id