
let gameVoice=null;
function pickGameVoice(){
 if(!("speechSynthesis" in window))return null;
 const wanted=lang==="fr"?"fr":"de",voices=speechSynthesis.getVoices()||[];
 return voices.find(v=>String(v.lang||"").toLowerCase().startsWith(wanted))||null;
}
function speakCard(text){if(window.BQAudio)return BQAudio.speak(text);
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
const ALLC={de:["Du sollst nur an Gott glauben.", "Du sollst den Namen Gottes nicht missbrauchen.", "Du sollst den Tag des Herrn heiligen.", "Du sollst Vater und Mutter ehren.", "Du sollst nicht töten.", "Du sollst die Ehe achten und treu sein.", "Du sollst nicht stehlen.", "Du sollst nicht lügen und nichts Falsches über andere sagen.", "Du sollst nicht begehren, was deinem Nächsten gehört.", "Du sollst nicht neidisch auf das sein, was andere haben."],fr:["Tu croiras en Dieu seul.", "Tu ne prendras pas le nom de Dieu en vain.", "Tu sanctifieras le jour du Seigneur.", "Tu honoreras ton père et ta mère.", "Tu ne tueras pas.", "Tu respecteras le mariage et tu seras fidèle.", "Tu ne voleras pas.", "Tu ne mentiras pas et tu ne diras rien de faux contre les autres.", "Tu ne convoiteras pas ce qui appartient à ton prochain.", "Tu ne seras pas envieux de ce que les autres possèdent."]};
const TX={de:{title:"Raum aufräumen",living:"Wohnzimmer",kitchen:"Küche",bedroom:"Schlafzimmer",bath:"Bad",near:"Komm etwas näher 😊",search:"Suche den richtigen Platz",found:"Gebot entdeckt!",next:"WEITER",puzzle:"Welche Karte kommt jetzt?",tap:"Karte antippen und dann auf HIER ABLEGEN tippen oder direkt dorthin ziehen.",drop:"HIER ABLEGEN",selected:"Karte ausgewählt. Jetzt HIER ABLEGEN antippen.",first:"Wähle zuerst eine Karte 😊",wrong:"😊 Fast! Das ist noch nicht die nächste Karte.",right:"✨ RICHTIG! Puzzleteil eingesetzt.",win:"Die 10 Gebote sind richtig geordnet!",newgame:"NEUES SPIEL",guess:"ICH WEISS ES!",guessTitle:"Welches Bild versteckt sich hier?",reserveWin:"Reserveherzen gewonnen!"},fr:{title:"Ranger la maison",living:"Salon",kitchen:"Cuisine",bedroom:"Chambre",bath:"Salle de bain",near:"Approche-toi un peu 😊",search:"Cherche le bon emplacement",found:"Commandement découvert !",next:"CONTINUER",puzzle:"Quelle carte vient maintenant ?",tap:"Touche une carte puis touche DÉPOSER ICI, ou fais-la glisser directement.",drop:"DÉPOSER ICI",selected:"Carte sélectionnée. Touche maintenant DÉPOSER ICI.",first:"Choisis d’abord une carte 😊",wrong:"😊 Presque ! Ce n’est pas encore la prochaine carte.",right:"✨ CORRECT ! Pièce du puzzle placée.",win:"Les 10 commandements sont dans le bon ordre !",newgame:"NOUVELLE PARTIE",guess:"JE SAIS !",guessTitle:"Quelle image se cache ici ?",reserveWin:"Vies de réserve gagnées !"}};
let p={x:50,y:80},it=[],done=0,ord=[],next=0,theme="lion",held=null;const O=["👟 Schuhe", "🧸 Teddy", "🍽️ Teller", "📚 Buch", "👕 T-Shirt", "🪥 Zahnbürste", "🧦 Socken", "🥄 Löffel", "🧩 Puzzle", "🧥 Jacke", "🛏️ Kissen", "🧴 Shampoo", "⚽ Ball", "✏️ Stift", "🥣 Schüssel", "🧢 Mütze", "🧹 Besen", "🧻 Toilettenpapier", "🎒 Schulranzen", "🧼 Seife", "🧽 Schwamm", "🧤 Handschuhe", "🚗 Spielzeugauto", "📖 Bibel", "🪮 Kamm", "🥛 Becher", "🩴 Hausschuhe", "🖍️ Buntstifte", "🧺 Wäsche", "🪆 Puppe"],D=["Flur", "Spielzeug", "Küche", "Regal", "Wäsche", "Bad", "Wäsche", "Küche", "Spielzeug", "Garderobe", "Bett", "Bad", "Spielzeug", "Schreibtisch", "Küche", "Garderobe", "Abstellraum", "Bad", "Schreibtisch", "Bad", "Küche", "Garderobe", "Spielzeug", "Regal", "Bad", "Küche", "Flur", "Schreibtisch", "Wäsche", "Spielzeug"];
const HOME_LABELS={de:{Küche:"Küche",Bad:"Bad",Schrank:"Schrank",Spielzeug:"Spielzeugkiste",Regal:"Regal",Flur:"Flur",Garderobe:"Garderobe",Bett:"Bett",Schreibtisch:"Schreibtisch",Abstellraum:"Abstellraum",Wäsche:"Wäschekorb"},fr:{Küche:"Cuisine",Bad:"Salle de bain",Schrank:"Armoire",Spielzeug:"Boîte à jouets",Regal:"Étagère",Flur:"Entrée",Garderobe:"Penderie",Bett:"Lit",Schreibtisch:"Bureau",Abstellraum:"Débarras",Wäsche:"Panier à linge"}};
const H={Küche:[72,25],Bad:[62,75],Schrank:[28,74],Spielzeug:[20,30],Regal:[36,25],Flur:[86,76],Garderobe:[86,62],Bett:[18,74],Schreibtisch:[39,74],Abstellraum:[88,86],Wäsche:[67,86]};
function boot(){let spots=sh([[14, 28], [29, 31], [42, 37], [61, 29], [82, 31], [15, 63], [30, 59], [43, 84], [58, 61], [81, 69], [17, 88], [40, 62], [64, 89], [84, 87], [66, 38]]);it=sh([...Array(O.length).keys()]).slice(0,10).map((id,i)=>({id,x:spots[i][0],y:spots[i][1],done:false}));ord=[...Array(10).keys()];done=next=0;theme=sh(Object.keys(MYSTERY))[0];p={x:50,y:80};held=null;render()}
function render(){G.innerHTML=`<main><header><button onclick="location.href='/'">← BibelQuiz</button><h1>🏠 ${t.title}</h1><b>${done}/10</b></header><button class=voice-test onclick="testGameVoice()">🔊 ${lang==="fr"?"TESTER LA VOIX":"STIMME TESTEN"}</button><div class=apt><div class="room r1">${t.living}</div><div class="room r2">${t.kitchen}</div><div class="room r3">${t.bedroom}</div><div class="room r4">${t.bath}</div>${Object.entries(H).map(([n,v])=>`<small class=home style="left:${v[0]}%;top:${v[1]}%">${(HOME_LABELS[lang]||HOME_LABELS.de)[n]||n}</small>`).join("")}${it.map((o,i)=>o.done?"":`<button class=item style="left:${o.x}%;top:${o.y}%" onclick="grab(${i})">${O[o.id].split(" ")[0]}</button>`).join("")}<div class=person id=person style="left:${p.x}%;top:${p.y}%" onpointerdown="startPersonDrag(event)">🧒</div></div><div class=pad><button onclick="walk(0,-6)">▲</button><button onclick="walk(-6,0)">◀</button><button onclick=action()>✋</button><button onclick="walk(6,0)">▶</button><button onclick="walk(0,6)">▼</button></div><p id=msg></p></main>`}

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
function grab(i){let o=it[i];if(Math.hypot(o.x-p.x,o.y-p.y)>13){toast(t.near);return}held=i;render()}
function action(){if(held===null){let i=it.findIndex(o=>!o.done&&Math.hypot(o.x-p.x,o.y-p.y)<13);if(i>=0)grab(i);return}let o=it[held],h=H[D[o.id]];if(h&&Math.hypot(p.x-h[0],p.y-h[1])<14){o.done=true;held=null;reveal()}else toast(t.search+" 😊")}
function reveal(){let x=ord[done++],num=x+1;G.innerHTML=`<div class=modal><section><div class=big>✨📜</div><h2>${num}/10</h2><p><b>${num}.</b> ${C[x]}</p><button onclick="${done===10?"puzzle()":"render()"}">${t.next}</button></section></div>`;speakCard(num+". "+C[x])}
let selectedCard=null,cardDrag=null;
const MYSTERY={lion:"🦁",elephant:"🐘",ark:"🛶",butterfly:"🦋",dolphin:"🐬",giraffe:"🦒"};let lastGuessAt=-1;
function board(){
 let covers=[...Array(10)].map((_,i)=>`<div class="mystery-cover ${i<next?"open":""}">${i<next?"":"🔒"}</div>`).join("");
 return `<div class=mystery-wrap><div class="puzzle-board puzzle-${theme}"><div class=mystery-cover-grid>${covers}</div><button class="puzzle-slot active mystery-drop" onclick="placeSelected()"><span>👉</span><small>${t.drop}</small></button></div>${next>=3&&next<10?`<button class=guess-btn onclick="guessMystery()">🔍 ${t.guess}</button>`:""}</div>`;
}
function guessMystery(){
 if(lastGuessAt===next){toast(lang==="fr"?"Découvre encore une pièce avant de réessayer.":"Decke erst noch ein Teil auf.");return}
 lastGuessAt=next;let names={lion:lang==="fr"?"Lion":"Löwe",elephant:lang==="fr"?"Éléphant":"Elefant",ark:lang==="fr"?"Arche":"Arche",butterfly:lang==="fr"?"Papillon":"Schmetterling",dolphin:lang==="fr"?"Dauphin":"Delfin",giraffe:lang==="fr"?"Girafe":"Giraffe"},opts=sh([theme,...sh(Object.keys(MYSTERY).filter(x=>x!==theme)).slice(0,3)]);
 G.innerHTML=`<main><h1>🔍 ${t.guessTitle}</h1>${board()}<div class=grid>${opts.map(x=>`<button class=choice data-guess="${x}">${MYSTERY[x]} ${names[x]}</button>`).join("")}</div></main>`;
 document.querySelectorAll("[data-guess]").forEach(b=>b.onclick=()=>{if(b.dataset.guess!==theme){toast(t.wrong);setTimeout(puzzle,500);return}let bonus=next<=3?3:next<=5?2:next<=7?1:0;if(bonus){let r=Number(localStorage.getItem("bq_reserve_hearts")||0)+bonus;localStorage.setItem("bq_reserve_hearts",r);toast(`💛 +${bonus} ${t.reserveWin}`,true)}celebrate();setTimeout(puzzle,650)})
}
function puzzle(){
 if(next===10){G.innerHTML=`<main><h1>🏆 ${t.win}</h1>${board()}<div class=final-celebration>✨🎉⭐🎉✨</div><button onclick="location.reload()">${t.newgame}</button></main>`;celebrate();return}
 selectedCard=null;
 let choices=sh([...Array(10).keys()].filter(i=>i>=next));
 G.innerHTML=`<main><h1>🧩 Puzzle · ${next}/10</h1>${board()}<h2>${t.puzzle}</h2><p class=hint>👆 ${t.tap}</p><div class=drag-cards>${choices.map(i=>`<div class=drag-card data-i="${i}" onpointerdown="cardDown(event,${i})" onclick="selectAndSpeak(${i},this)"><span class=speaker>🔊</span>${C[i]}</div>`).join("")}</div></main>`;
}
function selectAndSpeak(i,el){
 if(cardDrag?.moved)return;
 selectedCard=i;document.querySelectorAll(".drag-card").forEach(x=>x.classList.remove("selected"));el.classList.add("selected");speakCard(C[i]);toast(t.selected,true);
}
function placeSelected(){
 if(selectedCard===null){toast(t.first);return}
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
lang=canonicalGameLanguage();C=ALLC[lang]||ALLC.de;t=TX[lang]||TX.de;boot();