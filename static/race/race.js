const root=document.querySelector("#raceApp");
const token=localStorage.token||"";let lang="de",level="enfant",questions=[],qi=0,score=0,distance=0,lane=1,running=false,turbo=0,last=0,pickups=[],nextPickup=700;
const labels={de:{title:"🏎️ BibelRennen",sub:"Fahre, sammle Bibel-Fragen und hole die meisten Punkte!",start:"RENNEN STARTEN",back:"← BibelQuiz",question:"Frage",finish:"ZIEL!",points:"Punkte",race:"Rennen",listen:"Vorlesen"},fr:{title:"🏎️ Course Biblique",sub:"Conduis, collecte les questions et gagne le plus de points !",start:"DÉMARRER",back:"← BibelQuiz",question:"Question",finish:"ARRIVÉE !",points:"Points",race:"Course",listen:"Écouter"}};
async function api(path,opt={}){let r=await fetch(path,{...opt,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token,...(opt.headers||{})}});if(!r.ok)throw new Error(await r.text());return r.json()}
function menu(){let t=labels[lang];root.innerHTML=`<div class=menu><div class=panel><div class=big>🏎️📖</div><h1>${t.title}</h1><p>${t.sub}</p><div class=levels>${[["enfant","🧒 KINDER / ENFANT"],["facile","🌱 EINFACH / FACILE"],["moyen","📖 MITTEL / MOYEN"],["difficile","🔥 SCHWER / DIFFICILE"]].map(([v,n])=>`<button class="btn ${v===level?"sel":""}" onclick="choose('${v}',this)">${n}</button>`).join("")}</div><button class="btn start" onclick=start()>${t.start}</button><p><button class=btn onclick="location.href='/'">${t.back}</button></p></div></div>`}
function choose(v,b){level=v;document.querySelectorAll(".levels .btn").forEach(x=>x.classList.remove("sel"));b.classList.add("sel")}
async function start(){try{let me=await api("/api/me");lang=me.language||"de";questions=await api(`/api/race/questions/${level}`);qi=0;score=0;distance=0;lane=1;turbo=0;speed=0;gas=false;braking=false;pickups=[];nextPickup=70;renderRace();running=true;last=performance.now();requestAnimationFrame(loop)}catch(e){alert("Bitte zuerst in BibelQuiz anmelden / Connecte-toi d'abord à BibelQuiz");location.href="/"}}
function renderRace(){root.innerHTML=`<div class=race id=road>${Array.from({length:8},(_,i)=>`<i class=road-line style="top:${i*15-15}%"></i>`).join("")}
<div class=hud><span class=pill>⭐ <b id=sc>0</b></span><span class="pill speedo">🏎️ <b id=spd>0</b> km/h</span><span class=pill id=boost>⚡</span></div>
<div class=race-map><div style="display:flex;justify-content:space-between"><span>START</span><span><b id=metersLeft>1000</b> m → 🏁 ZIEL</span></div><div class=map-track><i class=map-fill id=mapFill></i><span class=map-car id=mapCar>🏎️</span></div><div class=progress-percent><b id=pctText>0%</b> ${lang==="de"?"der Strecke":"du parcours"}</div></div>
<div class=distance-sign id=distanceSign>500 m → ZIEL</div><div class=finish-gate id=finishGate>🏁 ZIEL 🏁</div>
<div class=car id=car></div>
<div class=controls><div class=steer><button class=drive onpointerdown="move(-1)">◀</button><button class=drive onpointerdown="move(1)">▶</button></div><div class=pedals><button class="drive brake" id=brakeBtn title="Bremse / Frein">▼</button><button class="drive gas" id=gasBtn title="Gas / Accélérer">▲</button></div></div></div>`;placeCar();bindPedals()}
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
function setGas(v){
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
function loop(now){if(!running)return;let dt=Math.min(.05,(now-last)/1000);last=now;
 let isTurbo=turbo>now,max=isTurbo?165:MAX_SPEED;
 let gasHeld=gas||document.querySelector("#gasBtn")?.dataset.pressed==="1";
 let brakeHeld=braking||document.querySelector("#brakeBtn")?.dataset.pressed==="1";
 if(gasHeld)speed+=95*dt;else speed-=16*dt;
 if(brakeHeld)speed-=125*dt;
 speed=Math.max(0,Math.min(max,speed));
 if(isTurbo)speed=Math.max(speed,145);
 distance+=speed*dt*.095;if(distance>=TRACK){distance=TRACK;updateProgress();finish();return}
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
function collect(p){p.el.remove();pickups.splice(pickups.indexOf(p),1);if(p.kind==="star"){score+=20;document.getElementById("sc").textContent=score;requestAnimationFrame(loop)}else{running=false;gas=false;braking=false;speed*=.45;showQuestion()}}
function speak(text){if(!speechSynthesis)return;speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.88;speechSynthesis.speak(u)}
function showQuestion(){let q=questions[qi++%questions.length],r=q.reponses[lang],t=labels[lang];let d=document.createElement("div");d.className="question-overlay";d.innerHTML=`<div class=question><h2>📖 ${t.question}</h2><p style="font-size:21px;font-weight:900">${q.question[lang]}</p><button class=speaker onclick='speak(${JSON.stringify(q.question[lang]+" "+Object.entries(r).map(([k,v])=>k+": "+v).join(". "))})'>🔊 ${t.listen}</button><div class=answers>${["A","B","C","D"].map(a=>`<button class=answer onclick="answerRace('${a}',this)"><b>${a}</b> ${r[a]}</button>`).join("")}</div></div>`;road.appendChild(d);window.raceQ=q}
function answerRace(a,b){let ok=a===raceQ.correcte;document.querySelectorAll(".answer").forEach(x=>x.disabled=true);b.classList.add(ok?"good":"bad");if(ok){score+=100;turbo=performance.now()+3000;document.getElementById("boost").textContent="⚡ TURBO";setTimeout(()=>{document.getElementById("boost")?.replaceChildren("⚡")},3000)}document.getElementById("sc").textContent=score;setTimeout(()=>{document.querySelector(".question-overlay")?.remove();running=true;last=performance.now();requestAnimationFrame(loop)},700)}
function finish(){running=false;let arrival=100;score+=arrival;root.querySelector(".race").insertAdjacentHTML("beforeend",`<div class=finish><div class=panel><div class=big>🏁🏆</div><h1>${labels[lang].finish}</h1><h2>⭐ ${score} ${labels[lang].points}</h2><p>🏎️ +${arrival} ${lang==="de"?"Zielbonus":"bonus arrivée"}</p><button class="btn start" onclick="menu()">${lang==="de"?"NOCH EIN RENNEN":"REJOUER"}</button><p><button class=btn onclick="location.href='/'">${labels[lang].back}</button></p></div></div>`)}
menu();
