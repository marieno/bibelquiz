import os
import json, random, secrets, time, logging, hashlib
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import database
from env_loader import load_private_env
load_private_env()
import mailer

log = logging.getLogger("bibelquiz.recovery")

ROOT=Path(__file__).parent
QUESTIONS=json.loads((ROOT/"questions"/"questions.json").read_text(encoding="utf-8"))["questions"]
LEVELS=["enfant","facile","moyen","difficile"]

app=FastAPI(title="BibelQuiz")
database.init()
database.account_migrate()
database.multiplayer_init()

class Auth(BaseModel):
    username:str
    password:str
    language:str="de"
    display_name:str|None=None
    email:str|None=None
class RoomReady(BaseModel):
    ready:bool
    car:str|None=None
class GroupCreate(BaseModel):
    game_type:str="quiz"
    difficulty:str="enfant"
class RoomJoin(BaseModel):
    code:str
class UnifiedRaceSync(BaseModel):
    distance:float
    speed:float
    score:int
    lane:int
    finished:bool=False
class GroupAnswer(BaseModel):
    choice:str
    question_index:int

class AudioPreferences(BaseModel):
    enabled:bool=False
    slow:bool=False

class AccountUpdate(BaseModel):
    display_name:str
    language:str
    email:str|None=None
class PasswordChange(BaseModel):
    current_password:str
    new_password:str
class RecoveryLookup(BaseModel):
    email:str
class PasswordRecoveryRequest(BaseModel):
    email:str
    username:str
class TokenLookup(BaseModel):
    token:str
class PasswordReset(BaseModel):
    token:str
    new_password:str

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
    try:u=database.register(a.username,a.password,a.language,a.display_name,a.email)
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



@app.put("/api/account/audio")
def account_audio(a:AudioPreferences,authorization:str|None=Header(None)):
 u=uid(authorization);database.update_audio_preferences(u,a.enabled,a.slow)
 return {"user":database.user(u)}

@app.put("/api/account")
def account_update(a:AccountUpdate,authorization:str|None=Header(None)):
 u=uid(authorization)
 try:database.update_account(u,a.display_name,a.language,a.email)
 except ValueError as e:raise HTTPException(400,str(e))
 return {"user":database.user(u)}

@app.post("/api/account/change-password")
def account_password(a:PasswordChange,authorization:str|None=Header(None)):
 u=uid(authorization)
 try:database.change_password(u,a.current_password,a.new_password)
 except ValueError as e:raise HTTPException(400,str(e))
 return {"ok":True}

@app.post("/api/recovery/usernames/request")
def recovery_usernames_request(a:RecoveryLookup):
 # Always return the same public response to avoid account/email enumeration.
 email=a.email.strip().lower()
 marker=hashlib.sha256(email.encode()).hexdigest()[:10]
 accounts=database.accounts_by_email(email)
 configured=mailer.configured()
 log.warning("RECOVERY_USERNAME_REQUEST email_hash=%s accounts=%s brevo_configured=%s",marker,len(accounts),configured)
 if accounts:
  token=database.create_recovery_token(email,"usernames")
  link=f"{mailer.APP_URL}/?recovery=usernames&token={token}"
  subject="BibelQuiz – Benutzerkonten / Comptes"
  body=f"""BibelQuiz

Öffne diesen sicheren Link, um die mit dieser E-Mail verbundenen Konten anzuzeigen:
{link}

Der Link ist 30 Minuten gültig und nur einmal verwendbar.

Ouvre ce lien sécurisé pour afficher les comptes associés à cette adresse.
Le lien est valable 30 minutes et utilisable une seule fois."""
  database.queue_email(email,subject,body)
  log.warning("RECOVERY_MAIL_QUEUED purpose=usernames email_hash=%s",marker)
 return {"ok":True}

@app.post("/api/recovery/usernames/verify")
def recovery_usernames_verify(a:TokenLookup):
 tok=database.recovery_token(a.token,"usernames")
 if not tok:raise HTTPException(400,"TOKEN_INVALID")
 accounts=database.accounts_by_email(tok["email"])
 database.consume_recovery_token(a.token)
 return {"accounts":accounts}

