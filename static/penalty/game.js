
function speakCard(text){
 if(!("speechSynthesis" in window))return;
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="de-DE";u.rate=.84;speechSynthesis.resume();speechSynthesis.speak(u)}catch(e){}
}
function toast(msg,good=false){
 let t=document.getElementById("gameToast");if(!t){t=document.createElement("div");t.id="gameToast";t.className="game-toast";document.body.appendChild(t)}
 t.textContent=msg;t.className="game-toast show "+(good?"good":"try");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.className="game-toast",1700)
}
function celebrate(){
 const box=document.createElement("div");box.className="celebrate";box.innerHTML="✨ ⭐ 🎉 ⭐ ✨";document.body.appendChild(box);setTimeout(()=>box.remove(),900)
}
const G=document.getElementById("game"),sh=a=>[...a].sort(()=>Math.random()-.5),C=["Eine höchste Liebe zum Herrn", "Eine höchste Liebe zu allen Brüdern", "Trennung von der Familie", "Trennung vom eigenen Ich", "Sein Kreuz tragen", "Auf alles verzichten", "Im Wort bleiben", "Frucht bringen", "Trennung von jeder Sünde"];let goals=0,ord=sh([...Array(9).keys()]),next=0,theme="lion",drag=null,lock=false;
function render(){lock=false;G.innerHTML=`<main><header><button onclick="location.href='/'">← BibelQuiz</button><h1>⚽ 11-Meter</h1><b>${goals}/9</b></header><p>Ziehe den Ball in deine Schussrichtung.</p><div class=field id=f><div class=goal><span class=keeper id=k>🧤</span></div><div class=ball id=b>⚽</div></div></main>`;b.onpointerdown=e=>drag={x:e.clientX,y:e.clientY};window.onpointerup=e=>{if(!drag||lock)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag=null;if(Math.hypot(dx,dy)>25)shoot(dx,dy)}}
function shoot(dx,dy){lock=true;let f=document.getElementById("f").getBoundingClientRect(),tx=Math.max(8,Math.min(92,50+dx/f.width*100)),power=Math.min(1,Math.hypot(dx,dy)/180),ty=18+(1-power)*25,kx=15+Math.random()*70,b=document.getElementById("b"),k=document.getElementById("k");k.style.left=kx+"%";k.classList.add("dive");b.style.left=tx+"%";b.style.top=ty+"%";b.style.transform="translate(-50%,-50%) scale(.55)";setTimeout(()=>{if(tx<11||tx>89){alert("DANEBEN!");render()}else if(Math.abs(tx-kx)<14){alert("🧤 GEHALTEN!");render()}else goal()},800)}
function goal(){let x=ord[goals++];G.innerHTML=`<div class=modal><section><div class=big>⚽✨</div><h1>TOR!</h1><h2>${C[x]}</h2><button onclick="${goals===9?"startPuzzle()":"render()"}">WEITER</button></section></div>`}
function startPuzzle(){theme=sh(["lion","elephant","ark","butterfly","dolphin"])[0];next=0;puzzle()}
function board(){return `<div class="puzzle-board puzzle-${theme}">${[...Array(9)].map((_,i)=>`<div class="puzzle-slot ${i<next?"filled":""}" data-slot="${i}"><span>${i<next?"✓":""}</span></div>`).join("")}</div>`}
let cardDrag=null;
function puzzle(){
 if(next===9){G.innerHTML=`<main><h1>🏆 Richtig!</h1>${board()}<div class=final-celebration>✨🎉⭐🎉✨</div><button onclick="location.reload()">NEUES SPIEL</button></main>`;celebrate();return}
 let choices=sh([...Array(9).keys()]);
 G.innerHTML=`<main><h1>🧩 Puzzle · ${next}/9</h1>${board()}<h2>Welche Bedingung kommt als Nächstes?</h2><p class=hint>👆 Karte antippen = vorlesen · Karte ziehen = einsetzen</p><div class=drag-cards>${choices.map(i=>`<div class=drag-card data-i="${i}" onpointerdown="cardDown(event,${i})" onclick="speakCard(C[${i}])"><span class=speaker>🔊</span>${C[i]}</div>`).join("")}</div></main>`}
function cardDown(e,i){cardDrag={i,startX:e.clientX,startY:e.clientY,el:e.currentTarget,moved:false};e.currentTarget.setPointerCapture?.(e.pointerId)}
window.addEventListener("pointermove",e=>{if(!cardDrag)return;let dx=e.clientX-cardDrag.startX,dy=e.clientY-cardDrag.startY;if(Math.hypot(dx,dy)>8)cardDrag.moved=true;if(cardDrag.moved){cardDrag.el.classList.add("dragging");cardDrag.el.style.transform=`translate(${dx}px,${dy}px) rotate(2deg)`}});
window.addEventListener("pointerup",e=>{if(!cardDrag)return;let d=cardDrag;cardDrag=null;if(!d.moved){d.el.style.transform="";return}let slot=document.querySelector(`.puzzle-slot[data-slot="${next}"]`),r=slot?.getBoundingClientRect();if(r&&e.clientX>=r.left-30&&e.clientX<=r.right+30&&e.clientY>=r.top-30&&e.clientY<=r.bottom+30)dropCard(d.i);else{d.el.classList.add("wrong");d.el.style.transform="";setTimeout(()=>d.el?.classList.remove("wrong"),450);toast("Ziehe die Karte auf das nächste freie Puzzleteil 😊")}});
function dropCard(i){if(i!==next){document.querySelector(`.drag-card[data-i="${i}"]`)?.classList.add("wrong");toast("Fast! Versuch eine andere Karte 😊");return}next++;celebrate();toast("✨ Richtig! Puzzleteil eingesetzt.",true);setTimeout(puzzle,500)}
render();