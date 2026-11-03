import bcrypt


def hash_password(plain: str) -> str:
    """회원가입 때: 비밀번호 -> 해시 (DB에 저장할 글자)"""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """로그인 때: 입력한 비밀번호가 저장된 해시와 맞는지 True/False"""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False