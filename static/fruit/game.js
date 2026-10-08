window.addEventListener("error",e=>{const x=document.getElementById("game");if(x)x.innerHTML=`<main><div class=card><h2>⚠️ BibelQuiz</h2><p>${String(e.message||"Erreur")}</p><button onclick="location.href='/'">← BibelQuiz</button></div></main>`});
const lang=localStorage.getItem("bibelquiz_language")==="fr"?"fr":"de",G=document.getElementById("game"),sh=a=>[...a].sort(()=>Math.random()-.5);let score=0,maxScore=0;function say(x){if(!("speechSynthesis"in window))return;let u=new SpeechSynthesisUtterance(String(x));u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.82;speechSynthesis.cancel();speechSynthesis.speak(u)}function toast(x){let d=document.createElement("div");d.className="toast";d.textContent=x;document.body.appendChild(d);setTimeout(()=>d.remove(),1000)}function top(t,p){return `<header><button onclick="location.href='/'">← BibelQuiz</button><h2>${t}</h2></header><div class=master-top><b>${p}</b><span class=scorebox>⭐ ${score}/${maxScore}</span></div>`}function good(){score++;maxScore++;toast("✨ +1 ⭐")}async function bad(){maxScore++;await BQLives.lose(()=>location.reload());toast(lang==="fr"?"Essaie encore 😊":"Versuch es noch einmal 😊")}function finish(t,i){let p=maxScore?score/maxScore:1,m=p>=.85?"🥇":p>=.65?"🥈":"🥉";G.innerHTML=`<main><div class=master-end><div class=medal>${m}</div><h1>${i} ${t}</h1><p>⭐ ${score}/${maxScore}</p><button onclick="location.reload()">🔄</button> <button onclick="location.href='/'">← BibelQuiz</button></div></main>`}const F=lang==="fr"?["Amour", "Joie", "Paix", "Patience", "Bonté", "Bienveillance", "Fidélité", "Douceur", "Maîtrise de soi"]:["Liebe", "Freude", "Friede", "Geduld", "Freundlichkeit", "Güte", "Treue", "Sanftmut", "Selbstbeherrschung"],B=lang==="fr"?["Jalousie", "Colère", "Haine", "Mensonge", "Orgueil", "Impatience", "Égoïsme", "Méchanceté", "Envie"]:["Eifersucht", "Zorn", "Hass", "Lüge", "Stolz", "Ungeduld", "Egoismus", "Bosheit", "Neid"];let n=0,sel=null,on=[],pool=[];
function learn(){if(n===9)return treeGame();G.innerHTML=`<main>${top("🌳 "+(lang==="fr"?"Fruit de l’Esprit":"Frucht des Geistes"),"1. "+(lang==="fr"?"DÉCOUVRIR":"ENTDECKEN"))}<div class=dropzone><div class=tree>🌳</div></div><div class=card><h1>🍎 ${F[n]}</h1><button onclick="say(F[n])">🔊</button><button class=next-btn onclick="n++;learn()">→</button></div></main>`}
function treeGame(){pool=sh([...F.map(x=>({x,ok:1})),...B.map(x=>({x,ok:0}))]);on=[];sel=null;draw()}
function draw(){
 if(on.length===9)return finish(lang==="fr"?"Fruit de l’Esprit":"Frucht des Geistes","🌳");
 G.innerHTML=`<main>${top("🌳","2. "+(lang==="fr"?"REMPLIS L’ARBRE":"FÜLLE DEN BAUM"))}<div class=instruction>${lang==="fr"?"Glisse seulement les 9 fruits de l’Esprit sur l’arbre. Tu peux aussi toucher un mot puis l’arbre.":"Ziehe nur die 9 Früchte des Geistes auf den Baum. Du kannst auch ein Wort und danach den Baum antippen."}</div><div class=dropzone id=fruitTree><div class=tree>🌳</div>${on.map((x,i)=>`<span class=preview style="--p:${i}">🍎 ${x}</span>`).join("")}</div><div class=token-bank>${pool.map((o,i)=>`<button class="token ${sel===i?"selected":""}" data-fruit="${i}">${o.x}</button>`).join("")}</div><div id=dragGhost class=drag-ghost></div></main>`;
 bindFruitDrag()
}
function bindFruitDrag(){
 const tree=document.getElementById("fruitTree"),ghost=document.getElementById("dragGhost");
 let active=null;
 function select(i){sel=i;document.querySelectorAll("[data-fruit]").forEach(x=>x.classList.toggle("selected",+x.dataset.fruit===i))}
 tree.addEventListener("click",()=>{if(sel!==null)dropIndex(sel)});
 document.querySelectorAll("[data-fruit]").forEach(btn=>{
   const i=Number(btn.dataset.fruit);
   btn.addEventListener("click",()=>select(i));
   btn.addEventListener("pointerdown",e=>{active={i,x:e.clientX,y:e.clientY,moved:false};ghost.textContent=pool[i].x;ghost.style.display="block";ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px";select(i)});
 });
 document.addEventListener("pointermove",e=>{if(!active)return;if(Math.hypot(e.clientX-active.x,e.clientY-active.y)>8)active.moved=true;ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px";tree.classList.toggle("drag-over",pointInTree(e.clientX,e.clientY,tree))});
 document.addEventListener("pointerup",e=>{if(!active)return;let i=active.i,over=pointInTree(e.clientX,e.clientY,tree);active=null;ghost.style.display="none";tree.classList.remove("drag-over");if(over)dropIndex(i)});
}
function pointInTree(x,y,tree){const r=tree.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom}
async function dropIndex(idx){
 if(idx<0||idx>=pool.length)return;
 let o=pool[idx];
 if(!o.ok){sel=null;await bad();if(BQLives.zero())return;draw();return}
 good();on.push(o.x);pool.splice(idx,1);sel=null;draw()
}
learn();