@app.post("/api/recovery/password/request")
def recovery_password_request(a:PasswordRecoveryRequest):
 email=a.email.strip().lower();username=a.username.strip()
 marker=hashlib.sha256(email.encode()).hexdigest()[:10]
 accounts=database.accounts_by_email(email)
 match=next((x for x in accounts if x["username"].lower()==username.lower()),None)
 configured=mailer.configured()
 log.warning("RECOVERY_PASSWORD_REQUEST email_hash=%s accounts=%s username_match=%s brevo_configured=%s",marker,len(accounts),bool(match),configured)
 if match:
  with database.engine.connect() as c:
   row=c.execute(database.text("SELECT id FROM users WHERE lower(username)=lower(:u) AND lower(email)=lower(:e)"),{"u":username,"e":email}).first()
  if row:
   token=database.create_recovery_token(email,"password",row[0])
   link=f"{mailer.APP_URL}/?recovery=password&token={token}"
   subject="BibelQuiz – Passwort zurücksetzen / Réinitialiser le mot de passe"
   body=f"""BibelQuiz

Konto / Compte: {match["display_name"]}

Passwort zurücksetzen / Réinitialiser le mot de passe:
{link}

Der Link ist 30 Minuten gültig und nur einmal verwendbar.
Le lien est valable 30 minutes et utilisable une seule fois."""
   database.queue_email(email,subject,body)
   log.warning("RECOVERY_MAIL_QUEUED purpose=password email_hash=%s",marker)
 return {"ok":True}

@app.post("/api/recovery/password/reset")
def recovery_password_reset(a:PasswordReset):
 try:database.reset_password_by_token(a.token,a.new_password)
 except ValueError as e:raise HTTPException(400,str(e))
 return {"ok":True}

class RaceCreate(BaseModel):
 difficulty:str="enfant"
class RaceJoin(BaseModel):
 code:str
class RaceReady(BaseModel):
 ready:bool=True
 car:str="red"
class RaceSync(BaseModel):
 distance:float
 speed:float
 score:int
 lane:int
 finished:bool=False

@app.post("/api/race-multi/create")
def race_multi_create(a:RaceCreate,authorization:str|None=Header(None)):
 u=uid(authorization);lv=a.difficulty.lower()
 if lv not in LEVELS and lv!="alle":raise HTTPException(400,"INVALID_LEVEL")
 for _ in range(30):
  code=str(random.randint(100000,999999))
  if not database.race_room(code):
   database.race_create_room(u,code,lv);r=database.race_room(code);r["me"]=u;return r
 raise HTTPException(503,"ROOM_CODE_UNAVAILABLE")

@app.post("/api/race-multi/join")
def race_multi_join(a:RaceJoin,authorization:str|None=Header(None)):
 u=uid(authorization)
 try:database.race_join(u,a.code.strip())
 except ValueError as e:raise HTTPException(400,str(e))
 r=database.race_room(a.code.strip());r["me"]=u;return r

@app.get("/api/race-multi/{code}")
def race_multi_room(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);r=database.race_room(code)
 if not r:raise HTTPException(404,"ROOM_NOT_FOUND")
 if not any(p["user_id"]==u for p in r["players"]):raise HTTPException(403)
 r["me"]=u;return r

@app.post("/api/race-multi/{code}/ready")
def race_multi_ready(code:str,a:RaceReady,authorization:str|None=Header(None)):
 u=uid(authorization);database.race_ready(u,code,a.ready,a.car);r=database.race_room(code);r["me"]=u;return r

@app.post("/api/race-multi/{code}/start")
def race_multi_start(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);r=database.race_room(code)
 if not r:raise HTTPException(404,"ROOM_NOT_FOUND")
 if int(r["host_user_id"])!=int(u):raise HTTPException(403,"HOST_ONLY")
 lv=r["difficulty"];pool=QUESTIONS if lv=="alle" else [q for q in QUESTIONS if q["niveau"]==lv]
 chosen=random.sample(pool,min(10,len(pool)))
 try:database.race_start(u,code,[q["id"] for q in chosen])
 except ValueError as e:raise HTTPException(400,str(e))
 r=database.race_room(code);r["me"]=u
 r["questions"]=[{"id":q["id"],"question":q["question"],"reponses":q["reponses"],"correcte":q["correcte"]} for q in chosen]
 return r

@app.get("/api/race-multi/{code}/questions")
def race_multi_questions(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);r=database.race_room(code)
 if not r or not any(p["user_id"]==u for p in r["players"]):raise HTTPException(403)
 ids=[int(x) for x in (r.get("question_ids") or "").split(",") if x]
 return {"questions":[{"id":q["id"],"question":q["question"],"reponses":q["reponses"],"correcte":q["correcte"]} for q in QUESTIONS if q["id"] in ids]}

