
let gameVoice=null;
function pickGameVoice(){
 if(!("speechSynthesis" in window))return null;
 const wanted=lang==="fr"?"fr":"de",voices=speechSynthesis.getVoices()||[];
 return voices.find(v=>String(v.lang||"").toLowerCase().startsWith(wanted))||null;
}
function speakCard(text){
 if(!("speechSynthesis" in window)){toast(lang==="fr"?"La synthèse vocale n’est pas disponible.":"Sprachausgabe ist nicht verfügbar.");return false}
 try{
  speechSynthesis.cancel();speechSynthesis.resume();
  const u=new SpeechSynthesisUtterance(String(text||""));
  u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.82;u.pitch=1;u.volume=1;
  gameVoice=pickGameVoice();if(gameVoice)u.voice=gameVoice;
  speechSynthesis.speak(u);
  // Some Android engines remain paused after cancel; resume once more.
  setTimeout(()=>{try{speechSynthesis.resume()}catch(e){}},60);
  return true;
 }catch(e){toast(lang==="fr"?"Lecture impossible.":"Vorlesen nicht möglich.");return false}
}
function testGameVoice(){
 const text=lang==="fr"?"La lecture fonctionne.":"Die Sprachausgabe funktioniert.";
 speakCard(text);
}
if("speechSynthesis" in window){
 speechSynthesis.onvoiceschanged=()=>{gameVoice=pickGameVoice()};
}

