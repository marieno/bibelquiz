let raceMode=null;

function raceHome(){
 clearInterval(racePoll);racePoll=null;
 root.innerHTML=`<div class=menu><div class=panel>
 <div class=big>🏎️📖</div><h1>${lang==="de"?"BibelRennen":"Course Biblique"}</h1>
 <p>${lang==="de"?"Wähle deinen Spielmodus":"Choisis ton mode de jeu"}</p>
 <button class="btn start" onclick="soloSetup()">👤 ${lang==="de"?"SOLO":"SOLO"}</button>
 <button class="btn start" style="margin-top:12px" onclick="multiMenu()">👥 ${lang==="de"?"MULTIPLAYER 2–5":"MULTIJOUEUR 2–5"}</button>
 <p><button class=btn onclick="location.href='/'">← BibelQuiz</button></p></div></div>`;
}
function soloSetup(){
 raceMode="solo";
 // Existing race.js menu is now used only as the solo setup screen.
 menu();
}
let raceStarting=false;
let raceRoom="",racePoll=null,raceSyncTimer=null,raceMe=null,racePlayers=[];
function multiMenu(){
 raceMode="multi";clearInterval(racePoll);racePoll=null;
 root.innerHTML=`<div class=menu><div class=panel><div class=big>👥🏎️</div>
 <h1>${lang==="de"?"Multiplayer":"Multijoueur"}</h1><p>2–5 ${lang==="de"?"Spieler":"joueurs"}</p>
 <h3>👑 ${lang==="de"?"Raum erstellen":"Créer une salle"}</h3>
 <p>${lang==="de"?"Der Ersteller wird Host und wählt das Level.":"Le créateur devient Host et choisit le niveau."}</p>
 <div class=levels>${[["enfant","🧒 Kinder"],["facile","🌱 Einfach"],["moyen","📖 Mittel"],["difficile","🔥 Schwer"],["alle","🎲 Alle"]].map(([v,n])=>`<button class="btn ${v===level?"sel":""}" onclick="choose('${v}',this)">${n}</button>`).join("")}</div>
 <button class="btn start" onclick="raceCreate()">➕ ${lang==="de"?"RAUM ERSTELLEN":"CRÉER LA SALLE"}</button>
 <hr><h3>🔢 ${lang==="de"?"Raum beitreten":"Rejoindre une salle"}</h3>
 <input id=raceCode inputmode=numeric maxlength=6 placeholder="123456" style="font-size:25px;width:100%;padding:12px;border-radius:14px;border:2px solid #ccd">
 <button class="btn start" style="margin-top:10px" onclick="raceJoin()">🔗 ${lang==="de"?"BEITRETEN":"REJOINDRE"}</button>
 <p><button class=btn onclick="raceHome()">← ${lang==="de"?"Spielmodus":"Mode de jeu"}</button></p></div></div>`;
}
async function raceCreate(){let r=await api("/api/race-multi/create",{method:"POST",body:JSON.stringify({difficulty:level})});raceRoom=r.code;raceLobby()}
async function raceJoin(){try{let r=await api("/api/race-multi/join",{method:"POST",body:JSON.stringify({code:raceCode.value.trim()})});raceRoom=r.code;raceLobby()}catch(e){alert(e.message)}}
async function raceLobby(){
 clearInterval(racePoll);racePoll=null;
 const r=await api("/api/race-multi/"+raceRoom);raceMe=r.me;
 const isHost=Number(r.host_user_id)===Number(r.me);
 const mine=r.players.find(x=>Number(x.user_id)===Number(r.me));
 const hostPlayer=r.players.find(p=>Number(p.user_id)===Number(r.host_user_id));
 root.innerHTML=`<div class=menu><div class=panel>
 <h1>🏁 Lobby</h1><div style="font-size:38px;font-weight:1000;letter-spacing:5px">${r.code}</div>
 <h3>${groupLevel(r.difficulty)}</h3>
 <p>👑 Host: <b>${escRace(hostPlayer?.display_name||"Host")}</b></p>
 <div class=lobby-players>${r.players.map(p=>`<p>${Number(p.user_id)===Number(r.host_user_id)?"👑":"🏎️"} <b>${escRace(p.display_name)}</b><span style="float:right">${carEmoji(p.car)} ${p.ready?"🟢 READY":"⚪ "+(lang==="de"?"WARTET":"ATTEND")}</span></p>`).join("")}</div>
 <h3>🚗 ${lang==="de"?"Dein Auto":"Ta voiture"}</h3>
 <div>${["red","blue","green","yellow","purple"].map(c=>`<button class="btn ${mine?.car===c?"sel":""}" onclick="raceChooseCar('${c}',${mine?.ready?1:0})">${carEmoji(c)}</button>`).join("")}</div>
 ${isHost
 ? `<p>👑 ${lang==="de"?"Nur du kannst das Rennen starten.":"Toi seul peux démarrer la course."}</p>
    <button class="btn start" ${r.players.length<2||r.players.some(p=>!p.ready)?"disabled":""} onclick="raceMultiStart()">▶ ${lang==="de"?"RENNEN STARTEN":"DÉMARRER LA COURSE"}</button>`
 : `<button class="btn start" onclick="raceSetReady(${mine?.ready?"false":"true"},'${mine?.car||"red"}')">${mine?.ready?"🟢 "+(lang==="de"?"READY – ZURÜCKNEHMEN":"PRÊT – ANNULER"):"✅ "+(lang==="de"?"ICH BIN BEREIT":"JE SUIS PRÊT")}</button>
    <p>⏳ ${lang==="de"?"Warten, bis der Host das Rennen startet…":"Attends que le Host démarre la course…"}</p>`}
 <p><button class=btn onclick="multiMenu()">← ${lang==="de"?"Multiplayer verlassen":"Quitter"}</button></p></div></div>`;

 const snap=JSON.stringify(r.players.map(p=>[p.user_id,p.ready,p.car]))+"|"+r.host_user_id+"|"+r.status;
 racePoll=setInterval(async()=>{try{
   const n=await api("/api/race-multi/"+raceRoom);
   if(n.status==="playing"){clearInterval(racePoll);racePoll=null;await enterStartedRace();return}
   const next=JSON.stringify(n.players.map(p=>[p.user_id,p.ready,p.car]))+"|"+n.host_user_id+"|"+n.status;
   if(next!==snap){clearInterval(racePoll);racePoll=null;raceLobby()}
 }catch(e){}},700);
}
async function raceSetReady(ready,car){await api(`/api/race-multi/${raceRoom}/ready`,{method:"POST",body:JSON.stringify({ready,car})});raceLobby()}
async function raceChooseCar(car,ready){await api(`/api/race-multi/${raceRoom}/ready`,{method:"POST",body:JSON.stringify({ready:Boolean(ready),car})});raceLobby()}
function carEmoji(c){return {red:"🔴",blue:"🔵",green:"🟢",yellow:"🟡",purple:"🟣"}[c]||"🚗"}
function groupLevel(l){return {enfant:"🧒 Kinder",facile:"🌱 Einfach",moyen:"📖 Mittel",difficile:"🔥 Schwer",alle:"🎲 Alle Level"}[l]||l}
async function raceReady(car){return raceSetReady(true,car)}
async function raceMultiStart(){
 if(raceStarting)return;
 raceStarting=true;
 try{
  await api(`/api/race-multi/${raceRoom}/start`,{method:"POST",body:"{}"});
  if(racePoll){clearInterval(racePoll);racePoll=null}
  await enterStartedRace();
 }catch(e){raceStarting=false;alert(e.message)}
}
async function enterStartedRace(){
 if(raceStarting&&running)return;
 raceStarting=true;
 if(racePoll){clearInterval(racePoll);racePoll=null}
 root.innerHTML=`<div class=menu><div class=panel><div class=big>🏁</div><h1>${lang==="de"?"Das Rennen startet…":"La course démarre…"}</h1><p>${lang==="de"?"Der Host hat das Rennen gestartet.":"Le Host a lancé la course."}</p></div></div>`;
 try{await raceMultiPlay()}finally{raceStarting=false}
}
async function raceMultiPlay(){
 let room=await api(`/api/race-multi/${raceRoom}`);
 if(room.status!=="playing"){raceStarting=false;raceLobby();return}
 let q=await api(`/api/race-multi/${raceRoom}/questions`);
 if(!q.questions||!q.questions.length){throw new Error("RACE_QUESTIONS_NOT_READY")}
 questions=q.questions;qi=0;score=0;distance=0;lane=1;turbo=0;speed=0;gas=false;braking=false;pickups=[];nextPickup=70;renderRace();running=true;last=performance.now();requestAnimationFrame(loop);raceSyncTimer=setInterval(syncRace,800)}
