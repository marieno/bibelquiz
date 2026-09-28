# BibelQuiz Web / PWA

## Installation (Windows PowerShell)

```powershell
cd bibelquiz_web
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

PC: http://127.0.0.1:8000

### Handy / Tablet im selben WLAN
1. Auf Windows `ipconfig` ausführen.
2. Die IPv4-Adresse des PCs suchen, z.B. `192.168.1.25`.
3. Auf Handy/Tablet öffnen: `http://192.168.1.25:8000`
4. Falls Windows Firewall fragt: Zugriff für privates Netzwerk erlauben.

Hinweis: Für echte Nutzung übers Internet später HTTPS + PostgreSQL + persistente Sessions einsetzen.
