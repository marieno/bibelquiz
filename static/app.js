const A=document.querySelector("#app");let token=localStorage.token||"",me=null,prog=null,rewardHistory=[],weekly=null,groupCode="",groupPoll=null,weeklyRun="",weeklyQuestions=[],weeklyIdx=0,weeklyGood=0,lang="de",round=[],idx=0,good=0,level="",cat="";
const names={enfant:["Kinder","Enfant"],facile:["Einfach","Facile"],moyen:["Mittel","Moyen"],difficile:["Schwierig","Difficile"]};
const cats={creation:["Schöpfung","Création"],personnes:["Personen","Personnages"],jesus:["Jesus","Jésus"],miracles:["Wunder","Miracles"],general:["Bibelwissen","Bible générale"],ancien_testament:["Altes Testament","Ancien Testament"],nouveau_testament:["Neues Testament","Nouveau Testament"],rois:["Könige","Rois"],apotres:["Apostel","Apôtres"],moise_exode:["Mose & Exodus","Moïse & Exode"],prophetes:["Propheten","Prophètes"],paraboles:["Gleichnisse","Paraboles"],rois_royaumes:["Könige & Reiche","Rois & royaumes"],eglise_primitive:["Frühe Kirche","Église primitive"],epitres:["Briefe","Épîtres"],chronologie:["Chronologie","Chronologie"],connaissance:["Bibelwissen","Connaissance biblique"]};
const FX=document.querySelector("#fx");
const IDENTITY="/static/identity/";
function brandJourney(kind){
 const map={dashboard:"dove.svg",levels:"scroll.svg",categories:"fish.svg",group:"ark.svg",weekly:"scroll.svg",victory:"crown.svg"};
 let scene=document.querySelector("#transitionScene");if(!scene)return;
 scene.innerHTML=`<img src="${IDENTITY+(map[kind]||"dove.svg")}" alt="">`;scene.classList.remove("play");void scene.offsetWidth;scene.classList.add("play");setTimeout(()=>{scene.classList.remove("play");scene.innerHTML=""},760)
}
window.addEventListener("load",()=>setTimeout(()=>document.querySelector("#splash")?.classList.add("hide"),950));

