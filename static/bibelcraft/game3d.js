import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const $=id=>document.getElementById(id), stage=$('stage'),notice=$('notice'), key='bibelcraft-world-3d-v1';
let lang=localStorage.getItem('bq_lang')==='de'?'de':'fr', selected='wood', blocks=new Map(), yaw=0, pitch=-.23, held=new Set(), dragging=null;
const words={fr:{title:'Explore et construis !',mission:'Construis une maison avec au moins 8 briques et 4 blocs de bois.',hint:'Flèches / ZQSD pour marcher, glisser pour regarder. Vise puis appuie sur ＋ ou 🧽.',saved:'Monde sauvegardé sur cet appareil.',done:'Bravo ! Mission accomplie.',reset:'Effacer ce monde 3D ?',error:'Impossible de charger le moteur 3D. Vérifie la connexion Internet.'},de:{title:'Entdecke und baue!',mission:'Baue ein Haus mit mindestens 8 Ziegel- und 4 Holzblöcken.',hint:'Pfeiltasten / WASD zum Laufen, ziehen zum Schauen. Zielen und ＋ oder 🧽 drücken.',saved:'Welt auf diesem Gerät gespeichert.',done:'Super! Mission erfüllt.',reset:'Diese 3D-Welt löschen?',error:'3D-Motor konnte nicht geladen werden. Internetverbindung prüfen.'}};
const types={wood:['🪵',0xa97945],stone:['🪨',0x919aa2],brick:['🧱',0xc86c52],glass:['🪟',0x8bd6e4],gold:['⭐',0xe8c34e],leaf:['🌿',0x4b9e48]};
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9ddfff);scene.fog=new THREE.Fog(0x9ddfff,20,52);
const camera=new THREE.PerspectiveCamera(72,1,.1,100);const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=false;stage.insertBefore(renderer.domElement,stage.firstChild);
scene.add(new THREE.HemisphereLight(0xffffff,0x718c59,2));const sun=new THREE.DirectionalLight(0xffffff,1.5);sun.position.set(8,18,6);scene.add(sun);
const ground=new THREE.Mesh(new THREE.BoxGeometry(32,.35,32),new THREE.MeshLambertMaterial({color:0x76bb60}));ground.position.y=-.2;scene.add(ground);
const grid=new THREE.GridHelper(32,32,0x5b9e52,0x5b9e52);grid.position.y=.005;scene.add(grid);
const cube=new THREE.BoxGeometry(1,1,1), materials=Object.fromEntries(Object.entries(types).map(([k,v])=>[k,new THREE.MeshLambertMaterial({color:v[1],transparent:k==='glass',opacity:k==='glass'?.62:1})]));
const group=new THREE.Group();scene.add(group);const player=new THREE.Group();scene.add(player);const body=new THREE.Mesh(new THREE.BoxGeometry(.6,.9,.4),new THREE.MeshLambertMaterial({color:0x376ed5}));body.position.y=.95;player.add(body);const head=new THREE.Mesh(new THREE.BoxGeometry(.52,.52,.52),new THREE.MeshLambertMaterial({color:0xf4c79a}));head.position.y=1.65;player.add(head);
const pos=new THREE.Vector3(0,0,5);let selectedTarget=null;
function valid(x,y,z){return Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z)&&Math.abs(x)<=15&&Math.abs(z)<=15&&y>=0&&y<=9}
function id(x,y,z){return `${x},${y},${z}`}
function put(x,y,z,type){if(!valid(x,y,z)||!types[type]||blocks.size>=900&&!blocks.has(id(x,y,z)))return false;const k=id(x,y,z);if(blocks.has(k))group.remove(blocks.get(k).mesh);const mesh=new THREE.Mesh(cube,materials[type]);mesh.position.set(x,y+.5,z);mesh.userData={x,y,z};group.add(mesh);blocks.set(k,{type,mesh});return true}
function del(x,y,z){const k=id(x,y,z),entry=blocks.get(k);if(entry){group.remove(entry.mesh);blocks.delete(k)}}
function persist(){try{localStorage.setItem(key,JSON.stringify([...blocks].map(([k,v])=>[k,v.type])))}catch(e){$('message').textContent='Sauvegarde indisponible'}}
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))for(const item of saved.slice(0,900)){if(!Array.isArray(item)||item.length!==2)continue;const coords=String(item[0]).split(',').map(Number);if(coords.length===3)put(...coords,item[1])}}catch(e){}
if(!blocks.size){for(let i=0;i<4;i++){put(-5, i, -5,'wood');put(5,i,-4,'wood')}for(const [x,z] of [[-5,-5],[5,-4]])for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[0,0]])put(x+dx,4,z+dz,'leaf');persist()}
function refresh(){const t=words[lang];$('title').textContent=t.title;$('mission').textContent=t.mission;$('hint').textContent=t.hint;$('lang').value=lang;const p=$('palette');p.replaceChildren();for(const [k,[emoji]] of Object.entries(types)){const b=document.createElement('button');b.textContent=emoji+' '+k;b.className=k===selected?'active':'';b.onclick=()=>{selected=k;refresh()};p.append(b)}const vals=[...blocks.values()].map(v=>v.type),bricks=vals.filter(x=>x==='brick').length,woods=vals.filter(x=>x==='wood').length;$('status').textContent=`${blocks.size} blocs · 🧱 ${bricks}/8 · 🪵 ${woods}/4`;if(bricks>=8&&woods>=4)$('message').textContent=t.done}
function direction(){return new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))}
const ray=new THREE.Raycaster();function target(){ray.set(camera.position,direction());const hits=ray.intersectObjects(group.children,false);return hits.find(h=>h.distance<7)||null}
function edit(remove){const hit=target();if(!hit){$('message').textContent=lang==='fr'?'Approche-toi et vise un bloc.':'Gehe näher und ziele auf einen Block.';return}const d=hit.object.userData;if(remove)del(d.x,d.y,d.z);else{const n=hit.face.normal;const x=d.x+Math.round(n.x),y=d.y+Math.round(n.y),z=d.z+Math.round(n.z);if(Math.abs(x-pos.x)<.7&&Math.abs(z-pos.z)<.7&&y<2)return;put(x,y,z,selected)}persist();refresh()}
$('place').onclick=()=>edit(false);$('remove').onclick=()=>edit(true);$('save').onclick=()=>{persist();$('message').textContent=words[lang].saved};$('reset').onclick=()=>{if(confirm(words[lang].reset)){for(const v of blocks.values())group.remove(v.mesh);blocks.clear();persist();$('message').textContent='';refresh()}};$('lang').onchange=e=>{lang=e.target.value;refresh()};$('turnL').onclick=()=>yaw-=Math.PI/6;$('turnR').onclick=()=>yaw+=Math.PI/6;
const keys={arrowup:'forward',w:'forward',z:'forward',arrowdown:'back',s:'back',arrowleft:'left',a:'left',q:'left',arrowright:'right',d:'right'};
window.addEventListener('keydown',e=>{const d=keys[e.key.toLowerCase()];if(d){held.add(d);e.preventDefault()}if(e.key===' ')edit(false);if(e.key==='Backspace')edit(true)});window.addEventListener('keyup',e=>{const d=keys[e.key.toLowerCase()];if(d)held.delete(d)});window.addEventListener('blur',()=>held.clear());
for(const b of stage.querySelectorAll('[data-dir]')){const d=b.dataset.dir;b.addEventListener('pointerdown',e=>{e.preventDefault();held.add(d);b.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held.delete(d))}
renderer.domElement.addEventListener('pointerdown',e=>{dragging={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;yaw-=(e.clientX-dragging.x)*.006;pitch=Math.max(-1.2,Math.min(.8,pitch-(e.clientY-dragging.y)*.004));dragging={x:e.clientX,y:e.clientY}});renderer.domElement.addEventListener('pointerup',()=>dragging=null);renderer.domElement.addEventListener('pointercancel',()=>dragging=null);
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(stage);resize();
let last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const forward=Number(held.has('forward'))-Number(held.has('back')),side=Number(held.has('right'))-Number(held.has('left'));const speed=4.5*dt;pos.x+= (Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed;pos.z+=(-Math.cos(yaw)*forward+Math.sin(yaw)*side)*speed;pos.x=Math.max(-15,Math.min(15,pos.x));pos.z=Math.max(-15,Math.min(15,pos.z));player.position.copy(pos);player.rotation.y=yaw;camera.position.set(pos.x,2.9,pos.z+0);camera.position.add(new THREE.Vector3(-Math.sin(yaw)*3.6,1.3,Math.cos(yaw)*3.6));const aim=new THREE.Vector3(pos.x+Math.sin(yaw)*3,1.45+Math.sin(pitch)*4,pos.z-Math.cos(yaw)*3);camera.lookAt(aim);renderer.render(scene,camera);requestAnimationFrame(frame)}
// Aim from the actual camera direction, not from a separate orientation estimate.
function actualTarget(){ray.setFromCamera(new THREE.Vector2(0,0),camera);return ray.intersectObjects(group.children,false).find(h=>h.distance<9)||null}
// Replace target with camera-centered raycast for third-person aiming.
target=actualTarget;

// BibelCraft V2: friendly inhabitants, animals and an educational exploration trail.
const inhabitants=[];
function makeCreature(x,z,kind,color){
 const root=new THREE.Group();root.position.set(x,0,z);
 const mat=new THREE.MeshLambertMaterial({color});
 const torso=new THREE.Mesh(new THREE.BoxGeometry(kind==='sheep'?.95:.55,kind==='sheep'?.65:.85,kind==='sheep'?.65:.42),mat);
 torso.position.y=kind==='sheep'?.8:1;root.add(torso);
 const face=new THREE.Mesh(new THREE.BoxGeometry(.43,.43,.43),new THREE.MeshLambertMaterial({color:kind==='sheep'?0x777777:0xf2c9a0}));
 face.position.set(0,kind==='sheep'?.95:1.68,kind==='sheep'?.46:0);root.add(face);
 if(kind==='sheep')for(const a of [-.3,.3])for(const b of [-.25,.25]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,.42,.16),new THREE.MeshLambertMaterial({color:0x595c62}));leg.position.set(a,.24,b);root.add(leg)}
 scene.add(root);inhabitants.push({root,kind,originX:x,originZ:z});
}
makeCreature(-3,2,'sheep',0xf5f1e8);makeCreature(4,4,'sheep',0xf4e5c4);makeCreature(2,-4,'guide',0x9365b5);
const learning={fr:{guide:'Bienvenue ! Pour construire une maison solide, combien de côtés possède un carré ?',answers:['3','4','5'],right:1,good:'Bravo ! Un carré a quatre côtés. Continue à construire !',bad:'Essaie encore : compte les côtés d’une brique vue de face.',sheep:'Tu as rencontré un mouton ! Prends soin des animaux et de la création.',far:'Approche-toi du personnage violet ou d’un mouton.',interact:'💬 Parler',dialog:'Défi du guide'},de:{guide:'Willkommen! Wie viele Seiten hat ein Quadrat?',answers:['3','4','5'],right:1,good:'Super! Ein Quadrat hat vier Seiten. Bau weiter!',bad:'Versuche es erneut: Zähle die Seiten eines Quadrats.',sheep:'Du hast ein Schaf getroffen! Kümmere dich um die Tiere und die Schöpfung.',far:'Gehe näher zur violetten Figur oder zu einem Schaf.',interact:'💬 Sprechen',dialog:'Aufgabe des Guides'}};
const talkButton=document.createElement('button');talkButton.id='talk';talkButton.type='button';$('actions').append(talkButton);
const dialog=document.createElement('section');dialog.id='learning-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(92%,370px);background:#fffdf1;color:#17334c;border:3px solid #e5bd59;border-radius:18px;padding:18px;z-index:5;box-shadow:0 12px 40px #0005';stage.append(dialog);
function closeDialog(){dialog.hidden=true;dialog.replaceChildren()}
function openGuide(){const t=learning[lang];dialog.hidden=false;dialog.replaceChildren();const heading=document.createElement('h3');heading.textContent=t.dialog;const question=document.createElement('p');question.textContent=t.guide;dialog.append(heading,question);for(let i=0;i<3;i++){const b=document.createElement('button');b.textContent=t.answers[i];b.style.margin='5px';b.onclick=()=>{const answer=document.createElement('p');answer.textContent=i===t.right?t.good:t.bad;answer.setAttribute('aria-live','polite');dialog.replaceChildren(heading,question,answer);const close=document.createElement('button');close.textContent='OK';close.onclick=closeDialog;dialog.append(close);if(i===t.right){localStorage.setItem('bibelcraft-guide-challenge','done');$('message').textContent=t.good}};dialog.append(b)}const close=document.createElement('button');close.textContent='✕';close.setAttribute('aria-label','Fermer / Schließen');close.onclick=closeDialog;dialog.append(close)}
function interact(){const nearest=inhabitants.map(n=>({...n,d:Math.hypot(n.root.position.x-pos.x,n.root.position.z-pos.z)})).sort((a,b)=>a.d-b.d)[0];if(!nearest||nearest.d>3.2){$('message').textContent=learning[lang].far;return}if(nearest.kind==='guide')openGuide();else $('message').textContent=learning[lang].sheep}
talkButton.onclick=interact;
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&!e.repeat&&dialog.hidden){interact()}});
$('lang').addEventListener('change',()=>{talkButton.textContent=learning[lang].interact});talkButton.textContent=learning[lang].interact;
// Lightweight idle animation without timers or network requests.
function animateInhabitants(t){for(const [i,n] of inhabitants.entries()){n.root.position.y=Math.sin(t*.0015+i)*.045;n.root.rotation.y=Math.sin(t*.0004+i)*.25}requestAnimationFrame(animateInhabitants)}requestAnimationFrame(animateInhabitants);



