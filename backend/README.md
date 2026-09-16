# 🦴 Spine Care Platform (척추 건강 관리 웹 플랫폼)

사용자의 척추 상태와 일상 기록(통증, 수면, 활동)을 기반으로 맞춤형 운동 및 의학 정보를 제공하는 데이터 중심 웹 플랫폼입니다.

---

## 🛠️ Tech Stack
* **Backend**: Python, FastAPI, SQLAlchemy, PyMySQL
* **Database**: MySQL (`spinelog`), MySQL Workbench (16 Tables Normalized)
* **Security**: pwdlib (Password Hashing)

---

## 🗄️ Database Architecture (16개 테이블 구성)

### 1. 회원 / 인증
* **`users`**: 회원 기본 정보 및 인증 관리

### 2. 상태 및 목표
* **`conditions`**: 척추 질환 종류 마스터 데이터
* **`patient_conditions`**: 사용자별 질환 상태 및 운동 목표
* **`symptoms`**: 증상 마스터 데이터
* **`user_symptoms`**: 사용자가 선택한 증상 및 심각도 기록

### 3. 기록 관리
* **`pain_logs`**: 사용자의 일일 통증 기록
* **`pain_locations`**: 통증 발생 위치 마스터
* **`pain_types`**: 통증 양상/종류 마스터
* **`sleep_logs`**: 수면 시간 및 수면 기록
* **`activity_logs`**: 걸음 수 및 활동량 기록

### 4. 추천 및 콘텐츠
* **`exercises`**: 추천/운동 상세 정보 및 주의사항
* **`exercise_categories`**: 운동 분류 카테고리
* **`exercise_rules`**: 맞춤 운동 추천 규칙 매핑
* **`user_exercise_logs`**: 운동 수행 완료 기록 및 체감 난이도
* **`medical_contents`**: 의학 정보 큐레이션 콘텐츠 본문
* **`content_categories`**: 의학 정보 카테고리