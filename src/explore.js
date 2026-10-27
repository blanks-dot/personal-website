import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStereoPlayer } from './stereo.js?v=20261014d';
import { CONTENT } from './portfolio-content.js?v=20261014personal4';
import { paloAltoNow } from './palo-alto-time.js?v=20261014personal4';

const C = {paper:0xf8f3ec,ink:0x34251c,blue:0x244d92,grass:0x9daa8a,track:0xbf795e,line:0xf5eee2,wood:0xb99067,darkWood:0x806145,skin:0xe6bc99,hi:0xe0e98e,metal:0x8b9397};
const ORDER=['right-now','run-your-city','podcast','paintings','resume','say-hi'];
const NAMES=['Right now','Run Your City','Out of Our Depth','Paints by Blanks','Résumé','Say hi'];
const canvas=document.getElementById('scene');
let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }
catch { location.replace('/'+location.hash); throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(C.paper);scene.fog=new THREE.Fog(C.paper,100,200);
const camera=new THREE.PerspectiveCamera(36,1,.1,240);
const home=new THREE.Vector3(),homeLook=new THREE.Vector3(0,5,-7),camPos=new THREE.Vector3(),camLook=homeLook.clone(),camTarget=new THREE.Vector3(),lookTarget=homeLook.clone();
let current=null,sandboxFocused=false,hovered=null,phone=false,paused=false,t=0,clock=new THREE.Clock(),lastTrigger=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hemi=new THREE.HemisphereLight(0xf1f2ec,0x8b9879,1.25),ambient=new THREE.AmbientLight(0xf0f2ed,.3);
const sun=new THREE.DirectionalLight(0xfff8ec,2.8);sun.position.set(-24,40,18);sun.castShadow=true;
sun.shadow.mapSize.set(innerWidth<760?1024:2048,innerWidth<760?1024:2048);Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:120});sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;sun.shadow.radius=4;
scene.add(hemi,ambient,sun);
const materialCache=new Map();
function mat(color,options={}){const key=String(color)+Object.entries(options).map(([name,value])=>name+':'+(value?.isTexture?value.uuid:JSON.stringify(value))).join(',');if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness:.9,metalness:0,...options}));return materialCache.get(key);}
function mesh(geo,color,x=0,y=0,z=0,material){const m=new THREE.Mesh(geo,material||mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
const box=(w,h,d,c,x=0,y=0,z=0,r=.035,material)=>mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2,h/2,d/2)),c,x,y,z,material);
const cyl=(r,h,c,x=0,y=0,z=0,material)=>mesh(new THREE.CylinderGeometry(r,r,h,12),c,x,y,z,material);
const sphere=(r,c,x=0,y=0,z=0)=>mesh(new THREE.SphereGeometry(r,16,12),c,x,y,z);
const capsule=(r,length,c)=>mesh(new THREE.CapsuleGeometry(r,Math.max(.01,length-r*2),4,12),c);
let seed=4819;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function texture(draw,size=256){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tx;}
const turf=texture((x,s)=>{x.fillStyle='#ededed';x.fillRect(0,0,s,s);for(let i=0;i<12000;i++){const v=160+Math.floor(random()*90);x.strokeStyle=`rgba(${v},${v},${v},.14)`;x.beginPath();const a=random()*s,b=random()*s;x.moveTo(a,b);x.lineTo(a+random()*3-1.5,b-2-random()*3);x.stroke();}});turf.wrapS=turf.wrapT=THREE.RepeatWrapping;turf.repeat.set(104,96);
const woodTex=texture((x,s)=>{x.fillStyle='#f3f0eb';x.fillRect(0,0,s,s);for(let i=0;i<170;i++){const at=random()*s;x.strokeStyle=`rgba(83,67,52,${.025+random()*.035})`;x.beginPath();x.moveTo(at,0);x.bezierCurveTo(at+random()*9,90,at-random()*7,180,at+3,s);x.stroke();}});woodTex.wrapS=woodTex.wrapT=THREE.RepeatWrapping;
const woodMat=new THREE.MeshStandardMaterial({color:C.wood,map:woodTex,roughness:.86});
const fabric=texture((x,s)=>{x.fillStyle='#bcbcbc';x.fillRect(0,0,s,s);for(let i=0;i<s;i+=3){x.strokeStyle=i%2?'#ababab':'#d0d0d0';x.beginPath();x.moveTo(i,0);x.lineTo(i,s);x.moveTo(0,i);x.lineTo(s,i);x.stroke();}});fabric.wrapS=fabric.wrapT=THREE.RepeatWrapping;fabric.repeat.set(5,5);
const rubber=texture((x,s)=>{x.fillStyle='#b7b7b7';x.fillRect(0,0,s,s);for(let i=0;i<9000;i++){x.fillStyle=random()>.5?'#d5d5d5':'#929292';x.fillRect(random()*s,random()*s,.8,.8);}});rubber.wrapS=rubber.wrapT=THREE.RepeatWrapping;rubber.repeat.set(70,35);
const gravel=texture((x,s)=>{x.fillStyle='#d1c4ac';x.fillRect(0,0,s,s);for(let i=0;i<5000;i++){const v=150+Math.floor(random()*90);x.fillStyle=`rgb(${v},${v-8},${v-19})`;x.beginPath();x.ellipse(random()*s,random()*s,1+random()*2,.6+random(),random()*3,0,7);x.fill();}});gravel.wrapS=gravel.wrapT=THREE.RepeatWrapping;gravel.repeat.set(5,12);
const cloth=(color)=>mat(color,{bumpMap:fabric,bumpScale:.009,roughness:.97});
const linenMat=cloth(0xe9dfcc),rugMat=cloth(0xcbbb9b),stoneMat=mat(0xf1e5ce,{map:gravel,bumpMap:gravel,bumpScale:.02,roughness:1});
const assetManager=new THREE.LoadingManager();const assetsReady=new Promise(resolve=>{assetManager.onLoad=resolve;});const loader=new THREE.TextureLoader(assetManager);function picture(src){const tx=loader.load(src);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;return tx;}
const R=11.5,L=23,W=6,TZ=-8;
function oval(r){const s=new THREE.Shape();s.absarc(L/2,0,r,-Math.PI/2,Math.PI/2,false);s.absarc(-L/2,0,r,Math.PI/2,Math.PI*1.5,false);s.closePath();return s;}
function flat(geo,color,y=0,material){const m=mesh(geo,color,0,y,TZ,material);m.rotation.x=-Math.PI/2;m.castShadow=false;scene.add(m);return m;}
const grassPhoto=loader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/terrain/grasslight-big.jpg',undefined,undefined,()=>{groundMaterial.map=turf;groundMaterial.color.setHex(C.grass);groundMaterial.needsUpdate=true;});grassPhoto.colorSpace=THREE.SRGBColorSpace;grassPhoto.wrapS=grassPhoto.wrapT=THREE.RepeatWrapping;grassPhoto.repeat.set(122,112);grassPhoto.anisotropy=8;
const groundMaterial=new THREE.MeshStandardMaterial({color:0xdfe4d3,map:grassPhoto,roughness:1});
groundMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb = mix(vec3(.25,.31,.15), diffuseColor.rgb, .58); diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(.2126,.7152,.0722))), diffuseColor.rgb, .9);');};
flat(new THREE.PlaneGeometry(1000,800),C.grass,-.025,groundMaterial);
const trackShape=oval(R+W/2);trackShape.holes.push(oval(R-W/2));flat(new THREE.ShapeGeometry(trackShape,80),C.track,.025,mat(C.track,{bumpMap:rubber,bumpScale:.016,roughness:1}));
for(let i=0;i<=5;i++){const r=R-W/2+i*W/5,shape=oval(r+.022);shape.holes.push(oval(r-.022));const line=flat(new THREE.ShapeGeometry(shape,80),C.line,.04);line.receiveShadow=false;}
for(const x of [-6,5]){const line=flat(new THREE.PlaneGeometry(.24,W),C.line,.042);line.position.set(x,.042,TZ+R);line.receiveShadow=false;}

// Fine leaves and branches give the trees a natural silhouette at this scale.
function tree(x,z,scale=1){
 const group=new THREE.Group();group.add(cyl(.22,5,C.darkWood,0,2.5,0));
 for(let i=0;i<5;i++){const branch=capsule(.07,2.7,C.darkWood);branch.position.set(Math.cos(i*1.7)*.5,4,Math.sin(i*1.7)*.5);branch.rotation.z=.5*Math.sin(i*1.7);branch.rotation.x=.5*Math.cos(i*1.7);group.add(branch);}
 const count=innerWidth<760?1800:2800,geo=leafGeo,leafMat=new THREE.MeshStandardMaterial({color:0xffffff,side:THREE.DoubleSide,roughness:.9});
 const leaves=new THREE.InstancedMesh(geo,leafMat,count),dummy=new THREE.Object3D(),color=new THREE.Color();
 for(let i=0;i<count;i++){const angle=random()*Math.PI*2,u=random()*2-1,rad=Math.cbrt(random())*3.5;dummy.position.set(Math.cos(angle)*Math.sqrt(1-u*u)*rad,5.1+u*rad*.78,Math.sin(angle)*Math.sqrt(1-u*u)*rad);dummy.rotation.set(random()*3,random()*3,random()*3);const s=.32+random()*.48;dummy.scale.set(s,s,s);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);color.setHex(0x718459).multiplyScalar(.83+random()*.32);leaves.setColorAt(i,color);}
 leaves.castShadow=true;leaves.receiveShadow=true;group.add(leaves);group.scale.setScalar(scale);group.position.set(x,0,z);scene.add(group);
}


