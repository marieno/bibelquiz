/* BibelQuiz V6.8.1 shared race runtime */
const TRACK=1000;
const MAX_SPEED=125;
const root=document.querySelector("#raceApp");
let currentRaceQuestion=null;let raceReadAloud=false;let selectedCarModel="sport",selectedCarColor="red";window.raceLanguage="de";let debugFrames=0,debugLastDt=0;const token=localStorage.token||"";let lang="de",level="enfant",questions=[],qi=0,score=0,distance=0,lane=1,running=false,turbo=0,last=0,pickups=[],nextPickup=700;
const labels={de:{title:"🏎️ BibelRennen",sub:"Fahre, sammle Bibel-Fragen und hole die meisten Punkte!",start:"RENNEN STARTEN",back:"← BibelQuiz",question:"Frage",finish:"ZIEL!",points:"Punkte",race:"Rennen",listen:"Vorlesen"},fr:{title:"🏎️ Course Biblique",sub:"Conduis, collecte les questions et gagne le plus de points !",start:"DÉMARRER",back:"← BibelQuiz",question:"Question",finish:"ARRIVÉE !",points:"Points",race:"Course",listen:"Écouter"}};
async function api(path,opt={}){let r=await fetch(path,{...opt,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token,...(opt.headers||{})}});if(!r.ok)throw new Error(await r.text());return r.json()}
function menu(){let t=labels[lang];root.innerHTML=`<div class=menu><div class=panel><div class=big>🏎️📖</div><h1>${t.title}</h1><p>${t.sub}</p><div class=levels>${[["enfant","🧒 KINDER / ENFANT"],["facile","🌱 EINFACH / FACILE"],["moyen","📖 MITTEL / MOYEN"],["difficile","🔥 SCHWER / DIFFICILE"]].map(([v,n])=>`<button class="btn ${v===level?"sel":""}" onclick="choose('${v}',this)">${n}</button>`).join("")}</div><button class="btn" onclick="raceReadAloud=!raceReadAloud;this.textContent=raceReadAloud?(lang==='de'?'🔊 Vorlesen: AN':'🔊 Lecture: OUI'):(lang==='de'?'🔇 Vorlesen: AUS':'🔇 Lecture: NON')">${lang==="de"?"🔇 Vorlesen: AUS":"🔇 Lecture: NON"}</button><button class="btn start" onclick=start()>${t.start}</button><p><button class=btn onclick="location.href='/'">${t.back}</button></p></div></div>`}
function choose(v,b){level=v;document.querySelectorAll(".levels .btn").forEach(x=>x.classList.remove("sel"));b.classList.add("sel")}
async function start(){try{let me=await api("/api/me");lang=me.language||"de";window.raceLanguage=lang;raceMusic.init(lang);questions=await api(`/api/race/questions/${level}`);qi=0;score=0;distance=0;lane=1;turbo=0;speed=0;gas=false;braking=false;pickups=[];nextPickup=70;renderRace();running=true;last=performance.now();requestAnimationFrame(loop)}catch(e){alert("Bitte zuerst in BibelQuiz anmelden / Connecte-toi d'abord à BibelQuiz");location.href="/"}}
function renderRace(){raceMusic.installButton();raceMusic.start();root.innerHTML=`<div class=race id=road>${Array.from({length:8},(_,i)=>`<i class=road-line style="top:${i*15-15}%"></i>`).join("")}
<div class=hud><span class=pill>⭐ <b id=sc>0</b></span><span class="pill speedo">🏎️ <b id=spd>0</b> km/h</span><span class=pill id=boost>⚡</span></div>
<div class=race-map><div style="display:flex;justify-content:space-between"><span>START</span><span><b id=metersLeft>1000</b> m → 🏁 ZIEL</span></div><div class=map-track><i class=map-fill id=mapFill></i><span class=map-car id=mapCar>🏎️</span></div><div class=progress-percent><b id=pctText>0%</b> ${lang==="de"?"der Strecke":"du parcours"}</div></div>
<div class=distance-sign id=distanceSign>500 m → ZIEL</div><div class=finish-gate id=finishGate>🏁 ZIEL 🏁</div>
<div id=raceDebug style="display:none;position:absolute;z-index:100;left:8px;top:150px;background:#111e;color:#7CFC00;padding:8px 10px;border-radius:9px;font:700 12px monospace;line-height:1.35">FRAME: 0<br>RUN: ?<br>GAS: ?<br>BRAKE: ?<br>SPEED: 0<br>DT: 0</div><div class=car id=car></div>
<div class=controls><div class=steer><button class=drive onpointerdown="move(-1)">◀</button><button class=drive onpointerdown="move(1)">▶</button></div><div class=pedals><button class="drive brake" id=brakeBtn title="Bremse / Frein">▼</button><button class="drive gas" id=gasBtn title="Gas / Accélérer">▲</button></div></div></div>`;placeCar();bindPedals();arcadeInit()}
function bindHold(btn,onStart,onEnd){
 if(!btn)return;
 const start=e=>{e.preventDefault();onStart();};
 const end=e=>{e.preventDefault();onEnd();};
 if(window.PointerEvent){
  btn.addEventListener("pointerdown",start,{passive:false});
  btn.addEventListener("pointerup",end,{passive:false});
  btn.addEventListener("pointercancel",end,{passive:false});
  btn.addEventListener("pointerleave",e=>{if(e.buttons===0)end(e)},{passive:false});
 }else{
  btn.addEventListener("touchstart",start,{passive:false});
  btn.addEventListener("touchend",end,{passive:false});
  btn.addEventListener("touchcancel",end,{passive:false});
  btn.addEventListener("mousedown",start);
  btn.addEventListener("mouseup",end);
 }
}
function bindPedals(){
 const g=document.querySelector("#gasBtn"),b=document.querySelector("#brakeBtn");
 bindHold(g,()=>{g.dataset.pressed="1";setGas(true)},()=>{g.dataset.pressed="0";setGas(false)});
 bindHold(b,()=>{b.dataset.pressed="1";setBrake(true)},()=>{b.dataset.pressed="0";setBrake(false)});
 // Safety: release pedals only when the whole touch/pointer really ends.
 const release=()=>{if(g){g.dataset.pressed="0";setGas(false)}if(b){b.dataset.pressed="0";setBrake(false)}};
 window.addEventListener("pointerup",release,{passive:true});
 window.addEventListener("touchend",release,{passive:true});
}
function setGas(v){if(v)raceMusic.start();
 gas=v;
 document.querySelector("#gasBtn")?.classList.toggle("active",v);
 if(v&&running){speed=Math.max(speed,8);const e=document.getElementById("spd");if(e)e.textContent=Math.round(speed)}
}
function setBrake(v){
 braking=v;
 document.querySelector("#brakeBtn")?.classList.toggle("active",v);
 if(v&&running){speed=Math.max(0,speed-12);const e=document.getElementById("spd");if(e)e.textContent=Math.round(speed)}
}
function move(d){if(!running)return;lane=Math.max(0,Math.min(2,lane+d));placeCar()}
function placeCar(){let c=document.querySelector("#car");if(c)c.style.left=[22,44,66][lane]+"%"}
function spawn(){let el=document.createElement("div");el.className="pickup";el.textContent=Math.random()<.72?"📖":"⭐";let l=Math.floor(Math.random()*3);el.dataset.lane=l;el.dataset.kind=el.textContent==="📖"?"q":"star";el.style.left=[24,47,70][l]+"%";el.style.top="-60px";road.appendChild(el);pickups.push({el,y:-60,lane:l,kind:el.dataset.kind})}
function loop(now){
 debugFrames++;
 let rawDt=(now-last)/1000,dt=Math.min(.05,Math.max(0,rawDt));last=now;debugLastDt=dt;
 const dbg=document.getElementById("raceDebug");
 if(dbg)dbg.innerHTML=`FRAME: ${debugFrames}<br>RUN: ${running}<br>GAS: ${gas} / ${document.getElementById("gasBtn")?.dataset.pressed||"0"}<br>BRAKE: ${braking}<br>SPEED: ${speed.toFixed(1)}<br>DT: ${dt.toFixed(4)}`;
 if(!running)return;
 let isTurbo=turbo>now,max=isTurbo?165:MAX_SPEED;
 let gasHeld=gas||document.querySelector("#gasBtn")?.dataset.pressed==="1";
 let brakeHeld=braking||document.querySelector("#brakeBtn")?.dataset.pressed==="1";
 if(gasHeld)speed+=95*dt;else speed-=16*dt;
 if(brakeHeld)speed-=125*dt;
 speed=Math.max(0,Math.min(max,speed));
 if(isTurbo)speed=Math.max(speed,145);
 distance+=speed*dt*.095;if(distance>=TRACK){distance=TRACK;updateProgress();if(typeof unifiedCode!=="undefined"&&unifiedCode){running=false;return}else{finish();return}}
 if(distance>=nextPickup){spawn();nextPickup+=75+Math.random()*70}
 let scroll=(35+speed*2.0)*dt;
 for(let p of [...pickups]){p.y+=scroll;p.el.style.top=p.y+"px";let h=innerHeight;if(p.y>h*.72&&p.y<h*.9&&p.lane===lane){collect(p);return}if(p.y>h){p.el.remove();pickups.splice(pickups.indexOf(p),1)}}
 updateProgress();requestAnimationFrame(loop)}
