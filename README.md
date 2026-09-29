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


## V4.2-B/C – Multiplayer Game
- Host starts when 2–5 players are ready.
- Same 10 random questions for everyone, drawn from the full question bank.
- Server-authoritative 15-second timer.
- One answer per player per question.
- Correct answer: 100 base points + speed bonus 0–50.
- Answers are hidden until everyone answers or time expires.
- Intermediate leaderboard after each reveal.
- Host advances the room.
- Final podium after question 10.


## V4.2-D – Persistent multiplayer profile
- Finished games are persisted once.
- Stats: games, wins, podiums, fastest correct answer.
- Last 10 multiplayer results.
- Unique multiplayer badges and point rewards:
  - First group game +25
  - First win +50
  - 3 wins +100
  - 10 wins +250
  - 5 podiums +100
  - Correct answer within 3 seconds +75


## V4.2-E – Host UX
- Reveal happens automatically when all players answer or the 15-second timer expires.
- Host receives a large sticky/fixed bottom action panel after reveal.
- Questions 1–9: `NÄCHSTE FRAGE / QUESTION SUIVANTE`.
- Question 10: `ENDERGEBNIS ANZEIGEN / AFFICHER LE RÉSULTAT`.
- Non-host players see an explicit waiting-for-host panel.
- Faster polling makes reveal transitions clearer on phones.


## V4.2-F – Multiplayer corrective release
- Server explicitly returns `is_host` and `host_name`.
- Client no longer infers host role from JavaScript ID comparisons.
- Host name is visible during the game.
- Only the host receives the next-question/final-result control.
- Other players see the host's actual name while waiting.
- Player answer state is private: only "your answer is saved" is shown before reveal.
- Multiplayer profile now shows an explicit error screen if its API cannot load.


## V4.2-G – Multiplayer profile route fix
The personal multiplayer profile endpoints no longer live below the dynamic room-code route.
- `GET /api/multiplayer/profile`
- `POST /api/multiplayer/claim-badges`
This prevents `profile` from being interpreted as a room code.
