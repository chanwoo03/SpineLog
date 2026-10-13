import os

# [임시] 로그인 기능이 없어서 시연 사용자를 로그인 사용자로 간주한다.
DEMO_USER_ID = os.getenv("DEMO_USER_ID", "user01")


def get_current_user() -> str:
    """현재 로그인한 사용자 ID (지금은 시연용 user01 고정)"""
    return DEMO_USER_ID