// Human proportions, shaped anatomy and fabric keep the figures out of toy territory.
function person({scale=1,top=C.blue,skin=C.skin,hair=0x634d3c,long=false,shorts=0x454954,child=false}={}){
 const g=new THREE.Group(),hip=child?.73:.86,shoulder=child?1.23:1.43,headY=child?1.44:1.665,headR=child?.139:.128;
 const skinMat=mat(skin,{roughness:.69}),shirtMat=cloth(top),shortMat=cloth(shorts);
 function shaped(points,material,x=0,y=0,z=0,depth=1){const m=mesh(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),24),0,x,y,z,material);m.scale.z=depth;return m;}
 const torso=shaped([[.152,hip+.02],[.16,hip+.1],[.151,hip+.23],[.18,shoulder-.15],[.205,shoulder-.04],[.17,shoulder+.025],[.062,shoulder+.065]],shirtMat,0,0,0,.76);g.add(torso);
 const pelvis=box(.32,.16,.23,shorts,0,hip+.02,0,.065,shortMat);g.add(pelvis,cyl(.047,.14,skin,0,shoulder+.10,0,skinMat));
 const headRig=new THREE.Group();headRig.position.set(0,headY,.007);g.add(headRig);
 const faceMap=texture((ctx,n)=>{
  ctx.fillStyle='#'+skin.toString(16).padStart(6,'0');ctx.fillRect(0,0,n,n);
  // The front of Three's sphere is u=.25. Keep features small and warm in contrast.
  for(const side of [-1,1]){const x=n*(.25+side*.045),y=n*.465;ctx.strokeStyle='rgba(71,49,37,.72)';ctx.lineWidth=n*.003;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-n*.012,y);ctx.quadraticCurveTo(x,y-n*.006,x+n*.012,y);ctx.stroke();ctx.fillStyle='rgba(62,43,33,.72)';ctx.beginPath();ctx.ellipse(x,y+n*.001,n*.0038,n*.0042,0,0,7);ctx.fill();ctx.strokeStyle='rgba(77,54,39,.35)';ctx.lineWidth=n*.003;ctx.beginPath();ctx.moveTo(x-n*.014,y-n*.019);ctx.quadraticCurveTo(x,y-n*.025,x+n*.012,y-n*.018);ctx.stroke();}
  ctx.strokeStyle='rgba(139,82,66,.45)';ctx.lineWidth=n*.003;ctx.beginPath();ctx.moveTo(n*.229,n*.584);ctx.quadraticCurveTo(n*.25,n*.596,n*.271,n*.584);ctx.stroke();
 },512);
 const headGeo=new THREE.SphereGeometry(headR,40,28),pos=headGeo.attributes.position;
 for(let i=0;i<pos.count;i++){let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const ny=y/headR;
  if(ny<-.15)x*=1-(Math.abs(ny)-.15)*.19;
  if(z>0){const bridge=Math.exp(-Math.pow(x/.024,2)-Math.pow((y+.009)/.04,2))*.017;z+=bridge;}
  pos.setXYZ(i,x,y,z);
 }headGeo.computeVertexNormals();
 const head=mesh(headGeo,0,0,0,0,new THREE.MeshStandardMaterial({map:faceMap,roughness:.82}));head.scale.set(.9,1.08,.92);headRig.add(head);
 for(const x of [-headR*.87,headR*.87]){const ear=sphere(.014,skin,x,-.008,.003);ear.material=skinMat;ear.scale.set(.5,1.4,.8);headRig.add(ear);}
 const scalpGeo=new THREE.SphereGeometry(headR*1.04,40,24,0,Math.PI*2,0,Math.PI*.68),hp=scalpGeo.attributes.position;
 for(let i=0;i<hp.count;i++){const x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i),radius=Math.hypot(x,y,z),phi=Math.atan2(z,x),row=Math.acos(Math.max(-1,Math.min(1,y/radius)))/(Math.PI*.68),front=Math.max(0,Math.sin(phi)),theta=row*(2.1-front*.81+.035*Math.sin(phi*5));hp.setXYZ(i,Math.cos(phi)*Math.sin(theta)*radius,Math.cos(theta)*radius,Math.sin(phi)*Math.sin(theta)*radius);}scalpGeo.computeVertexNormals();
 const scalp=mesh(scalpGeo,hair,0,.012,-.006);scalp.scale.set(.91,1.07,.93);headRig.add(scalp);
 let tail=null;if(long){const tie=sphere(.027,hair,0,.005,-.134);headRig.add(tie);tail=capsule(.032,.25,hair);tail.position.set(0,-.09,-.16);tail.rotation.x=.3;headRig.add(tail);}
 function limb(x,y,upperLength,lowerLength,isLeg){
  const upper=new THREE.Group();upper.position.set(x,y,0);
  const upperShape=isLeg?[[.038,0],[.043,.06],[.062,upperLength*.48],[.074,upperLength*.85],[.056,upperLength]]:[[.026,0],[.038,upperLength*.42],[.052,upperLength*.82],[.038,upperLength]];
  const a=shaped(upperShape,skinMat,0,-upperLength,0,isLeg?.86:.89);upper.add(a);
  if(isLeg){const hem=shaped([[.072,0],[.081,.1],[.073,.19]],shortMat,0,-.18,0,.87);upper.add(hem);}else if(!long||child){const sleeve=shaped([[.05,0],[.057,.075],[.056,.135]],shirtMat,0,-.125,0,.94);upper.add(sleeve);}
  const lower=new THREE.Group();lower.position.y=-upperLength;
  const lowerShape=isLeg?[[.028,0],[.035,lowerLength*.18],[.055,lowerLength*.62],[.041,lowerLength]]:[[.021,0],[.036,lowerLength*.38],[.032,lowerLength*.75],[.027,lowerLength]];
  const b=shaped(lowerShape,skinMat,0,-lowerLength,0,isLeg?.83:.89);lower.add(b);
  const joint=sphere(isLeg?.041:.028,skin,0,0,0);joint.material=skinMat;joint.scale.z=.86;lower.add(joint);
  if(isLeg){const shoe=box(.105,.071,.24,0xe6e2d9,0,-lowerLength+.008,.044,.034);lower.add(shoe,box(.108,.019,.25,0xc8c9c5,0,-lowerLength-.025,.046,.008));const sock=cyl(.031,.06,C.paper,0,-lowerLength+.065,0);lower.add(sock);}else{const hand=sphere(.029,skin,0,-lowerLength-.027,.006);hand.material=skinMat;hand.scale.set(.8,1.6,.7);lower.add(hand);const thumb=capsule(.009,.043,skin);thumb.position.set(x<0?.025:-.025,-lowerLength-.021,.01);thumb.rotation.z=x<0?-.45:.45;thumb.material=skinMat;lower.add(thumb);}
  upper.add(lower);g.add(upper);return {upper,lower};
 }
 const arms=[limb(-.19,shoulder-.015,child?.245:.305,child?.23:.275,false),limb(.19,shoulder-.015,child?.245:.305,child?.23:.275,false)],legs=[limb(-.087,hip,child?.34:.40,child?.34:.40,true),limb(.087,hip,child?.34:.40,child?.34:.40,true)];
 arms.forEach((a,i)=>{a.upper.rotation.z=i===0?.07:-.07;a.lower.rotation.x=-.14;});g.userData={arms,legs,tail,head:headRig,torso};g.scale.setScalar(scale);return g;
}

const runners=[];
function runner(options,lane,phase,speed){const figure=person(options),path=oval(R-W/2+lane).getSpacedPoints(900).map(v=>new THREE.Vector3(v.x,0,-v.y+TZ));scene.add(figure);runners.push({figure,path,phase,speed,offset:random()*6});}
runner({scale:1.58,top:0xeee8df,long:true,hair:0xa48959},3.7,.39,39);
runner({scale:1.65,top:C.blue,skin:0xc09477,hair:0x45382d},4.6,.74,43);
function animateRunner(r,dt){r.phase=(r.phase+dt/r.speed)%1;const p=r.phase*(r.path.length-1),i=Math.floor(p),mix=p-i,a=r.path[i],b=r.path[(i+1)%r.path.length],ahead=r.path[(i+5)%r.path.length];r.figure.position.copy(a).lerp(b,mix);r.figure.lookAt(ahead.x,0,ahead.z);r.figure.rotateX(.085);const stride=t*7+r.offset;r.figure.position.y=Math.abs(Math.sin(stride))*.065*r.figure.scale.x;const limbs=r.figure.userData;for(let j=0;j<2;j++){const s=Math.sin(stride+j*Math.PI);limbs.legs[j].upper.rotation.x=s*.65;limbs.legs[j].lower.rotation.x=.15+Math.max(0,-s)*1.25;limbs.arms[j].upper.rotation.x=-s*.5;limbs.arms[j].upper.rotation.z=j===0?.05:-.05;limbs.arms[j].lower.rotation.x=-1.05;}if(limbs.tail)limbs.tail.rotation.x=.4+Math.sin(stride)*.13;}

