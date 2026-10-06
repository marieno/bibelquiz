
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
const G=document.getElementById("game"),sh=a=>[...a].sort(()=>Math.random()-.5),C=["Du sollst nur an Gott glauben.", "Du sollst den Namen Gottes nicht missbrauchen.", "Du sollst den Tag des Herrn heiligen.", "Du sollst Vater und Mutter ehren.", "Du sollst nicht töten.", "Du sollst die Ehe achten und treu sein.", "Du sollst nicht stehlen.", "Du sollst nicht lügen und nichts Falsches über andere sagen.", "Du sollst nicht begehren, was deinem Nächsten gehört.", "Du sollst nicht neidisch auf das sein, was andere haben."],O=["👟 Schuhe", "🧸 Teddy", "🍽️ Teller", "📚 Buch", "👕 T-Shirt", "🪥 Zahnbürste", "🧦 Socken", "🥄 Löffel", "🧩 Puzzle", "🧥 Jacke", "🛏️ Kissen", "🧴 Shampoo", "⚽ Ball", "✏️ Stift", "🥣 Schüssel", "🧢 Mütze", "🧹 Besen", "🧻 Toilettenpapier", "🎒 Schulranzen", "🧼 Seife", "🧽 Schwamm", "🧤 Handschuhe", "🚗 Spielzeugauto", "📖 Bibel", "🪮 Kamm", "🥛 Becher", "🩴 Hausschuhe", "🖍️ Buntstifte", "🧺 Wäsche", "🪆 Puppe"],D=["Flur", "Spielzeug", "Küche", "Regal", "Schrank", "Bad", "Schrank", "Küche", "Spielzeug", "Garderobe", "Bett", "Bad", "Spielzeug", "Schreibtisch", "Küche", "Schrank", "Abstellraum", "Bad", "Schreibtisch", "Bad", "Küche", "Schrank", "Spielzeug", "Regal", "Bad", "Küche", "Flur", "Schreibtisch", "Wäsche", "Spielzeug"];let p={x:50,y:80},it=[],done=0,ord=[],next=0,theme="lion",held=null;const H={Küche:[72,25],Bad:[62,75],Schrank:[28,74],Spielzeug:[20,30],Regal:[36,25],Flur:[86,76],Garderobe:[86,62],Bett:[18,74],Schreibtisch:[39,74],Abstellraum:[88,86],Wäsche:[67,86]};
function boot(){it=sh([...Array(O.length).keys()]).slice(0,10).map(id=>({id,x:10+Math.random()*80,y:14+Math.random()*70,done:false}));ord=sh([...Array(10).keys()]);done=next=0;theme=sh(["lion","elephant","ark","butterfly","dolphin"])[0];p={x:50,y:80};held=null;render()}
function render(){G.innerHTML=`<main><header><button onclick="location.href='/'">← BibelQuiz</button><h1>🏠 Raum aufräumen</h1><b>${done}/10</b></header><div class=apt><div class="room r1">Wohnzimmer</div><div class="room r2">Küche</div><div class="room r3">Schlafzimmer</div><div class="room r4">Bad</div>${Object.entries(H).map(([n,v])=>`<small class=home style="left:${v[0]}%;top:${v[1]}%">${n}</small>`).join("")}${it.map((o,i)=>o.done?"":`<button class=item style="left:${o.x}%;top:${o.y}%" onclick="grab(${i})">${O[o.id].split(" ")[0]}</button>`).join("")}<div class=person id=person style="left:${p.x}%;top:${p.y}%" onpointerdown="startPersonDrag(event)">🧒</div></div><div class=pad><button onclick="walk(0,-6)">▲</button><button onclick="walk(-6,0)">◀</button><button onclick=action()>✋</button><button onclick="walk(6,0)">▶</button><button onclick="walk(0,6)">▼</button></div><p id=msg></p></main>`}