// V19.6: Noé — mission narrative facultative, distincte du récit biblique.
const noahText={
 fr:{heading:'🚢 L’arche de Noé',intro:'Dans la Bible, Dieu demande à Noé de construire une arche (Genèse 6–9). Ici, tu réalises une construction inspirée de cette histoire.',step1:'Étape 1 : place au moins 12 blocs de bois pour préparer ton arche.',step2:'Étape 2 : approche-toi des deux moutons et parle-leur pour les accueillir.',step3:'Étape 3 : retrouve le guide violet pour terminer l’aventure.',finish:'Bravo ! Tu as terminé l’aventure inspirée de Noé. La Bible nous parle de confiance et d’obéissance à Dieu.',verse:'À lire en famille : Genèse 6:22.',label:'🚢 Mission Noé',progress:'Progression',reset:'Recommencer la mission',sheep:'Mouton accueilli !',guide:'Mission terminée !'},
 de:{heading:'🚢 Noahs Arche',intro:'In der Bibel erhält Noah von Gott den Auftrag, eine Arche zu bauen (1. Mose 6–9). Hier baust du etwas, das von der Geschichte inspiriert ist.',step1:'Schritt 1: Setze mindestens 12 Holzblöcke für deine Arche.',step2:'Schritt 2: Gehe zu beiden Schafen und sprich mit ihnen.',step3:'Schritt 3: Gehe zum violetten Begleiter, um das Abenteuer abzuschließen.',finish:'Super! Du hast Noahs Abenteuer geschafft. Die Bibel erzählt von Vertrauen und Gehorsam gegenüber Gott.',verse:'Lest gemeinsam: 1. Mose 6,22.',label:'🚢 Noah-Mission',progress:'Fortschritt',reset:'Mission neu starten',sheep:'Schaf begrüßt!',guide:'Mission abgeschlossen!'}
};
const noahKey='bibelcraft-noah-v1';
let noah={met:[],done:false};
try{const loaded=JSON.parse(localStorage.getItem(noahKey)||'{}');if(Array.isArray(loaded.met))noah.met=loaded.met.filter(x=>Number.isInteger(x)&&x>=0&&x<2);noah.done=loaded.done===true}catch(e){}
function saveNoah(){try{localStorage.setItem(noahKey,JSON.stringify(noah))}catch(e){}}
const noahPanel=document.createElement('section');noahPanel.id='noah-mission';noahPanel.style.cssText='border:2px solid #e2c87b;border-radius:14px;padding:12px;margin-top:12px;background:#fff5d7';document.querySelector('aside').append(noahPanel);
function woodCount(){return [...blocks.values()].filter(b=>b.type==='wood').length}
function noahStep(){if(noah.done)return 4;if(woodCount()<12)return 1;if(noah.met.length<2)return 2;return 3}
function renderNoah(){const t=noahText[lang],step=noahStep();noahPanel.replaceChildren();const h=document.createElement('h3');h.textContent=t.heading;noahPanel.append(h);const p=document.createElement('p');p.textContent=t.intro;noahPanel.append(p);const instruction=document.createElement('p');instruction.textContent=step===1?t.step1:step===2?t.step2:step===3?t.step3:t.finish;noahPanel.append(instruction);const progress=document.createElement('p');progress.textContent=`${t.progress} : ${step===4?3:step-1}/3 · 🪵 ${woodCount()}/12 · 🐑 ${noah.met.length}/2`;noahPanel.append(progress);if(step===4){const verse=document.createElement('p');verse.textContent=t.verse;noahPanel.append(verse)}const restart=document.createElement('button');restart.type='button';restart.textContent=t.reset;restart.onclick=()=>{noah={met:[],done:false};saveNoah();renderNoah()};noahPanel.append(restart)}
const oldRefresh=refresh;refresh=function(){oldRefresh();renderNoah()};
const oldInteract=interact;interact=function(){const nearest=inhabitants.map((n,i)=>({n,i,d:Math.hypot(n.root.position.x-pos.x,n.root.position.z-pos.z)})).sort((a,b)=>a.d-b.d)[0];if(nearest&&nearest.d<=3.2){if(nearest.n.kind==='sheep'&&woodCount()>=12){if(!noah.met.includes(nearest.i)){noah.met.push(nearest.i);saveNoah();$('message').textContent=noahText[lang].sheep}renderNoah()}else if(nearest.n.kind==='guide'&&noahStep()===3){noah.done=true;saveNoah();$('message').textContent=noahText[lang].guide;renderNoah();return}}oldInteract()};
talkButton.onclick=()=>interact();
renderNoah();