@app.post("/api/race-multi/{code}/sync")
def race_multi_sync(code:str,a:RaceSync,authorization:str|None=Header(None)):
 u=uid(authorization)
 try:database.race_sync(u,code,max(0,min(1000,a.distance)),max(0,min(200,a.speed)),max(0,a.score),max(0,min(2,a.lane)),a.finished)
 except ValueError as e:raise HTTPException(400,str(e))
 r=database.race_room(code);r["me"]=u
 # Effective score includes finish bonus once finished.
 for p in r["players"]:
  p["total_score"]=p["score"]+(database.race_finish_bonus(p["finish_order"]) if p["finished"] else 0)
 return r

@app.get("/api/race/questions/{level}")
def race_questions(level:str,authorization:str|None=Header(None)):
 uid(authorization)
 if level not in LEVELS:raise HTTPException(400,"INVALID_LEVEL")
 pool=[q for q in QUESTIONS if q["niveau"]==level]
 chosen=random.sample(pool,min(20,len(pool)))
 return [{"id":q["id"],"question":q["question"],"reponses":q["reponses"],"correcte":q["correcte"],"reference":q["reference"]} for q in chosen]

@app.get("/api/version")
def app_version():
 return {"version":"6.8.2","build":"race-bundle-syntax-fix"}

@app.post("/api/group/create")
def group_create(a:GroupCreate,authorization:str|None=Header(None)):
 u=uid(authorization)
 game_type=(a.game_type or "quiz").strip().lower()
 difficulty=(a.difficulty or "enfant").strip().lower()
 if game_type not in ("quiz","race"):raise HTTPException(400,"INVALID_GAME_TYPE")
 if difficulty not in ("enfant","facile","moyen","difficile","alle"):raise HTTPException(400,"INVALID_DIFFICULTY")
 for _ in range(30):
  code=str(random.randint(100000,999999))
  if not database.room(code):
   database.create_room(u,code,difficulty,game_type)
   return database.room(code)
 raise HTTPException(503,"ROOM_CODE_UNAVAILABLE")

@app.post("/api/group/join")
def group_join(a:RoomJoin,authorization:str|None=Header(None)):
 u=uid(authorization);code=a.code.strip()
 try:database.join_room(u,code)
 except ValueError as e:raise HTTPException(400,str(e))
 return database.room(code)

@app.get("/api/group/{code}")
def group_room(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);r=database.room(code)
 if not r:raise HTTPException(404,"ROOM_NOT_FOUND")
 if not any(p["user_id"]==u for p in r["players"]):raise HTTPException(403)
 r["me"]=u
 return r

@app.post("/api/group/{code}/ready")
def group_ready(code:str,a:RoomReady,authorization:str|None=Header(None)):
 u=uid(authorization);database.set_ready(u,code,a.ready,a.car);return database.room(code)

@app.post("/api/group/{code}/leave")
def group_leave(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);database.leave_room(u,code);return {"ok":True}


def group_question_pool(difficulty):
 # Group mode is independent from Solo unlocks.
 if difficulty=="alle":return QUESTIONS
 return [q for q in QUESTIONS if q["niveau"]==difficulty]

def choose_group_questions(difficulty):
 if difficulty!="alle":
  pool=group_question_pool(difficulty)
  if len(pool)<10:raise HTTPException(409,"NOT_ENOUGH_QUESTIONS")
  return random.sample(pool,10)
 # Balanced mix: 3 enfant + 3 facile + 2 moyen + 2 difficile.
 distribution={"enfant":3,"facile":3,"moyen":2,"difficile":2}
 chosen=[]
 for level,count in distribution.items():
  pool=[q for q in QUESTIONS if q["niveau"]==level]
  if len(pool)<count:raise HTTPException(409,"NOT_ENOUGH_QUESTIONS")
  chosen.extend(random.sample(pool,count))
 random.shuffle(chosen)
 return chosen