function fly(symbol){
  let e=document.createElement("div");e.className="float-object";e.textContent=symbol||["📖","⭐","🕊️","🌈","✨"][Math.floor(Math.random()*5)];
  e.style.top=(12+Math.random()*65)+"vh";FX.appendChild(e);setTimeout(()=>e.remove(),1200);
}
function confetti(){
  for(let i=0;i<18;i++){let e=document.createElement("span");e.className="confetti";e.textContent=["⭐","✨","🎉","💛","🌟"][i%5];e.style.left=(Math.random()*100)+"vw";e.style.animationDelay=(Math.random()*.35)+"s";FX.appendChild(e);setTimeout(()=>e.remove(),2200)}
}
function rewardPopup(r){
  confetti();let d=document.createElement("div");d.className="reward-pop";
  d.innerHTML=`<div class=big>${r.emoji||"🎁"}</div><h2>${lang==="de"?"Meilenstein erreicht!":"Étape accomplie !"}</h2><p>${r.title}</p><div class=bonus>+${r.points} ⭐</div><button class="btn green full">${lang==="de"?"SUPER!":"GÉNIAL !"}</button>`;
  d.querySelector("button").onclick=()=>d.remove();document.body.appendChild(d)
}
function showRewards(list){if(!list||!list.length)return;let i=0;function next(){if(i>=list.length)return;rewardPopup(list[i++]);let btn=document.querySelector(".reward-pop button");btn.onclick=()=>{btn.closest(".reward-pop").remove();setTimeout(next,120)}}next()}
const L=(x)=>x[lang==="de"?0:1], esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
async function api(url,opt={}){opt.headers={...(opt.headers||{}),...(token?{Authorization:"Bearer "+token}:{}),"Content-Type":"application/json"};let r=await fetch(url,opt);let j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.detail||r.status);return j}
function back(fn){return `<button class="btn ghost" onclick="${fn}">← ${lang==="de"?"Zurück":"Retour"}</button>`}
function auth(){
 A.innerHTML=`<div class=wrap><div class="card auth"><div class=logo><img src="/static/identity/logo.svg" style="width:120px;border-radius:20px"><br>BibelQuiz</div><div class=sub>Wissen • Spielen • Wachsen</div>
 <input id=u autocomplete=username placeholder="Benutzername / Nom d'utilisateur">
 <input id=p autocomplete=current-password type=password placeholder="Passwort / Mot de passe">
 <button class="btn full" onclick="login()">ANMELDEN / SE CONNECTER</button>
 <div style="display:flex;justify-content:space-between;margin-top:12px"><button class="btn ghost" onclick="recoveryInfo('password')">Passwort vergessen?</button><button class="btn ghost" onclick="recoveryInfo('username')">Benutzername vergessen?</button></div>
 <hr style="margin:22px 0;border:0;border-top:1px solid var(--line)">
 <p style="text-align:center">Noch kein Konto? / Pas encore de compte ?</p>
 <button class="btn green full" onclick="registerView()">NEUES KONTO ERSTELLEN / CRÉER UN COMPTE</button><p id=msg></p></div></div>`
}
function registerView(){
 A.innerHTML=`<div class=wrap><div class="card auth">${back("auth()")}<h1>Neues Konto / Nouveau compte</h1>
 <label>Spielername / Nom de joueur</label><input id=rd placeholder="Spoda"><small>So wirst du im Spiel genannt. / Nom affiché dans le jeu.</small>
 <label>Benutzername / Identifiant</label><input id=ru autocomplete=username placeholder="marie1985"><small>Mindestens 3 Zeichen • nur für die Anmeldung.</small>
 <label>E-Mail</label><input id=re type=email autocomplete=email placeholder="familie@example.com"><small>Eine E-Mail darf für mehrere Konten verwendet werden.</small>
 <label>Passwort / Mot de passe</label><input id=rp type=password autocomplete=new-password placeholder="Mindestens 8 Zeichen">
 <label>Passwort bestätigen / Confirmer</label><input id=rp2 type=password autocomplete=new-password placeholder="••••••••">
 <label>Sprache / Langue</label><select id=rl style="width:100%;padding:14px;border-radius:14px;border:1px solid var(--line);margin:7px 0"><option value=de>Deutsch</option><option value=fr>Français</option></select>
 <div id=rchecks style="margin:12px 0"></div><button class="btn green full" onclick="register()">KONTO ERSTELLEN / CRÉER LE COMPTE</button><p id=rmsg></p></div></div>`;
 ["rd","ru","re","rp","rp2"].forEach(id=>document.getElementById(id).addEventListener("input",registerChecks));registerChecks()
}
function registerChecks(){
 let okName=rd.value.trim().length>=2,okUser=ru.value.trim().length>=3,okMail=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(re.value.trim()),okPw=rp.value.length>=8,okSame=rp.value&&rp.value===rp2.value;
 rchecks.innerHTML=`<p>${okName?"✅":"○"} Spielername</p><p>${okUser?"✅":"○"} Benutzername ≥ 3</p><p>${okMail?"✅":"○"} E-Mail</p><p>${okPw?"✅":"○"} Passwort ≥ 8</p><p>${okSame?"✅":"○"} Passwörter stimmen überein</p>`;
 return okName&&okUser&&okMail&&okPw&&okSame
}
async function login(){try{let x=await api("/api/login",{method:"POST",body:JSON.stringify({username:u.value,password:p.value})});token=x.token;localStorage.token=token;await load()}catch(e){msg.textContent="Benutzername oder Passwort falsch. / Identifiant ou mot de passe incorrect."}}
async function register(){
 if(!registerChecks()){rmsg.textContent="Bitte alle Angaben prüfen. / Vérifie les informations.";return}
 try{let x=await api("/api/register",{method:"POST",body:JSON.stringify({username:ru.value.trim(),display_name:rd.value.trim(),email:re.value.trim(),password:rp.value,language:rl.value})});token=x.token;localStorage.token=token;await load()}
 catch(e){let m={"USERNAME_EXISTS":"Dieser Benutzername ist bereits vergeben. / Cet identifiant est déjà utilisé.","USERNAME_TOO_SHORT":"Benutzername: mindestens 3 Zeichen.","PASSWORD_TOO_SHORT":"Passwort: mindestens 8 Zeichen.","DISPLAY_NAME_TOO_SHORT":"Spielername ist zu kurz."};rmsg.textContent=m[e.message]||e.message}
}
function recoveryInfo(kind){
 if(kind==="username"){
  A.innerHTML=`<div class=wrap><div class="card auth">${back("auth()")}<h1>👤 Benutzername vergessen?</h1><p>Gib die Familien-E-Mail ein. Wir senden einen sicheren Link. / Entre l’e-mail familial. Nous envoyons un lien sécurisé.</p><input id=recEmail type=email placeholder="familie@example.com"><button class="btn green full" onclick="requestUsernames()">✉️ SENDEN / ENVOYER</button><p id=recMsg></p></div></div>`
 }else{
  A.innerHTML=`<div class=wrap><div class="card auth">${back("auth()")}<h1>🔑 Passwort vergessen?</h1><p>E-Mail + Benutzername des Kontos. / E-mail + identifiant du compte.</p><input id=recEmail type=email placeholder="familie@example.com"><input id=recUser placeholder="Benutzername / Identifiant"><button class="btn green full" onclick="requestPassword()">✉️ RESET-LINK SENDEN</button><p id=recMsg></p></div></div>`
 }
}
async function requestUsernames(){await api("/api/recovery/usernames/request",{method:"POST",body:JSON.stringify({email:recEmail.value.trim()})});recMsg.innerHTML="✉️ <b>E-Mail angefordert / E-mail demandée</b><br>Wenn die Adresse registriert ist, erhältst du in wenigen Sekunden eine E-Mail. Bitte auch Spam prüfen.<br>Si l’adresse est enregistrée, tu recevras un e-mail dans quelques secondes. Vérifie aussi les spams."}
async function requestPassword(){await api("/api/recovery/password/request",{method:"POST",body:JSON.stringify({email:recEmail.value.trim(),username:recUser.value.trim()})});recMsg.innerHTML="✉️ <b>Reset-Link angefordert / Lien demandé</b><br>Wenn die Angaben stimmen, erhältst du in wenigen Sekunden eine E-Mail. Bitte auch Spam prüfen.<br>Si les informations correspondent, tu recevras un e-mail dans quelques secondes. Vérifie aussi les spams."}
async function handleRecoveryLink(){
 let q=new URLSearchParams(location.search),type=q.get("recovery"),tok=q.get("token");if(!type||!tok)return false;
 if(type==="usernames"){
  try{let x=await api("/api/recovery/usernames/verify",{method:"POST",body:JSON.stringify({token:tok})});A.innerHTML=`<div class=wrap><div class="card auth"><h1>👤 BibelQuiz Konten</h1>${x.accounts.map(a=>`<div class=card style="margin:8px 0"><b>${esc(a.display_name)}</b><br><small>${esc(a.username)}</small></div>`).join("")}<button class="btn green full" onclick="history.replaceState({},'',location.pathname);auth()">ANMELDEN</button></div></div>`}catch(e){recoveryInvalid()}return true
 }
 if(type==="password"){A.innerHTML=`<div class=wrap><div class="card auth"><h1>🔑 Neues Passwort</h1><input id=np1 type=password placeholder="Mindestens 8 Zeichen"><input id=np2 type=password placeholder="Passwort bestätigen"><button class="btn green full" onclick="finishPasswordReset('${tok}')">PASSWORT SPEICHERN</button><p id=resetMsg></p></div></div>`;return true}
 return false
}
async function finishPasswordReset(tok){if(np1.value.length<8){resetMsg.textContent="Mindestens 8 Zeichen.";return}if(np1.value!==np2.value){resetMsg.textContent="Passwörter stimmen nicht überein.";return}try{await api("/api/recovery/password/reset",{method:"POST",body:JSON.stringify({token:tok,new_password:np1.value})});history.replaceState({},'',location.pathname);A.innerHTML=`<div class=wrap><div class="card auth"><h1>✓ Passwort geändert</h1><button class="btn green full" onclick="auth()">ANMELDEN</button></div></div>`}catch(e){recoveryInvalid()}}
function recoveryInvalid(){A.innerHTML=`<div class=wrap><div class="card auth"><h1>⚠️ Link ungültig / Lien invalide</h1><p>Der Link ist abgelaufen oder wurde bereits verwendet. / Le lien a expiré ou a déjà été utilisé.</p><button class="btn full" onclick="history.replaceState({},'',location.pathname);auth()">ZURÜCK</button></div></div>`}
async function load(){try{let x=await api("/api/me");me=x.user;prog=x.progress;rewardHistory=x.rewards||[];lang=me.language;dashboard()}catch(e){token="";localStorage.removeItem("token");auth()}}
function dashboard(){brandJourney("dashboard");let active="enfant";for(let l of Object.keys(prog))if(prog[l].unlocked)active=l;let p=prog[active],pct=Math.round(100*p.done/p.total);
A.innerHTML=`<div class=wrap><div class=top><div class=brand-mark><img src="/static/identity/logo.svg" alt=""><h2 class=brand-title>BibelQuiz</h2></div><button class="btn ghost top-logout" onclick="logout()">🚪 ${lang==="de"?"Abmelden":"Déconnexion"}</button><b>${esc(me.display_name||me.username)} ⭐ ${me.points}</b></div><div class="card hero"><h1>${lang==="de"?"Willkommen zurück":"Bienvenue"}, ${esc(me.display_name||me.username)}! 👋</h1><p>${lang==="de"?"Schön, dass du da bist!":"Heureux de te revoir !"}</p></div><div class=card><h3>${lang==="de"?"Aktuelles Level":"Niveau actuel"}: ${L(names[active])}</h3><div class=progress><i style="width:${pct}%"></i></div><p>${p.done}/${p.total} • ${pct}%</p><button class="btn green" onclick="levels()">▶ ${lang==="de"?"WEITERSPIELEN":"CONTINUER"}</button></div><h2>${lang==="de"?"Alle Level":"Tous les niveaux"}</h2><div class=levels>${Object.keys(prog).map(l=>`<div class="card level ${prog[l].unlocked?"":"locked"}"><h3>${prog[l].unlocked?"🔓":"🔒"} ${L(names[l])}</h3><p>${prog[l].done}/${prog[l].total}</p>${prog[l].unlocked?`<button class=btn onclick="categories('${l}')">${lang==="de"?"Spielen":"Jouer"}</button>`:""}</div>`).join("")}</div><div class="card" style="margin-top:16px;background:#dff5e0"><h2>👥 ${lang==="de"?"Gruppenspiel":"Jeu en groupe"}</h2><p>${lang==="de"?"Erstelle eine Lobby oder tritt mit einem 6-stelligen Code bei. Maximal 5 Spieler.":"Crée un salon ou rejoins-le avec un code à 6 chiffres. Maximum 5 joueurs."}</p><button class="btn" onclick="groupHome()">👥 ${lang==="de"?"GRUPPE":"GROUPE"}</button> <button class="btn ghost" onclick="groupProfile()">🏆 ${lang==="de"?"MEIN PROFIL":"MON PROFIL"}</button></div><div class="card" style="margin-top:16px;background:#fff1b8"><h2>⭐ ${lang==="de"?"Quiz der Woche":"Quiz de la semaine"}</h2><p>${lang==="de"?"10 neue Fragen • Wochenrangliste • Belohnungen":"10 nouvelles questions • classement • récompenses"}</p><button class="btn green" onclick="weeklyHome()">⭐ ${lang==="de"?"JETZT SPIELEN":"JOUER"}</button></div><div class="card" style="margin-top:16px"><h3>🎖️ ${lang==="de"?"Meine Meilensteine":"Mes récompenses"}</h3><div class=milestone-track>${[5,10,25,50,100].map(n=>`<div class="milestone ${Object.values(prog).reduce((a,x)=>a+x.done,0)>=n?"done":""}">${Object.values(prog).reduce((a,x)=>a+x.done,0)>=n?"⭐":"○"}<br>${n}</div>`).join("")}</div><div class=badges style="margin-top:12px">${rewardHistory.slice(0,6).map(r=>`<span class=badge>${esc(r.title)}</span>`).join("")||`<span style="color:var(--muted)">${lang==="de"?"Dein erstes Abzeichen wartet auf dich!":"Ton premier badge t’attend !"}</span>`}</div></div><p><button class="btn ghost" onclick="progressView()">📊 ${lang==="de"?"Fortschritt":"Progression"}</button> <button class="btn ghost" onclick="accountView()">👤 ${lang==="de"?"Mein Konto":"Mon compte"}</button> <button class="btn ghost" onclick="logout()">🚪 Logout</button></p></div>`}
function levels(){brandJourney("levels");A.innerHTML=`<div class=wrap>${back("dashboard()")}<h1>${lang==="de"?"Wähle dein Level":"Choisis ton niveau"}</h1><div class=levels>${Object.keys(prog).map(l=>`<div class="card level ${prog[l].unlocked?"":"locked"}"><h2>${prog[l].unlocked?"🔓":"🔒"} ${L(names[l])}</h2><p>${prog[l].done}/${prog[l].total}</p>${prog[l].unlocked?`<button class=btn onclick="categories('${l}')">▶</button>`:""}</div>`).join("")}</div></div>`}
function categories(l){brandJourney("categories");level=l;let cs=prog[l].categories;A.innerHTML=`<div class=wrap>${back("levels()")}<h1>${L(names[l])}</h1><div class=cats>${Object.keys(cs).map(c=>{let x=cs[c],pc=Math.round(100*x.done/x.total);return `<div class="card cat"><h3>${L(cats[c]||[c,c])}</h3><div class=progress><i style="width:${pc}%"></i></div><p>${x.done}/${x.total}</p><button class=btn onclick="start('${c}')">▶ ${lang==="de"?"Spielen":"Jouer"}</button></div>`}).join("")}</div></div>`}
async function start(c){fly("⭐");cat=c;round=await api(`/api/round/${level}/${c}`);idx=0;good=0;question()}
function question(){if(idx>=round.length)return result();stopSpeech();let q=round[idx],r=q.reponses[lang];A.innerHTML=`<div class=wrap><div class=top>${back(`categories('${level}')`)}<b>⭐ ${me.points}</b></div><p class=pill>${L(names[level])} • ${L(cats[cat]||[cat,cat])}</p><div class=progress><i style="width:${100*(idx+1)/round.length}%"></i></div><p>${lang==="de"?"Frage":"Question"} ${idx+1}/${round.length}</p><div class="card question">${esc(q.question[lang])}</div>${audioQuestionTools(q)}<div class=answers>${["A","B","C","D"].map(x=>`<div class=answer-row><button id=a${x} class="btn answer has-audio" onclick="answer('${x}')"><b>${x}</b>&nbsp;&nbsp; ${esc(r[x])}</button>${audioAnswerButton(x,r[x])}</div>`).join("")}</div><div id=fb></div><div id=nxt></div></div>`;maybeAutoSpeak(q)}
async function answer(choice){document.querySelectorAll(".answer").forEach(b=>b.disabled=true);let q=round[idx],x=await api("/api/answer",{method:"POST",body:JSON.stringify({question_id:q.id,choice})});me=x.user;prog=x.progress;if(x.rewards&&x.rewards.length){rewardHistory=[...x.rewards,...rewardHistory]}if(x.correct){good++;confetti();document.querySelector("#a"+choice).classList.add("good");fb.innerHTML=`<div class="feedback" style="background:#dff6df">🎉 ${lang==="de"?"Richtig!":"Bonne réponse !"} +${q.points}</div>`}else{document.querySelector("#a"+choice).classList.add("bad");document.querySelector("#a"+x.correct_choice).classList.add("good");fb.innerHTML=`<div class="feedback" style="background:#ffe0e0">💡 ${lang==="de"?"Leider falsch.":"Mauvaise réponse."}</div>`}if(x.rewards&&x.rewards.length)setTimeout(()=>showRewards(x.rewards),500);nxt.innerHTML=`<button class="btn green full" onclick="idx++;question()">${lang==="de"?"WEITER":"SUIVANT"} →</button>`}
function result(){confetti();brandJourney("victory");let stars=good==round.length?"⭐⭐⭐":good>=3?"⭐⭐":"⭐";A.innerHTML=`<div class=wrap><div class="card auth"><div class=stars>🏆<br>${stars}</div><h1 style="text-align:center">${lang==="de"?"Runde beendet!":"Partie terminée !"}</h1><h1 style="text-align:center">${good}/${round.length}</h1><p style="text-align:center">⭐ ${me.points} ${lang==="de"?"Punkte":"Points"}</p><button class="btn full" onclick="start('${cat}')">🔄 ${lang==="de"?"Nochmal":"Rejouer"}</button><button class="btn green full" onclick="dashboard()">🏠 Dashboard</button></div></div>`}
function progressView(){fly("🏅");A.innerHTML=`<div class=wrap>${back("dashboard()")}<h1>📊 ${lang==="de"?"Fortschritt":"Progression"}</h1>${Object.keys(prog).map(l=>`<div class=card style="margin:12px 0"><h2>${prog[l].unlocked?"🔓":"🔒"} ${L(names[l])} ${prog[l].done}/${prog[l].total}</h2>${prog[l].unlocked?Object.keys(prog[l].categories).map(c=>`<p>${L(cats[c]||[c,c])}: ${prog[l].categories[c].done}/${prog[l].categories[c].total}</p>`).join(""):""}</div>`).join("")}</div>`}