const childRunners=[],greeters=[],textRedraws=[];
let mentor=null;
function addChildren(group){
 const colours=[C.hi,C.blue,0xd59b8b,0x65979c,0xa29ac2,0xeee5cf,0xb77d65,0x78969d];
 for(let i=0;i<8;i++){
  const figure=person({child:true,scale:.91+(i%3)*.055,top:colours[i],skin:[0xb78059,C.skin,0x936744,C.skin,0xc6966d][i%5],hair:[0x413126,0xa1814f,0x352a22,0x79604a,0x3f332b][i%5],long:i===1||i===3||i===6});
  figure.traverse(o=>{if(o.isMesh)o.userData.stop='run-your-city';});group.add(figure);childRunners.push({figure,phase:i*Math.PI*2/8});
 }
 mentor=person({scale:1.48,top:0xeee3c7,hair:0x473729,long:true});mentor.position.set(4.7,0,-2.9);mentor.rotation.y=-.55;mentor.userData.arms.forEach(a=>{a.upper.rotation.x=-.8;a.lower.rotation.x=-1.4;});group.add(mentor);mentor.traverse(o=>{if(o.isMesh)o.userData.stop='run-your-city';});
}
function animateChildren(){
 childRunners.forEach(({figure,phase})=>{const angle=t*.72+phase;figure.position.set(Math.cos(angle)*4.15,Math.abs(Math.sin(t*9+phase))*.065,.12+Math.sin(angle)*1.62);figure.rotation.y=Math.atan2(-4.15*Math.sin(angle),1.62*Math.cos(angle));const limbs=figure.userData;for(let j=0;j<2;j++){const sw=Math.sin(t*9+phase+j*Math.PI);limbs.legs[j].upper.rotation.x=sw*.82;limbs.legs[j].lower.rotation.x=.12+Math.max(0,-sw)*1.18;limbs.arms[j].upper.rotation.x=-sw*.68;limbs.arms[j].lower.rotation.x=-.95;}if(limbs.tail)limbs.tail.rotation.x=.4+Math.sin(t*9+phase)*.19;});
}
function written(text,bg='#f8f3ec',ink='#2440b8'){
 const c=document.createElement('canvas');c.width=768;c.height=192;const x=c.getContext('2d'),tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
 const draw=()=>{x.fillStyle=bg;x.fillRect(0,0,768,192);x.fillStyle=ink;x.textAlign='center';x.textBaseline='middle';x.font='96px "Give You Glory", cursive';x.fillText(text,384,103);tx.needsUpdate=true;};draw();textRedraws.push(draw);return tx;
}
function printLabel(text,width=1,height=.3,bg='#f8f3ec',ink='#244d92'){
 const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*height/width));const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';let size=Math.round(c.height*.64);ctx.font='600 '+size+'px Poppins, sans-serif';while(ctx.measureText(text).width>c.width*.88&&size>12){ctx.font='600 '+(--size)+'px Poppins, sans-serif';}ctx.fillText(text,c.width/2,c.height/2);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 const label=mesh(new THREE.PlaneGeometry(width,height),0,0,0,0,new THREE.MeshBasicMaterial({map}));label.castShadow=false;return label;
}
function institutionBook(title,color,x,y,z,height=1.18){
 const g=new THREE.Group(),w=.34,d=.62;
 g.add(box(w,height,d,color,0,height/2,0,.018),box(w-.055,height-.06,d-.05,C.paper,0,height/2,-.005,.008));
 for(const side of [-1,1])g.add(box(.026,height,d,color,side*(w/2-.013),height/2,0,.008));
 const c=document.createElement('canvas');c.width=256;c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.fillRect(0,0,256,1024);ctx.translate(128,512);ctx.rotate(-Math.PI/2);ctx.fillStyle='#f8f3ec';let fontSize=104;ctx.font='600 '+fontSize+'px Poppins, sans-serif';while(ctx.measureText(title).width>850)ctx.font='600 '+(--fontSize)+'px Poppins, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(title,0,0);ctx.fillRect(-430,-90,860,3);ctx.fillRect(-430,90,860,3);const spineMap=new THREE.CanvasTexture(c);spineMap.colorSpace=THREE.SRGBColorSpace;
 const spine=mesh(new THREE.PlaneGeometry(w-.015,height-.025),0,0,height/2,d/2+.008,new THREE.MeshStandardMaterial({map:spineMap,roughness:.85}));g.add(spine);g.position.set(x,y,z);return g;
}
function trainingCone(x,z){
 const g=new THREE.Group();g.add(box(.34,.035,.34,0xe57931,0,.025,0,.04),mesh(new THREE.CylinderGeometry(.022,.14,.42,24),0xe57931,0,.25,0));
 g.add(mesh(new THREE.CylinderGeometry(.067,.085,.065,24),C.paper,0,.29,0));g.position.set(x,0,z);return g;
}

function leafGeometry(){
 const p=[],ix=[];for(let i=0;i<=10;i++){const y=i/10,w=Math.sin(Math.PI*y)*.18;for(const side of [-1,1])p.push(side*w,y,Math.sin(y*Math.PI)*.1+Math.abs(side*w)*.25);if(i<10){const n=i*2;ix.push(n,n+1,n+2,n+1,n+3,n+2);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(ix);geo.computeVertexNormals();return geo;
}
const leafGeo=leafGeometry();
[[-23,-29,1.35],[-14,-35,1.12],[-6,-38,1.2],[5,-39,1.35],[12,-40,1.1],[18,-33,1.35],[28,-26,1.17]].forEach(a=>tree(...a));
function path(points,width=.62){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.045,p[1]))),verts=[],indices=[],uv=[];
 for(let i=0;i<=100;i++){const p=curve.getPoint(i/100),tangent=curve.getTangent(i/100),side=new THREE.Vector3(-tangent.z,0,tangent.x).multiplyScalar(width/2);verts.push(p.x+side.x,p.y,p.z+side.z,p.x-side.x,p.y,p.z-side.z);uv.push(0,i/100,1,i/100);if(i<100){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const m=mesh(geo,0,0,0,0,stoneMat);m.castShadow=false;scene.add(m);
}
function parasol(group,x,z){
 const g=new THREE.Group();g.position.set(x,0,z);g.add(cyl(.045,4.35,C.darkWood,0,2.18,0));
 const geometry=new THREE.ConeGeometry(2.25,.72,12,1,true),canopy=mesh(geometry,0,0,4.1,0,new THREE.MeshStandardMaterial({color:0xebe0c9,bumpMap:fabric,bumpScale:.006,roughness:.96,side:THREE.DoubleSide}));g.add(canopy);
 for(let i=0;i<12;i++){const angle=i*Math.PI/6,end=new THREE.Vector3(Math.cos(angle)*2.25,3.74,Math.sin(angle)*2.25),rib=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,4.43,0),end]),new THREE.LineBasicMaterial({color:0xb6a78d}));g.add(rib);}g.add(sphere(.07,C.darkWood,0,4.49,0));group.add(g);
}
function seated(group,x,z,{top=C.blue,long=false,hair=0x554434,skin=C.skin}={}){
 const f=person({scale:1.46,top,long,hair,skin});f.position.set(x,.795-.86*1.46,z+.12);
 f.userData.legs.forEach((l,i)=>{l.upper.rotation.x=-Math.PI/2;l.upper.rotation.z=i===0?.055:-.055;l.lower.rotation.x=Math.PI/2;l.lower.scale.y=1.25;});
 f.userData.arms.forEach((a,i)=>{a.upper.rotation.x=-.42;a.upper.rotation.z=i===0?-.14:.14;a.lower.rotation.x=-1.05;});group.add(f);return f;
}