def group_public_state(uid_,code):
 r=database.room(code)
 if not r or not any(p["user_id"]==uid_ for p in r["players"]):raise HTTPException(403)
 host_player=next((p for p in r["players"] if p["user_id"]==r["host_user_id"]),None)
 is_host=(uid_==r["host_user_id"])
 host_name=host_player["display_name"] if host_player else "Host"
 st=database.game_state(code)
 if not st:return {"room":r,"phase":"lobby","is_host":is_host,"host_name":host_name}
 if st["status"]=="finished" or st["current_index"]>=len(st["question_ids"]):
  database.finalize_multiplayer_results(code)
  return {"room":r,"phase":"finished","scores":st["scores"],"stats":database.multiplayer_stats(uid_),"difficulty":r.get("difficulty") or "alle"}
 i=st["current_index"];qid=st["question_ids"][i];q=next(x for x in QUESTIONS if x["id"]==qid)
 started=datetime.fromisoformat(st["question_started_at"])
 elapsed=max(0,(datetime.now(timezone.utc)-started).total_seconds())
 remaining=max(0,15-elapsed)
 all_answered=len(st["answered_ids"])>=len(r["players"])
 reveal=remaining<=0 or all_answered
 out={"room":r,"phase":"reveal" if reveal else "question","is_host":is_host,"host_name":host_name,"index":i,"total":10,
      "remaining":round(remaining,1),"scores":st["scores"],"answered_count":len(st["answered_ids"]),
      "player_count":len(r["players"]),"my_answered":uid_ in st["answered_ids"],
      "question":{"id":q["id"],"question":q["question"],"reponses":q["reponses"]}}
 if reveal:
  out["correct_choice"]=q["correcte"];out["reference"]=q["reference"]
  out["answers"]=database.game_answer_details(code,i)
 return out

@app.post("/api/group/{code}/race-sync")
def unified_group_race_sync(code:str,a:UnifiedRaceSync,authorization:str|None=Header(None)):
 u=uid(authorization)
 try:database.unified_race_sync(u,code,max(0,min(1000,a.distance)),max(0,min(200,a.speed)),max(0,a.score),max(0,min(2,a.lane)),a.finished)
 except ValueError as e:raise HTTPException(400,str(e))
 st=database.unified_race_state(code)
 if not st or not any(int(x["user_id"])==int(u) for x in st["players"]):raise HTTPException(403)
 st["me"]=u
 return st

@app.get("/api/group/{code}/race-state")
def unified_group_race_state(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);st=database.unified_race_state(code)
 if not st or not any(int(x["user_id"])==int(u) for x in st["players"]):raise HTTPException(403)
 st["me"]=u
 return st

@app.get("/api/group/{code}/questions")
def unified_group_questions(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);r=database.room(code)
 if not r or not any(int(p["user_id"])==int(u) for p in r["players"]):raise HTTPException(403)
 st=database.game_state(code)
 if not st:return {"questions":[]}
 ids=st["question_ids"]
 return {"questions":[{"id":q["id"],"question":q["question"],"reponses":q["reponses"],"correcte":q["correcte"],"reference":q["reference"]} for q in QUESTIONS if q["id"] in ids]}

@app.post("/api/group/{code}/start")
def group_start(code:str,authorization:str|None=Header(None)):
 u=uid(authorization)
 room=database.room(code)
 if not room:raise HTTPException(404,"ROOM_NOT_FOUND")
 if int(room["host_user_id"])!=int(u):raise HTTPException(403,"HOST_ONLY")
 chosen=choose_group_questions(room.get("difficulty") or "alle")
 try:database.start_game(u,code,[q["id"] for q in chosen])
 except ValueError as e:raise HTTPException(400,str(e))
 return group_public_state(u,code)

@app.get("/api/group/{code}/game")
def group_game(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);return group_public_state(u,code)

@app.post("/api/group/{code}/answer")
def group_answer(code:str,a:GroupAnswer,authorization:str|None=Header(None)):
 u=uid(authorization);st=database.game_state(code)
 if not st or st["status"]!="playing":raise HTTPException(409,"GAME_NOT_PLAYING")
 if a.question_index!=st["current_index"]:raise HTTPException(409,"QUESTION_CHANGED")
 started=datetime.fromisoformat(st["question_started_at"])
 elapsed_ms=max(0,int((datetime.now(timezone.utc)-started).total_seconds()*1000))
 if elapsed_ms>15000:raise HTTPException(409,"TIME_UP")
 qid=st["question_ids"][st["current_index"]];q=next(x for x in QUESTIONS if x["id"]==qid)
 ok=a.choice.upper()==q["correcte"]
 # 100 base + 0..50 speed bonus. Full bonus at immediate response, zero at 15s.
 bonus=max(0,50-int(elapsed_ms/300))
 pts=(100+bonus) if ok else 0
 if not database.save_game_answer(u,code,st["current_index"],a.choice.upper(),ok,elapsed_ms,pts):
  raise HTTPException(409,"ALREADY_ANSWERED")
 return {"accepted":True}

