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


## V3 – animations & gamification
- Animated page transitions and flying Bible-themed emoji objects.
- Confetti on correct answers and victories.
- Persistent milestone rewards stored in the database.
- Milestones: 5, 10, 25, 50, 100 mastered questions.
- Category completion bonus: +50 points.
- Level completion bonus: +150 points.
- Rewards are unique and cannot be claimed twice.
- Absolute SQLite path for PythonAnywhere.


## V4.1 – Quiz der Woche
Place one weekly JSON in `weekly/`. Exactly one should have `"active": true`.
The first completed attempt is ranked; later attempts are practice.
Weekly rewards: participation +20, 7/10 +30, 9/10 +50, 10/10 +100.


## V4.2-A – Group Lobby
- Create a six-digit room.
- Join by code.
- 2–5 authenticated players.
- Host crown and host migration if host leaves.
- Ready/not-ready state.
- Lobby refreshes automatically.
- Start button is intentionally disabled until V4.2-B game synchronization is added.
