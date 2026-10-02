const root=document.querySelector("#raceApp");
const token=localStorage.token||"";let lang="de",level="enfant",questions=[],qi=0,score=0,distance=0,lane=1,running=false,turbo=0,last=0,pickups=[],nextPickup=700;
const labels={de:{title:"🏎️ BibelRennen",sub:"Fahre, sammle Bibel-Fragen und hole die meisten Punkte!",start:"RENNEN STARTEN",back:"← BibelQuiz",question:"Frage",finish:"ZIEL!",points:"Punkte",race:"Rennen",listen:"Vorlesen"},fr:{title:"🏎️ Course Biblique",sub:"Conduis, collecte les questions et gagne le plus de points !",start:"DÉMARRER",back:"← BibelQuiz",question:"Question",finish:"ARRIVÉE !",points:"Points",race:"Course",listen:"Écouter"}};
async function api(path,opt={}){let r=await fetch(path,{...opt,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token,...(opt.headers||{})}});if(!r.ok)throw new Error(await r.text());return r.json()}
function menu(){let t=labels[lang];root.innerHTML=`<div class=menu><div class=panel><div class=big>🏎️📖</div><h1>${t.title}</h1><p>${t.sub}</p><div class=levels>${[["enfant","🧒 KINDER / ENFANT"],["facile","🌱 EINFACH / FACILE"],["moyen","📖 MITTEL / MOYEN"],["difficile","🔥 SCHWER / DIFFICILE"]].map(([v,n])=>`<button class="btn ${v===level?"sel":""}" onclick="choose('${v}',this)">${n}</button>`).join("")}</div><button class="btn start" onclick=start()>${t.start}</button><p><button class=btn onclick="location.href='/'">${t.back}</button></p></div></div>`}
function choose(v,b){level=v;document.querySelectorAll(".levels .btn").forEach(x=>x.classList.remove("sel"));b.classList.add("sel")}
async function start(){try{let me=await api("/api/me");lang=me.language||"de";questions=await api(`/api/race/questions/${level}`);qi=0;score=0;distance=0;lane=1;turbo=0;speed=0;gas=false;braking=false;pickups=[];nextPickup=70;renderRace();running=true;last=performance.now();requestAnimationFrame(loop)}catch(e){alert("Bitte zuerst in BibelQuiz anmelden / Connecte-toi d'abord à BibelQuiz");location.href="/"}}
function renderRace(){root.innerHTML=`<div class=race id=road>${Array.from({length:8},(_,i)=>`<i class=road-line style="top:${i*15-15}%"></i>`).join("")}
<div class=hud><span class=pill>⭐ <b id=sc>0</b></span><span class="pill speedo">🏎️ <b id=spd>0</b> km/h</span><span class=pill id=boost>⚡</span></div>
<div class=race-map><div style="display:flex;justify-content:space-between"><span>START</span><span>🏁 ZIEL</span></div><div class=map-track><i class=map-fill id=mapFill></i><span class=map-car id=mapCar>🏎️</span></div></div>
<div class=distance-sign id=distanceSign>500 m → ZIEL</div><div class=finish-gate id=finishGate>🏁 ZIEL 🏁</div>
<div class=car id=car></div>
<div class=controls><div class=steer><button class=drive onpointerdown="move(-1)">◀</button><button class=drive onpointerdown="move(1)">▶</button></div><div class=pedals><button class="drive brake" id=brakeBtn onpointerdown="setBrake(true)" onpointerup="setBrake(false)" onpointercancel="setBrake(false)">▼</button><button class="drive gas" id=gasBtn onpointerdown="setGas(true)" onpointerup="setGas(false)" onpointercancel="setGas(false)">▲</button></div></div></div>`;placeCar()}
function setGas(v){gas=v;document.querySelector("#gasBtn")?.classList.toggle("active",v)}
function setBrake(v){braking=v;document.querySelector("#brakeBtn")?.classList.toggle("active",v)}
function move(d){if(!running)return;lane=Math.max(0,Math.min(2,lane+d));placeCar()}
function placeCar(){let c=document.querySelector("#car");if(c)c.style.left=[22,44,66][lane]+"%"}
function spawn(){let el=document.createElement("div");el.className="pickup";el.textContent=Math.random()<.72?"📖":"⭐";let l=Math.floor(Math.random()*3);el.dataset.lane=l;el.dataset.kind=el.textContent==="📖"?"q":"star";el.style.left=[24,47,70][l]+"%";el.style.top="-60px";road.appendChild(el);pickups.push({el,y:-60,lane:l,kind:el.dataset.kind})}
function loop(now){if(!running)return;let dt=Math.min(.05,(now-last)/1000);last=now;
 let isTurbo=turbo>now,max=isTurbo?165:MAX_SPEED;
 if(gas)speed+=72*dt;else speed-=22*dt;if(braking)speed-=105*dt;speed=Math.max(0,Math.min(max,speed));
 if(isTurbo)speed=Math.max(speed,145);
 distance+=speed*dt*.095;if(distance>=TRACK){distance=TRACK;updateProgress();finish();return}
 if(distance>=nextPickup){spawn();nextPickup+=75+Math.random()*70}
 let scroll=(35+speed*2.0)*dt;
 for(let p of [...pickups]){p.y+=scroll;p.el.style.top=p.y+"px";let h=innerHeight;if(p.y>h*.72&&p.y<h*.9&&p.lane===lane){collect(p);return}if(p.y>h){p.el.remove();pickups.splice(pickups.indexOf(p),1)}}
 updateProgress();requestAnimationFrame(loop)}
