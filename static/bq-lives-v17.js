(function(){
if(window.BQLives)return;
const lang=localStorage.getItem("bibelquiz_language")==="fr"?"fr":"de";
let state={lives:3,reserve_lives:0},ready=false;
function token(){return localStorage.getItem("token")||""}
async function api(path,opt={}){let t=token();if(!t)throw new Error("NO_AUTH");let r=await fetch(path,{...opt,headers:{...(opt.headers||{}),"Authorization":"Bearer "+t,"Content-Type":"application/json"}});if(!r.ok)throw new Error("HTTP_"+r.status);return r.json()}
function html(){return "❤️".repeat(state.lives)+"🖤".repeat(Math.max(0,3-state.lives))+` <span class=bq-reserve>💛 ${state.reserve_lives}</span>`}
function paint(){document.querySelectorAll("[data-bq-lives]").forEach(x=>x.innerHTML=html())}
async function load(){try{state=await api("/api/lives");ready=true;paint()}catch(e){ready=false}return state}
async function spend(){state=await api("/api/lives/spend",{method:"POST"});paint();return state}
async function gain(n){state=await api("/api/lives/gain",{method:"POST",body:JSON.stringify({count:n})});paint();return state}
function zero(){return state.lives<=0&&state.reserve_lives<=0}
function bonus(retry){let q=0,won=0,Q=lang==="fr"?[["Combien d’apôtres ?",12,[7,10,12,40]],["Combien d’Évangiles ?",4,[2,4,5,12]],["Combien de Commandements ?",10,[7,9,10,12]]]:[["Wie viele Apostel?",12,[7,10,12,40]],["Wie viele Evangelien?",4,[2,4,5,12]],["Wie viele Gebote?",10,[7,9,10,12]]];let G=document.getElementById("game");function ask(){if(q===3){gain(won).then(()=>{G.innerHTML=`<main><div class=reward><h1>❤️ ${won}/3</h1><p>${html()}</p><button id=bqContinue>${lang==="fr"?"CONTINUER":"WEITER"}</button></div></main>`;bqContinue.onclick=retry});return}let z=Q[q],opts=[...z[2]].sort(()=>Math.random()-.5);G.innerHTML=`<main><h2>❤️ BONUS ${q+1}/3</h2><p>${z[0]}</p><div class=grid>${opts.map((x,i)=>`<button class=choice data-bq="${i}">${x}</button>`).join("")}</div></main>`;document.querySelectorAll("[data-bq]").forEach((b,i)=>b.onclick=()=>{if(opts[i]===z[1])won++;q++;ask()})}ask()}
async function lose(retry){await spend();if(!zero())return true;let G=document.getElementById("game");G.innerHTML=`<main><div class=reward><h1>💔 ${lang==="fr"?"Plus de vies":"Keine Leben mehr"}</h1><p>${html()}</p><button id=bqBonus>❤️ ${lang==="fr"?"GAGNER DES VIES":"LEBEN GEWINNEN"}</button></div></main>`;bqBonus.onclick=()=>bonus(retry);return false}
window.BQLives={load,spend,gain,lose,bonus,html,state:()=>state,zero};
window.addEventListener("DOMContentLoaded",load);
})();