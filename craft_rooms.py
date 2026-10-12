"""Private cooperative rooms; SQLite persistence, server-authoritative revisions."""
import os, sqlite3, secrets, time, threading
from pathlib import Path
DB=Path(os.environ.get('BIBELCRAFT_ROOMS_DB',str(Path(__file__).parent/'data'/'craft_rooms.sqlite3')))
LOCK=threading.RLock()
def connect():
 DB.parent.mkdir(parents=True,exist_ok=True)
 c=sqlite3.connect(DB,timeout=15)
 c.row_factory=sqlite3.Row
 c.execute('PRAGMA busy_timeout=15000')
 c.execute('CREATE TABLE IF NOT EXISTS worlds (code TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, created REAL NOT NULL)')
 c.execute('CREATE TABLE IF NOT EXISTS players (token TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, x REAL DEFAULT 0,z REAL DEFAULT 5, seen REAL NOT NULL)')
 return c
def create(name):
 with LOCK,connect() as c:
  for _ in range(30):
   code=''.join(str(secrets.randbelow(10)) for _ in range(6))
   if not c.execute('SELECT 1 FROM worlds WHERE code=?',(code,)).fetchone():break
  else:raise ValueError('No code available')
  c.execute('INSERT INTO worlds(code,created) VALUES(?,?)',(code,time.time()))
  token=secrets.token_urlsafe(24)
  c.execute('INSERT INTO players(token,code,name,seen) VALUES(?,?,?,?)',(token,code,name,time.time()))
  return {'code':code,'token':token,'player_id':token[:10]}
def join(code,name):
 with LOCK,connect() as c:
  if not c.execute('SELECT 1 FROM worlds WHERE code=?',(code,)).fetchone():raise ValueError('Unknown room')
  count=c.execute('SELECT COUNT(*) FROM players WHERE code=? AND seen>?',(code,time.time()-40)).fetchone()[0]
  if count>=5:raise ValueError('Room full')
  token=secrets.token_urlsafe(24)
  c.execute('INSERT INTO players(token,code,name,seen) VALUES(?,?,?,?)',(token,code,name,time.time()))
  return {'code':code,'token':token,'player_id':token[:10]}
def sync(code,token,x,z):
 with LOCK,connect() as c:
  p=c.execute('SELECT code FROM players WHERE token=? AND code=?',(token,code)).fetchone()
  if not p:raise ValueError('Not a member')
  now=time.time()
  c.execute('UPDATE players SET x=?,z=?,seen=? WHERE token=?',(max(-15,min(15,x)),max(-15,min(15,z)),now,token))
  rows=c.execute('SELECT substr(token,1,10) AS id,name,x,z FROM players WHERE code=? AND seen>?',(code,now-40)).fetchall()
  revision=c.execute('SELECT revision FROM worlds WHERE code=?',(code,)).fetchone()[0]
  return {'revision':revision,'players':[dict(r) for r in rows]}
