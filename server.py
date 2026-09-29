import json, random, secrets, time
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



WEEKLY_DIR=ROOT/"weekly"
WEEKLY_RUNS={}

def active_weekly():
 files=sorted(WEEKLY_DIR.glob("*.json"),reverse=True)
 for f in files:
  d=json.loads(f.read_text(encoding="utf-8"))
  if d.get("active"): return d
 return None

class WeeklyAnswer(BaseModel):
    week:str
    question_id:str
    choice:str

def public_weekly_question(q):
 return {"id":q["id"],"question":q["question"],"reponses":q["reponses"]}

def evaluate_rewards(user_id,p):
    won=[]
    total_mastered=sum(p[l]["done"] for l in LEVELS)

    for target,bonus,emoji in [(5,20,"🌟"),(10,30,"🏅"),(25,50,"🔥"),(50,100,"🏆"),(100,200,"👑")]:
        if total_mastered>=target:
            key=f"mastered:{target}"
            title=f"{emoji} {target} Fragen / questions"
            if database.claim_reward(user_id,key,title,bonus):
                won.append({"key":key,"title":title,"points":bonus,"emoji":emoji})

    for level in LEVELS:
        for category,cp in p[level]["categories"].items():
            if cp["total"] and cp["done"]==cp["total"]:
                key=f"category:{level}:{category}"
                title=f"🎁 Kategorie geschafft / catégorie terminée"
                if database.claim_reward(user_id,key,title,50):
                    won.append({"key":key,"title":title,"points":50,"emoji":"🎁"})

        lp=p[level]
        if lp["total"] and lp["done"]==lp["total"]:
            key=f"level:{level}"
            title=f"🏆 Level geschafft / niveau terminé"
            if database.claim_reward(user_id,key,title,150):
                won.append({"key":key,"title":title,"points":150,"emoji":"🏆"})
    return won

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
    u=uid(authorization); return {"user":database.user(u),"progress":progress(u),"rewards":database.rewards(u)}

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
    rewards=evaluate_rewards(u,p)
    return {"correct":correct,"correct_choice":q["correcte"],"reference":q["reference"],
            "newly_mastered":newly,"user":database.user(u),"progress":p,"rewards":rewards}

@app.get("/health")
def health(): return {"status":"ok"}


@app.get("/api/weekly")
def weekly_info(authorization:str|None=Header(None)):
 u=uid(authorization); w=active_weekly()
 if not w:return {"active":False}
 first=database.weekly_first_result(u,w["week"])
 return {"active":True,"week":w["week"],"title":w["title"],"question_count":len(w["questions"]),
         "first_result":first,"leaderboard":database.weekly_leaderboard(w["week"],10)}

@app.post("/api/weekly/start")
def weekly_start(authorization:str|None=Header(None)):
 u=uid(authorization); w=active_weekly()
 if not w:raise HTTPException(404,"NO_WEEKLY_QUIZ")
 run=secrets.token_urlsafe(18)
 WEEKLY_RUNS[run]={"uid":u,"week":w["week"],"start":time.time(),"answers":{}}
 return {"run":run,"week":w["week"],"title":w["title"],"questions":[public_weekly_question(q) for q in w["questions"]]}

@app.post("/api/weekly/answer/{run}")
def weekly_answer(run:str,a:WeeklyAnswer,authorization:str|None=Header(None)):
 u=uid(authorization); state=WEEKLY_RUNS.get(run)
 if not state or state["uid"]!=u:raise HTTPException(404,"RUN_NOT_FOUND")
 w=active_weekly()
 if not w or w["week"]!=state["week"]:raise HTTPException(409,"QUIZ_CHANGED")
 q=next((x for x in w["questions"] if x["id"]==a.question_id),None)
 if not q:raise HTTPException(404,"QUESTION_NOT_FOUND")
 if q["id"] in state["answers"]:raise HTTPException(409,"ALREADY_ANSWERED")
 ok=a.choice.upper()==q["correcte"]; state["answers"][q["id"]]=ok
 return {"correct":ok,"correct_choice":q["correcte"],"reference":q["reference"]}

@app.post("/api/weekly/finish/{run}")
def weekly_finish(run:str,authorization:str|None=Header(None)):
 u=uid(authorization); state=WEEKLY_RUNS.pop(run,None)
 if not state or state["uid"]!=u:raise HTTPException(404,"RUN_NOT_FOUND")
 w=active_weekly()
 if not w or w["week"]!=state["week"]:raise HTTPException(409,"QUIZ_CHANGED")
 correct=sum(1 for v in state["answers"].values() if v)
 duration=max(1,int((time.time()-state["start"])*1000))
 # Accuracy dominates; time only adds a modest tiebreak-style bonus.
 score=correct*100+max(0,200-min(200,duration//1000))
 ranked=database.save_weekly_result(u,w["week"],score,correct,duration)
 rewards=[]
 if ranked:
  if database.claim_reward(u,f"weekly:{w['week']}:participation","⭐ Quiz der Woche / Quiz de la semaine",20):
   rewards.append({"emoji":"⭐","title":"Quiz der Woche / Quiz de la semaine","points":20})
  for need,bonus,emoji in [(7,30,"🥉"),(9,50,"🥈"),(10,100,"🥇")]:
   if correct>=need and database.claim_reward(u,f"weekly:{w['week']}:{need}",f"{emoji} {correct}/10",bonus):
    rewards.append({"emoji":emoji,"title":f"{correct}/10","points":bonus})
 return {"ranked":ranked,"score":score,"correct_count":correct,"duration_ms":duration,
         "first_result":database.weekly_first_result(u,w["week"]),"leaderboard":database.weekly_leaderboard(w["week"],10),
         "rewards":rewards,"user":database.user(u)}

@app.get("/api/weekly/archive")
def weekly_archive(authorization:str|None=Header(None)):
 uid(authorization); out=[]
 for f in sorted(WEEKLY_DIR.glob("*.json"),reverse=True):
  w=json.loads(f.read_text(encoding="utf-8"))
  out.append({"week":w["week"],"title":w["title"],"active":bool(w.get("active"))})
 return out

app.mount("/static",StaticFiles(directory=ROOT/"static"),name="static")
@app.get("/")
def home():return FileResponse(ROOT/"static"/"index.html")