function stopGroupPoll(){if(groupPoll){clearInterval(groupPoll);groupPoll=null}}
window.groupGameType="quiz";window.selectedGroupLevel="enfant";
function groupHome(){
 stopGroupPoll();brandJourney("group");
 window.groupGameType="quiz";
 window.selectedGroupLevel="enfant";
 A.innerHTML=`<div class=wrap>${back("dashboard()")}<div class="card hero"><h1>👥 ${lang==="de"?"Gruppenspiel":"Jeu en groupe"}</h1><small class=build-tag>V6.7.1</small><p>2–5 ${lang==="de"?"Spieler":"joueurs"}</p></div>
 <div class=levels><div class=card><h2>👑 ${lang==="de"?"Gruppe erstellen":"Créer un groupe"}</h2>
 <p><b>${lang==="de"?"Spiel wählen":"Choisir le jeu"}</b></p>
 <div class=group-level-grid><button class="btn group-type selected" id=groupTypeQuiz data-type=quiz onclick="selectGroupType(this)">❓ QUIZ</button><button class="btn group-type" id=groupTypeRace data-type=race onclick="selectGroupType(this)">🏎️ BIBELRENNEN</button></div>
 <p><b>${lang==="de"?"Schwierigkeitsgrad":"Niveau"}</b></p>
 <div class=group-level-grid>
 <button class="btn group-level selected" data-level=enfant onclick="selectGroupLevel(this)">🧒 ${lang==="de"?"KINDER":"ENFANT"}</button>
 <button class="btn group-level" data-level=facile onclick="selectGroupLevel(this)">🌱 ${lang==="de"?"EINFACH":"FACILE"}</button>
 <button class="btn group-level" data-level=moyen onclick="selectGroupLevel(this)">📖 ${lang==="de"?"MITTEL":"MOYEN"}</button>
 <button class="btn group-level" data-level=difficile onclick="selectGroupLevel(this)">🔥 ${lang==="de"?"SCHWER":"DIFFICILE"}</button>
 <button class="btn group-level" data-level=alle onclick="selectGroupLevel(this)">🎲 ${lang==="de"?"ALLE":"TOUS"}</button></div>
 <button class="btn green full" onclick="groupCreate()">➕ ${lang==="de"?"GRUPPE ERSTELLEN":"CRÉER LE GROUPE"}</button></div>
 <div class=card><h2>🔢 ${lang==="de"?"Beitreten":"Rejoindre"}</h2><p>${lang==="de"?"Nur den 6-stelligen Code eingeben.":"Entre seulement le code à 6 chiffres."}</p><input id=roomCode inputmode=numeric maxlength=6 placeholder="123456"><button class="btn full" onclick="groupJoin()">${lang==="de"?"BEITRETEN":"REJOINDRE"}</button><p id=gmsg></p></div></div></div>`
}
function selectGroupType(btn){
 window.groupGameType=btn.dataset.type==="race"?"race":"quiz";
 document.querySelectorAll(".group-type").forEach(x=>x.classList.toggle("selected",x===btn));
}
function selectGroupLevel(btn){
 window.selectedGroupLevel=btn.dataset.level||"enfant";
 document.querySelectorAll(".group-level").forEach(x=>x.classList.toggle("selected",x===btn));
}
async function groupCreate(){
 const gameType=window.groupGameType==="race"?"race":"quiz";
 const difficulty=["enfant","facile","moyen","difficile","alle"].includes(window.selectedGroupLevel)?window.selectedGroupLevel:"enfant";
 try{
  let r=await api("/api/group/create",{method:"POST",body:JSON.stringify({game_type:gameType,difficulty})});
  groupCode=r.code;groupLobby();
 }catch(e){alert(e.message)}
}
async function groupJoin(){try{let r=await api("/api/group/join",{method:"POST",body:JSON.stringify({code:roomCode.value})});groupCode=r.code;groupLobby()}catch(e){gmsg.textContent=e.message}}
function groupLevelLabel(level){
 const de={enfant:"🧒 KINDER",facile:"🌱 EINFACH",moyen:"📖 MITTEL",difficile:"🔥 SCHWER",alle:"🎲 ALLE"};
 const fr={enfant:"🧒 ENFANT",facile:"🌱 FACILE",moyen:"📖 MOYEN",difficile:"🔥 DIFFICILE",alle:"🎲 TOUS"};
 return (lang==="de"?de:fr)[level]||level;
}
async function groupLobby(){
 stopGroupPoll();let r;try{r=await api("/api/group/"+groupCode)}catch(e){groupHome();return}
 const host=Number(r.host_user_id)===Number(r.me),mine=r.players.find(p=>Number(p.user_id)===Number(r.me)),isRace=r.game_type==="race";
 A.innerHTML=`<div class=wrap>${back("groupLeave()")}<div class="card hero"><h1>🏁 Lobby</h1><div style="font-size:46px;font-weight:900;letter-spacing:8px">${r.code}</div><p>${isRace?"🏎️ BibelRennen":"❓ Quiz"} · ${groupLevelLabel(r.difficulty||"alle")} · ${r.players.length}/5</p></div>
 <div class=card><h2>👥 ${lang==="de"?"Spieler":"Joueurs"}</h2>${r.players.map(p=>`<p>${Number(p.user_id)===Number(r.host_user_id)?"👑":"👤"} <b>${esc(p.display_name)}</b><span style="float:right">${isRace?raceCarDot(p.car):""} ${p.ready?"🟢 "+(lang==="de"?"Bereit":"Prêt"):"⚪ "+(lang==="de"?"Wartet":"Attend")}</span></p>`).join("")}
 ${!host&&isRace?`<h3>🚗 ${lang==="de"?"Dein Auto":"Ta voiture"}</h3><div>${["red","blue","green","yellow","purple"].map(c=>`<button class="btn ${mine?.car===c?"selected":""}" onclick="groupCar('${c}',${mine?.ready?1:0})">${raceCarDot(c)}</button>`).join("")}</div>`:""}
 ${!host?`<button class="btn ${mine?.ready?"ghost":"green"} full" onclick="groupReady(${!(mine&&mine.ready)})">${mine?.ready?(lang==="de"?"NICHT BEREIT":"PAS PRÊT"):(lang==="de"?"BEREIT":"PRÊT")}</button><p>⏳ ${lang==="de"?"Der Host startet das Spiel.":"Le Host démarre le jeu."}</p>`:""}
 ${host?`<p>👑 ${lang==="de"?"Nur der Host kann starten.":"Seul le Host peut démarrer."}</p><button class="btn green full" onclick="groupStart()" ${r.players.length<2||r.players.some(p=>!p.ready)?"disabled":""}>▶ ${isRace?(lang==="de"?"RENNEN STARTEN":"DÉMARRER LA COURSE"):(lang==="de"?"SPIEL STARTEN":"DÉMARRER LE JEU")}</button>`:""}</div>
 <p><button class="btn ghost" onclick="groupLeave()">🚪 ${lang==="de"?"Gruppe verlassen":"Quitter le groupe"}</button></p></div>`;
 const snap=JSON.stringify(r.players.map(p=>[p.user_id,p.ready,p.car]))+"|"+r.status;
 groupPoll=setInterval(async()=>{try{let n=await api("/api/group/"+groupCode);if(n.status==="playing"){stopGroupPoll();if(n.game_type==="race"){location.href="/static/race/index.html?group="+encodeURIComponent(groupCode)}else groupGame();return}let ns=JSON.stringify(n.players.map(p=>[p.user_id,p.ready,p.car]))+"|"+n.status;if(ns!==snap){stopGroupPoll();groupLobby()}}catch(e){stopGroupPoll()}},700)
}
function raceCarDot(c){return {red:"🔴",blue:"🔵",green:"🟢",yellow:"🟡",purple:"🟣"}[c]||"🔴"}
async function groupCar(car,ready){await api(`/api/group/${groupCode}/ready`,{method:"POST",body:JSON.stringify({ready:Boolean(ready),car})});groupLobby()}
async function groupStart(){stopGroupPoll();let r=await api(`/api/group/${groupCode}/start`,{method:"POST",body:"{}"});if(r.room?.game_type==="race"||r.game_type==="race"){location.href="/static/race/index.html?group="+encodeURIComponent(groupCode)}else groupGame()}
async function groupGame(){
 stopGroupPoll();let x;
 try{x=await api(`/api/group/${groupCode}/game`)}catch(e){groupHome();return}
 if(x.phase==="lobby"){groupLobby();return}window.groupQuestionIndex=x.index
 if(x.phase==="finished"){groupPodium(x);return}
 let q=x.question,r=q.reponses[lang],host=Boolean(x.is_host);
 let audioKey=groupCode+":"+x.index;if(window._lastGroupAudio!==audioKey){window._lastGroupAudio=audioKey;maybeAutoSpeak(q)}
 let answers=x.answers||[];
 A.innerHTML=`<div class="wrap group-game-wrap"><div class=top><span class=pill>👥 ${groupCode} &nbsp; 👑 ${esc(x.host_name||"Host")} &nbsp; ${groupLevelLabel(x.room.difficulty||"alle")}</span><b>🏆 ${x.scores.find(s=>s.user_id===x.room.me)?.score||0}</b></div>
 <div class=progress><i style="width:${100*(x.index+1)/10}%"></i></div><div class=top><p>${lang==="de"?"Frage":"Question"} ${x.index+1}/10</p><h2>⏱ ${Math.ceil(x.remaining)}s</h2></div>
 <div class="card question">${esc(q.question[lang])}</div>${audioQuestionTools(q)}
 <div class=answers>${["A","B","C","D"].map(a=>`<button id=g${a} class="btn answer ${x.phase==="reveal"&&a===x.correct_choice?"good":""}" ${x.phase==="reveal"||x.my_answered?"disabled":""} onclick="groupAnswer('${a}')"><b>${a}</b>&nbsp;&nbsp; ${esc(r[a])}</button>`).join("")}</div>
 <div class=card style="margin-top:14px"><b>${x.answered_count}/${x.player_count} ${lang==="de"?"haben geantwortet":"ont répondu"}</b><p>${x.my_answered?"✅ "+(lang==="de"?"Deine Antwort ist gespeichert":"Ta réponse est enregistrée"):"⏳ "+(lang==="de"?"Du hast noch nicht geantwortet":"Tu n’as pas encore répondu")}</p>${x.phase==="question"&&x.remaining<=1?`<p>⏱ ${lang==="de"?"Zeit fast abgelaufen!":"Temps presque écoulé !"}</p>`:""}</div>
 ${x.phase==="reveal"?`<div class=card style="margin-top:14px"><h2>💡 ${lang==="de"?"Auflösung":"Réponse"}</h2><p style="font-size:18px">✅ <b>${esc(r[x.correct_choice])}</b></p>${answers.map(a=>`<p>${a.correct?"✅":"❌"} <b>${esc(a.username)}</b> — ${a.points>0?"+"+a.points+" ⭐":"0"}</p>`).join("")}<h3>🏆 ${lang==="de"?"Zwischenstand":"Classement"}</h3>${x.scores.map((s,i)=>`<p>${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1+"."} <b>${esc(s.username)}</b> — ${s.score} ⭐</p>`).join("")}</div>${host?`<div class=host-dock><div class=host-title>👑 ${lang==="de"?"DU BIST DER HOST":"TU ES L’HÔTE"}</div><button class="btn host-next" onclick="groupNext()">${x.index===9?"🏆 "+(lang==="de"?"ENDERGEBNIS ANZEIGEN":"AFFICHER LE RÉSULTAT"):"▶ "+(lang==="de"?"NÄCHSTE FRAGE":"QUESTION SUIVANTE")+" →"}</button></div>`:`<div class=wait-host>👑 ${lang==="de"?(esc(x.host_name)+" startet die nächste Frage"):(esc(x.host_name)+" lance la question suivante")} <span class=wait-dots>● ● ●</span></div>`}`:""}</div>`
 groupPoll=setTimeout(groupGame,x.phase==="question"?500:900)
}
async function groupAnswer(choice){try{await api(`/api/group/${groupCode}/answer`,{method:"POST",body:JSON.stringify({choice,question_index:window.groupQuestionIndex})})}catch(e){
 // index is recovered from server on retry; use explicit current state below
 let st=await api(`/api/group/${groupCode}/game`);if(!st.my_answered)await api(`/api/group/${groupCode}/answer`,{method:"POST",body:JSON.stringify({choice,question_index:st.index})})
 }groupGame()}
