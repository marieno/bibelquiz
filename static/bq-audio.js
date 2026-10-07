(function(){
if(window.BQAudio)return;
let ctx=null,musicOn=false,musicTimer=null,idx=0,unlocked=false;
const lang=localStorage.getItem("bibelquiz_language")==="fr"?"fr":"de";
const melody=lang==="fr"?[262,330,392,440,392,349,330,294]:[294,370,440,494,440,392,370,330];
function ensure(){try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();unlocked=true;if("speechSynthesis"in window)speechSynthesis.resume()}catch(e){}}
function tone(f){ensure();if(!ctx)return;let o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.value=f;g.gain.setValueAtTime(.035,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.32);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.33)}
function loop(){if(!musicOn)return;tone(melody[idx++%melody.length]);musicTimer=setTimeout(loop,460)}
function music(){ensure();musicOn=!musicOn;let b=document.getElementById("bqMusicBtn");if(b)b.textContent=musicOn?"🎵":"🔇";clearTimeout(musicTimer);if(musicOn)loop()}
function speak(text){ensure();if(!("speechSynthesis"in window))return false;try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(String(text||""));u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.82;let vs=speechSynthesis.getVoices()||[],v=vs.find(x=>String(x.lang||"").toLowerCase().startsWith(lang));if(v)u.voice=v;speechSynthesis.speak(u);setTimeout(()=>speechSynthesis.resume(),80);return true}catch(e){return false}}
function unlock(){ensure();document.removeEventListener("pointerdown",unlock,true);document.removeEventListener("touchstart",unlock,true);document.removeEventListener("click",unlock,true)}
document.addEventListener("pointerdown",unlock,true);document.addEventListener("touchstart",unlock,true);document.addEventListener("click",unlock,true);
window.BQAudio={speak,music,ensure};
window.addEventListener("DOMContentLoaded",()=>{let old=document.querySelector(".bq-music");if(old)old.remove();let d=document.createElement("div");d.className="bq-music";d.innerHTML='<button id="bqMusicBtn">🔇</button>';document.body.appendChild(d);document.getElementById("bqMusicBtn").onclick=music});
})();