// Family in the center, with six more fans in relaxed groups around them.
const bleachers=new THREE.Group();
for(let row=0;row<3;row++){
 const z=-row*1.25,y=.65+row*.62;
 bleachers.add(box(17.6,.12,.66,C.blue,0,y,z,.045),box(17.6,.08,.42,0xbac0bc,0,y-.49,z+.64,.015));
 for(const x of [-7.8,-2.6,2.6,7.8]){
  bleachers.add(box(.075,y-.1,.075,C.metal,x,(y-.1)/2,z),box(.075,.08,1.05,C.metal,x,.07,z+.3));
  const brace=box(.055,Math.hypot(y-.18,.72),.055,C.metal,x,(y-.18)/2+.07,z+.36);brace.rotation.x=-Math.atan2(.72,y-.18);bleachers.add(brace);
 }
}
for(const x of [-8.7,8.7]){bleachers.add(cyl(.055,2.8,C.metal,x,1.4,-2.8));const rail=cyl(.045,3.3,C.metal,x,1.1,-1.35);rail.rotation.x=Math.PI/2;bleachers.add(rail);}
const backRail=cyl(.045,17.4,C.metal,0,2.65,-2.8);backRail.rotation.z=Math.PI/2;bleachers.add(backRail);bleachers.position.set(0,0,-27);scene.add(bleachers);
// Symbolic family figures; paired styling for Mary and her twin, without claiming likenesses.
const family=[
 {role:'Mary',x:-1.12,row:0,scale:1.48,top:C.blue,hair:0x806447,long:true},
 {role:'Twin sister',x:1.12,row:0,scale:1.48,top:0x89a29a,hair:0x806447,long:true},
 {role:'Mom',x:-2.5,row:1,scale:1.49,top:0xd3a28d,hair:0x786556,long:true},
 {role:'Dad',x:2.5,row:1,scale:1.61,top:0xe1d8c3,hair:0x7a766b},
 {role:'Older brother',x:-4.3,row:2,scale:1.67,top:0x6b8598,hair:0x65503d},
 {role:'Older brother',x:4.3,row:2,scale:1.70,top:0x89946c,hair:0x594735,wave:true}
];
const fans=[
 {x:-6.65,row:0,scale:1.54,top:0xd49977,hair:0x46352b,skin:0xb48261,long:true},
 {x:6.4,row:0,scale:1.58,top:0x8298a5,hair:0x483b30},
 {x:-5.5,row:1,scale:1.65,top:0xe3d19d,hair:0x4d4038,skin:0x9d7154},
 {x:5.4,row:1,scale:1.5,top:0xa398b5,hair:0x96734c,long:true},
 {x:-7.05,row:2,scale:1.54,top:0x87a89d,hair:0x453528,long:true},
 {x:7.0,row:2,scale:1.66,top:0xd29e8a,hair:0x3d3027,skin:0xb37d59}
];
function popcorn(){
 const g=new THREE.Group();g.add(box(.23,.30,.20,0xf6e6c6,0,.15,0,.02));
 for(const x of [-.08,0,.08]){g.add(box(.035,.27,.008,0xc76e5c,x,.15,.104,.003),box(.035,.27,.008,0xc76e5c,x,.15,-.104,.003));}
 for(let i=0;i<22;i++){
  const x=(random()-.5)*.20,z=(random()-.5)*.17,y=.31+random()*.055,kernel=sphere(.024,i%3?0xf6e4b5:0xe8cd8d,x,y,z);kernel.scale.set(1.15,.85,1);g.add(kernel);
  if(i%2===0)g.add(sphere(.016,0xffefd0,x+.018,y+.013,z));
 }return g;
}
function fanDrink(){const g=new THREE.Group();g.add(cyl(.073,.23,C.paper,0,.115,0),cyl(.076,.065,C.blue,0,.12,0),cyl(.08,.018,C.paper,0,.239,0));const straw=cyl(.009,.17,0xc47962,.018,.32,0);straw.rotation.z=.14;g.add(straw);return g;}
function held(f,prop,side=0){
 const arm=f.userData.arms[side];arm.upper.rotation.set(-.55,0,0);arm.lower.rotation.x=-1.12;
 prop.position.set(0,-.3,.025);prop.rotation.x=1.67;arm.lower.add(prop);
}
const spectators=[],snackers=[],pennants=[];
for(const [i,member] of [...family,...fans].entries()){
 const f=person({...member,shorts:0x4f5960}),seat=.65+member.row*.62;
 f.position.set(member.x,seat+.18-.86*member.scale,-member.row*1.25-.1);
 f.userData.legs.forEach((leg,j)=>{leg.upper.rotation.x=-Math.PI/2;leg.upper.rotation.z=j===0?.045:-.045;leg.lower.rotation.x=Math.PI/2;leg.lower.scale.y=.63/(.427*member.scale);});
 f.userData.arms.forEach((arm,j)=>{arm.upper.rotation.x=-.44;arm.upper.rotation.z=j===0?-.09:.09;arm.lower.rotation.x=-.95;});
 f.userData.head.rotation.y=(i%2===0?1:-1)*.12;
 if(member.wave){f.userData.arms[1].upper.rotation.z=-2.25;f.userData.arms[1].lower.rotation.x=-.55;}
 if([0,4,6,9].includes(i)){held(f,popcorn());snackers.push({figure:f,phase:i*.73});}
 if([2,3,7,10].includes(i))held(f,fanDrink());
 if(i===8){const cap=mesh(new THREE.SphereGeometry(.138,24,12,0,Math.PI*2,0,Math.PI/2),C.blue,0,.025,0);f.userData.head.add(cap,box(.22,.014,.18,C.blue,0,.028,.13,.045));}
 if(i===11){
  const arm=f.userData.arms[1];arm.upper.rotation.z=-2.25;arm.lower.rotation.x=-.55;
  const flag=new THREE.Group();flag.add(cyl(.012,.74,C.wood,0,.28,0));
  const shape=new THREE.Shape();shape.moveTo(0,.38);shape.lineTo(.47,.50);shape.lineTo(0,.65);shape.closePath();flag.add(mesh(new THREE.ShapeGeometry(shape),0,0,0,0,mat(0xe7dcad,{side:THREE.DoubleSide})));
  const stripe=box(.035,.25,.013,C.blue,.025,.515,.009,.002);flag.add(stripe);flag.position.set(0,-.31,0);flag.rotation.z=2.25;flag.rotation.x=.55;arm.lower.add(flag);pennants.push(f);
 }
 bleachers.add(f);spectators.push(f);
}
function animateFamily(){
 spectators.forEach((f,i)=>{f.userData.head.rotation.y=(i%2===0?1:-1)*.12+Math.sin(t*.5+i)*.055;});
 const arm=spectators[5].userData.arms[1];arm.upper.rotation.z=-2.25+Math.sin(t*1.7)*.10;
 snackers.forEach(({figure,phase})=>{const reach=Math.pow(Math.max(0,Math.sin(t*.7+phase)),6),a=figure.userData.arms[1];a.upper.rotation.x=-.44-reach*.53;a.lower.rotation.x=-.95-reach*.87;});
 pennants.forEach((f,i)=>{f.userData.arms[1].upper.rotation.z=-2.25+Math.sin(t*2.4+i)*.16;});
}
// A few belongings break the symmetry: a striped towel, tote, spare cap and cooler.
const towel=box(1.3,.035,.56,0xe8dbc5,-3.8,.735,.02,.025);towel.rotation.y=.12;bleachers.add(towel);
for(let i=0;i<5;i++)bleachers.add(box(.06,.008,.55,0x7b9dab,-4.29+i*.24,.759,.02,.002));
const tote=box(.62,.68,.28,0xd0aa7d,3.9,.35,.8,.09);bleachers.add(tote,mesh(new THREE.TorusGeometry(.16,.025,8,20,Math.PI),C.darkWood,3.9,.72,.8));
const spareCap=mesh(new THREE.SphereGeometry(.19,20,12,0,Math.PI*2,0,Math.PI/2),0xcb8b71,-.1,1.34,-1.25);bleachers.add(spareCap,box(.30,.025,.21,0xcb8b71,-.1,1.35,-1.07,.05));
const fanCooler=box(.9,.63,.65,0x7b9d9e,8.05,.33,.55,.08);bleachers.add(fanCooler,box(.95,.09,.69,C.paper,8.05,.69,.55,.035));
// The same snack details carry through to the café and picnic.

// Running shoes tucked beside the bleachers, with cobalt heel tabs and cream laces.
const trainers=new THREE.Group();
for(const x of [-.22,.22]){trainers.add(box(.3,.13,.65,C.paper,x,.09,0,.07),box(.31,.04,.67,0xc9c7bc,x,.027,0,.03),box(.22,.16,.22,C.blue,x,.17,-.2,.045));for(let i=0;i<3;i++)trainers.add(box(.22,.018,.024,C.paper,x,.17,-.05+i*.09,.006));}
trainers.rotation.y=-.35;trainers.position.set(-5.8,.01,-25.6);scene.add(trainers);

const raceClock=new THREE.Group();raceClock.position.set(-15.0,0,-2.3);raceClock.rotation.y=.10;
raceClock.add(box(3.05,1.23,.22,0x2f4048,0,2.42,0,.10));
for(const x of [-1.12,1.12])raceClock.add(box(.07,1.8,.07,C.metal,x,.93,-.04,.02),box(.55,.07,.55,C.metal,x,.06,-.04,.025));
const clockCanvas=document.createElement('canvas');clockCanvas.width=1024;clockCanvas.height=384;const clockInk=clockCanvas.getContext('2d'),clockMap=new THREE.CanvasTexture(clockCanvas);clockMap.colorSpace=THREE.SRGBColorSpace;
const clockFace=mesh(new THREE.PlaneGeometry(2.86,1.05),0,0,2.42,.121,new THREE.MeshBasicMaterial({map:clockMap}));clockFace.castShadow=false;raceClock.add(clockFace);scene.add(raceClock);
let lastWallSecond=-1,lastSolarMinute=-1;
function drawRaceClock(time){clockInk.fillStyle='#18272c';clockInk.fillRect(0,0,1024,384);clockInk.textAlign='center';clockInk.textBaseline='middle';clockInk.fillStyle='#d8dccc';clockInk.font='500 36px Poppins, sans-serif';clockInk.fillText('PALO ALTO',512,63);clockInk.fillStyle='#f2ad65';clockInk.font='600 152px monospace';clockInk.fillText(time,512,211);clockMap.needsUpdate=true;}