async function groupNext(){await api(`/api/group/${groupCode}/next`,{method:"POST",body:"{}"});groupGame()}
async function groupPodium(x){
 stopGroupPoll();confetti();fly("🏆");
 let badge=await api("/api/multiplayer/claim-badges",{method:"POST",body:"{}"});me=badge.user||me;
 let s=x.scores,st=badge.stats;
 A.innerHTML=`<div class=wrap><div class="card auth"><div class=stars><img class=result-crown src="/static/identity/crown.svg" alt="Crown"><br>⭐⭐⭐</div><h1 style="text-align:center">${lang==="de"?"Endergebnis":"Résultat final"}</h1><p style="text-align:center"><b>${groupLevelLabel(x.difficulty||x.room?.difficulty||"alle")}</b> • 10 ${lang==="de"?"Fragen":"questions"}</p>${s.map((p,i)=>`<p style="font-size:${i===0?24:18}px;text-align:center">${i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1+"."} <b>${esc(p.username)}</b> — ${p.score} ⭐ <small>(${p.correct_count}/10)</small></p>`).join("")}<hr><p style="text-align:center">🎮 ${st.games} &nbsp; 🥇 ${st.wins} &nbsp; 🎖️ ${st.podiums}</p><button class="btn full" onclick="groupProfile()">🏆 ${lang==="de"?"MEIN MULTIPLAYER-PROFIL":"MON PROFIL MULTIJOUEUR"}</button><button class="btn green full" onclick="groupHome()">👥 ${lang==="de"?"NEUE GRUPPE":"NOUVEAU GROUPE"}</button><button class="btn ghost full" onclick="dashboard()">🏠 Dashboard</button></div></div>`;
 if(badge.rewards&&badge.rewards.length)setTimeout(()=>showRewards(badge.rewards),450)
}
async function groupProfile(){
 try{
 stopGroupPoll();let x=await api("/api/multiplayer/profile"),st=x.stats;
 let best=st.best_answer_ms==null?"—":(st.best_answer_ms/1000).toFixed(2)+" s";
 A.innerHTML=`<div class=wrap>${back("dashboard()")}<div class="card hero"><h1>🏆 ${lang==="de"?"Multiplayer-Profil":"Profil multijoueur"}</h1></div>
 <div class=stats><div class=card><h2>🎮 ${st.games}</h2><p>${lang==="de"?"Spiele":"Parties"}</p></div><div class=card><h2>🥇 ${st.wins}</h2><p>${lang==="de"?"Siege":"Victoires"}</p></div><div class=card><h2>🎖️ ${st.podiums}</h2><p>Podiums</p></div><div class=card><h2>⚡ ${best}</h2><p>${lang==="de"?"Beste Antwort":"Meilleure réponse"}</p></div></div>
 <div class=card style="margin-top:14px"><h2>🎖️ Badges</h2><div class=badges>${x.rewards.length?x.rewards.map(r=>`<span class=badge>${esc(r.title)}</span>`).join(""):`<span>${lang==="de"?"Noch kein Multiplayer-Badge.":"Pas encore de badge multijoueur."}</span>`}</div></div>
 <div class=card style="margin-top:14px"><h2>📜 ${lang==="de"?"Letzte Spiele":"Dernières parties"}</h2>${x.history.length?x.history.map(h=>`<p>${h.position==1?"🥇":h.position==2?"🥈":h.position==3?"🥉":"#"+h.position} <b>${h.score} ⭐</b> — ${h.correct_count}/10 • ${groupLevelLabel(h.difficulty||"alle")} <small>(${h.room_code})</small></p>`).join(""):`<p>—</p>`}</div></div>`
 }
 catch(e){
  stopGroupPoll();
  A.innerHTML=`<div class=wrap>${back("dashboard()")}<div class=card><h2>⚠️ ${lang==="de"?"Profil konnte nicht geladen werden":"Impossible de charger le profil"}</h2><p>${esc(e.message||String(e))}</p><button class="btn" onclick="groupProfile()">${lang==="de"?"ERNEUT VERSUCHEN":"RÉESSAYER"}</button></div></div>`
 }
}

