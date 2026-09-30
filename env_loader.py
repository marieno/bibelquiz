import os
from pathlib import Path
DEFAULT_ENV_FILE=Path(os.getenv("BIBELQUIZ_ENV_FILE","/home/MarieNo/.bibelquiz.env"))
def load_private_env(path=DEFAULT_ENV_FILE):
    if not path.exists(): return False
    for raw in path.read_text(encoding="utf-8").splitlines():
        line=raw.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        key,value=line.split("=",1);key=key.strip();value=value.strip().strip('"').strip("'")
        if key and key not in os.environ: os.environ[key]=value
    return True