let personDrag=false;
function startPersonDrag(e){personDrag=true;e.preventDefault();document.getElementById("person")?.setPointerCapture?.(e.pointerId)}
window.addEventListener("pointermove",e=>{
 if(!personDrag)return;const apt=document.querySelector(".apt");if(!apt)return;const r=apt.getBoundingClientRect();
 p.x=Math.max(2,Math.min(98,(e.clientX-r.left)/r.width*100));p.y=Math.max(3,Math.min(97,(e.clientY-r.top)/r.height*100));
 if(held!==null){it[held].x=p.x;it[held].y=p.y}
 const person=document.getElementById("person");if(person){person.style.left=p.x+"%";person.style.top=p.y+"%"}
 const item=held!==null?document.querySelectorAll(".item")[held]:null;
});
window.addEventListener("pointerup",()=>{if(personDrag){personDrag=false;autoInteract()}});
function autoInteract(){
 if(held===null){let i=it.findIndex(o=>!o.done&&Math.hypot(o.x-p.x,o.y-p.y)<9);if(i>=0){held=i;toast("✋ "+O[it[i].id]+" aufgenommen",true);render();return}}
 if(held!==null){let o=it[held],h=H[D[o.id]];if(h&&Math.hypot(p.x-h[0],p.y-h[1])<11){o.done=true;held=null;celebrate();toast("✨ Richtig aufgeräumt!",true);setTimeout(reveal,500)}}
}
function walk(x,y){p.x=Math.max(3,Math.min(97,p.x+x));p.y=Math.max(7,Math.min(94,p.y+y));if(held!==null){it[held].x=p.x;it[held].y=p.y}render()}
function grab(i){let o=it[i];if(Math.hypot(o.x-p.x,o.y-p.y)>13){toast("Komm etwas näher zum Gegenstand 😊");return}held=i;render()}
function action(){if(held===null){let i=it.findIndex(o=>!o.done&&Math.hypot(o.x-p.x,o.y-p.y)<13);if(i>=0)grab(i);return}let o=it[held],h=H[D[o.id]];if(h&&Math.hypot(p.x-h[0],p.y-h[1])<14){o.done=true;held=null;reveal()}else toast("Fast! Suche den richtigen Platz 😊")}
function reveal(){let x=ord[done++];G.innerHTML=`<div class=modal><section><div class=big>✨📜</div><p>${C[x]}</p><button onclick="${done===10?"puzzle()":"render()"}">WEITER</button></section></div>`}
function board(){return `<div class="puzzle-board puzzle-${theme}">${[...Array(10)].map((_,i)=>`<div class="puzzle-slot ${i<next?"filled":""}" data-slot="${i}"><span>${i<next?"✓":""}</span></div>`).join("")}</div>`}
let cardDrag=null;
function puzzle(){
 if(next===10){G.innerHTML=`<main><h1>🏆 Richtig!</h1>${board()}<div class=final-celebration>✨🎉⭐🎉✨</div><button onclick="location.reload()">NEUES SPIEL</button></main>`;celebrate();return}
 let choices=sh([...Array(10).keys()]);
 G.innerHTML=`<main><h1>🧩 Puzzle · ${next}/10</h1>${board()}<h2>Welches Gebot kommt als Nächstes?</h2><p class=hint>👆 Karte antippen = vorlesen · Karte ziehen = einsetzen</p><div class=drag-cards>${choices.map(i=>`<div class=drag-card data-i="${i}" onpointerdown="cardDown(event,${i})" onclick="speakCard(C[${i}])"><span class=speaker>🔊</span>${C[i]}</div>`).join("")}</div></main>`}
function cardDown(e,i){cardDrag={i,startX:e.clientX,startY:e.clientY,el:e.currentTarget,moved:false};e.currentTarget.setPointerCapture?.(e.pointerId)}
window.addEventListener("pointermove",e=>{if(!cardDrag)return;let dx=e.clientX-cardDrag.startX,dy=e.clientY-cardDrag.startY;if(Math.hypot(dx,dy)>8)cardDrag.moved=true;if(cardDrag.moved){cardDrag.el.classList.add("dragging");cardDrag.el.style.transform=`translate(${dx}px,${dy}px) rotate(2deg)`}});
window.addEventListener("pointerup",e=>{if(!cardDrag)return;let d=cardDrag;cardDrag=null;if(!d.moved){d.el.style.transform="";return}let slot=document.querySelector(`.puzzle-slot[data-slot="${next}"]`),r=slot?.getBoundingClientRect();if(r&&e.clientX>=r.left-30&&e.clientX<=r.right+30&&e.clientY>=r.top-30&&e.clientY<=r.bottom+30)dropCard(d.i);else{d.el.classList.add("wrong");d.el.style.transform="";setTimeout(()=>d.el?.classList.remove("wrong"),450);toast("Ziehe die Karte auf das nächste freie Puzzleteil 😊")}});
function dropCard(i){if(i!==next){document.querySelector(`.drag-card[data-i="${i}"]`)?.classList.add("wrong");toast("Fast! Versuch eine andere Karte 😊");return}next++;celebrate();toast("✨ Richtig! Puzzleteil eingesetzt.",true);setTimeout(puzzle,500)}
boot();