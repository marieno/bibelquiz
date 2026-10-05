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


## V5.4.5 – Email Queue + Worker
- ASGI requests no longer contact Brevo.
- Recovery creates its secure token and queues the complete email in SQLite, then returns immediately.
- `email_worker.py` sends pending messages outside Uvicorn.
- Worker uses the existing reliable Brevo mailer.
- Queue records status, attempts, sent timestamp and last error.
- Failed messages retry up to five worker runs.
- Run manually with `.venv/bin/python email_worker.py`; schedule it separately once validated.


## V5.4.6 – Automatic Recovery Worker
- Recovery queues the email and immediately spawns `email_worker.py` as a detached process.
- The HTTP request does not wait for Brevo.
- Worker uses the proven console/subprocess network path.
- A short-lived lock file prevents request bursts from spawning multiple workers.
- Worker removes the lock when it exits.
- Queue remains the source of truth: transient failures stay pending for later retry.
- The temporary `/api/system/subprocess-test` diagnostic endpoint is not included in this release.


## V5.4.7 – External free email worker
- SQLite remains the production database.
- Web requests only enqueue recovery mail; no Brevo/subprocess call from Uvicorn.
- Private queue API is protected by `EMAIL_WORKER_SECRET`.
- GitHub Actions polls every 5 minutes, sends through Brevo, then reports `sent`/`failed`.
- Required GitHub Actions secrets: `BIBELQUIZ_URL`, `EMAIL_WORKER_SECRET`, `BREVO_API_KEY`, `BREVO_FROM_EMAIL`.
- `EMAIL_WORKER_SECRET` must also exist in `/home/MarieNo/.bibelquiz.env`.


## V5.4.8 – Editable family email
- `Mein Konto / Mon compte` can edit the family recovery email.
- Email remains non-unique: siblings/parents may share one address.
- Login username remains read-only/private.
- Saving account settings updates display name, language and recovery email together.
- Existing external GitHub/Brevo email worker remains unchanged.


## V5.5 – Group Game Levels
Host selects the group difficulty before creating the room:
- `enfant` → Kinder / Enfant
- `facile` → Einfach / Facile
- `moyen` → Mittel / Moyen
- `difficile` → Schwer / Difficile
- `alle` → all levels

Each game still has exactly 10 questions. `alle` is balanced as 3 enfant + 3 facile + 2 moyen + 2 difficile, shuffled afterward. The selected difficulty is visible in the lobby/game/podium and stored in multiplayer history. Group levels are independent of Solo unlock progress.


## V5.5.1 – Dashboard cleanup
- Removed the decorative `Wort / Abenteuer / Frieden / Erfolg` identity tiles.
- Added a compact logout action to the top of the dashboard.
- Existing account/game functionality is unchanged.


## V6.0 – BibelRennen prototype
Integrated solo racing prototype, isolated under `/static/race/`.
- Touch left/right driving on phone/tablet.
- Four existing question levels.
- Track pickups: Bible questions and stars.
- A/B/C/D only; no free-text answers.
- DE/FR speech synthesis for question + choices.
- Correct answer: +100 and 3-second turbo.
- Star pickup: +20.
- Finish bonus: +100.
- Dashboard entry added.
This prototype intentionally has no multiplayer persistence yet. Its purpose is to validate driving, question interruption, audio and scoring before building 2–5 player synchronization.


## V6.1 – Real Driving & Finish Progression
- Hold ▲ to accelerate; releasing it causes natural deceleration.
- Hold ▼ to brake harder.
- ◀/▶ change lanes.
- Real-time km/h display, with 125 km/h normal maximum.
- Correct Bible answer still grants a 3-second turbo, now pushing speed toward ~145–165 km/h.
- START→ZIEL mini-map shows the car moving along the route.
- From halfway onward a distance-to-finish sign appears.
- From ~82% onward the finish gate becomes visible and approaches on the road.
- Question pickup reduces momentum, so the player must accelerate again after answering.


## V6.1.1 – Mobile-safe race controls
- Driving controls are fixed above the phone safe-area/navigation bar.
- All four controls remain visible: left, right, brake and accelerator.
- Accelerator is explicitly labelled `▲ GAS`; brake `▼ FREIN`.
- Car position is raised on short/mobile displays so controls never cover it.
- Added extra bottom track space for phone aspect ratios.


## V6.1.2 – Reliable touch pedals
- Accelerator/brake use explicit non-passive touch/pointer listeners.
- Browser gestures are disabled on pedals only.
- Pressing GAS immediately gives visible speed feedback and holding accelerates.
- Pressing FREIN immediately reduces speed and holding brakes strongly.
- Active pedals visibly change state while held.