// V19.7 — David le berger. Activité libre, sans vies ni pénalités.
// Les moutons restent dans le monde; leur déplacement est lent et borné.
const davidKey='bibelcraft-david-v1';
const davidWords={
 fr:{title:'🐑 David, le jeune berger',intro:'Dans 1 Samuel 16–17, David est berger avant de devenir roi. Cette aventure est inspirée de son travail de berger.',start:'Approche-toi des deux moutons et retrouve-les. Appuie sur « Parler » pour les rassembler.',progress:'Moutons retrouvés',done:'Bravo ! Tu as retrouvé les deux moutons. David prenait soin du troupeau confié à sa garde.',verse:'À découvrir en famille : 1 Samuel 17:34–37.',restart:'Recommencer David',found:'Un mouton retrouvé !',already:'Ce mouton a déjà été retrouvé.'},
 de:{title:'🐑 David, der junge Hirte',intro:'In 1. Samuel 16–17 ist David Hirte, bevor er König wird. Dieses Abenteuer ist von seiner Arbeit als Hirte inspiriert.',start:'Finde beide Schafe. Geh nahe heran und drücke auf „Sprechen“, um sie zu sammeln.',progress:'Gefundene Schafe',done:'Super! Du hast beide Schafe gefunden. David kümmerte sich um seine Herde.',verse:'Lest gemeinsam: 1. Samuel 17,34–37.',restart:'David-Mission neu starten',found:'Ein Schaf gefunden!',already:'Dieses Schaf wurde schon gefunden.'}
};
let david={found:[]};
try{const d=JSON.parse(localStorage.getItem(davidKey)||'{}');if(Array.isArray(d.found))david.found=[...new Set(d.found.filter(i=>i===0||i===1))]}catch(e){}
function saveDavid(){try{localStorage.setItem(davidKey,JSON.stringify(david))}catch(e){}}
const davidPanel=document.createElement('section');davidPanel.id='david-mission';davidPanel.style.cssText='border:2px solid #a2c98a;border-radius:14px;padding:12px;margin-top:12px;background:#eaf8dd';document.querySelector('aside').append(davidPanel);
function renderDavid(){const t=davidWords[lang];davidPanel.replaceChildren();const h=document.createElement('h3');h.textContent=t.title;const intro=document.createElement('p');intro.textContent=t.intro;const instruction=document.createElement('p');instruction.textContent=david.found.length===2?t.done:t.start;const count=document.createElement('p');count.textContent=`${t.progress} : ${david.found.length}/2`;davidPanel.append(h,intro,instruction,count);if(david.found.length===2){const verse=document.createElement('p');verse.textContent=t.verse;davidPanel.append(verse)}const restart=document.createElement('button');restart.type='button';restart.textContent=t.restart;restart.onclick=()=>{david={found:[]};saveDavid();renderDavid()};davidPanel.append(restart)}
// Conserve la logique de Noé : une interaction peut compter pour les deux aventures.
const interactNoah=interact;
interact=function(){const closest=inhabitants.map((n,i)=>({n,i,d:Math.hypot(n.root.position.x-pos.x,n.root.position.z-pos.z)})).sort((a,b)=>a.d-b.d)[0];if(closest&&closest.d<=3.2&&closest.n.kind==='sheep'&&closest.i<2){if(!david.found.includes(closest.i)){david.found.push(closest.i);saveDavid();$('message').textContent=davidWords[lang].found}else{$('message').textContent=davidWords[lang].already}renderDavid()}interactNoah()};
talkButton.onclick=()=>interact();
// Animation douce des moutons, sans boucle réseau ni recalcul de la scène.
const sheepHomes=inhabitants.slice(0,2).map(n=>({x:n.originX,z:n.originZ}));
function moveSheep(t){inhabitants.slice(0,2).forEach((n,i)=>{const home=sheepHomes[i];const a=t*.00024+i*2.7;n.root.position.x=home.x+Math.sin(a)*1.15;n.root.position.z=home.z+Math.cos(a*.8)*1.05;n.root.rotation.y=a+.6});requestAnimationFrame(moveSheep)}
requestAnimationFrame(moveSheep);
const refreshNoah=refresh;refresh=function(){refreshNoah();renderDavid()};
renderDavid();