async function groupReady(v){await api(`/api/group/${groupCode}/ready`,{method:"POST",body:JSON.stringify({ready:v})});groupLobby()}
async function groupLeave(){stopGroupPoll();if(groupCode){try{await api(`/api/group/${groupCode}/leave`,{method:"POST",body:"{}"})}catch(e){}}groupCode="";groupHome()}

async function weeklyHome(){
 brandJourney("weekly");weekly=await api("/api/weekly");
 if(!weekly.active){A.innerHTML=`<div class=wrap>${back("dashboard()")}<div class=card><h2>⭐ Quiz der Woche</h2><p>Noch kein Quiz / Pas encore de quiz.</p></div></div>`;return}
 let title=weekly.title[lang],first=weekly.first_result;
 A.innerHTML=`<div class=wrap>${back("dashboard()")}<div class="card hero"><h1>⭐ ${esc(title)}</h1><p>${weekly.week} • ${weekly.question_count} ${lang==="de"?"Fragen":"questions"}</p></div>
 <div class=card><h2>${first?(lang==="de"?"Dein gewerteter Versuch":"Ta tentative classée"):(lang==="de"?"Bereit?":"Prêt ?")}</h2>
 ${first?`<p>🏆 ${first.score} • ${first.correct_count}/10</p><p>${lang==="de"?"Du kannst erneut üben; nur der erste Versuch zählt.":"Tu peux rejouer pour t’entraîner ; seule la première tentative compte."}</p>`:""}
 <button class="btn green" onclick="weeklyStart()">▶ ${first?(lang==="de"?"NOCHMAL ÜBEN":"REJOUER"):(lang==="de"?"STARTEN":"COMMENCER")}</button></div>
 <div class=card style="margin-top:14px"><h2>🏆 ${lang==="de"?"Wochenrangliste":"Classement de la semaine"}</h2>${weekly.leaderboard.length?weekly.leaderboard.map((r,i)=>`<p><b>${i+1}. ${esc(r.username)}</b> — ${r.score} ⭐ — ${r.correct_count}/10</p>`).join(""):`<p>${lang==="de"?"Noch keine Ergebnisse.":"Pas encore de résultats."}</p>`}</div>
 <p><button class="btn ghost" onclick="weeklyArchive()">📚 Archiv / Archives</button></p></div>`
}
async function weeklyStart(){
 let x=await api("/api/weekly/start",{method:"POST",body:"{}"});weeklyRun=x.run;weeklyQuestions=x.questions;weeklyIdx=0;weeklyGood=0;weeklyQuestion()
}
function weeklyQuestion(){
 stopSpeech();if(weeklyIdx>=weeklyQuestions.length)return weeklyFinish();
 let q=weeklyQuestions[weeklyIdx],r=q.reponses[lang];
 A.innerHTML=`<div class=wrap><div class=top>${back("weeklyHome()")}<b>⭐ Quiz der Woche</b></div><div class=progress><i style="width:${100*(weeklyIdx+1)/weeklyQuestions.length}%"></i></div><p>${lang==="de"?"Frage":"Question"} ${weeklyIdx+1}/10</p><div class="card question">${esc(q.question[lang])}</div>${audioQuestionTools(q)}<div class=answers>${["A","B","C","D"].map(x=>`<button id=w${x} class="btn answer" onclick="weeklyAnswer('${x}')"><b>${x}</b>&nbsp;&nbsp; ${esc(r[x])}</button>`).join("")}</div><div id=fb></div><div id=nxt></div></div>`
}
async function weeklyAnswer(choice){
 document.querySelectorAll(".answer").forEach(b=>b.disabled=true);let q=weeklyQuestions[weeklyIdx];
 let x=await api(`/api/weekly/answer/${weeklyRun}`,{method:"POST",body:JSON.stringify({week:weekly.week,question_id:q.id,choice})});
 if(x.correct){weeklyGood++;document.querySelector("#w"+choice).classList.add("good");confetti();fb.innerHTML=`<div class="feedback" style="background:#dff6df">🎉 ${lang==="de"?"Richtig!":"Bonne réponse !"}</div>`}
 else{document.querySelector("#w"+choice).classList.add("bad");document.querySelector("#w"+x.correct_choice).classList.add("good");fb.innerHTML=`<div class="feedback" style="background:#ffe0e0">💡 ${lang==="de"?"Leider falsch.":"Mauvaise réponse."}</div>`}
 nxt.innerHTML=`<button class="btn green full" onclick="weeklyIdx++;weeklyQuestion()">${lang==="de"?"WEITER":"SUIVANT"} →</button>`
}
async function weeklyFinish(){
 let x=await api(`/api/weekly/finish/${weeklyRun}`,{method:"POST",body:"{}"});me=x.user;confetti();showRewards(x.rewards||[]);
 A.innerHTML=`<div class=wrap><div class="card auth"><div class=stars>🏆<br>${x.correct_count==10?"⭐⭐⭐":x.correct_count>=7?"⭐⭐":"⭐"}</div><h1 style="text-align:center">${lang==="de"?"Wochenquiz beendet!":"Quiz de la semaine terminé !"}</h1><h1 style="text-align:center">${x.correct_count}/10</h1><p style="text-align:center">🏆 ${x.score}</p><p style="text-align:center">${x.ranked?(lang==="de"?"Dieser Versuch zählt für die Rangliste.":"Cette tentative compte au classement."):(lang==="de"?"Übungsrunde – dein erster Versuch bleibt gewertet.":"Entraînement – ta première tentative reste classée.")}</p><button class="btn green full" onclick="weeklyHome()">⭐ ${lang==="de"?"RANGLISTE":"CLASSEMENT"}</button><button class="btn ghost full" onclick="dashboard()">🏠 Dashboard</button></div></div>`
}
async function weeklyArchive(){
 let a=await api("/api/weekly/archive");A.innerHTML=`<div class=wrap>${back("weeklyHome()")}<h1>📚 Archiv / Archives</h1>${a.map(w=>`<div class=card style="margin:10px 0"><b>${w.week}</b> — ${esc(w.title[lang])} ${w.active?"⭐":""}</div>`).join("")}</div>`;maybeAutoSpeak(q)
}

