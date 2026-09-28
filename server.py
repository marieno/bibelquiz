import json, random, secrets
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import database

ROOT=Path(__file__).parent
QUESTIONS=json.loads((ROOT/"questions"/"questions.json").read_text(encoding="utf-8"))["questions"]
LEVELS=["enfant","facile","moyen","difficile"]

app=FastAPI(title="BibelQuiz")
database.init()

class Auth(BaseModel):
    username:str
    password:str
    language:str="de"
class Answer(BaseModel):
    question_id:int
    choice:str

def uid(authorization:str|None):
    if not authorization or not authorization.startswith("Bearer "): raise HTTPException(401)
    u=database.session_user(authorization[7:])
    if not u: raise HTTPException(401)
    return u

def progress(user_id):
    m=database.mastered(user_id); result={}
    for level in LEVELS:
        pool=[q for q in QUESTIONS if q["niveau"]==level]
        cats={}
        for c in sorted({q["categorie"] for q in pool}):
            cp=[q for q in pool if q["categorie"]==c]
            cats[c]={"done":sum(q["id"] in m for q in cp),"total":len(cp)}
        result[level]={"unlocked":database.unlocked(user_id,level),
                       "done":sum(q["id"] in m for q in pool),"total":len(pool),"categories":cats}
    for i,l in enumerate(LEVELS[:-1]):
        if result[l]["total"] and result[l]["done"]==result[l]["total"]:
            nxt=LEVELS[i+1]
            if not result[nxt]["unlocked"]:
                database.unlock(user_id,nxt); result[nxt]["unlocked"]=True
    return result

@app.post("/api/register")
def register(a:Auth):
    try:u=database.register(a.username,a.password,a.language)
    except ValueError as e:raise HTTPException(400,str(e))
    token=database.create_session(u)
    return {"token":token,"user":database.user(u)}

@app.post("/api/login")
def login(a:Auth):
    user=database.login(a.username,a.password)
    if not user:raise HTTPException(401,"LOGIN_FAILED")
    token=database.create_session(user["id"])
    return {"token":token,"user":database.user(user["id"])}

@app.get("/api/me")
def me(authorization:str|None=Header(None)):
    u=uid(authorization); return {"user":database.user(u),"progress":progress(u)}

@app.get("/api/round/{level}/{category}")
def round_(level:str,category:str,authorization:str|None=Header(None)):
    u=uid(authorization)
    if not database.unlocked(u,level):raise HTTPException(403,"LEVEL_LOCKED")
    pool=[q for q in QUESTIONS if q["niveau"]==level and q["categorie"]==category]
    m=database.mastered(u); todo=[q for q in pool if q["id"] not in m]; done=[q for q in pool if q["id"] in m]
    random.shuffle(todo); random.shuffle(done)
    chosen=(todo+done)[:5]
    # Never send answer key to browser.
    return [{"id":q["id"],"niveau":q["niveau"],"categorie":q["categorie"],
             "question":q["question"],"reponses":q["reponses"],"points":q["points"]} for q in chosen]

@app.post("/api/answer")
def answer(a:Answer,authorization:str|None=Header(None)):
    u=uid(authorization)
    q=next((x for x in QUESTIONS if x["id"]==a.question_id),None)
    if not q:raise HTTPException(404)
    correct=a.choice.upper()==q["correcte"]
    newly=database.answer(u,q["id"],correct,int(q.get("points",0)))
    p=progress(u)
    return {"correct":correct,"correct_choice":q["correcte"],"reference":q["reference"],
            "newly_mastered":newly,"user":database.user(u),"progress":p}

@app.get("/health")
def health(): return {"status":"ok"}

app.mount("/static",StaticFiles(directory=ROOT/"static"),name="static")
@app.get("/")
def home():return FileResponse(ROOT/"static"/"index.html")