const hot=[],stops={},steam=[],talkers=[],patioLights=[];
const musicPickables=[],musicMeters=[];let stereoPlayer;const sandboxView=new THREE.Vector3(-7.6,0,-1.7);
function stop(group,id,marker){group.position.set(...marker.position);group.rotation.y=marker.rotation||0;group.traverse(o=>{if(o.isMesh)o.userData.stop=id;});scene.add(group);const number=ORDER.indexOf(id)+1,button=document.createElement('button');button.className='marker';button.setAttribute('aria-label',`${number}. ${NAMES[number-1]}`);button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="number" aria-hidden="true">${number}</span><span class="tooltip" aria-hidden="true">${NAMES[number-1]}</span>`;button.addEventListener('click',()=>go(id,button));button.addEventListener('pointerenter',()=>setHover(id));button.addEventListener('pointerleave',()=>setHover(null));button.addEventListener('focus',()=>setHover(id));button.addEventListener('blur',()=>setHover(null));document.getElementById('markers').append(button);hot.push(group);stops[id]={group,button,anchor:new THREE.Vector3(...marker.anchor),name:NAMES[number-1]};}
function table(width=3.4,height=1.6,depth=1.8){const g=new THREE.Group();g.add(box(width,.13,depth,C.wood,0,height,0,.03,woodMat));for(const x of [-width/2+.15,width/2-.15])for(const z of [-depth/2+.15,depth/2-.15])g.add(box(.09,height,.09,C.darkWood,x,height/2,z));return g;}
function mug(g,x,y,z){g.add(cyl(.16,.3,C.blue,x,y+.15,z));const handle=mesh(new THREE.TorusGeometry(.105,.024,6,14),C.blue,x+.18,y+.15,z);g.add(handle);g.add(cyl(.135,.012,C.darkWood,x,y+.304,z));const heart=new THREE.Shape();heart.moveTo(0,-.055);heart.bezierCurveTo(-.1,.01,-.06,.10,0,.048);heart.bezierCurveTo(.06,.10,.1,.01,0,-.055);const milk=mesh(new THREE.ShapeGeometry(heart),0xf0ddbb,x,y+.312,z);milk.rotation.x=-Math.PI/2;milk.castShadow=false;g.add(milk);for(let i=0;i<3;i++){const p=sphere(.035,C.paper,x,y+.42+i*.14,z);p.material=new THREE.MeshBasicMaterial({color:C.paper,transparent:true,opacity:.3,depthWrite:false});p.castShadow=false;g.add(p);steam.push({mesh:p,x,y:y+.35,z,offset:i/3});}}
{
 const g=table();g.add(box(1.1,.045,.7,C.blue,-.8,1.69,.12));const page=box(1.02,.012,.66,C.paper,-.8,1.72,.12);g.add(page);
 const base=box(1.05,.035,.72,0xc8ccd0,.25,1.69,-.18);g.add(base);const screen=box(1.05,.68,.055,0xa3aab1,.25,2.03,-.51);screen.rotation.x=-.18;g.add(screen);const display=box(.92,.55,.009,C.paper,.25,2.03,-.47);display.rotation.x=-.18;display.material=new THREE.MeshStandardMaterial({map:texture((ctx,n)=>{ctx.fillStyle='#f6f1e6';ctx.fillRect(0,0,n,n);ctx.fillStyle='#244d92';ctx.fillRect(0,0,n,40);ctx.fillStyle='#a3b5ab';ctx.fillRect(30,75,125,160);ctx.fillStyle='#99a5b0';for(let i=0;i<6;i++)ctx.fillRect(180,80+i*28,255-i%2*55,8);ctx.fillStyle='#e0e98e';ctx.fillRect(180,280,220,90);}),roughness:.6});g.add(display);mug(g,1.22,1.67,.3);
 parasol(g,-.5,-1.7);g.add(box(1.05,.12,.72,C.wood,-.1,.79,1.65,.02,woodMat));for(const x of [-.55,.35])g.add(box(.055,.75,.055,C.darkWood,x,.39,1.65));
 const board=box(1.6,1.06,.07,C.blue,1.35,2.72,-.78,.04);g.add(board);for(const x of [.8,1.9])g.add(cyl(.023,.68,C.darkWood,x,2.0,-.78));
 for(const [x,y,angle] of [[.94,2.8,-.08],[1.55,2.75,.08]]){const note=box(.49,.61,.015,C.paper,x,y,-.731,.008);note.rotation.z=angle;g.add(note);for(let j=0;j<3;j++)g.add(box(.31,.016,.006,0x9ca9bd,x,y+.13-j*.11,-.718,.001));}
 for(let i=0;i<3;i++)g.add(box(.66,.012,.012,0xb1b6bd,-.82,1.732,.05+i*.12,.002));
 // A lived-in study nook: proper chair back, green lamp, books and a canvas tote.
 g.add(box(1.02,.72,.09,C.wood,-.1,1.2,1.96,.045,woodMat),box(.94,.13,.65,0xa2aca0,-.1,.88,1.65,.055));
 for(let i=0;i<4;i++){const book=box(.74,.13,.56,[C.blue,0xd7a58e,C.paper,0x859985][i],-1.12,.075+i*.14,1.38,.012);book.rotation.y=.12;g.add(book);}
 g.add(cyl(.22,.05,0x698b7e,-1.3,1.72,-.42),cyl(.025,.65,0x698b7e,-1.3,2.04,-.42));
 const shade=mesh(new THREE.SphereGeometry(.29,24,12,0,Math.PI*2,0,Math.PI/2),0x698b7e,-1.3,2.36,-.42);g.add(shade);
 const lamp=new THREE.PointLight(0xffd6a0,0,3,2);lamp.position.set(-1.3,2.21,-.42);g.add(lamp);patioLights.push(lamp);
 const tote=box(.62,.73,.25,0xe8d9ba,-1.75,.39,1.65,.09);g.add(tote);g.add(mesh(new THREE.TorusGeometry(.17,.025,8,24,Math.PI),C.darkWood,-1.75,.77,1.65));
 // The desk stays open for a real personal photo, rather than a placeholder.
 stop(g,'right-now',{position:[-12.4,0,-7.9],rotation:.13,anchor:[-13.4,2.7,-6.6]});
}
{
 const g=new THREE.Group(),archPath=new THREE.CurvePath();
 archPath.add(new THREE.LineCurve3(new THREE.Vector3(-3.55,.1,0),new THREE.Vector3(-3.55,3.9,0)));
 archPath.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-3.55,3.9,0),new THREE.Vector3(-3.55,4.8,0),new THREE.Vector3(-2.65,4.8,0)));
 archPath.add(new THREE.LineCurve3(new THREE.Vector3(-2.65,4.8,0),new THREE.Vector3(2.65,4.8,0)));
 archPath.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(2.65,4.8,0),new THREE.Vector3(3.55,4.8,0),new THREE.Vector3(3.55,3.9,0)));
 archPath.add(new THREE.LineCurve3(new THREE.Vector3(3.55,3.9,0),new THREE.Vector3(3.55,.1,0)));
 g.add(mesh(new THREE.TubeGeometry(archPath,100,.39,20,false),0,0,0,0,mat(C.blue,{roughness:.53,bumpMap:fabric,bumpScale:.003})));
 for(const x of [-3.55,3.55])g.add(cyl(.5,.13,C.line,x,.07,0));
 for(const x of [-3.55,3.55])for(const y of [.44,3.6]){const band=mesh(new THREE.CylinderGeometry(.402,.402,.12,48),C.line,x,y,0);g.add(band);}
 for(const angle of [0,.85,2.25,Math.PI,3.95,5.35])g.add(trainingCone(Math.cos(angle)*4.95,.12+Math.sin(angle)*2.25));
 stop(g,'run-your-city',{position:[-6,0,TZ+R],anchor:[-6,5.35,TZ+R]});addChildren(g);
}
const hydration=table(2.0,1.03,1.0);hydration.position.set(.25,0,-1.9);
const dispenser=mesh(new THREE.CylinderGeometry(.31,.35,.73,32),0xe8822d,-.49,1.49,-.04);hydration.add(dispenser,cyl(.34,.08,C.paper,-.49,1.90,-.04),box(.10,.13,.16,C.paper,-.49,1.30,.33,.025));
const gatoradeLabel=printLabel('Gatorade',.53,.17,'#e8822d','#f8f3ec');gatoradeLabel.position.set(-.49,1.58,.31);hydration.add(gatoradeLabel);
for(let i=0;i<3;i++){
 const bottle=new THREE.Group();bottle.add(cyl(.075,.27,i%2?0xa2bf64:0xe5a34d,0,.145,0),cyl(.045,.09,0xd6dfc4,0,.33,0),cyl(.049,.035,0xe87e32,0,.391,0),cyl(.078,.095,C.paper,0,.17,0));bottle.position.set(.23+i*.24,1.10,.0);hydration.add(bottle);
}
for(let i=0;i<4;i++)hydration.add(cyl(.067,.095,C.paper,.36+i*.15,1.10,.32));scene.add(hydration);

// A flush track sandpit with a short approach and take-off board.
const trackSandbox=new THREE.Group();trackSandbox.position.set(-7.6,0,-1.7);
const sandMap=texture((ctx,n)=>{ctx.fillStyle='#d8bd8d';ctx.fillRect(0,0,n,n);for(let i=0;i<6000;i++){ctx.fillStyle=i%2?'rgba(123,93,53,.12)':'rgba(255,241,207,.25)';ctx.fillRect(random()*n,random()*n,1+random(),1);}ctx.strokeStyle='rgba(137,110,70,.10)';ctx.lineWidth=1;for(let i=0;i<24;i++){const y=i*n/24;ctx.beginPath();ctx.moveTo(0,y);ctx.quadraticCurveTo(n*.5,y+8,n,y+2);ctx.stroke();}},512);
trackSandbox.add(box(4.4,.055,2.15,0xe1cba4,0,.05,0,.025,new THREE.MeshStandardMaterial({map:sandMap,color:0xffffff,roughness:1})));
for(const z of [-1.1,1.1])trackSandbox.add(box(4.55,.12,.09,C.wood,0,.075,z,.018,woodMat));
for(const x of [-2.23,2.23])trackSandbox.add(box(.09,.12,2.23,C.wood,x,.075,0,.018,woodMat));
trackSandbox.add(box(2.7,.025,.95,C.track,-3.62,.024,0,.01,mat(C.track,{bumpMap:rubber,bumpScale:.009,roughness:1})),box(.20,.03,1.02,C.paper,-2.44,.043,0,.005));
for(const [x,z,turn] of [[-.8,-.22,.1],[-.4,.22,-.2],[.2,-.12,.25]]){const print=mesh(new THREE.CircleGeometry(.09,16),0,x,.082,z,new THREE.MeshStandardMaterial({color:0xb99c6c,transparent:true,opacity:.36,roughness:1,depthWrite:false}));print.rotation.x=-Math.PI/2;print.rotation.z=turn;print.scale.y=1.6;print.castShadow=false;trackSandbox.add(print);}
trackSandbox.traverse(o=>{if(o.isMesh){o.userData.sandbox=true;o.userData.stop='right-now';}});hot.push(trackSandbox);scene.add(trackSandbox);

function chair(x,z){const g=new THREE.Group();
 g.add(box(1.25,.14,1.28,C.wood,0,.49,0,.04,woodMat),box(1.35,1.08,.1,C.wood,0,1.1,-.61,.03,woodMat),box(1.18,.18,1.15,C.paper,0,.62,0,.075,linenMat),box(1.2,.88,.18,C.paper,0,1.14,-.48,.09,linenMat));
 for(const a of [-.57,.57])for(const b of [-.55,.55])g.add(box(.07,.5,.07,C.darkWood,a,.25,b));
 for(const a of [-.67,.67])g.add(box(.08,.08,1.35,C.wood,a,.98,0,.02,woodMat));g.position.set(x,0,z);return g;}

{
 const g=new THREE.Group();g.add(chair(-1.5,0),chair(1.5,0));const rug=box(5.3,.04,3.3,0xc9bda7,0,.025,.25,.02,rugMat);g.add(rug);const desk=table(1.1,.74,.8);desk.position.z=.45;g.add(desk);
 for(const x of [-.7,.7]){g.add(cyl(.028,1.6,0x50565c,x,.8,.8),cyl(.2,.035,0x50565c,x,.03,.8));const arm=cyl(.025,.6,0x50565c,x,1.62,.65);arm.rotation.x=.7;arm.rotation.z=x<0?.7:-.7;g.add(arm);const microphone=capsule(.07,.25,0x3c434a);microphone.position.set(x<0?x-.2:x+.2,1.77,.43);microphone.rotation.x=Math.PI/2;g.add(microphone);}
 const notes=new THREE.Group();notes.add(box(.52,.055,.38,C.blue,0,.82,.48,.012),box(.46,.012,.33,C.paper,0,.853,.48,.005));for(let i=0;i<3;i++)notes.add(box(.29,.006,.012,0x9ca8b5,0,.863,.41+i*.06,.002));notes.rotation.y=.16;g.add(notes);
 const headphones=mesh(new THREE.TorusGeometry(.18,.028,6,16,Math.PI),C.blue,0,.95,.4);headphones.rotation.x=Math.PI/2;g.add(headphones);

 const hosts=[seated(g,-1.5,0,{top:0xdbcbb2,long:true,hair:0x9b744c}),seated(g,1.5,0,{top:0x52707d,hair:0x42382e,skin:0xc79573})];g.userData.hosts=hosts;talkers.push(...hosts);
 // A single catenary of small bulbs stays entirely behind the grass patio.
 const cable=new THREE.CatmullRomCurve3([new THREE.Vector3(-3,3.9,-1.3),new THREE.Vector3(0,3.45,-1.3),new THREE.Vector3(3,3.9,-1.3)]);
 g.add(mesh(new THREE.TubeGeometry(cable,40,.013,5,false),0x625c50));
 for(const x of [-3,3])g.add(cyl(.035,3.95,C.darkWood,x,1.98,-1.3));
 for(let i=0;i<9;i++){const point=cable.getPoint((i+.5)/9),bulb=sphere(.055,C.paper,point.x,point.y-.12,point.z);bulb.material=new THREE.MeshStandardMaterial({color:0xffedc5,emissive:0xffbb66,emissiveIntensity:0,roughness:.3});g.add(bulb,cyl(.022,.07,0x625c50,point.x,point.y-.04,point.z));patioLights.push(bulb);}
 const glow=new THREE.PointLight(0xffd4a2,0,8,2);glow.position.set(0,2.8,-.4);g.add(glow);patioLights.push(glow);
 stop(g,'podcast',{position:[9.2,0,10.3],rotation:-.3,anchor:[9.2,2.3,10.4]});
}
{
 const g=new THREE.Group();
 // Five identical oak-and-linen stands. Paintings retain their original proportions.
 for(let i=0;i<27;i++)g.add(box(.37,.08,3.0,C.wood,-5.2+i*.4,.048,.5,.006,woodMat));
 const artworks=[['img/florals.avif',320/436],['img/acrylics.avif',320/345],['img/header.avif',320/447],['img/p1760.avif',320/606],['img/p0319.avif',320/447]];
 artworks.forEach(([src,ratio],i)=>{
  const x=(i-2)*2.13,display=new THREE.Group();display.position.set(x,0,0);
  display.add(box(1.99,2.99,.13,C.wood,0,2.07,0,.035,woodMat),box(1.83,2.83,.025,C.paper,0,2.07,.079,.015));
  const h=Math.min(2.56,1.61/ratio),w=h*ratio;
  display.add(mesh(new THREE.PlaneGeometry(w,h),C.paper,0,2.07,.097,new THREE.MeshStandardMaterial({map:picture(src),roughness:.94})));
  for(const dx of [-.72,.72])display.add(box(.055,.7,.055,C.darkWood,dx,.35,-.025),box(.065,.07,.85,C.darkWood,dx,.08,-.2));
  g.add(display);
 });
 const stool=table(.8,1.1,.8);stool.position.set(-6,0,.6);g.add(stool);g.add(cyl(.15,.32,C.blue,-6,1.3,.6));
 for(let i=0;i<5;i++){const brush=cyl(.018,.6,i%2?C.darkWood:C.blue,-6.14+i*.07,1.63,.6);brush.rotation.z=(i-2)*.13;g.add(brush);}
 const palette=cyl(.48,.04,C.paper,-6,1.19,.6);palette.scale.z=.64;g.add(palette);
 for(const [i,color] of [C.blue,C.hi,0xd49284,0x75a2a0,0xb59acc].entries())g.add(sphere(.047,color,-6.29+i*.13,1.225,.65));

 const visitor=person({scale:1.43,top:0xd1bea4,long:true,hair:0x593e2c,shorts:0x676d66});visitor.position.set(.8,0,2.3);visitor.rotation.y=Math.PI-.3;visitor.userData.arms[0].upper.rotation.x=-.45;visitor.userData.arms[0].lower.rotation.x=-1.2;g.add(visitor);
 stop(g,'paintings',{position:[2.2,0,-7.5],rotation:0,anchor:[1.1,1.1,-5.8]});
}
{
 const g=new THREE.Group();
 for(let i=0;i<4;i++)g.add(box(3.7,.11,.21,C.wood,0,.74,-.32+i*.24,.025,woodMat));
 for(const x of [-1.5,1.5])g.add(box(.1,.72,.82,C.blue,x,.36,0,.03));
 const portfolio=new THREE.Group();portfolio.add(box(1.35,1.78,.09,C.blue,0,1.66,-.06,.035),box(1.16,1.57,.018,C.paper,0,1.67,.001,.015));
 portfolio.add(box(.66,.08,.015,C.blue,-.13,2.2,.018,.003));for(let i=0;i<7;i++)portfolio.add(box(i%3===0?.78:.94,.025,.012,0x9da39f,0,1.98-i*.13,.017,.003));portfolio.rotation.x=-.13;g.add(portfolio);
 for(let i=0;i<3;i++)g.add(box(.8,.13,.65,[C.blue,0xd7ae83,C.paper][i],1.18,.87+i*.13,.06,.015));
 const bag=box(.7,.8,.3,0x64816d,-1.13,.4,.83,.13);g.add(bag);const handle=mesh(new THREE.TorusGeometry(.16,.023,8,20,Math.PI),C.darkWood,-1.13,.81,.83);g.add(handle);
 // A reading bench and open archive shelf give the résumé its own silhouette.
 for(const x of [-1.5,1.5])g.add(box(.08,1.52,.08,C.blue,x,.78,-.55,.02));
 for(let i=0;i<3;i++)g.add(box(3.7,.18,.065,C.wood,0,1.13+i*.23,-.55,.025,woodMat));
 g.add(box(.87,.17,.67,0xc7cba9,-1.04,.88,.03,.08),box(.83,.17,.63,0xa5b8be,.12,.89,.05,.08));
 const shelf=new THREE.Group();shelf.position.set(3.25,0,-.3);
 for(const y of [.16,1.08,2.55])shelf.add(box(3.15,.09,.84,C.wood,0,y,0,.025,woodMat));
 for(const x of [-1.48,1.48])for(const z of [-.35,.35])shelf.add(box(.065,2.68,.065,C.blue,x,1.36,z,.02));
 const chapters=[['UVA',0xb66e33],['Stanford GSB',0x8c3538],['Bain',0xb64e46],['CHAI',0x487a99],['Bluebird',0x6a9cae],['Oak Street',0x66836a],['Praava',0x528c84]];
 chapters.forEach(([title,color],i)=>shelf.add(institutionBook(title,color,-1.20+i*.39,1.13,0,1.06+(i%3)*.09)));
 shelf.add(box(.92,.42,.66,0xb99067,0,.42,0,.06),box(.3,.07,.015,C.paper,0,.43,.338,.008));
 g.add(shelf);
 // A rolled running bib and a medal, small enough to discover up close.
 g.add(box(.42,.02,.3,C.paper,1.18,1.29,.06,.008));const ribbon=box(.06,.32,.018,C.blue,1.52,1.15,.37,.006);ribbon.rotation.z=-.2;g.add(ribbon);
 const medal=cyl(.095,.025,0xc8a965,1.55,.97,.39);medal.rotation.x=Math.PI/2;g.add(medal);
 stop(g,'resume',{position:[12.7,0,-7.8],rotation:-.13,anchor:[12.2,2.4,-6.6]});
}
{
 const g=new THREE.Group();g.add(box(3.7,.16,1.75,C.wood,0,1.45,0,.09,woodMat),box(3.45,.93,1.48,0xf1e5cf,0,.89,0,.09));
 for(let i=0;i<23;i++)g.add(box(.034,.79,.035,0xd5bfa0,-1.57+i*.142,.88,.752,.01));
 for(const x of [-1.38,1.38])for(const z of [-.55,.55]){const wheel=cyl(.25,.11,C.blue,x,.25,z);wheel.rotation.x=Math.PI/2;g.add(wheel);const hub=cyl(.072,.12,C.wood,x,.25,z);hub.rotation.x=Math.PI/2;g.add(hub);}
 for(const x of [-1.84,1.84])g.add(cyl(.035,3.7,C.darkWood,x,1.85,-.61));
 for(let i=0;i<12;i++){const x=-2.02+i*.367,roof=box(.371,.045,2.16,i%2?0xf4ead9:0x7c9aab,x,3.58,-.12,.012);roof.rotation.x=.11;g.add(roof);const scallop=box(.367,.22,.035,i%2?0xf4ead9:0x7c9aab,x,3.34,.96,.085);g.add(scallop);}

 mug(g,-1.12,1.53,.16);mug(g,-.66,1.53,.3);
 const pot=cyl(.2,.62,0xb8babe,-.12,1.84,-.2);g.add(pot,box(.2,.42,.11,0x4a5054,.17,1.85,-.2));g.add(cyl(.16,.05,0x4a5054,-.12,2.16,-.2));
 for(let i=0;i<4;i++){const can=cyl(.11,.39,i%2?0xd89580:0x6898aa,.55+i*.26,1.73,.15);can.material=new THREE.MeshStandardMaterial({color:i%2?0xd89580:0x6898aa,roughness:.42,metalness:.24});g.add(can,cyl(.11,.024,0xc7c8c5,.55+i*.26,1.94,.15));const ring=cyl(.113,.11,i%2?C.hi:C.blue,.55+i*.26,1.78,.15);g.add(ring);const tab=mesh(new THREE.TorusGeometry(.024,.006,5,10),0x6a6e73,.55+i*.26,1.958,.15);tab.rotation.x=Math.PI/2;g.add(tab);}
 const plaque=box(1.95,.63,.06,C.paper,0,.98,.79,.17);g.add(plaque);
 const sign=mesh(new THREE.PlaneGeometry(1.78,.45),C.paper,0,.98,.827,new THREE.MeshStandardMaterial({map:written('say hi'),roughness:1}));g.add(sign);
 const coffeeTag=mesh(new THREE.PlaneGeometry(.8,.2),C.paper,-.9,1.51,.89,new THREE.MeshStandardMaterial({map:written('coffee'),roughness:1})),energyTag=mesh(new THREE.PlaneGeometry(.8,.2),C.paper,.95,1.51,.89,new THREE.MeshStandardMaterial({map:written('energy'),roughness:1}));g.add(coffeeTag,energyTag);

 const host=person({scale:1.42,top:0xd1ac96,hair:0x806447,long:true,shorts:0x56686a});host.position.set(-2.25,0,.72);host.rotation.y=1.12;host.userData.head.rotation.y=-.2;
 host.userData.arms[1].upper.rotation.x=-.54;host.userData.arms[1].upper.rotation.z=-.12;host.userData.arms[1].lower.rotation.x=-1.12;host.userData.greetingType='host';g.add(host);greeters.push(host);
 const guest=person({scale:1.48,top:0x73969b,skin:0xb18161,hair:0x443126});guest.position.set(2.38,0,1.25);guest.rotation.y=-1.18;guest.userData.head.rotation.y=.16;guest.userData.arms[0].upper.rotation.x=-.38;guest.userData.arms[0].lower.rotation.x=-1.12;guest.userData.greetingType='guest';g.add(guest);greeters.push(guest);
 for(const [figure,side] of [[host,1],[guest,0]]){const hand=figure.userData.arms[side].lower,cup=cyl(.068,.16,C.paper,0,-.30,.065);cup.rotation.x=1.5;hand.add(cup);}

 const biscuitPlate=cyl(.20,.018,C.paper,-.35,1.555,.60);g.add(biscuitPlate);for(const dx of [-.07,.07]){const cookie=cyl(.07,.025,0xcda36c,-.35+dx,1.579,.60);g.add(cookie);for(let i=0;i<3;i++)g.add(sphere(.009,0x71513d,-.39+dx+i*.035,1.595,.60));}
 const envelope=box(.57,.015,.36,C.paper,.45,1.55,.58,.01);envelope.rotation.y=-.22;g.add(envelope);const stamp=box(.10,.006,.12,0xa4b3d2,.64,1.564,.48,.003);g.add(stamp);
 const cooler=box(.78,.65,.64,0x8aa7a5,2.48,.35,-.12,.09);g.add(cooler,box(.83,.1,.68,C.paper,2.48,.71,-.12,.04));

 stop(g,'say-hi',{position:[-9.8,0,8.7],rotation:.05,anchor:[-9.8,3.95,8.7]});
}

// A small listening spot fills the foreground, entirely outside the running lanes.
const listening=new THREE.Group();listening.position.set(.2,0,8.6);listening.rotation.y=.08;
const picnicTexture=texture((ctx,n)=>{ctx.fillStyle='#e7dfc9';ctx.fillRect(0,0,n,n);ctx.fillStyle='#a3b3a2';for(let y=0;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2===0)ctx.fillRect(x*n/8,y*n/8,n/8,n/8);});
const picnic=box(4.1,.025,2.9,C.paper,0,.02,.4,.03,new THREE.MeshStandardMaterial({map:picnicTexture,roughness:1}));listening.add(picnic);
const stereoTable=table(1.85,.66,.91);stereoTable.position.set(0,0,-.48);listening.add(stereoTable);
const radio=new THREE.Group();radio.position.set(0,.72,-.48);
radio.add(box(1.6,.7,.42,0xc99872,0,.35,0,.1,woodMat),box(1.47,.59,.018,0xe5d6b7,0,.35,.218,.065));
for(const x of [-.49,.49]){const grille=cyl(.205,.023,0x455f65,x,.35,.242);grille.rotation.x=Math.PI/2;radio.add(grille);for(let i=-3;i<=3;i++)radio.add(box(.30,.011,.014,0xaab7ad,x,.35+i*.045,.263,.004));}
radio.add(box(.37,.19,.02,0x354d51,0,.43,.244,.025));
for(let i=0;i<4;i++){const meter=box(.035,.08,.015,0xd4dba6,-.105+i*.07,.42,.26,.005);radio.add(meter);musicMeters.push(meter);}
for(const x of [-.12,.12]){const knob=cyl(.052,.035,C.blue,x,.19,.26);knob.rotation.x=Math.PI/2;radio.add(knob);}
radio.add(box(.92,.045,.065,C.darkWood,0,.91,0,.02));for(const x of [-.44,.44])radio.add(box(.045,.22,.065,C.darkWood,x,.79,0,.015));
radio.traverse(o=>{if(o.isMesh)o.userData.music=true;});musicPickables.push(radio);listening.add(radio);
const cushionA=box(.94,.19,.84,0xd7a18a,-1.05,.15,1.05,.12,cloth(0xd7a18a));cushionA.rotation.y=.2;
const cushionB=box(.88,.18,.81,0x829ba8,1.02,.14,1.0,.12,cloth(0x829ba8));cushionB.rotation.y=-.19;listening.add(cushionA,cushionB);
const openBook=new THREE.Group();openBook.add(box(.54,.025,.47,C.blue,0,.03,0,.012),box(.49,.02,.43,C.paper,0,.055,0,.006));openBook.position.set(.33,.05,1.36);openBook.rotation.y=-.24;listening.add(openBook);
const picnicPopcorn=popcorn();picnicPopcorn.position.set(-.52,.055,.73);picnicPopcorn.scale.setScalar(1.4);listening.add(picnicPopcorn);
scene.add(listening);
const stereoButton=document.getElementById('stereo-button');
stereoPlayer=createStereoPlayer([stereoButton],playing=>{document.body.classList.toggle('music-playing',playing);});

// Night is lit across the entire venue; it never hides the clickable places.
const floods=[];
for(const x of [-24,24]){const g=new THREE.Group();g.add(cyl(.10,10.8,C.metal,0,5.4,0),box(1.9,.1,.3,C.metal,0,10.75,0));const lamps=[];for(let i=0;i<3;i++){const lamp=box(.44,.44,.13,0xe0dfd6,-.6+i*.6,10.75,.12);lamp.material=new THREE.MeshStandardMaterial({color:C.paper,emissive:0xffecd4,emissiveIntensity:0});lamps.push(lamp);g.add(lamp);}const light=new THREE.SpotLight(0xffeddc,0,100,1.1,.75,1.8);light.position.set(x,10.7,-23);light.target.position.set(x*.23,0,-4);scene.add(light,light.target);g.position.set(x,0,-23);scene.add(g);floods.push({light,lamps,group:g,x});}
const galleryLight=new THREE.PointLight(0xffead6,0,9,1.7);galleryLight.position.set(4.3,3,-4.2);scene.add(galleryLight);
const MODES=[{fog:0xf8f3ec,hemi:0xf1f2ed,sun:0xfff8ee,hi:1.14,amb:.24,si:3.0,flood:0,art:0,exposure:1.035},{fog:0xd8d5d9,hemi:0xcfd8e5,sun:0xffdabc,hi:1.15,amb:.42,si:.85,flood:380,art:5,exposure:1.12},{fog:0x253044,hemi:0xb3c9e3,sun:0xb9d0e7,hi:.78,amb:.3,si:.1,flood:540,art:8,exposure:1.08}];
let mode=0,modeTarget=0,automaticLighting=true;const fogGoal=new THREE.Color(),hemiGoal=new THREE.Color(),sunGoal=new THREE.Color();
function setMode(value){automaticLighting=value==='auto';modeTarget=automaticLighting?paloAltoNow().mode:Number(value);document.querySelectorAll('[data-time]').forEach(b=>b.setAttribute('aria-pressed',String(automaticLighting?b.dataset.time==='auto':b.dataset.time===String(modeTarget))));document.body.dataset.time=['day','dusk','night'][modeTarget];try{sessionStorage.setItem('mary-light-choice',String(value));}catch{}}
document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.time)));
function updateRealWorld(){
 const now=new Date(),second=Math.floor(now.getTime()/1000);if(second===lastWallSecond)return;lastWallSecond=second;
 const local=paloAltoNow(now);drawRaceClock(local.time);document.getElementById('clock-description').textContent='Palo Alto local time: '+local.time;document.getElementById('lighting-auto').title='Follow daylight in Palo Alto, '+local.time;
 const minute=Math.floor(second/60);if(automaticLighting&&minute!==lastSolarMinute){modeTarget=local.mode;document.body.dataset.time=['day','dusk','night'][modeTarget];}lastSolarMinute=minute;
}
function lighting(dt){const target=MODES[modeTarget],k=reduced?1:1-Math.exp(-dt*3.5);scene.fog.color.lerp(fogGoal.setHex(target.fog),k);scene.background.copy(scene.fog.color);hemi.color.lerp(hemiGoal.setHex(target.hemi),k);sun.color.lerp(sunGoal.setHex(target.sun),k);hemi.intensity+=(target.hi-hemi.intensity)*k;ambient.intensity+=(target.amb-ambient.intensity)*k;sun.intensity+=(target.si-sun.intensity)*k;sun.position.y+=(modeTarget===1?16-sun.position.y:40-sun.position.y)*k;renderer.toneMappingExposure+=(target.exposure-renderer.toneMappingExposure)*k;floods.forEach(f=>{f.light.intensity+=(target.flood-f.light.intensity)*k;f.lamps.forEach(l=>l.material.emissiveIntensity+=(modeTarget?1.8-l.material.emissiveIntensity:-l.material.emissiveIntensity)*k);});galleryLight.intensity+=(target.art-galleryLight.intensity)*k;patioLights.forEach(l=>{if(l.isLight)l.intensity+=((modeTarget?12:0)-l.intensity)*k;else l.material.emissiveIntensity+=((modeTarget?2.8:0)-l.material.emissiveIntensity)*k;});mode=modeTarget;}

const card=document.getElementById('card'),cardin=document.getElementById('cardin'),links=[...document.querySelectorAll('[data-go]')];
function setHover(id){hovered=id;for(const key of ORDER){stops[key].button.classList.toggle('is-hovered',key===id);links.find(a=>a.dataset.go===key)?.classList.toggle('is-hovered',key===id);}canvas.style.cursor=id?'pointer':'';}
function focusCamera(p,id){const gallery=id==='paintings',x=p.x+(phone?0:gallery?2.2:2.7);lookTarget.set(x,phone?(id==='run-your-city'||gallery?-.8:-1.1):2.5,p.z);camTarget.set(x,phone?10.5:gallery?8.3:7.2,p.z+(phone?(gallery?24:20):(gallery?20.5:16.2)));}
function go(id,trigger){const stop=stops[id];if(!stop)return;sandboxFocused=false;current=id;lastTrigger=trigger||links.find(a=>a.dataset.go===id);setHover(null);document.body.classList.add('at');cardin.innerHTML=CONTENT[id];cardin.scrollTop=0;card.setAttribute('aria-label',stop.name);card.setAttribute('aria-hidden','false');card.inert=false;card.classList.add('on');document.getElementById('notebook-link').href='/#'+id;document.getElementById('text-view').href='/#'+id;for(const key of ORDER)stops[key].button.setAttribute('aria-pressed',String(key===id));links.forEach(a=>{if(a.dataset.go===id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 const p=stop.group.position;focusCamera(p,id);history.replaceState(null,'','#'+id);
 const h=cardin.querySelector('h2');h.tabIndex=-1;h.focus({preventScroll:true});
}
function openSandbox(trigger){go('right-now',trigger);sandboxFocused=true;focusCamera(sandboxView,'sandbox');const details=cardin.querySelector('[data-ai-sandbox]');if(details){details.open=true;details.scrollIntoView({block:'nearest',behavior:reduced?'instant':'smooth'});}}
const sandboxButton=document.getElementById('sandbox-button');sandboxButton.addEventListener('click',()=>openSandbox(sandboxButton));
function back(){if(!current)return;current=null;sandboxFocused=false;document.body.classList.remove('at');card.classList.remove('on');card.inert=true;card.setAttribute('aria-hidden','true');camTarget.copy(home);lookTarget.copy(homeLook);links.forEach(a=>a.removeAttribute('aria-current'));ORDER.forEach(id=>stops[id].button.setAttribute('aria-pressed','false'));document.getElementById('text-view').href='/';history.replaceState(null,'',location.pathname);lastTrigger?.focus({preventScroll:true});}
document.getElementById('back').addEventListener('click',back);document.getElementById('cardx').addEventListener('click',back);links.forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.go,a);});a.addEventListener('pointerenter',()=>setHover(a.dataset.go));a.addEventListener('pointerleave',()=>setHover(null));a.addEventListener('focus',()=>setHover(a.dataset.go));a.addEventListener('blur',()=>setHover(null));});
document.addEventListener('keydown',e=>{if(e.key==='Escape')back();if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&!e.target.closest('button,a')){e.preventDefault();const i=current?ORDER.indexOf(current):(e.key==='ArrowRight'?-1:0);go(ORDER[(i+(e.key==='ArrowRight'?1:5))%6]);}});
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null,lastPointerX=0,viewPan=0;
function hit(e){mouse.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects([...hot,...musicPickables],true),data=hits[0]?.object.userData;return data?.music?'music':data?.sandbox?'sandbox':data?.stop||null;}
canvas.addEventListener('pointermove',e=>{if(down&&phone&&!current){viewPan=THREE.MathUtils.clamp(viewPan-(e.clientX-lastPointerX)/20,-2,18);lastPointerX=e.clientX;setHover(null);}else if(!current)setHover(hit(e));});canvas.addEventListener('pointerleave',()=>setHover(null));canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];lastPointerX=e.clientX;});canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>10){down=null;return;}down=null;const id=hit(e);if(id==='music'){stereoPlayer.toggle();return;}if(id==='sandbox'){openSandbox();return;}if(current){back();return;}if(id)go(id);});
const motion=document.getElementById('motion');motion.addEventListener('click',()=>{paused=!paused;motion.textContent=paused?'Play motion':'Pause motion';motion.setAttribute('aria-pressed',String(paused));});
function resize(){
 phone=innerWidth<760;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=phone?55:36;camera.updateProjectionMatrix();
 const fit=THREE.MathUtils.clamp(1.46/camera.aspect,1,1.28);
 if(phone){home.set(-7.2,16.5,34.5);homeLook.set(-7.2,2.6,-1.8);}else{home.set(0,17.5*fit,33*fit);homeLook.set(0,2.5,-3.0);viewPan=0;}
 bleachers.position.set(0,0,-27);bleachers.rotation.y=0;stops.paintings.group.rotation.y=0;
 floods.forEach(f=>{f.group.position.set(f.x,0,-23);f.light.position.set(f.x,10.7,-23);f.light.target.position.set(f.x*.23,0,-4);});
 scene.fog.near=home.distanceTo(homeLook)+60;scene.fog.far=scene.fog.near+140;
 if(!current){camTarget.copy(home);lookTarget.copy(homeLook);}else{focusCamera(sandboxFocused?sandboxView:stops[current].group.position,sandboxFocused?'sandbox':current);}
}

addEventListener('resize',resize);resize();camPos.copy(home);camLook.copy(homeLook);
let measured=0,slow=0,degraded=false;const projected=new THREE.Vector3();
function frame(){const raw=clock.getDelta(),dt=Math.min(raw,.05),movement=paused?0:dt;t+=movement;if(document.visibilityState==='visible'&&!degraded&&measured++<360){slow=raw>.055?slow+1:Math.max(0,slow-1);if(slow>50){renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));degraded=true;}}
 runners.forEach(r=>animateRunner(r,movement));animateChildren();if(!paused){talkers.forEach((f,i)=>{f.userData.arms[i].lower.rotation.x=-1.05+Math.sin(t*1.2+i)*.09;});greeters.forEach(g=>{if(g.userData.greetingType==='host'){g.userData.arms[1].lower.rotation.x=-1.12+Math.sin(t*.9)*.055;g.userData.head.rotation.y=-.2+Math.sin(t*.55)*.045;}else g.userData.arms[0].lower.rotation.x=-1.12+Math.sin(t*.8)*.06;});if(mentor)mentor.userData.arms.forEach((a,i)=>a.lower.rotation.z=(i===0?1:-1)*(.13+Math.sin(t*4)*.08));animateFamily();steam.forEach(s=>{const p=(t*.32+s.offset)%1;s.mesh.position.set(s.x+Math.sin(p*5)*.025,s.y+p*.52,s.z);s.mesh.material.opacity=.22*(1-p);});}
 updateRealWorld();lighting(dt);if(phone&&!current){camTarget.copy(home);lookTarget.copy(homeLook);camTarget.x+=viewPan;lookTarget.x+=viewPan;}const k=reduced?1:1-Math.exp(-dt*4);camPos.lerp(camTarget,k);camLook.lerp(lookTarget,k);camera.position.copy(camPos);camera.lookAt(camLook);camera.updateMatrixWorld();
 ORDER.forEach(id=>{const s=stops[id];projected.copy(s.anchor).project(camera);const x=(projected.x*.5+.5)*innerWidth,y=(.5-projected.y*.5)*innerHeight;s.button.style.left=x+'px';s.button.style.top=y+'px';s.button.style.visibility=projected.z>1||x<15||x>innerWidth-15||y<140||y>innerHeight-90?'hidden':'visible';});
 musicMeters.forEach((m,i)=>m.scale.y=stereoPlayer.playing&&!paused&&!reduced?.55+Math.abs(Math.sin(t*5+i*.9))*.9:1);
 renderer.render(scene,camera);requestAnimationFrame(frame);
}
let savedLight='auto';try{const stored=sessionStorage.getItem('mary-light-choice');if(['auto','0','1','2'].includes(stored))savedLight=stored;}catch{}setMode(savedLight);updateRealWorld();
const timeout=setTimeout(()=>document.getElementById('load-message').textContent='The track is taking a moment. You can read the notebook below.',10000);
await Promise.race([Promise.all([document.fonts.ready,assetsReady]),new Promise(resolve=>setTimeout(resolve,4000))]);
textRedraws.forEach(draw=>draw());clearTimeout(timeout);animateChildren();runners.forEach(r=>animateRunner(r,0));frame();document.body.classList.add('ready');document.getElementById('load').classList.add('off');const section=location.hash.slice(1);if(stops[section])go(section);