function accountView(){
 A.innerHTML=`<div class=wrap>${back("dashboard()")}<div class="card hero"><h1>👤 ${lang==="de"?"Mein Konto":"Mon compte"}</h1><p>${esc(me.display_name||me.username)}</p></div>
 <div class=card><label>${lang==="de"?"Spielername":"Nom de joueur"}</label><input id=ad value="${esc(me.display_name||me.username)}"><label>${lang==="de"?"Benutzername (privat)":"Identifiant (privé)"}</label><input value="${esc(me.username)}" disabled><label>${lang==="de"?"Familien-E-Mail":"E-mail familial"}</label><input id=ae type=email value="${esc(me.email||"")}" placeholder="familie@example.com"><small>${lang==="de"?"Mehrere Konten dürfen dieselbe E-Mail verwenden.":"Plusieurs comptes peuvent utiliser la même adresse."}</small><label>Sprache / Langue</label><select id=al style="width:100%;padding:14px;border-radius:14px"><option value=de ${me.language==="de"?"selected":""}>Deutsch</option><option value=fr ${me.language==="fr"?"selected":""}>Français</option></select><button class="btn green full" onclick="saveAccount()">💾 ${lang==="de"?"SPEICHERN":"ENREGISTRER"}</button><p id=amsg></p></div>
 <div class=audio-settings><h2>🔊 ${lang==="de"?"Vorlesemodus":"Mode lecture"}</h2><div class=switchline><span>${lang==="de"?"Frage + Antworten automatisch vorlesen":"Lire automatiquement question + réponses"}</span><input id=audioEnabled type=checkbox ${me.audio_enabled?"checked":""}></div><div class=switchline><span>🐢 ${lang==="de"?"Langsam sprechen":"Parler lentement"}</span><input id=audioSlow type=checkbox ${me.audio_slow?"checked":""}></div><button class="btn" onclick="saveAudioPrefs()">💾 ${lang==="de"?"AUDIO SPEICHERN":"ENREGISTRER AUDIO"}</button><span id=audioMsg></span></div><div class=card style="margin-top:14px"><h2>🔑 ${lang==="de"?"Passwort ändern":"Changer le mot de passe"}</h2><input id=oldp type=password placeholder="${lang==="de"?"Aktuelles Passwort":"Mot de passe actuel"}"><input id=newp type=password placeholder="${lang==="de"?"Neues Passwort – mindestens 8 Zeichen":"Nouveau mot de passe – 8 caractères minimum"}"><button class="btn full" onclick="changePassword()">🔑 ${lang==="de"?"PASSWORT ÄNDERN":"CHANGER"}</button><p id=pmsg></p></div></div>`
}
async function saveAccount(){try{let x=await api("/api/account",{method:"PUT",body:JSON.stringify({display_name:ad.value.trim(),language:al.value,email:ae.value.trim()})});me=x.user;lang=me.language;amsg.textContent="✓ "+(lang==="de"?"Gespeichert":"Enregistré")}catch(e){amsg.textContent=e.message}}
async function changePassword(){if(newp.value.length<8){pmsg.textContent=lang==="de"?"Mindestens 8 Zeichen.":"8 caractères minimum.";return}try{await api("/api/account/change-password",{method:"POST",body:JSON.stringify({current_password:oldp.value,new_password:newp.value})});pmsg.textContent="✓ "+(lang==="de"?"Passwort geändert.":"Mot de passe modifié.");oldp.value="";newp.value=""}catch(e){pmsg.textContent=e.message==="CURRENT_PASSWORD_WRONG"?(lang==="de"?"Aktuelles Passwort ist falsch.":"Mot de passe actuel incorrect."):e.message}}

