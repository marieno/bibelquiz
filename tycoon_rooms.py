"""Server-authoritative private rooms for Bible Tycoon."""
import json, os, secrets, sqlite3, threading, time
from pathlib import Path
from fastapi import HTTPException
DB=Path(os.environ.get('BIBELQUIZ_TYCOON_DB',str(Path(__file__).resolve().parent/'data'/'tycoon_rooms.sqlite3')))
LOCK=threading.RLock()
COST={'house':(30,3),'farm':(25,2),'well':(45,4),'market':(65,6),'garden':(20,1),'coop':(35,3),'pen':(40,4)}
def fresh():return {'coins':150,'wood':25,'food':15,'helped':0,'grid':[None]*64,'harvests':0,'crops':{},'animalsFed':0,'quests':{},'visitors':0,'community':0}
def connect():
 DB.parent.mkdir(parents=True,exist_ok=True)
 c=sqlite3.connect(DB,timeout=10);c.execute('PRAGMA busy_timeout=10000');c.execute('CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY, state TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, created REAL NOT NULL)');c.execute('CREATE TABLE IF NOT EXISTS members(token TEXT PRIMARY KEY,code TEXT NOT NULL,name TEXT NOT NULL,seen REAL NOT NULL)');return c
def clean(c):c.execute('DELETE FROM members WHERE seen<?',(time.time()-90,))
def room(c,code):
 r=c.execute('SELECT state,revision FROM rooms WHERE code=?',(code,)).fetchone()
 if not r:raise HTTPException(404,'ROOM_NOT_FOUND')
 return json.loads(r[0]),r[1]
def member(c,token):
 r=c.execute('SELECT code,name FROM members WHERE token=?',(token,)).fetchone()
 if not r:raise HTTPException(403,'SESSION_EXPIRED')
 c.execute('UPDATE members SET seen=? WHERE token=?',(time.time(),token));return r

def create(name):
 name=name.strip()[:24]
 if not name:raise HTTPException(400,'NAME_REQUIRED')
 with LOCK,connect() as c:
  clean(c)
  for _ in range(20):
   code=f'{secrets.randbelow(1000000):06d}'
   if not c.execute('SELECT 1 FROM rooms WHERE code=?',(code,)).fetchone():break
  else:raise HTTPException(503,'NO_ROOM_CODE')
  token=secrets.token_urlsafe(24)
  c.execute('INSERT INTO rooms VALUES(?,?,?,?)',(code,json.dumps(fresh()),0,time.time()))
  c.execute('INSERT INTO members VALUES(?,?,?,?)',(token,code,name,time.time()))
  return {'code':code,'token':token,'state':fresh(),'revision':0,'players':[name]}
def join(code,name):
 name=name.strip()[:24];code=code.strip()
 if not name or len(code)!=6 or not code.isdigit():raise HTTPException(400,'INVALID_JOIN')
 with LOCK,connect() as c:
  c.execute('BEGIN IMMEDIATE');clean(c);state,rev=room(c,code)
  if c.execute('SELECT COUNT(*) FROM members WHERE code=?',(code,)).fetchone()[0]>=5:raise HTTPException(409,'ROOM_FULL')
  token=secrets.token_urlsafe(24);c.execute('INSERT INTO members VALUES(?,?,?,?)',(token,code,name,time.time()))
  return {'code':code,'token':token,'state':state,'revision':rev,'players':players(c,code)}
def players(c,code):return [x[0] for x in c.execute('SELECT name FROM members WHERE code=? ORDER BY seen DESC',(code,)).fetchall()]
def snapshot(token):
 with LOCK,connect() as c:
  clean(c);code,_=member(c,token);state,rev=room(c,code)
  return {'code':code,'state':state,'revision':rev,'players':players(c,code)}
def action(token,kind,cell=None,building=None,quest=None):
 with LOCK,connect() as c:
  c.execute('BEGIN IMMEDIATE');clean(c);code,_=member(c,token);s,rev=room(c,code)
  count=lambda k:s['grid'].count(k)
  def require(ok,message='REQUIREMENTS_NOT_MET'):
   if not ok:raise HTTPException(409,message)
  if kind=='build':
   require(type(cell)==int and 0<=cell<64 and building in COST,'INVALID_BUILD');require(s['grid'][cell] is None,'OCCUPIED')
   coins,wood=COST[building];require(s['coins']>=coins and s['wood']>=wood,'INSUFFICIENT_RESOURCES');s['coins']-=coins;s['wood']-=wood;s['grid'][cell]=building
   if building=='farm':s['crops'][str(cell)]=int(time.time()*1000)
  elif kind=='harvest':
   ready=[str(i) for i,v in enumerate(s['grid']) if v=='farm' and int(time.time()*1000)-s['crops'].get(str(i),int(time.time()*1000))>=30000]
   require(ready,'CROPS_GROWING')
   for i in ready:s['crops'][i]=int(time.time()*1000)
   s['food']+=15*len(ready);s['wood']+=2*len(ready);s['harvests']+=len(ready)
  elif kind=='feed':
   require(count('coop')+count('pen')>0 and s['food']>=5);s['food']-=5;s['animalsFed']+=1;s['coins']+=5+(5 if count('market') else 0)
  elif kind=='sell':
   require(s['food']>=10);s['food']-=10;s['coins']+=20+(10 if count('market') else 0)
  elif kind=='share':
   require(s['food']>=10 and count('house')>=1);s['food']-=10;s['helped']+=1;s['coins']+=10
  elif kind=='welcome':
   require(count('house')>=2 and count('well')>=1 and s['food']>=5);s['food']-=5;s['visitors']+=1
  elif kind=='festival':
   require(count('market')>=1 and s['helped']>=6 and s['food']>=15);s['food']-=15;s['community']+=1
  elif kind=='claim':
   checks={'welcome':count('house')>=2 and count('farm')>=1 and count('well')>=1 and s['helped']>=2,'harvest':s['harvests']>=3 and s['helped']>=4,'animals':count('coop')+count('pen')>=1 and s['animalsFed']>=5,'travelers':s['visitors']>=3,'festival':s['community']>=1}
   require(quest in checks and checks[quest] and not s['quests'].get(quest));s['quests'][quest]=True;s['coins']+=30;s['wood']+=5
  else:raise HTTPException(400,'UNKNOWN_ACTION')
  rev+=1;c.execute('UPDATE rooms SET state=?,revision=? WHERE code=?',(json.dumps(s),rev,code))
  return {'code':code,'state':s,'revision':rev,'players':players(c,code)}
