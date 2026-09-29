import os,hashlib,secrets
from datetime import datetime,timedelta,timezone
from sqlalchemy import create_engine,text
LEVELS=["enfant","facile","moyen","difficile"]
BASE_DIR=os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(BASE_DIR,"data"),exist_ok=True)
URL=os.getenv("DATABASE_URL",f"sqlite:///{os.path.join(BASE_DIR,'data','bible_quiz.db')}")
if URL.startswith("postgres://"): URL="postgresql+psycopg://"+URL[11:]
elif URL.startswith("postgresql://"): URL="postgresql+psycopg://"+URL[13:]
engine=create_engine(URL,pool_pre_ping=True,connect_args={"check_same_thread":False} if URL.startswith("sqlite") else {})
def init():
 with engine.begin() as c:
  pk="INTEGER PRIMARY KEY AUTOINCREMENT" if URL.startswith("sqlite") else "BIGSERIAL PRIMARY KEY"
  c.execute(text(f"CREATE TABLE IF NOT EXISTS users(id {pk},username TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,password_salt TEXT NOT NULL,language TEXT NOT NULL DEFAULT 'de',points INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL)"))
  c.execute(text("CREATE TABLE IF NOT EXISTS level_progress(user_id BIGINT NOT NULL,level TEXT NOT NULL,unlocked INTEGER NOT NULL DEFAULT 0,UNIQUE(user_id,level))"))
  c.execute(text("CREATE TABLE IF NOT EXISTS question_progress(user_id BIGINT NOT NULL,question_id INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,correct_answers INTEGER NOT NULL DEFAULT 0,mastered INTEGER NOT NULL DEFAULT 0,last_played_at TEXT,UNIQUE(user_id,question_id))"))
  c.execute(text("CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id BIGINT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL)"))
  c.execute(text("CREATE TABLE IF NOT EXISTS rewards(user_id BIGINT NOT NULL,reward_key TEXT NOT NULL,title TEXT NOT NULL,points INTEGER NOT NULL DEFAULT 0,earned_at TEXT NOT NULL,UNIQUE(user_id,reward_key))"))
def hp(p,s=None):
 s=s or secrets.token_hex(32);return hashlib.pbkdf2_hmac("sha256",p.encode(),s.encode(),250000).hex(),s
def register(u,p,l):
 u=u.strip()
 if len(u)<3:raise ValueError("USERNAME_TOO_SHORT")
 if len(p)<6:raise ValueError("PASSWORD_TOO_SHORT")
 h,s=hp(p)
 try:
  with engine.begin() as c:
   uid=c.execute(text("INSERT INTO users(username,password_hash,password_salt,language,created_at) VALUES(:u,:h,:s,:l,:d) RETURNING id"),{"u":u,"h":h,"s":s,"l":l,"d":datetime.now(timezone.utc).isoformat()}).scalar_one()
   for lv in LEVELS:c.execute(text("INSERT INTO level_progress(user_id,level,unlocked) VALUES(:u,:l,:o)"),{"u":uid,"l":lv,"o":1 if lv=="enfant" else 0})
   return uid
 except Exception as e:
  if "unique" in str(e).lower() or "duplicate" in str(e).lower():raise ValueError("USERNAME_EXISTS")
  raise
def login(u,p):
 with engine.connect() as c:r=c.execute(text("SELECT * FROM users WHERE lower(username)=lower(:u)"),{"u":u.strip()}).mappings().first()
 if not r:return None
 h,_=hp(p,r["password_salt"]);return dict(r) if secrets.compare_digest(h,r["password_hash"]) else None
def create_session(uid):
 raw=secrets.token_urlsafe(40);hh=hashlib.sha256(raw.encode()).hexdigest();now=datetime.now(timezone.utc);exp=now+timedelta(days=30)
 with engine.begin() as c:c.execute(text("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(:t,:u,:e,:c)"),{"t":hh,"u":uid,"e":exp.isoformat(),"c":now.isoformat()})
 return raw
def session_user(raw):
 hh=hashlib.sha256(raw.encode()).hexdigest()
 with engine.connect() as c:r=c.execute(text("SELECT user_id FROM sessions WHERE token_hash=:t AND expires_at>:n"),{"t":hh,"n":datetime.now(timezone.utc).isoformat()}).first()
 return r[0] if r else None
def user(uid):
 with engine.connect() as c:r=c.execute(text("SELECT id,username,language,points FROM users WHERE id=:u"),{"u":uid}).mappings().first()
 return dict(r) if r else None
def mastered(uid):
 with engine.connect() as c:rs=c.execute(text("SELECT question_id FROM question_progress WHERE user_id=:u AND mastered=1"),{"u":uid}).all()
 return {r[0] for r in rs}
def unlocked(uid,l):
 with engine.connect() as c:r=c.execute(text("SELECT unlocked FROM level_progress WHERE user_id=:u AND level=:l"),{"u":uid,"l":l}).first()
 return bool(r and r[0])
def unlock(uid,l):
 with engine.begin() as c:c.execute(text("UPDATE level_progress SET unlocked=1 WHERE user_id=:u AND level=:l"),{"u":uid,"l":l})
def answer(uid,qid,ok,pts):
 now=datetime.now(timezone.utc).isoformat()
 with engine.begin() as c:
  r=c.execute(text("SELECT mastered FROM question_progress WHERE user_id=:u AND question_id=:q"),{"u":uid,"q":qid}).first();new=bool(ok and(not r or not r[0]))
  if r:c.execute(text("UPDATE question_progress SET attempts=attempts+1,correct_answers=correct_answers+:v,mastered=CASE WHEN :ok=1 THEN 1 ELSE mastered END,last_played_at=:d WHERE user_id=:u AND question_id=:q"),{"v":1 if ok else 0,"ok":1 if ok else 0,"d":now,"u":uid,"q":qid})
  else:c.execute(text("INSERT INTO question_progress(user_id,question_id,attempts,correct_answers,mastered,last_played_at) VALUES(:u,:q,1,:v,:m,:d)"),{"u":uid,"q":qid,"v":1 if ok else 0,"m":1 if ok else 0,"d":now})
  if ok:c.execute(text("UPDATE users SET points=points+:p WHERE id=:u"),{"p":pts,"u":uid})
 return new

def claim_reward(uid,key,title,points):
 now=datetime.now(timezone.utc).isoformat()
 try:
  with engine.begin() as c:
   c.execute(text("INSERT INTO rewards(user_id,reward_key,title,points,earned_at) VALUES(:u,:k,:t,:p,:d)"),
             {"u":uid,"k":key,"t":title,"p":points,"d":now})
   if points:c.execute(text("UPDATE users SET points=points+:p WHERE id=:u"),{"p":points,"u":uid})
  return True
 except Exception as e:
  if "unique" in str(e).lower() or "duplicate" in str(e).lower():return False
  raise

def rewards(uid):
 with engine.connect() as c:
  rows=c.execute(text("SELECT reward_key,title,points,earned_at FROM rewards WHERE user_id=:u ORDER BY earned_at DESC"),{"u":uid}).mappings().all()
 return [dict(r) for r in rows]