async function syncRace(){if(!raceRoom)return;try{let r=await api(`/api/race-multi/${raceRoom}/sync`,{method:"POST",body:JSON.stringify({distance,speed,score,lane,finished:distance>=TRACK})});racePlayers=r.players;renderOpponents(r);if(r.players.every(p=>p.finished)){clearInterval(raceSyncTimer);showRaceResults(r)}}catch(e){}}
function renderOpponents(r){
 document.querySelectorAll(".opponent,.live-board,.offscreen-racer").forEach(x=>x.remove());
 let me=r.players.find(x=>x.user_id===r.me),roadEl=document.getElementById("road");
 if(!me||!roadEl)return;
 // Live ranking here is track position only, not final winner.
 let byTrack=[...r.players].sort((a,b)=>b.distance-a.distance);
 let board=document.createElement("div");board.className="live-board";
 board.innerHTML=`<b>🏁 LIVE</b>${byTrack.map((p,i)=>`<div><span>${i+1}. ${escRace(p.display_name)} ${p.user_id===r.me?"(MOI)":""}</span><span>${Math.floor(p.distance/10)}% · ⭐${p.score}</span></div>`).join("")}`;
 roadEl.appendChild(board);

 for(let p of r.players.filter(x=>x.user_id!==r.me)){
   let gap=p.distance-me.distance;
   // Nearby opponents are rendered on the road. Interpolation is CSS-driven.
   if(Math.abs(gap)<=150){
     let e=document.createElement("div");e.className="opponent";
     e.dataset.uid=p.user_id;
     e.style.left=[22,44,66][p.lane]+"%";
     let y=Math.max(21,Math.min(72,47-gap*.17));
     e.style.top=y+"%";
     e.innerHTML=`<span class="racer-name">${escRace(p.display_name)}</span><span class="racer-car car-${p.car||"blue"}">🏎️</span><span class="racer-gap">${gap>=0?"+":""}${Math.round(gap)} m</span>`;
     roadEl.appendChild(e);
   }else{
     let tag=document.createElement("div");tag.className="offscreen-racer "+(gap>0?"ahead":"behind");
     tag.innerHTML=`${gap>0?"▲":"▼"} ${escRace(p.display_name)} ${gap>0?"+":""}${Math.round(gap)} m`;
     roadEl.appendChild(tag);
   }
 }
}
function escRace(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showRaceResults(r){running=false;let sorted=[...r.players].sort((a,b)=>(b.total_score||b.score)-(a.total_score||a.score));root.innerHTML=`<div class=menu><div class=panel><div class=big>🏆</div><h1>${lang==="de"?"Endstand":"Classement final"}</h1>${sorted.map((p,i)=>`<h2>${["🥇","🥈","🥉","4.","5."][i]} ${p.display_name} — ${p.total_score||p.score} ⭐</h2>`).join("")}<button class="btn start" onclick="multiMenu()">🏎️ ${lang==="de"?"NEUES RENNEN":"NOUVELLE COURSE"}</button></div></div>`}


let unifiedTimer=null,unifiedFinishedSent=false,unifiedWaiting=false;
async function unifiedRaceFromGroup(code){
 raceRoom=code;let room=await api("/api/group/"+code);
 if(room.game_type!=="race"){location.href="/";return}
 let q=await api(`/api/group/${code}/questions`);
 questions=q.questions;qi=0;score=0;distance=0;lane=1;turbo=0;speed=0;gas=false;braking=false;pickups=[];nextPickup=70;
 renderRace();running=true;last=performance.now();requestAnimationFrame(loop);
 unifiedTimer=setInterval(unifiedSync,700);
}
async function unifiedSync(){
 try{
  let st=await api(`/api/group/${raceRoom}/race-sync`,{method:"POST",body:JSON.stringify({distance,speed,score,lane,finished:distance>=TRACK})});
  renderUnifiedRacers(st);
  if(st.race_over){clearInterval(unifiedTimer);showUnifiedResults(st);return}
  if(distance>=TRACK&&!unifiedWaiting){unifiedWaiting=true;running=false;showWaiting(st)}
  else if(unifiedWaiting)showWaiting(st);
 }catch(e){}
}
function renderUnifiedRacers(st){
 let me=st.players.find(p=>Number(p.user_id)===Number(st.me)),roadEl=document.getElementById("road");if(!me||!roadEl)return;
 document.querySelectorAll(".opponent,.live-board,.offscreen-racer").forEach(x=>x.remove());
 let board=document.createElement("div");board.className="live-board";
 let order=[...st.players].sort((a,b)=>b.race_distance-a.race_distance);
 board.innerHTML=`<b>🏁 LIVE</b>${order.map((p,i)=>`<div><span>${i+1}. ${escRace(p.display_name)}${Number(p.user_id)===Number(st.me)?" (DU)":""}</span><span>${Math.floor(p.race_distance/10)}% · ⭐${p.race_score}</span></div>`).join("")}`;roadEl.appendChild(board);
 for(let p of st.players.filter(x=>Number(x.user_id)!==Number(st.me))){
  let gap=p.race_distance-me.race_distance;
  if(Math.abs(gap)<=150){let e=document.createElement("div");e.className="opponent";e.style.left=[22,44,66][p.race_lane]+"%";e.style.top=Math.max(21,Math.min(72,47-gap*.17))+"%";e.innerHTML=`<span class=racer-name>${escRace(p.display_name)}</span><span class="racer-car car-${p.car}">🏎️</span><span class=racer-gap>${gap>=0?"+":""}${Math.round(gap)} m</span>`;roadEl.appendChild(e)}
  else{let e=document.createElement("div");e.className="offscreen-racer "+(gap>0?"ahead":"behind");e.textContent=`${gap>0?"▲":"▼"} ${p.display_name} ${gap>0?"+":""}${Math.round(gap)} m`;roadEl.appendChild(e)}
 }
}
function showWaiting(st){raceMusic.duck();
 let existing=document.getElementById("multiFinish");if(existing)existing.remove();
 let me=st.players.find(p=>Number(p.user_id)===Number(st.me)),left=st.players.filter(p=>!p.race_finished);
 document.body.insertAdjacentHTML("beforeend",`<div class=question-overlay id=multiFinish><div class=question><h1>🏁 ZIEL!</h1><h2>⭐ ${me?.race_score||score}</h2><h2>⏱️ ${st.remaining_seconds??20}s</h2><p>${left.length?(lang==="de"?"Warten auf: ":"En attente de : ")+left.map(x=>escRace(x.display_name)+" "+Math.floor(x.race_distance/10)+"%").join(", "):""}</p></div></div>`)
}
function showUnifiedResults(st){raceMusic.restore();
 running=false;document.getElementById("multiFinish")?.remove();
 let sorted=[...st.players].sort((a,b)=>b.total_score-a.total_score);
 root.innerHTML=`<div class=menu><div class=panel><div class=big>🏆</div><h1>${lang==="de"?"ENDERGEBNIS":"CLASSEMENT FINAL"}</h1>${sorted.map((p,i)=>`<p style="font-size:20px"><b>${["🥇","🥈","🥉","4.","5."][i]} ${escRace(p.display_name)}</b> — ⭐ ${p.total_score} <small>(${p.race_score}+${p.finish_bonus}${p.dnf?" · DNF":""})</small></p>`).join("")}<h2>🏆 ${escRace(sorted[0]?.display_name||"")} — ${sorted[0]?.total_score||0} ⭐</h2><button class="btn start" onclick="location.href='/'">← BibelQuiz</button></div></div>`
}
const unifiedCode=new URLSearchParams(location.search).get("group");
if(unifiedCode){unifiedRaceFromGroup(unifiedCode).catch(e=>{alert(e.message);location.href="/"})}else{raceHome()}