function updateProgress(){
 let pct=Math.min(100,distance/TRACK*100),remain=Math.max(0,TRACK-distance);
 const spdEl=document.getElementById("spd"),fillEl=document.getElementById("mapFill"),carEl=document.getElementById("mapCar"),metersEl=document.getElementById("metersLeft"),pctEl=document.getElementById("pctText"),signEl=document.getElementById("distanceSign"),gateEl=document.getElementById("finishGate");
 if(spdEl)spdEl.textContent=Math.round(speed);if(fillEl)fillEl.style.width=pct+"%";if(carEl)carEl.style.left=pct+"%";if(metersEl)metersEl.textContent=Math.ceil(remain);if(pctEl)pctEl.textContent=Math.floor(pct)+"%";
 if(signEl){if(pct>=25){signEl.style.display="block";let mark=remain>750?750:remain>500?500:remain>250?250:remain>100?100:Math.ceil(remain/10)*10;signEl.textContent=`${mark} m → 🏁 ZIEL`}else signEl.style.display="none"}
 if(gateEl){if(pct>=75){gateEl.style.display="block";let local=(pct-75)/25,y=-115+local*(innerHeight*.58);gateEl.style.top=Math.min(innerHeight*.46,y)+"px";gateEl.style.transform=`scale(${0.55+local*.65})`;gateEl.style.opacity=String(Math.min(1,.35+local))}else gateEl.style.display="none"}
}
function collect(p){raceMusic.restore();p.el.remove();pickups.splice(pickups.indexOf(p),1);if(p.kind==="star"){score+=20;document.getElementById("sc").textContent=score;requestAnimationFrame(loop)}else{running=false;gas=false;braking=false;speed*=.45;showQuestion()}}
function speak(text){if(!speechSynthesis)return;speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.88;speechSynthesis.speak(u)}
function stopRaceSpeech(){try{speechSynthesis.cancel()}catch(e){}}
function replayRaceQuestion(){if(currentRaceQuestion)speakRaceQuestion(currentRaceQuestion,true)}
function speakRaceQuestion(q,force=false){
 if((!raceReadAloud&&!force)||!("speechSynthesis" in window)||!q)return;
 try{speechSynthesis.cancel();const rr=q.reponses?.[lang]||q.reponses?.de||[];const qq=(typeof q.question==="object"?(q.question[lang]||q.question.de):q.question)||"";const u=new SpeechSynthesisUtterance(qq+" "+rr.map((x,i)=>String.fromCharCode(65+i)+". "+x).join(". "));u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.84;speechSynthesis.resume();speechSynthesis.speak(u)}catch(e){}
}
window.addEventListener("unhandledrejection",e=>{
 const d=document.getElementById("raceDebug");
 if(d){d.style.color="#fff";d.style.background="#b00020";d.innerHTML+="<br>PROMISE: "+String(e.reason).slice(0,90)}
});

