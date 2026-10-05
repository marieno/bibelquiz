let raceStarting=false;
let raceRoom="",racePoll=null,raceSyncTimer=null,raceMe=null,racePlayers=[];
function multiMenu(){let t=labels[lang];root.innerHTML=`<div class=menu><div class=panel><div class=big>🏎️🏎️</div><h1>BibelRennen Multiplayer</h1><p>2–5 ${lang==="de"?"Spieler":"joueurs"}</p>
<h3>${lang==="de"?"Gruppe erstellen":"Créer un groupe"}</h3><div class=levels>${[["enfant","🧒 Kinder"],["facile","🌱 Einfach"],["moyen","📖 Mittel"],["difficile","🔥 Schwer"],["alle","🎲 Alle"]].map(([v,n])=>`<button class="btn ${v===level?"sel":""}" onclick="choose('${v}',this)">${n}</button>`).join("")}</div><button class="btn start" onclick="raceCreate()">🎮 ${lang==="de"?"ERSTELLEN":"CRÉER"}</button>
<hr><h3>${lang==="de"?"Beitreten":"Rejoindre"}</h3><input id=raceCode inputmode=numeric maxlength=6 placeholder="123456" style="font-size:25px;width:100%;padding:12px;border-radius:14px;border:2px solid #ccd"><button class="btn start" style="margin-top:10px" onclick="raceJoin()">🔢 ${lang==="de"?"BEITRETEN":"REJOINDRE"}</button><p><button class=btn onclick="menu()">← Solo</button></p></div></div>`}
async function raceCreate(){let r=await api("/api/race-multi/create",{method:"POST",body:JSON.stringify({difficulty:level})});raceRoom=r.code;raceLobby()}
async function raceJoin(){try{let r=await api("/api/race-multi/join",{method:"POST",body:JSON.stringify({code:raceCode.value.trim()})});raceRoom=r.code;raceLobby()}catch(e){alert(e.message)}}
async function raceLobby(){
 clearInterval(racePoll);racePoll=null;
 let r=await api("/api/race-multi/"+raceRoom);raceMe=r.me;
 const isHost=Number(r.host_user_id)===Number(r.me),mine=r.players.find(x=>Number(x.user_id)===Number(r.me));
 root.innerHTML=`<div class=menu><div class=panel><h1>🏁 Lobby ${r.code}</h1><h3>${groupLevel(r.difficulty)}</h3>
 <p>👑 Host: <b>${escRace((r.players.find(p=>Number(p.user_id)===Number(r.host_user_id))||{}).display_name||"Host")}</b></p>
 ${r.players.map(p=>`<p>${Number(p.user_id)===Number(r.host_user_id)?"👑":"🏎️"} <b>${escRace(p.display_name)}</b> <span style="float:right">${p.ready?"🟢 READY":"⚪"}</span></p>`).join("")}
 <h3>🚗 Auto</h3><div>${["red","blue","green","yellow","purple"].map(c=>`<button class=btn onclick="raceReady('${c}')">${carEmoji(c)} ${c}</button>`).join("")}</div>
 ${isHost?`<button class="btn start" ${r.players.length<2||r.players.some(p=>!p.ready)?"disabled":""} onclick="raceMultiStart()">▶ ${lang==="de"?"RENNEN STARTEN":"DÉMARRER"}</button>`:`<button class="btn start" onclick="raceReady('${mine?.car||"red"}')">${mine?.ready?"✅ READY":(lang==="de"?"ICH BIN BEREIT":"JE SUIS PRÊT")}</button><p>⏳ ${lang==="de"?"Der Host startet das Rennen.":"Le Host démarre la course."}</p>`}</div></div>`;
 const snap=JSON.stringify(r.players.map(p=>[p.user_id,p.ready,p.car]))+"|"+r.host_user_id+"|"+r.status;
 racePoll=setInterval(async()=>{try{const n=await api("/api/race-multi/"+raceRoom);if(n.status==="playing"){clearInterval(racePoll);racePoll=null;await enterStartedRace();return}const next=JSON.stringify(n.players.map(p=>[p.user_id,p.ready,p.car]))+"|"+n.host_user_id+"|"+n.status;if(next!==snap){clearInterval(racePoll);racePoll=null;raceLobby()}}catch(e){}},700)
}
function carEmoji(c){return {red:"🔴",blue:"🔵",green:"🟢",yellow:"🟡",purple:"🟣"}[c]||"🚗"}
function groupLevel(l){return {enfant:"🧒 Kinder",facile:"🌱 Einfach",moyen:"📖 Mittel",difficile:"🔥 Schwer",alle:"🎲 Alle Level"}[l]||l}
async function raceReady(car){await api(`/api/race-multi/${raceRoom}/ready`,{method:"POST",body:JSON.stringify({ready:true,car})});raceLobby()}
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
// Add multiplayer entry to solo menu after it renders.
const oldMenu=menu;menu=function(){oldMenu();let panel=document.querySelector(".panel");if(panel)panel.insertAdjacentHTML("beforeend",`<p><button class="btn start" onclick="multiMenu()">👥🏎️ MULTIPLAYER 2–5</button></p>`)}
menu();