@app.post("/api/group/{code}/next")
def group_next(code:str,authorization:str|None=Header(None)):
 u=uid(authorization);r=database.room(code)
 if not r or r["host_user_id"]!=u:raise HTTPException(403,"HOST_ONLY")
 st=database.game_state(code)
 if not st:raise HTTPException(404)
 # Host can advance only after all answered or timer elapsed.
 started=datetime.fromisoformat(st["question_started_at"])
 elapsed=(datetime.now(timezone.utc)-started).total_seconds()
 if len(st["answered_ids"])<len(r["players"]) and elapsed<15:raise HTTPException(409,"QUESTION_STILL_ACTIVE")
 database.advance_game(code)
 return group_public_state(u,code)


def evaluate_multiplayer_badges(u):
 st=database.multiplayer_stats(u);won=[]
 checks=[
  ("multi:first_game",st["games"]>=1,"🎮 Erste Gruppenpartie / Première partie",25,"🎮"),
  ("multi:first_win",st["wins"]>=1,"🥇 Erster Sieg / Première victoire",50,"🥇"),
  ("multi:3wins",st["wins"]>=3,"🔥 3 Siege / 3 victoires",100,"🔥"),
  ("multi:10wins",st["wins"]>=10,"🏆 10 Siege / 10 victoires",250,"🏆"),
  ("multi:5podiums",st["podiums"]>=5,"🎖️ 5 Podien / 5 podiums",100,"🎖️"),
  ("multi:blitz",st["best_answer_ms"] is not None and st["best_answer_ms"]<=3000,"⚡ Blitzantwort / Réponse éclair",75,"⚡")
 ]
 for key,ok,title,pts,emoji in checks:
  if ok and database.claim_reward(u,key,title,pts):won.append({"key":key,"title":title,"points":pts,"emoji":emoji})
 return won

@app.get("/api/multiplayer/profile")
def group_profile(authorization:str|None=Header(None)):
 u=uid(authorization)
 return {"stats":database.multiplayer_stats(u),"history":database.multiplayer_history(u,10),
         "rewards":[r for r in database.rewards(u) if str(r["reward_key"]).startswith("multi:")]}

@app.post("/api/multiplayer/claim-badges")
def group_claim_badges(authorization:str|None=Header(None)):
 u=uid(authorization);won=evaluate_multiplayer_badges(u)
 return {"rewards":won,"stats":database.multiplayer_stats(u),"user":database.user(u)}


@app.get("/service-worker.js")
def service_worker():
    return FileResponse(ROOT/"static"/"service-worker.js", media_type="application/javascript", headers={"Service-Worker-Allowed":"/","Cache-Control":"no-cache"})

@app.get("/api/system/mail-status")
def mail_status(authorization:str|None=Header(None)):
 u=uid(authorization)
 return {"provider":"brevo","configured":mailer.configured(),"sender_configured":bool(mailer.BREVO_FROM_EMAIL)}

EMAIL_WORKER_SECRET=os.getenv("EMAIL_WORKER_SECRET","")

def require_worker_secret(authorization):
 if not EMAIL_WORKER_SECRET: raise HTTPException(503,"WORKER_NOT_CONFIGURED")
 if not authorization or not secrets.compare_digest(authorization,"Bearer "+EMAIL_WORKER_SECRET): raise HTTPException(401,"UNAUTHORIZED")

class WorkerResult(BaseModel):
 status:str
 error:str|None=None

@app.get("/api/internal/email-queue")
def internal_email_queue(authorization:str|None=Header(None)):
 require_worker_secret(authorization)
 return {"emails":database.pending_emails(20)}

@app.post("/api/internal/email-queue/{mail_id}/result")
def internal_email_result(mail_id:int,a:WorkerResult,authorization:str|None=Header(None)):
 require_worker_secret(authorization)
 if a.status=="sent": database.mark_email_sent(mail_id)
 elif a.status=="failed": database.mark_email_failed(mail_id,a.error or "EXTERNAL_WORKER_FAILED")
 else: raise HTTPException(400,"INVALID_STATUS")
 return {"ok":True}

app.mount("/static",StaticFiles(directory=ROOT/"static"),name="static")
@app.get("/")
def home():return FileResponse(ROOT/"static"/"index.html")