/* MULTIPLAYER */
let raceMode=null;

const garageModels=["sport","coupe","suv","kart"],garageColors=["red","blue","green","yellow","purple","black","white"];
function garageModelLabel(x){return {sport:"SPORT",coupe:"COUPÉ",suv:"SUV",kart:"KART"}[x]||x}
function garagePreview(){return `<div class="garage-car model-${selectedCarModel} color-${selectedCarColor}"><b>BIBEL</b></div>`}
let garageMode="solo";
function legacyRaceHome(){root.innerHTML=`<div class=menu><div class=panel><div class=big>🏎️📖</div><h1>BibelRennen</h1><p>${lang==="de"?"Wähle deinen Spielmodus":"Choisis ton mode de jeu"}</p><button class="btn start" onclick="garageMode='solo';renderGarage()">👤 SOLO</button><button class="btn start" onclick="garageMode='multi';renderGarage()">👥 MULTIPLAYER 2–5</button><p><button class=btn onclick="location.href='/'">← BibelQuiz</button></p></div></div>`}
function renderGarage(){root.innerHTML=`<div class=menu><div class=panel><h1>🚘 ${lang==="de"?"DEIN AUTO":"TA VOITURE"}</h1><div class=garage-preview>${garagePreview()}</div><h3>${lang==="de"?"Modell":"Modèle"}</h3><div class=garage-grid>${garageModels.map(x=>`<button class="btn ${x===selectedCarModel?"sel":""}" onclick="selectedCarModel='${x}';renderGarage()">${garageModelLabel(x)}</button>`).join("")}</div><h3>${lang==="de"?"Farbe":"Couleur"}</h3><div class=color-grid>${garageColors.map(x=>`<button class="color-choice color-${x} ${x===selectedCarColor?"selected":""}" onclick="selectedCarColor='${x}';renderGarage()"></button>`).join("")}</div><button class="btn full" onclick="raceReadAloud=!raceReadAloud;renderGarage()">${raceReadAloud?(lang==="de"?"🔊 Vorlesen: AN":"🔊 Lecture : OUI"):(lang==="de"?"🔇 Vorlesen: AUS":"🔇 Lecture : NON")}</button><button class="btn start full" onclick="${garageMode==="solo"?"menu()":"raceMultiHome()"}">${lang==="de"?"WEITER":"CONTINUER"}</button><p><button class=btn onclick=raceHome()>← ${lang==="de"?"Zurück":"Retour"}</button></p></div></div>`}

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
 raceRoom=code;
 let profile=await api("/api/me");lang=profile.language||"de";window.raceLanguage=lang;raceMusic.init(lang);let room=await api("/api/group/"+code);
 if(room.game_type!=="race"){location.href="/";return}
 /* personal read-aloud choice retained */
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
function renderUnifiedRacers(st){arcadeRenderOpponents(st);
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

const v73Models=["sport","coupe","suv","kart"],v73Colors=["red","blue","green","yellow","purple","black","white"];
let v73Mode="solo";
function v73ModelLabel(x){return {sport:"SPORT",coupe:"COUPÉ",suv:"SUV",kart:"KART"}[x]||x}
function v73Preview(){return `<div class="garage-car model-${selectedCarModel} color-${selectedCarColor}"><span class=garage-window></span><span class=garage-light-left></span><span class=garage-light-right></span><b>BIBEL</b></div>`}
function primeSpeech(){if(!("speechSynthesis" in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(" ");u.lang=lang==="fr"?"fr-FR":"de-DE";speechSynthesis.speak(u)}catch(e){}}
function raceHome(){
 const mode=new URLSearchParams(location.search).get("mode");
 if(mode==="solo"){v73Mode="solo";renderV73Garage();return}
 if(mode==="multi"){v73Mode="multi";renderV73Garage();return}
 root.innerHTML=`<div class=menu><div class=panel><h1>🏎️ BibelRennen</h1><button class="btn start" onclick="v73Mode='solo';renderV73Garage()">👤 SOLO</button><button class="btn start" onclick="v73Mode='multi';renderV73Garage()">👥 MULTIPLAYER</button><p><button class=btn onclick="location.href='/'">← BibelQuiz</button></p></div></div>`;
}
function renderV73Garage(){
 const de=lang==="de";
 root.innerHTML=`<div class=menu><div class="panel garage-panel"><h1>🚘 ${de?"DEIN AUTO":"TA VOITURE"}</h1>
 <div class=garage-preview>${v73Preview()}</div>
 <h3>${de?"Modell":"Modèle"}</h3><div class=garage-grid>${v73Models.map(x=>`<button class="btn ${x===selectedCarModel?"sel":""}" onclick="selectedCarModel='${x}';renderV73Garage()">${v73ModelLabel(x)}</button>`).join("")}</div>
 <h3>${de?"Farbe":"Couleur"}</h3><div class=color-grid>${v73Colors.map(x=>`<button class="color-choice color-${x} ${x===selectedCarColor?"selected":""}" onclick="selectedCarColor='${x}';renderV73Garage()"></button>`).join("")}</div>
 <div class=read-choice><b>🔊 ${de?"Fragen vorlesen":"Lecture automatique"}</b><div class=read-buttons>
 <button class="btn ${!raceReadAloud?"sel":""}" onclick="raceReadAloud=false;renderV73Garage()">${de?"AUS":"NON"}</button>
 <button class="btn ${raceReadAloud?"sel":""}" onclick="raceReadAloud=true;primeSpeech();renderV73Garage()">${de?"AN":"OUI"}</button></div></div>
 <button class="btn start full" onclick="${v73Mode==="solo"?"menu()":"raceMultiHome()"}">${de?"WEITER":"CONTINUER"}</button>
 <p><button class=btn onclick="location.href='/'">← BibelQuiz</button></p></div></div>`;
}
const unifiedCode=new URLSearchParams(location.search).get("group");
async function initRacePage(){try{const me=await api("/api/me");lang=me.language||"de";window.raceLanguage=lang;raceMusic.init(lang)}catch(e){}if(unifiedCode){unifiedRaceFromGroup(unifiedCode).catch(e=>{alert(e.message);location.href="/"})}else raceHome()}
initRacePage()
