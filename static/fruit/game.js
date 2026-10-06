const lang=localStorage.getItem("bibelquiz_language")==="fr"?"fr":"de",G=document.getElementById("game"),sh=a=>[...a].sort(()=>Math.random()-.5);function say(x){if(!("speechSynthesis"in window))return;try{speechSynthesis.cancel();speechSynthesis.resume();let u=new SpeechSynthesisUtterance(String(x));u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.82;speechSynthesis.speak(u)}catch(e){}}function toast(x){let d=document.createElement("div");d.className="toast";d.textContent=x;document.body.appendChild(d);setTimeout(()=>d.remove(),1200)}function wrong(){toast(lang==="fr"?"😊 Presque ! Essaie encore.":"😊 Fast! Versuch es noch einmal.")}function reward(x,b){G.innerHTML=`<main><div class=reward><div class=badge>${b}</div><div class=stars>⭐ ⭐ ⭐</div><h1>${x}</h1><button onclick="location.reload()">🔄</button> <button onclick="location.href='/'">← BibelQuiz</button></div></main>`}function head(x,n,t){return `<header><button onclick="location.href='/'">← BibelQuiz</button><h2>${x}</h2><b>${n}/${t}</b></header><div class=progress><i style="width:${n/t*100}%"></i></div>`}const X=lang==="fr"?["Amour", "Joie", "Paix", "Patience", "Bonté", "Bienveillance", "Fidélité", "Douceur", "Maîtrise de soi"]:["Liebe", "Freude", "Friede", "Geduld", "Freundlichkeit", "Güte", "Treue", "Sanftmut", "Selbstbeherrschung"],I=["🍎", "🍎", "🍎", "🍎", "🍎", "🍎", "🍎", "🍎", "🍎"];let n=0,lives=3;let attempts=0;function resetAttempts(){attempts=0}function help(correct,onNext,hint){attempts++;if(attempts===1){toast(lang==="fr"?"😊 Presque ! Essaie encore.":"😊 Fast! Versuch es noch einmal.");return}if(attempts===2){toast("💡 "+hint);return}G.innerHTML+=`<div class=correct-reveal>📖 ${lang==="fr"?"Bonne réponse":"Richtige Antwort"}: <b>${correct}</b><br><button class=next-btn id=helpNext>${lang==="fr"?"CONTINUER →":"WEITER →"}</button></div>`;say(correct);document.getElementById("helpNext").onclick=()=>{resetAttempts();onNext()}}
function learn(){if(n===X.length)return odd();G.innerHTML=`<main>${head(lang==="fr"?"Fruit de l\u2019Esprit":"Frucht des Geistes",n,X.length)}<div class=phase>${lang==="fr"?"APPRENDRE":"LERNEN"}</div><div class="scene themed"><div class=sceneIcon>${I[n]}</div></div><div class=card><h1>${n+1}. ${X[n]}</h1><button onclick="say(X[n])">🔊</button> <button class=next-btn onclick="n++;learn()">✨</button></div></main>`;say(X[n])}
function odd(){let bad=lang==="fr"?"Jalousie \ud83d\ude20":"Eifersucht \ud83d\ude20",o=sh([0,1,2,-1]);G.innerHTML=`<main><div class=phase>🕵️ INTRUS</div><h2>${lang==="fr"?'Lequel n’est pas un fruit de l’Esprit ?':'Was ist keine Frucht des Geistes?'}</h2><div class=grid>${o.map(i=>`<button class=choice onclick="oddPick(${i})">${i<0?bad:I[i]+" "+X[i]}</button>`).join("")}</div></main>`}
function oddPick(i){if(i!==-1){help(lang==="fr"?'Jalousie 😠':'Eifersucht 😠',missing,lang==="fr"?"Cherche celui qui n’appartient pas au groupe.":"Suche, was nicht zur Gruppe gehört.");return}resetAttempts();missing()}
function missing(){let m=Math.floor(X.length/2),o=sh([m,...sh([...Array(X.length).keys()].filter(i=>i!==m)).slice(0,3)]);G.innerHTML=`<main><div class=phase>❓ Fruit manquant / Fehlende Frucht</div><h2>${lang==="fr"?'🌳 Un fruit est tombé de l’arbre. Lequel manque ?':'🌳 Eine Frucht ist vom Baum gefallen. Welche fehlt?'}</h2><div class=grid>${o.map(i=>`<button class=choice onclick="miss(${i},${m})">${I[i]} ${X[i]}</button>`).join("")}</div></main>`}
function miss(i,m){if(i!==m){help(X[m],challenge,lang==="fr"?"Observe les éléments déjà appris.":"Schau auf die bereits gelernten Elemente.");return}resetAttempts();challenge()}
function challenge(){
 let round=0,lives=3;
 function recognition(){
  if(round===6)return finalOdd();
  let target=Math.floor(Math.random()*X.length),opts=sh([target,...sh([...Array(X.length).keys()].filter(i=>i!==target)).slice(0,3)]);
  G.innerHTML=`<main><div class=phase>🎯 ${lang==="fr"?"RECONNAÎTRE":"ERKENNEN"}</div><div class=hearts>${"❤️".repeat(lives)}</div>
  <h2>${lang==="fr"?'Trouve le fruit de l’Esprit demandé.':'Finde die genannte Frucht des Geistes.'}</h2>
  <div class=card><button onclick="say(X[${target}])">🔊 ${lang==="fr"?"ÉCOUTER":"ANHÖREN"}</button></div>
  <div class=grid>${opts.map(i=>`<button class=choice onclick="window.rec(${i},${target})">${I[i]} ${X[i]}</button>`).join("")}</div></main>`;
  say(X[target]);
  window.rec=(i,t)=>{
   if(i!==t){lives=Math.max(0,lives-1);help(X[t],()=>{round++;lives=3;recognition()},lang==="fr"?"Écoute encore attentivement le nom.":"Höre den Namen noch einmal genau an.");return}
   resetAttempts();round++;lives=3;toast("✨ "+(lang==="fr"?"Correct !":"Richtig!"));setTimeout(recognition,300);
  }
 }
 function finalOdd(){
  let bad=lang==="fr"?'Jalousie 😠':'Eifersucht 😠',ids=sh([...Array(X.length).keys()]).slice(0,3);
  G.innerHTML=`<main><div class=phase>🕵️ INTRUS</div><h2>${lang==="fr"?'Lequel n’est PAS un fruit de l’Esprit ?':'Was ist KEINE Frucht des Geistes?'}</h2>
  <div class=grid>${sh([...ids,-1]).map(i=>`<button class=choice onclick="window.fo(${i})">${i<0?bad:I[i]+" "+X[i]}</button>`).join("")}</div></main>`;
  window.fo=i=>{if(i!==-1){help(bad,()=>reward(lang==="fr"?"Challenge réussi !":"Challenge geschafft!",'🍎'),lang==="fr"?"Cherche celui qui ne fait pas partie du groupe.":"Suche, was nicht zur Gruppe gehört.");return}reward(lang==="fr"?"Challenge réussi !":"Challenge geschafft!",'🍎')}
 }
 recognition();
}
learn();