function logout(){localStorage.removeItem("token");token="";auth()}
handleRecoveryLink().then(done=>{if(!done)(token?load():auth())});



// ---------- V5.3 Audio accessibility ----------
let currentUtterance=null;
function stopSpeech(){if("speechSynthesis" in window){speechSynthesis.cancel();currentUtterance=null}document.querySelectorAll(".audio-btn").forEach(b=>b.classList.remove("speaking"))}
function speakText(text,button=null){
 if(!("speechSynthesis" in window)||!text)return;
 stopSpeech();let u=new SpeechSynthesisUtterance(text);u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=(me&&me.audio_slow)?0.72:0.95;u.pitch=1;
 let voices=speechSynthesis.getVoices(),v=voices.find(x=>x.lang.toLowerCase().startsWith(lang==="fr"?"fr":"de"));if(v)u.voice=v;
 if(button)button.classList.add("speaking");u.onend=u.onerror=()=>{button?.classList.remove("speaking");currentUtterance=null};currentUtterance=u;speechSynthesis.speak(u)
}
function speakQuestion(q){
 let r=q.reponses[lang],prefix=lang==="fr"?"Réponse":"Antwort";
 speakText(`${q.question[lang]}. ${prefix} A: ${r.A}. ${prefix} B: ${r.B}. ${prefix} C: ${r.C}. ${prefix} D: ${r.D}.`)
}
function audioQuestionTools(q){
 window._audioQ=q;
 return `<div class=audio-toolbar><button class=audio-btn onclick="speakQuestion(window._audioQ)">🔊 ${lang==="de"?"Frage + Antworten vorlesen":"Lire question + réponses"}</button><button class=audio-btn onclick="stopSpeech()">⏹</button></div>`
}
function audioAnswerButton(letter,text){
 return `<button class=answer-audio aria-label="Audio ${letter}" onclick="event.stopPropagation();speakText(${JSON.stringify(text)},this)">🔊</button>`
}
async function saveAudioPrefs(){
 let enabled=document.querySelector("#audioEnabled")?.checked||false,slow=document.querySelector("#audioSlow")?.checked||false;
 try{let x=await api("/api/account/audio",{method:"PUT",body:JSON.stringify({enabled,slow})});me=x.user;document.querySelector("#audioMsg").textContent="✓ "+(lang==="de"?"Gespeichert":"Enregistré")}catch(e){document.querySelector("#audioMsg").textContent=e.message}
}
function maybeAutoSpeak(q){if(me&&me.audio_enabled)setTimeout(()=>speakQuestion(q),350)}