notice.textContent=lang==='fr'?'Explore ton monde !':'Erkunde deine Welt!';setTimeout(()=>{notice.textContent=''},4000);refresh();requestAnimationFrame(frame);


// V19.8 — Le village de l'entraide (Jean 13:34–35).
// Une aventure facultative : les autres missions et le mode construction restent disponibles.
const villageKey='bibelcraft-village-v1';
const villageWords={
 fr:{title:'🏡 Le village de l’entraide',intro:'Jésus nous enseigne à nous aimer les uns les autres (Jean 13:34–35). Construis, cultive et partage dans ce village imaginaire.',build:'Construis une maison : place 8 blocs de briques.',garden:'Prépare un jardin : plante 3 graines dans les parcelles.',share:'Approche-toi de l’habitante près du jardin et partage ta récolte avec elle.',done:'Bravo ! Tu as construit, cultivé et partagé. À lire en famille : Jean 13:34–35.',progress:'Étapes terminées',plant:'🌱 Planter',planted:'Une graine plantée !',already:'Cette parcelle est déjà cultivée.',tooFar:'Approche-toi du jardin.',shared:'Merci pour ton aide !',reset:'Recommencer le village',talk:'💬 Parler',resident:'Habitante du village'},
 de:{title:'🏡 Dorf der Nächstenliebe',intro:'Jesus lehrt uns, einander zu lieben (Johannes 13,34–35). Baue, pflanze und teile in diesem erfundenen Dorf.',build:'Baue ein Haus: Setze 8 Ziegelblöcke.',garden:'Lege einen Garten an: Pflanze 3 Samen in die Beete.',share:'Geh zur Dorfbewohnerin am Garten und teile deine Ernte.',done:'Super! Du hast gebaut, gepflanzt und geteilt. Lest gemeinsam: Johannes 13,34–35.',progress:'Abgeschlossene Schritte',plant:'🌱 Pflanzen',planted:'Ein Samen wurde gepflanzt!',already:'Dieses Beet ist schon bepflanzt.',tooFar:'Geh näher zum Garten.',shared:'Danke für deine Hilfe!',reset:'Dorf neu starten',talk:'💬 Sprechen',resident:'Dorfbewohnerin'}
};
let village={plots:[],shared:false};
try{const v=JSON.parse(localStorage.getItem(villageKey)||'{}');if(Array.isArray(v.plots))village.plots=[...new Set(v.plots.filter(i=>Number.isInteger(i)&&i>=0&&i<3))];village.shared=v.shared===true}catch(e){}
function saveVillage(){try{localStorage.setItem(villageKey,JSON.stringify(village))}catch(e){}}
const villagePanel=document.createElement('section');villagePanel.id='village-mission';villagePanel.style.cssText='border:2px solid #9bc8a3;border-radius:14px;padding:12px;margin-top:12px;background:#e9f9ee';document.querySelector('aside').append(villagePanel);
const gardenPlots=[[7,2],[8,2],[9,2]];
const gardenMeshes=[];
const soilMaterial=new THREE.MeshLambertMaterial({color:0x795337});
const cropMaterial=new THREE.MeshLambertMaterial({color:0x36a354});
gardenPlots.forEach(([x,z],i)=>{const soil=new THREE.Mesh(new THREE.BoxGeometry(.85,.15,.85),soilMaterial);soil.position.set(x,.09,z);scene.add(soil);const crop=new THREE.Mesh(new THREE.BoxGeometry(.22,.55,.22),cropMaterial);crop.position.set(x,.4,z);crop.visible=village.plots.includes(i);scene.add(crop);gardenMeshes.push(crop)});
makeCreature(7,5,'villager',0x4aaf89);
const resident=inhabitants[inhabitants.length-1];
const plantButton=document.createElement('button');plantButton.id='plant-village';plantButton.type='button';plantButton.style.cssText='background:#d9f5cb';document.querySelector('aside .bar').append(plantButton);
function brickCount(){return [...blocks.values()].filter(b=>b.type==='brick').length}
function villageStage(){if(brickCount()<8)return 0;if(village.plots.length<3)return 1;if(!village.shared)return 2;return 3}
function renderVillage(){const t=villageWords[lang],step=villageStage();plantButton.textContent=t.plant;villagePanel.replaceChildren();const h=document.createElement('h3');h.textContent=t.title;const intro=document.createElement('p');intro.textContent=t.intro;const task=document.createElement('p');task.textContent=[t.build,t.garden,t.share,t.done][step];const progress=document.createElement('p');progress.textContent=`${t.progress} : ${step}/3 · 🧱 ${Math.min(8,brickCount())}/8 · 🌱 ${village.plots.length}/3`;villagePanel.append(h,intro,task,progress);const reset=document.createElement('button');reset.type='button';reset.textContent=t.reset;reset.onclick=()=>{village={plots:[],shared:false};gardenMeshes.forEach(c=>c.visible=false);saveVillage();renderVillage()};villagePanel.append(reset)}
plantButton.onclick=()=>{const t=villageWords[lang];if(villageStage()!==1){$('message').textContent=[t.build,t.garden,t.share,t.done][villageStage()];return}const available=gardenPlots.map(([x,z],i)=>({i,d:Math.hypot(x-pos.x,z-pos.z)})).filter(a=>a.d<2.5).sort((a,b)=>a.d-b.d);if(!available.length){$('message').textContent=t.tooFar;return}const plot=available.find(a=>!village.plots.includes(a.i));if(!plot){$('message').textContent=t.already;return}village.plots.push(plot.i);gardenMeshes[plot.i].visible=true;saveVillage();$('message').textContent=t.planted;renderVillage()};
const interactDavid=interact;
interact=function(){const d=Math.hypot(resident.root.position.x-pos.x,resident.root.position.z-pos.z);if(d<3.2){const t=villageWords[lang];if(villageStage()===2){village.shared=true;saveVillage();$('message').textContent=t.shared;renderVillage()}else $('message').textContent=[t.build,t.garden,t.share,t.done][villageStage()];return}interactDavid()};
talkButton.onclick=()=>interact();
const refreshDavid=refresh;refresh=function(){refreshDavid();renderVillage()};
renderVillage();
