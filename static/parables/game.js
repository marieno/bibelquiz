const lang=localStorage.getItem("bibelquiz_language")==="fr"?"fr":"de",G=document.getElementById("game"),sh=a=>[...a].sort(()=>Math.random()-.5);function say(x){if(!("speechSynthesis"in window))return;try{speechSynthesis.cancel();speechSynthesis.resume();let u=new SpeechSynthesisUtterance(String(x));u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.82;speechSynthesis.speak(u)}catch(e){}}function toast(x){let d=document.createElement("div");d.className="toast";d.textContent=x;document.body.appendChild(d);setTimeout(()=>d.remove(),1200)}function wrong(){toast(lang==="fr"?"😊 Presque ! Essaie encore.":"😊 Fast! Versuch es noch einmal.")}function reward(x,b){G.innerHTML=`<main><div class=reward><div class=badge>${b}</div><div class=stars>⭐ ⭐ ⭐</div><h1>${x}</h1><p>${lang==="fr"?"Badge gagné !":"Abzeichen gewonnen!"}</p><button onclick="location.reload()">🔄</button> <button onclick="location.href='/'">← BibelQuiz</button></div></main>`}function head(x,n,t){return `<header><button onclick="location.href='/'">← BibelQuiz</button><h2>${x}</h2><b>${n}/${t}</b></header><div class=progress><i style="width:${Math.min(100,n/t*100)}%"></i></div>`}const X=lang==="fr"?["La brebis perdue", "Le bon Samaritain", "Le fils prodigue", "Le semeur", "Le grain de moutarde", "Les dix vierges", "Les talents", "La maison sur le roc"]:["Das verlorene Schaf", "Der barmherzige Samariter", "Der verlorene Sohn", "Der Sämann", "Das Senfkorn", "Die zehn Jungfrauen", "Die Talente", "Das Haus auf dem Felsen"],I=["🐑", "🤝", "🏠", "🌱", "🌾", "🪔", "💰", "🪨"];let n=0,lives=3;let attempts=0;function resetAttempts(){attempts=0}function help(correct,onNext,hint){attempts++;if(attempts===1){toast(lang==="fr"?"😊 Presque ! Essaie encore.":"😊 Fast! Versuch es noch einmal.");return}if(attempts===2){toast("💡 "+hint);return}G.innerHTML+=`<div class=correct-reveal>📖 ${lang==="fr"?"Bonne réponse":"Richtige Antwort"}: <b>${correct}</b><br><button class=next-btn id=helpNext>${lang==="fr"?"CONTINUER →":"WEITER →"}</button></div>`;say(correct);document.getElementById("helpNext").onclick=()=>{resetAttempts();onNext()}}
function learn(){if(n===X.length)return odd();G.innerHTML=`<main>${head(lang==="fr"?"Paraboles de J\u00e9sus":"Gleichnisse Jesu",n,X.length)}<div class=phase>${lang==="fr"?"1. APPRENDRE":"1. LERNEN"}</div><div class="scene themed"><div class=sceneIcon>${I[n]}</div></div><div class=card><h1>${n+1}. ${X[n]}</h1><button onclick="say(X[n])">🔊</button> <button class=next-btn onclick="n++;learn()">✨ ${lang==="fr"?"SUIVANT":"WEITER"}</button></div></main>`;say(X[n])}
function odd(){let bad=lang==="fr"?"Football":"Fu\u00dfball",o=sh([0,1,2,-1]);G.innerHTML=`<main><div class=phase>🕵️ ${lang==="fr"?"2. TROUVE L’INTRUS":"2. FINDE DEN EINDRINGLING"}</div><h2>${lang==="fr"?'Lequel n’est pas une parabole de cette aventure ?':'Was ist kein Gleichnis aus diesem Abenteuer?'}</h2><div class=grid>${o.map(i=>`<button class=choice onclick="oddPick(${i})">${i<0?bad:I[i]+" "+X[i]}</button>`).join("")}</div></main>`}
function oddPick(i){if(i!==-1){help(lang==="fr"?'Football':'Fußball',missing,lang==="fr"?"Cherche celui qui n’appartient pas au groupe.":"Suche, was nicht zur Gruppe gehört.");return}resetAttempts();missing()}
function missing(){let m=Math.floor(X.length/2),o=sh([m,...sh([...Array(X.length).keys()].filter(i=>i!==m)).slice(0,3)]);G.innerHTML=`<main><h2>${lang==="fr"?'🐑 Une parabole parmi celles apprises a été cachée. Laquelle ?':'🐑 Eines der gelernten Gleichnisse wurde verdeckt. Welches?'}</h2><div class=phase>❓ ${lang==="fr"?"3. QUI MANQUE ?":"3. WAS FEHLT?"}</div><div class=slots>${X.map((x,i)=>`<span class=slot>${i===m?"❓":I[i]+" "+x}</span>`).join("")}</div><div class=grid>${o.map(i=>`<button class=choice onclick="miss(${i},${m})">${X[i]}</button>`).join("")}</div></main>`}
function miss(i,m){if(i!==m){help(X[m],challenge,lang==="fr"?"Observe les éléments déjà appris.":"Schau auf die bereits gelernten Elemente.");return}resetAttempts();challenge()}
function challenge(){
 let round=0,lives=3;
 function recognition(){
  if(round===6)return finalOdd();
  let target=Math.floor(Math.random()*X.length),opts=sh([target,...sh([...Array(X.length).keys()].filter(i=>i!==target)).slice(0,3)]);
  G.innerHTML=`<main><div class=phase>🎯 ${lang==="fr"?"RECONNAÎTRE":"ERKENNEN"}</div><div class=hearts>${"❤️".repeat(lives)}</div>
  <h2>${lang==="fr"?'Trouve la parabole de Jésus demandée.':'Finde das genannte Gleichnis Jesu.'}</h2>
  <div class=card><button onclick="say(X[${target}])">🔊 ${lang==="fr"?"ÉCOUTER":"ANHÖREN"}</button></div>
  <div class=grid>${opts.map(i=>`<button class=choice onclick="window.rec(${i},${target})">${I[i]} ${X[i]}</button>`).join("")}</div></main>`;
  say(X[target]);
  window.rec=(i,t)=>{
   if(i!==t){lives=Math.max(0,lives-1);help(X[t],()=>{round++;lives=3;recognition()},lang==="fr"?"Écoute encore attentivement le nom.":"Höre den Namen noch einmal genau an.");return}
   resetAttempts();round++;lives=3;toast("✨ "+(lang==="fr"?"Correct !":"Richtig!"));setTimeout(recognition,300);
  }
 }
 function finalOdd(){
  let bad=lang==="fr"?'Football ⚽':'Fußball ⚽',ids=sh([...Array(X.length).keys()]).slice(0,3);
  G.innerHTML=`<main><div class=phase>🕵️ INTRUS</div><h2>${lang==="fr"?'Laquelle n’est PAS une parabole de ce jeu ?':'Was ist KEIN Gleichnis aus diesem Spiel?'}</h2>
  <div class=grid>${sh([...ids,-1]).map(i=>`<button class=choice onclick="window.fo(${i})">${i<0?bad:I[i]+" "+X[i]}</button>`).join("")}</div></main>`;
  window.fo=i=>{if(i!==-1){help(bad,()=>reward(lang==="fr"?"Challenge réussi !":"Challenge geschafft!",'🐑'),lang==="fr"?"Cherche celui qui ne fait pas partie du groupe.":"Suche, was nicht zur Gruppe gehört.");return}reward(lang==="fr"?"Challenge réussi !":"Challenge geschafft!",'🐑')}
 }
 recognition();
}
learn();