function updateProgress(){let pct=Math.min(100,distance/TRACK*100);if(spd)spd.textContent=Math.round(speed);if(mapFill)mapFill.style.width=pct+"%";if(mapCar)mapCar.style.left=pct+"%";
 let remain=Math.max(0,TRACK-distance);if(distanceSign){if(pct>=50){distanceSign.style.display="block";distanceSign.textContent=`${Math.ceil(remain/50)*50} m → ZIEL`}else distanceSign.style.display="none"}
 if(finishGate){if(pct>=82){finishGate.style.display="block";let y=-150+(pct-82)/18*(innerHeight*.55);finishGate.style.top=Math.min(innerHeight*.45,y)+"px"}else finishGate.style.display="none"}}
function collect(p){p.el.remove();pickups.splice(pickups.indexOf(p),1);if(p.kind==="star"){score+=20;sc.textContent=score;requestAnimationFrame(loop)}else{running=false;gas=false;braking=false;speed*=.45;showQuestion()}}
function speak(text){if(!speechSynthesis)return;speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(text);u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.88;speechSynthesis.speak(u)}
function showQuestion(){let q=questions[qi++%questions.length],r=q.reponses[lang],t=labels[lang];let d=document.createElement("div");d.className="question-overlay";d.innerHTML=`<div class=question><h2>📖 ${t.question}</h2><p style="font-size:21px;font-weight:900">${q.question[lang]}</p><button class=speaker onclick='speak(${JSON.stringify(q.question[lang]+" "+Object.entries(r).map(([k,v])=>k+": "+v).join(". "))})'>🔊 ${t.listen}</button><div class=answers>${["A","B","C","D"].map(a=>`<button class=answer onclick="answerRace('${a}',this)"><b>${a}</b> ${r[a]}</button>`).join("")}</div></div>`;road.appendChild(d);window.raceQ=q}
function answerRace(a,b){let ok=a===raceQ.correcte;document.querySelectorAll(".answer").forEach(x=>x.disabled=true);b.classList.add(ok?"good":"bad");if(ok){score+=100;turbo=performance.now()+3000;boost.textContent="⚡ TURBO";setTimeout(()=>{if(boost)boost.textContent="⚡"},3000)}sc.textContent=score;setTimeout(()=>{document.querySelector(".question-overlay")?.remove();running=true;last=performance.now();requestAnimationFrame(loop)},700)}
function finish(){running=false;let arrival=100;score+=arrival;root.querySelector(".race").insertAdjacentHTML("beforeend",`<div class=finish><div class=panel><div class=big>🏁🏆</div><h1>${labels[lang].finish}</h1><h2>⭐ ${score} ${labels[lang].points}</h2><p>🏎️ +${arrival} ${lang==="de"?"Zielbonus":"bonus arrivée"}</p><button class="btn start" onclick="menu()">${lang==="de"?"NOCH EIN RENNEN":"REJOUER"}</button><p><button class=btn onclick="location.href='/'">${labels[lang].back}</button></p></div></div>`)}
menu();