function toast(msg,good=false){
 let t=document.getElementById("gameToast");if(!t){t=document.createElement("div");t.id="gameToast";t.className="game-toast";document.body.appendChild(t)}
 t.textContent=msg;t.className="game-toast show "+(good?"good":"try");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.className="game-toast",1700)
}
function celebrate(){
 const box=document.createElement("div");box.className="celebrate";box.innerHTML="✨ ⭐ 🎉 ⭐ ✨";document.body.appendChild(box);setTimeout(()=>box.remove(),900)
}
const G=document.getElementById("game");let lang="de",C,t;const sh=a=>[...a].sort(()=>Math.random()-.5);
const ALLC={de:["Eine höchste Liebe zum Herrn", "Eine höchste Liebe zu allen Brüdern", "Trennung von der Familie", "Trennung vom eigenen Ich", "Sein Kreuz tragen", "Auf alles verzichten", "Im Wort bleiben", "Frucht bringen", "Trennung von jeder Sünde"],fr:["Un amour suprême pour le Seigneur", "Un amour suprême pour tous les frères", "Une séparation d’avec la famille", "Une séparation d’avec le moi", "Porter sa croix", "Renoncer à tout", "Demeurer dans la parole", "Porter du fruit", "La séparation d’avec tout péché"]};
const TX={de:{title:"11-Meter – Jünger Jesu",instruction:"Dribble mit dem Spieler. In der Schusszone: vom Ball zum Ziel im Tor wischen.",training:"TRAINING",pro:"PROFI",champion:"CHAMPION",chooseMode:"WÄHLE DEIN LEVEL",shootZone:"SCHUSSZONE",power:"SCHUSSKRAFT",dribble:"DRIBBLE",miss:"Daneben!",saved:"Gehalten!",goal:"TOR!",next:"WEITER",puzzle:"Welche Karte kommt jetzt?",tap:"Karte antippen und dann auf HIER ABLEGEN tippen oder direkt dorthin ziehen.",drop:"HIER ABLEGEN",select:"Karte ausgewählt. Jetzt HIER ABLEGEN antippen.",choose:"Wähle zuerst eine Karte 😊",wrong:"😊 Fast! Das ist noch nicht die nächste Karte.",right:"✨ RICHTIG! Puzzleteil eingesetzt.",newgame:"NEUES SPIEL",win:"Alle 9 Bedingungen richtig!",guess:"ICH WEISS ES!",guessTitle:"Welches Bild versteckt sich hier?",reserveWin:"Reserveherzen gewonnen!"},fr:{title:"Penalty – Disciple de Jésus",instruction:"Dribble avec le joueur. Dans la zone de tir : glisse du ballon vers la cible dans le but.",training:"ENTRAÎNEMENT",pro:"PRO",champion:"CHAMPION",chooseMode:"CHOISIS TON NIVEAU",shootZone:"ZONE DE TIR",power:"PUISSANCE",dribble:"DRIBBLE",miss:"À côté !",saved:"Arrêté !",goal:"BUT !",next:"CONTINUER",puzzle:"Quelle carte vient maintenant ?",tap:"Touche une carte puis touche DÉPOSER ICI, ou fais-la glisser directement.",drop:"DÉPOSER ICI",select:"Carte sélectionnée. Touche maintenant DÉPOSER ICI.",choose:"Choisis d’abord une carte 😊",wrong:"😊 Presque ! Ce n’est pas encore la prochaine carte.",right:"✨ CORRECT ! Pièce du puzzle placée.",newgame:"NOUVELLE PARTIE",win:"Les 9 conditions sont dans le bon ordre !",guess:"JE SAIS !",guessTitle:"Quelle image se cache ici ?",reserveWin:"Vies de réserve gagnées !"}};
let goals=0,next=0,theme="lion",drag=null,lock=false,mode=null,playerX=50,playerY=76,shotStart=null,keeperX=50,keeperY=18,dribbleDrag=null;
const MODE={
 training:{keeperSpeed:.88,saveRadius:8,assist:14,cones:2,defenders:0,zoneTop:39,zoneHeight:25,aim:true},
 pro:{keeperSpeed:.60,saveRadius:14,assist:2,cones:4,defenders:1,zoneTop:44,zoneHeight:16,aim:false},
 champion:{keeperSpeed:.43,saveRadius:18,assist:0,cones:5,defenders:2,zoneTop:48,zoneHeight:11,aim:false}
};
function chooseMode(){
 G.innerHTML=`<main><header><button onclick="location.href='/'">← BibelQuiz</button><h1>⚽ ${t.title}</h1></header><h2>${t.chooseMode}</h2><div class=mode-grid><button data-mode=training>⚽ ${t.training}<small>${lang==="fr"?"🎯 Ligne de tir + aide · aucun défenseur · gardien lent":"🎯 Schusshilfe · kein Verteidiger · langsamer Torwart"}</small></button><button data-mode=pro>⚽⚽ ${t.pro}<small>${lang==="fr"?"🧍 1 défenseur mobile · zone réduite · gardien rapide":"🧍 1 beweglicher Verteidiger · kleinere Zone · schneller Torwart"}</small></button><button data-mode=champion>⚽⚽⚽ ${t.champion}<small>${lang==="fr"?"🧍🧍 2 défenseurs · petite zone · aucune aide · gardien réactif":"🧍🧍 2 Verteidiger · kleine Zone · keine Hilfe · reaktiver Torwart"}</small></button></div></main>`;
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render()})
}
function fieldMarkup(){
 let cfg=MODE[mode],cones=[...Array(cfg.cones)].map((_,i)=>{let x=mode==="champion"?(12+Math.random()*76):(18+(i%2)*64),y=61-i*6;return `<span class=cone style="left:${x}%;top:${y}%">🔺</span>`}).join("");
 let defenders=[...Array(cfg.defenders)].map((_,i)=>`<span class="defender defender-${i}" id="def${i}" style="left:${i?67:33}%;top:${mode==="champion"?49:52}%">🧍‍♂️</span>`).join("");
 let guide=cfg.aim?`<div class=training-guide><span>⬆️</span><b>${lang==="fr"?"DRIBBLE ICI":"HIER DRIBBELN"}</b><span>🎯</span></div>`:"";
 return `<div class="stadium stadium-${mode}"><div class=crowd>${mode==="champion"?"🔥 🙌 📣 🙌 🔥 🙌 📣 🙌 🔥":"🙌 👏 🙌 👏 🙌 👏 🙌 👏"}</div><div class=field id=f><div class=penalty-box></div><div class=shoot-zone style="top:${cfg.zoneTop}%;height:${cfg.zoneHeight}%">${t.shootZone}</div>${guide}<div class=goal-shadow></div><div class=goal><div class=net></div><span class=keeper-body id=k>🧤<span>🧍</span></span></div>${cones}${defenders}<div class=player id=pl>🧑‍🦱<span class=feet>👟</span></div><div class=ball id=b>⚽</div><div class=aim id=aim>🎯</div></div></div>`;
}
function render(){
 lock=false;playerX=50;playerY=76;keeperX=50;keeperY=18;
 G.innerHTML=`<main><header><button onclick="location.href='/'">← BibelQuiz</button><h1>⚽ ${t.title}</h1><b>${goals}/9</b></header><div class=arena-info><span>🎮 ${t.dribble}</span><span>${mode==="training"?"⚽":mode==="pro"?"⚽⚽":"⚽⚽⚽"}</span></div><p>${t.instruction}</p>${fieldMarkup()}<div class=power-wrap><b>${t.power}</b><div class=power-meter><i id=powerFill></i></div></div></main>`;
 syncPlayer();bindArena();startDefenders();
}
function syncPlayer(){
 let pl=document.getElementById("pl"),b=document.getElementById("b");if(!pl||!b)return;
 pl.style.left=playerX+"%";pl.style.top=playerY+"%";
 b.style.left=(playerX+3)+"%";b.style.top=(playerY+7)+"%";
}
let defenderTick=null,defPhase=0;
function startDefenders(){
 clearInterval(defenderTick);if(!MODE[mode].defenders)return;
 defenderTick=setInterval(()=>{defPhase+=.12;for(let i=0;i<MODE[mode].defenders;i++){let el=document.getElementById("def"+i);if(!el)continue;let center=i?66:34,amp=mode==="champion"?19:13;el.style.left=(center+Math.sin(defPhase+i*2)*amp)+"%"}},55)
}
function checkDefenderCollision(){
 for(let i=0;i<MODE[mode].defenders;i++){let el=document.getElementById("def"+i);if(!el)continue;let dx=Math.abs(playerX-parseFloat(el.style.left||50)),dy=Math.abs(playerY-parseFloat(el.style.top||50));if(dx<9&&dy<10)return true}return false
}
function bindArena(){
 let f=document.getElementById("f"),pl=document.getElementById("pl"),b=document.getElementById("b"),aim=document.getElementById("aim");
 pl.onpointerdown=e=>{if(lock)return;dribbleDrag={id:e.pointerId};pl.setPointerCapture?.(e.pointerId);e.preventDefault()};
 pl.onpointermove=e=>{if(!dribbleDrag||lock)return;let r=f.getBoundingClientRect();playerX=Math.max(10,Math.min(90,(e.clientX-r.left)/r.width*100));playerY=Math.max(42,Math.min(79,(e.clientY-r.top)/r.height*100));syncPlayer();if(checkDefenderCollision()){toast(lang==="fr"?"🛑 Ballon perdu ! Recommence.":"🛑 Ball verloren! Neuer Versuch.");playerX=50;playerY=76;syncPlayer()}};
 pl.onpointerup=()=>{dribbleDrag=null};
 b.onpointerdown=e=>{if(lock)return;let cfg=MODE[mode];if(playerY>cfg.zoneTop+cfg.zoneHeight){toast(lang==="fr"?"Dribble d’abord jusqu’à la zone de tir ⚽":"Dribble zuerst bis in die Schusszone ⚽");return}shotStart={x:e.clientX,y:e.clientY};b.setPointerCapture?.(e.pointerId);aim.style.display=MODE[mode].aim?"block":"none";e.preventDefault()};
 b.onpointermove=e=>{if(!shotStart||lock)return;let r=f.getBoundingClientRect(),x=Math.max(14,Math.min(86,(e.clientX-r.left)/r.width*100)),y=Math.max(7,Math.min(35,(e.clientY-r.top)/r.height*100));aim.style.left=x+"%";aim.style.top=y+"%";let pow=Math.min(100,Math.hypot(e.clientX-shotStart.x,e.clientY-shotStart.y)/2);document.getElementById("powerFill").style.width=pow+"%"};
 b.onpointerup=e=>{if(!shotStart||lock)return;let st=shotStart;shotStart=null;aim.style.display="none";let r=f.getBoundingClientRect(),tx=(e.clientX-r.left)/r.width*100,ty=(e.clientY-r.top)/r.height*100,power=Math.min(1,Math.hypot(e.clientX-st.x,e.clientY-st.y)/190);shootTo(tx,ty,power)};
}
function shootTo(tx,ty,power){
 if(power<.18){toast(lang==="fr"?"Tire plus fort !":"Schieß stärker!");return}
 lock=true;let cfg=MODE[mode],b=document.getElementById("b"),k=document.getElementById("k"),net=document.querySelector(".net");
 // Assisted aiming only in training/pro.
 tx=Math.max(5,Math.min(95,tx+(50-tx)*(cfg.assist/100)));
 let targetY=Math.max(8,Math.min(36,ty));
 // Keeper predicts imperfectly; reaction depends on difficulty.
 let error=(Math.random()-.5)*(mode==="training"?34:mode==="pro"?22:13);
 keeperX=Math.max(18,Math.min(82,tx+error));
 let diveRight=keeperX>50;
 b.classList.add("shot");b.style.left=tx+"%";b.style.top=targetY+"%";
 let reaction=mode==="champion"?210:mode==="pro"?110:20;
 setTimeout(()=>{k.style.left=keeperX+"%";k.classList.add(diveRight?"dive-right":"dive-left")},reaction);b.style.transform=`translate(-50%,-50%) scale(${.42+.18*(1-power)})`;
 setTimeout(()=>{
   let inGoal=tx>=13&&tx<=87&&targetY>=7&&targetY<=39;
   let keeperReach=Math.abs(tx-keeperX)<cfg.saveRadius && targetY>13;
   if(!inGoal){toast("💨 "+t.miss);setTimeout(render,700);return}
   if(keeperReach){k.classList.add("caught");b.classList.add("saved-ball");toast("🧤 "+t.saved);setTimeout(render,900);return}
   net.classList.add("net-hit");goal();
 },760*cfg.keeperSpeed+220)
}
function goal(){
 let x=goals++;celebrate();setTimeout(()=>{G.innerHTML=`<div class=modal><section><div class=big>⚽🥅✨</div><h1>${t.goal}</h1><h2><b>${x+1}.</b> ${C[x]}</h2><button id=conditionSpeak>🔊</button><button id=conditionNext>${t.next}</button></section></div>`;speakCard((x+1)+". "+C[x]);conditionSpeak.onclick=()=>speakCard(C[x]);conditionNext.onclick=()=>goals===9?startPuzzle():render()},420)
}
function startPuzzle(){theme=sh(["lion","elephant","ark","butterfly","dolphin"])[0];next=0;puzzle()}
let selectedCard=null,cardDrag=null;
const MYSTERY={lion:"🦁",elephant:"🐘",ark:"🛶",butterfly:"🦋",dolphin:"🐬"};let lastGuessAt=-1;
function board(){
 let reveal=Math.round(next/9*100);
 return `<div class="mystery-wrap"><div class="puzzle-board puzzle-${theme}" style="--reveal:${reveal}%">${[...Array(9)].map((_,i)=>`<button class="puzzle-slot ${i<next?"filled":i===next?"active":"locked"}" data-slot="${i}" onclick="${i===next?"placeSelected()":""}"><span>${i<next?"✓":i===next?"👉":"🔒"}</span>${i===next?`<small>${t.drop}</small>`:""}</button>`).join("")}<div class=mystery-mask></div></div>${next>=3&&next<9?`<button class=guess-btn onclick="guessMystery()">${t.guess} 🔍</button>`:""}</div>`;
}
function guessMystery(){
 if(lastGuessAt===next){toast(lang==="fr"?"Découvre encore une pièce avant de réessayer.":"Decke erst noch ein Teil auf.");return}
 lastGuessAt=next;let names={lion:lang==="fr"?"Lion":"Löwe",elephant:lang==="fr"?"Éléphant":"Elefant",ark:lang==="fr"?"Arche":"Arche",butterfly:lang==="fr"?"Papillon":"Schmetterling",dolphin:lang==="fr"?"Dauphin":"Delfin"},opts=sh([theme,...sh(Object.keys(MYSTERY).filter(x=>x!==theme)).slice(0,3)]);
 G.innerHTML=`<main><h1>🔍 ${t.guessTitle}</h1>${board()}<div class=grid>${opts.map(x=>`<button class=choice data-guess="${x}">${MYSTERY[x]} ${names[x]}</button>`).join("")}</div></main>`;
 document.querySelectorAll("[data-guess]").forEach(b=>b.onclick=()=>{if(b.dataset.guess!==theme){toast(t.wrong);return puzzle()}let bonus=next<=3?3:next<=5?2:next<=7?1:0;if(bonus){let r=Number(localStorage.getItem("bq_reserve_hearts")||0)+bonus;localStorage.setItem("bq_reserve_hearts",r);toast(`💛 +${bonus} ${t.reserveWin}`,true)}celebrate();setTimeout(puzzle,650)})
}
function puzzle(){
 if(next===9){G.innerHTML=`<main><h1>🏆 ${t.win}</h1>${board()}<div class=final-celebration>✨🎉⭐🎉✨</div><button onclick="location.reload()">${t.newgame}</button></main>`;celebrate();return}
 selectedCard=null;
 let choices=sh([...Array(9).keys()].filter(i=>i>=next));
 G.innerHTML=`<main><h1>🧩 Puzzle · ${next}/9</h1>${board()}<h2>${t.puzzle}</h2><p class=hint>👆 ${t.tap}</p><div class=drag-cards>${choices.map(i=>`<div class=drag-card data-i="${i}" onpointerdown="cardDown(event,${i})" onclick="selectAndSpeak(${i},this)"><span class=speaker>🔊</span>${C[i]}</div>`).join("")}</div></main>`;
}
function selectAndSpeak(i,el){
 if(cardDrag?.moved)return;
 selectedCard=i;document.querySelectorAll(".drag-card").forEach(x=>x.classList.remove("selected"));el.classList.add("selected");speakCard(C[i]);toast(t.select,true);
}
function placeSelected(){
 if(selectedCard===null){toast(t.choose);return}
 dropCard(selectedCard);
}
function cardDown(e,i){cardDrag={i,startX:e.clientX,startY:e.clientY,el:e.currentTarget,moved:false};e.currentTarget.setPointerCapture?.(e.pointerId)}
window.addEventListener("pointermove",e=>{if(!cardDrag)return;let dx=e.clientX-cardDrag.startX,dy=e.clientY-cardDrag.startY;if(Math.hypot(dx,dy)>10)cardDrag.moved=true;if(cardDrag.moved){cardDrag.el.classList.add("dragging");cardDrag.el.style.transform=`translate(${dx}px,${dy}px) scale(1.04)`}});
window.addEventListener("pointerup",e=>{
 if(!cardDrag)return;let d=cardDrag;cardDrag=null;
 if(!d.moved){d.el.style.transform="";return}
 const slot=document.querySelector(".puzzle-slot.active"),r=slot?.getBoundingClientRect();
 // Generous mobile drop zone: 70px tolerance around the active slot.
 if(r&&e.clientX>=r.left-70&&e.clientX<=r.right+70&&e.clientY>=r.top-70&&e.clientY<=r.bottom+70)dropCard(d.i);
 else{d.el.style.transform="";d.el.classList.remove("dragging");toast("Ziehe die Karte zum leuchtenden Feld 👉")}
});
function dropCard(i){
 if(i!==next){
  let el=document.querySelector(`.drag-card[data-i="${i}"]`);el?.classList.add("wrong");setTimeout(()=>el?.classList.remove("wrong"),450);
  toast(t.wrong);return
 }
 next++;selectedCard=null;celebrate();toast(t.right,true);setTimeout(puzzle,600);
}
function canonicalGameLanguage(){return localStorage.getItem("bibelquiz_language")==="fr"?"fr":"de"}
lang=canonicalGameLanguage();C=ALLC[lang]||ALLC.de;t=TX[lang]||TX.de;chooseMode();