// ---------- PWA installation ----------
let deferredInstallPrompt=null;
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function isStandalone(){return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true}
function dismissInstall(){document.querySelector("#installBanner")?.remove();localStorage.installDismissed=Date.now()}
function showInstallBanner(){
 if(isStandalone()||document.querySelector("#installBanner"))return;
 let old=Number(localStorage.installDismissed||0);
 if(Date.now()-old<3*24*60*60*1000)return;
 let d=document.createElement("div");d.id="installBanner";d.className="install-banner browser-only";
 let ios=isIOS();
 d.innerHTML=`<h3>📲 ${lang==="fr"?"Installer BibelQuiz":"BibelQuiz installieren"}</h3><p>${ios?(lang==="fr"?"Dans Safari : Partager → Sur l’écran d’accueil.":"In Safari: Teilen → Zum Home-Bildschirm."):(lang==="fr"?"Ajoute BibelQuiz à ton écran d’accueil.":"BibelQuiz wie eine App auf dem Startbildschirm nutzen.")}</p><div class=install-actions>${deferredInstallPrompt?`<button class="btn green" id=installNow>${lang==="fr"?"INSTALLER":"INSTALLIEREN"}</button>`:""}<button class="btn ghost" onclick="dismissInstall()">${lang==="fr"?"Plus tard":"Später"}</button></div>`;
 document.body.appendChild(d);
 if(deferredInstallPrompt)document.querySelector("#installNow").onclick=async()=>{deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;d.remove()}
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;setTimeout(showInstallBanner,700)});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;document.querySelector("#installBanner")?.remove();localStorage.removeItem("installDismissed")});
function showUpdateBanner(reg){
 if(document.querySelector("#updateBanner"))return;
 let d=document.createElement("div");d.id="updateBanner";d.className="update-banner";
 d.innerHTML=`<b>🔄 ${lang==="fr"?"Nouvelle version disponible":"Neue Version verfügbar"}</b><br><span>${lang==="fr"?"BibelQuiz a été mis à jour.":"BibelQuiz wurde aktualisiert."}</span><br><button class="btn green">${lang==="fr"?"ACTUALISER MAINTENANT":"JETZT AKTUALISIEREN"}</button>`;
 d.querySelector("button").onclick=()=>{if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"})};document.body.appendChild(d)
}
if("serviceWorker" in navigator)window.addEventListener("load",async()=>{
 try{
  let refreshing=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(refreshing)return;refreshing=true;location.reload()});
  let reg=await navigator.serviceWorker.register("/service-worker.js",{updateViaCache:"none"});
  if(reg.waiting&&navigator.serviceWorker.controller)showUpdateBanner(reg);
  reg.addEventListener("updatefound",()=>{let nw=reg.installing;if(!nw)return;nw.addEventListener("statechange",()=>{if(nw.state==="installed"&&navigator.serviceWorker.controller)showUpdateBanner(reg)})});
  setInterval(()=>reg.update().catch(()=>{}),15*60*1000);
 }catch(e){console.error("Service worker:",e)}
});
setTimeout(()=>{if(isIOS())showInstallBanner()},1600);
