from db import engine
from sqlalchemy import text

with engine.connect() as connection:
    result = connection.execute(text("SELECT * FROM conditions"))
    

    for row in result:
        print(row)

