# 1. 바탕: 파이썬 3.14가 설치된 가벼운 리눅스
FROM python:3.14-slim

# 2. 컨테이너 안에서 작업할 폴더
WORKDIR /code

# 3. 패키지 목록을 먼저 복사하고 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 내 코드 복사
COPY app ./app

# 5. 컨테이너가 켜지면 실행할 명령
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]