## V6.1.3 – Continuous acceleration and explicit finish distance
- Driving loop reads the actual held state of GAS/BRAKE every animation frame.
- GAS acceleration strengthened and should climb continuously while held.
- Progress HUD now shows exact meters remaining and percentage.
- Road signs appear from 25% onward with 750/500/250/100m milestones.
- Finish gate appears from 75%, grows and moves toward the player as ZIEL approaches.


## V6.1.5 – Mobile race diagnostic
Temporary on-screen telemetry: animation frame count, running flag, GAS state, brake state, speed and dt. Runtime JavaScript errors are rendered in red directly on the race screen. This build is for diagnosis only and should be removed after the mobile loop issue is identified.


## V6.1.6 – Speed loop fix
- Explicit `MAX_SPEED=125` and `TRACK=1000` declarations.
- Fixes the frame-1 `ReferenceError` that stopped acceleration and distance progression.
- Diagnostic overlay hidden for normal play.


## V6.2 – BibelRennen Multiplayer (first playable slice)
- 2–5 authenticated players per race room.
- Host creates a six-digit room and selects Kinder/Einfach/Mittel/Schwer/Alle.
- Players join by code, select a car and mark Ready.
- Host starts only when at least 2 players are present and all are ready.
- Same 10-question set is shared by the room.
- Each phone renders driving locally; distance/speed/score/lane are synchronized every ~800ms.
- Other racers are rendered relative to the local player's progress.
- Finish order gives secondary bonuses: 100/70/50/30/20.
- Final winner is sorted by total points, not arrival order.
This is the first multiplayer race slice; anti-cheat/server-authoritative scoring and richer track visuals remain later work.


## V6.3 – Live Racers
- Nearby opponents are visibly rendered on the same road relative to the local racer.
- Every opponent has player name, selected car color cue and live meter gap.
- CSS interpolation smooths the ~800ms network updates.
- A compact LIVE board shows track order, progress percentage and current Bible points.
- Racers more than 150m away remain visible as ▲ ahead / ▼ behind indicators.
- LIVE order is explicitly track position only; final podium remains total-points based.


## V6.3.1 – Host start synchronization
- Lobby clients poll room status every ~700ms.
- `status=playing` immediately transitions every joined device into the race.
- Host and guests use the same race-entry path.
- Guests see `Das Rennen startet… / La course démarre…` during transition.
- Shared room questions are fetched before the local race loop starts.
- Transition guard prevents duplicate race starts from overlapping poll requests.


## V6.4 – Clean BibelRennen flow
State flow is now explicit: Mode Select → Solo Setup OR Multiplayer Create/Join → Lobby → Host Start → Starting → Racing → Finished.
- Multiplayer create button is `RAUM ERSTELLEN`, never `Rennen starten`.
- Only the actual host sees `RENNEN STARTEN` in the lobby.
- Guests only have Ready/Cancel Ready and wait for the host.
- Car selection is independent from Ready state.
- All guests auto-transition when room status changes to `playing`.
- Removed the previous menu monkey-patching that could leave duplicate start affordances.


## V6.6 – Unified Group Lobby
One multiplayer entry and one room code for both Quiz and BibelRennen.
- Host alone chooses game type (`quiz` or `race`) and difficulty before creating the group.
- Guest only enters the six-digit code.
- Lobby exposes game type/level as read-only to guests.
- Race guests choose car and Ready; quiz guests only Ready.
- Only host receives the start action; server also enforces HOST_ONLY.
- Host start changes the shared room to playing; guests auto-transition.
- Race launches from the same group code via `/static/race/index.html?group=CODE`.


## V6.6.1 – Game selector fix
- Quiz is the real default game type on every Group creation screen.
- Quiz is visibly selected by default.
- Clicking BibelRennen/Quiz updates a single explicit global selector state.
- Group creation validates and defaults game type to quiz and difficulty to enfant.
- Prevents stale/redeclared JavaScript state from blocking group creation.


## V6.7.1 – Consolidated unified multiplayer build
Consolidates all validated manual fixes plus live race synchronization:
- GroupCreate carries game_type + difficulty with Quiz/Kinder defaults.
- create_room persists game_type.
- set_ready supports car.
- groupLevelLabel restored.
- host-only start remains enforced.
- unified race sync, visible opponents, LIVE board, 20-second finish window, DNF and common final ranking.
- `/api/version` returns 6.7.1.
- Group screen visibly shows V6.7.1.
- Service worker cache: bibelquiz-v6-7-1-consolidated.
