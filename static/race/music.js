const raceMusic={
 audio:null,
 enabled:true,
 normalVolume:.34,
 questionVolume:.09,
 started:false,
 init(language){
  const current=(language||window.raceLanguage||localStorage.lang||"de").toLowerCase();
  const src=current==="fr"
   ?"/static/race/audio/etre-disciple-de-jesus.m4a"
   :"/static/race/audio/10-gebote-v2.m4a";
  this.audio=new Audio(src);
  this.audio.loop=true;
  this.audio.preload="auto";
  this.audio.volume=this.normalVolume;
 },
 async start(){
  if(!this.audio)this.init(window.raceLanguage||"de");
  if(!this.enabled)return;
  try{await this.audio.play();this.started=true;this.updateButton()}catch(e){this.started=false;this.updateButton()}
 },
 stop(){if(this.audio){this.audio.pause();this.audio.currentTime=0}this.started=false;this.updateButton()},
 toggle(){
  this.enabled=!this.enabled;
  if(this.enabled)this.start();else if(this.audio)this.audio.pause();
  this.updateButton();
 },
 duck(){if(this.audio&&this.enabled)this.audio.volume=this.questionVolume},
 restore(){if(this.audio&&this.enabled)this.audio.volume=this.normalVolume},
 updateButton(){
  const b=document.getElementById("musicToggle");
  if(b)b.textContent=this.enabled?"🎵":"🔇";
 },
 installButton(){
  if(document.getElementById("musicToggle"))return;
  const b=document.createElement("button");
  b.id="musicToggle";b.type="button";b.className="music-toggle";
  b.setAttribute("aria-label","Musik an/aus");
  b.textContent=this.enabled?"🎵":"🔇";
  b.addEventListener("click",()=>this.toggle());
  document.body.appendChild(b);
 }
};
window.raceMusic=raceMusic;
