(function(){
if(window.BQAudio)return;
const lang=localStorage.getItem("bibelquiz_language")==="fr"?"fr":"de";
let audio=null,enabled=false,started=false,voice=null;
function initMusic(){if(audio)return;audio=new Audio(lang==="fr"?"/static/race/audio/etre-disciple-de-jesus.m4a":"/static/race/audio/10-gebote-v2.m4a");audio.loop=true;audio.preload="auto";audio.volume=.28}
async function music(){initMusic();enabled=!enabled;let b=document.getElementById("bqMusicBtn");if(!enabled){audio.pause();if(b)b.textContent=lang==="fr"?"▶️ MUSIQUE":"▶️ MUSIK";return}try{await audio.play();started=true;if(b)b.textContent=lang==="fr"?"⏸️ MUSIQUE":"⏸️ MUSIK"}catch(e){started=false;if(b)b.textContent=lang==="fr"?"▶️ MUSIQUE":"▶️ MUSIK"}}
function unlock(){initMusic();try{if("speechSynthesis"in window)speechSynthesis.resume()}catch(e){}}
function pickVoice(){if(!("speechSynthesis"in window))return null;let vs=speechSynthesis.getVoices()||[];return vs.find(v=>String(v.lang||"").toLowerCase().startsWith(lang))||null}
function speak(text){unlock();if(!("speechSynthesis"in window))return false;try{speechSynthesis.cancel();speechSynthesis.resume();let u=new SpeechSynthesisUtterance(String(text||""));u.lang=lang==="fr"?"fr-FR":"de-DE";u.rate=.82;u.pitch=1;voice=pickVoice();if(voice)u.voice=voice;if(audio&&enabled)audio.volume=.07;u.onend=()=>{if(audio&&enabled)audio.volume=.28};u.onerror=()=>{if(audio&&enabled)audio.volume=.28};speechSynthesis.speak(u);setTimeout(()=>speechSynthesis.resume(),80);return true}catch(e){return false}}
document.addEventListener("pointerdown",unlock,{capture:true,once:true});document.addEventListener("touchstart",unlock,{capture:true,once:true});
window.BQAudio={speak,music,unlock};
window.addEventListener("DOMContentLoaded",()=>{let old=document.querySelector(".bq-music");if(old)old.remove();let d=document.createElement("div");d.className="bq-music";d.innerHTML='<button id="bqMusicBtn" type="button">'+(lang==="fr"?"▶️ MUSIQUE":"▶️ MUSIK")+'</button>' ;document.body.appendChild(d);document.getElementById("bqMusicBtn").addEventListener("click",music)});
})();