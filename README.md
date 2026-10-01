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


## V5.0 – Installable PWA
- Standalone display mode for tablet/phone.
- 192px and 512px BibelQuiz icons.
- Root-scoped service worker with versioned app-shell cache.
- API calls remain network-only so multiplayer/leaderboards stay current.
- Android/Chromium native install prompt when available.
- iPhone/iPad Safari add-to-home-screen guidance.
- Offline fallback to cached application shell; live game/API features still require internet.


## V5.1 – BibelQuiz visual identity
- Branded startup splash screen.
- Original lightweight SVG identity set: Bible/cross logo, dove, ark, crown, fish, scroll.
- Branded animated page journeys replace several generic emoji transitions.
- Dashboard identity strip.
- Crown artwork on multiplayer/result celebrations.
- Identity assets cached by the PWA service worker.


## V5.2 – Account & Authentication
- Existing accounts migrate safely: `display_name` defaults to current username.
- Username stays unique/private and is used for login.
- Display/player name is public in the game and can be changed.
- Email is private and deliberately NOT unique, allowing family/child accounts to share one address.
- New registration is a dedicated screen; opening it no longer submits empty credentials.
- Registration validates player name, username, email, 8-character password and confirmation.
- Account screen supports player-name/language update and password change.
- Recovery UI is present but intentionally disabled until verified SMTP/email delivery is configured.


## V5.3 – Accessibility & Audio
- Browser/device text-to-speech via Web Speech API; no MP3 library required.
- German `de-DE` and French `fr-FR` based on account language.
- Read question + all four answers.
- Individual answer speaker controls.
- Optional automatic reading stored per user.
- Optional slow speech mode stored per user.
- Solo, Weekly Quiz and Multiplayer support.
- Multiplayer speech is local to each device and never changes timer or score.
- Speech stops when moving to another solo/weekly question.


## V5.4 – Secure family account recovery
- Shared family email addresses remain supported.
- Username recovery sends a 30-minute, one-time secure link; account names are revealed only after possession of the email is verified through that link.
- Password recovery requires both email and private username, then sends a 30-minute, one-time reset link.
- Public request endpoints always return the same response to reduce account/email enumeration.
- Recovery tokens are stored only as SHA-256 hashes.
- SMTP credentials come only from environment variables; `.env` stays ignored by Git.
- `.env.example` documents required variables without secrets.


## V5.4-Brevo – HTTPS transactional mail
- SMTP dependency removed.
- Recovery mail uses Brevo `POST https://api.brevo.com/v3/smtp/email`.
- API key is sent only in the `api-key` HTTP header.
- Required environment variables: `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`, `APP_URL`.
- No third-party Python package is required; the integration uses Python's standard HTTPS client.
- Never commit a real API key. `.env` remains ignored.


## V5.4.1 – Private Brevo environment
- Loads `/home/MarieNo/.bibelquiz.env` before importing the Brevo mailer.
- Existing real process environment variables take precedence.
- No dependency such as python-dotenv is required.
- Authenticated `/api/system/mail-status` exposes only booleans, never the API key.


## V5.4.2 – PWA update reliability
- Service worker registered from `/service-worker.js` with root scope.
- HTML, JS and CSS are network-first/no-store; cache is only the offline fallback.
- New worker waits and displays an explicit update banner.
- `JETZT AKTUALISIEREN / ACTUALISER MAINTENANT` activates the new worker and reloads once.
- Worker checks for updates every 15 minutes while the app is open.
- Recovery screens now explicitly mention delivery delay and spam folder.


## V5.4.3 – Recovery diagnostics
- Public recovery responses remain neutral (`{"ok": true}`).
- Server logs now record recovery request state and Brevo outcome.
- Email addresses are represented only by a short SHA-256 marker.
- Tokens and API keys are never logged.
- Brevo message ID presence is logged, not the ID itself.
- Mail helper now returns Brevo's message ID to the server for diagnostic confirmation.


## V5.4.4 – Reliable Recovery
- Brevo delivery retries transient connection/server errors up to three times (0s, 0.6s, 1.5s backoff).
- Permanent 4xx errors (except 429) fail immediately.
- Recovery token is invalidated if all delivery attempts fail.
- Recovery logs remain privacy-preserving and no longer dump full tracebacks for expected delivery failures.
- Includes the missing production recovery logger definition.
