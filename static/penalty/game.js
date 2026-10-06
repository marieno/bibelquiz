
function speakCard(text){
 if(!("speechSynthesis" in window))return;
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.84;speechSynthesis.resume();speechSynthesis.speak(u)}catch(e){}
}
function toast(msg,good=false){
 let t=document.getElementById("gameToast");if(!t){t=document.createElement("div");t.id="gameToast";t.className="game-toast";document.body.appendChild(t)}
 t.textContent=msg;t.className="game-toast show "+(good?"good":"try");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.className="game-toast",1700)
}
function celebrate(){
 const box=document.createElement("div");box.className="celebrate";box.innerHTML="✨ ⭐ 🎉 ⭐ ✨";document.body.appendChild(box);setTimeout(()=>box.remove(),900)
}
const G=document.getElementById("game"),rawLang=localStorage.lang||"de",lang=String(rawLang).toLowerCase().startsWith("fr")?"fr":"de",sh=a=>[...a].sort(()=>Math.random()-.5);
const ALLC={de:["Eine höchste Liebe zum Herrn", "Eine höchste Liebe zu allen Brüdern", "Trennung von der Familie", "Trennung vom eigenen Ich", "Sein Kreuz tragen", "Auf alles verzichten", "Im Wort bleiben", "Frucht bringen", "Trennung von jeder Sünde"],fr:["Un amour suprême pour le Seigneur", "Un amour suprême pour tous les frères", "Une séparation d’avec la famille", "Une séparation d’avec le moi", "Porter sa croix", "Renoncer à tout", "Demeurer dans la parole", "Porter du fruit", "La séparation d’avec tout péché"]},C=ALLC[lang]||ALLC.de;
const TX={de:{title:"11-Meter – Jünger Jesu",instruction:"Ziehe den Ball in deine Schussrichtung.",miss:"Daneben!",saved:"Gehalten!",goal:"TOR!",next:"WEITER",puzzle:"Welche Karte kommt jetzt?",tap:"Karte antippen und dann auf HIER ABLEGEN tippen oder direkt dorthin ziehen.",drop:"HIER ABLEGEN",select:"Karte ausgewählt. Jetzt HIER ABLEGEN antippen.",choose:"Wähle zuerst eine Karte 😊",wrong:"😊 Fast! Das ist noch nicht die nächste Karte.",right:"✨ RICHTIG! Puzzleteil eingesetzt.",newgame:"NEUES SPIEL",win:"Alle 9 Bedingungen richtig!"},fr:{title:"Penalty – Disciple de Jésus",instruction:"Fais glisser le ballon dans la direction de ton tir.",miss:"À côté !",saved:"Arrêté !",goal:"BUT !",next:"CONTINUER",puzzle:"Quelle carte vient maintenant ?",tap:"Touche une carte puis touche DÉPOSER ICI, ou fais-la glisser directement.",drop:"DÉPOSER ICI",select:"Carte sélectionnée. Touche maintenant DÉPOSER ICI.",choose:"Choisis d’abord une carte 😊",wrong:"😊 Presque ! Ce n’est pas encore la prochaine carte.",right:"✨ CORRECT ! Pièce du puzzle placée.",newgame:"NOUVELLE PARTIE",win:"Les 9 conditions sont dans le bon ordre !"}},t=TX[lang]||TX.de;
let goals=0,next=0,theme="lion",drag=null,lock=false;
function render(){lock=false;G.innerHTML=`<main><header><button onclick="location.href='/'">← BibelQuiz</button><h1>⚽ ${t.title}</h1><b>${goals}/9</b></header><p>${t.instruction}</p><div class=field id=f><div class=goal><span class=keeper id=k>🧤</span></div><div class=ball id=b>⚽</div></div></main>`;b.onpointerdown=e=>drag={x:e.clientX,y:e.clientY};window.onpointerup=e=>{if(!drag||lock)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag=null;if(Math.hypot(dx,dy)>25)shoot(dx,dy)}}
function shoot(dx,dy){lock=true;let f=document.getElementById("f").getBoundingClientRect(),tx=Math.max(8,Math.min(92,50+dx/f.width*100)),power=Math.min(1,Math.hypot(dx,dy)/180),ty=18+(1-power)*25,kx=15+Math.random()*70,b=document.getElementById("b"),k=document.getElementById("k");k.style.left=kx+"%";k.classList.add("dive");b.style.left=tx+"%";b.style.top=ty+"%";b.style.transform="translate(-50%,-50%) scale(.55)";setTimeout(()=>{if(tx<11||tx>89){toast(t.miss);render()}else if(Math.abs(tx-kx)<14){toast("🧤 "+t.saved);render()}else goal()},800)}
function goal(){let x=goals++;G.innerHTML=`<div class=modal><section><div class=big>⚽✨</div><h1>${t.goal}</h1><h2><b>${x+1}.</b> ${C[x]}</h2><button onclick="${goals===9?"startPuzzle()":"render()"}">${t.next}</button></section></div>`}
function startPuzzle(){theme=sh(["lion","elephant","ark","butterfly","dolphin"])[0];next=0;puzzle()}
let selectedCard=null,cardDrag=null;
function board(){
 return `<div class="puzzle-board puzzle-${theme}">${[...Array(9)].map((_,i)=>`<button class="puzzle-slot ${i<next?"filled":i===next?"active":"locked"}" data-slot="${i}" onclick="${i===next?"placeSelected()":""}"><span>${i<next?"✓":i===next?"👉": "🔒"}</span>${i===next?`<small>${t.drop}</small>`:""}</button>`).join("")}</div>`;
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
render();