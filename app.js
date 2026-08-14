import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

const G = 9.81;
const BASE_RADIUS = 0.20;
const BASE_THICK = 0.018;
const PIVOT_Y = BASE_THICK / 2 + 0.018;
const DEFAULTS = {
  model:'prototype', hCm:34,
  m1g:5.00,m2g:5.00,m3g:5.00,
  r1cm:17,a1:150,r2cm:17,a2:30,r3cm:17,a3:270
};
const MODEL_INFO = {
  prototype:{name:'Prototipo 3 varillas',mass:0.024,comFrac:0.30,color:0xb88042},
  lattice:{name:'Celosía triangular',mass:0.030,comFrac:0.34,color:0xa96f35},
  mast:{name:'Mástil reforzado',mass:0.036,comFrac:0.38,color:0x9d6938}
};

const $ = id => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeef4f8);
scene.fog = new THREE.Fog(0xeef4f8, 1.35, 2.4);
const camera = new THREE.PerspectiveCamera(42,1,0.01,5);
let cam = {radius:0.78,yaw:0.72,pitch:0.48,mode:'free'};

scene.add(new THREE.HemisphereLight(0xffffff,0x8797a4,2.0));
const sun = new THREE.DirectionalLight(0xffffff,3.5); sun.position.set(.5,.9,.4); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); scene.add(sun);
const warm = new THREE.DirectionalLight(0xffddb5,1.1); warm.position.set(-.45,.35,-.3); scene.add(warm);

const world = new CANNON.World({gravity:new CANNON.Vec3(0,-G,0)});
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.solver.iterations = 14;
world.defaultContactMaterial.friction = 0.45;

const groundBody = new CANNON.Body({mass:0}); world.addBody(groundBody);
let towerBody=null, towerConstraint=null, towerVisual=null;
let towerMass=MODEL_INFO.prototype.mass, towerCom=0.1, towerH=0.34;
let previousVel = new CANNON.Vec3();
let smoothAccel = new THREE.Vector3();

function makeWoodTexture(){
  const c=document.createElement('canvas'); c.width=c.height=768; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,768,768); g.addColorStop(0,'#e2bd8d');g.addColorStop(.5,'#d3a36a');g.addColorStop(1,'#c28e55');x.fillStyle=g;x.fillRect(0,0,768,768);
  for(let i=0;i<180;i++){const y=Math.random()*768;x.beginPath();x.strokeStyle=`rgba(91,53,24,${0.025+Math.random()*.07})`;x.lineWidth=.5+Math.random()*2;x.moveTo(0,y);x.bezierCurveTo(180,y+Math.random()*12-6,500,y+Math.random()*12-6,768,y+Math.random()*8-4);x.stroke();}
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
const woodTex=makeWoodTexture();
const baseMat=new THREE.MeshStandardMaterial({map:woodTex,roughness:.72,metalness:.03});
const base=new THREE.Mesh(new THREE.CylinderGeometry(BASE_RADIUS,BASE_RADIUS,BASE_THICK,96),baseMat);base.position.y=0;base.receiveShadow=true;base.castShadow=true;scene.add(base);
const edge=new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry),new THREE.LineBasicMaterial({color:0x805b35,transparent:true,opacity:.65}));base.add(edge);

// Plano polar real: radios, circunferencias y marcas cada 10°.
const polarGroup=new THREE.Group(); polarGroup.position.y=BASE_THICK/2+.0007; scene.add(polarGroup);
const polarLineMat=new THREE.LineBasicMaterial({color:0x40566a,transparent:true,opacity:.28});
const polarMajorMat=new THREE.LineBasicMaterial({color:0x243b53,transparent:true,opacity:.48});
function circleLine(r,segments=128,mat=polarLineMat){const pts=[];for(let i=0;i<=segments;i++){const a=2*Math.PI*i/segments;pts.push(new THREE.Vector3(r*Math.cos(a),0,r*Math.sin(a)))}const g=new THREE.BufferGeometry().setFromPoints(pts);return new THREE.Line(g,mat)}
for(let r=.02;r<=BASE_RADIUS+.0001;r+=.02) polarGroup.add(circleLine(r,128,Math.abs((r*100)%10)<.01?polarMajorMat:polarLineMat));
for(let deg=0;deg<360;deg+=10){const a=THREE.MathUtils.degToRad(deg);const mat=deg%30===0?polarMajorMat:polarLineMat;const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(BASE_RADIUS*Math.cos(a),0,BASE_RADIUS*Math.sin(a))]);polarGroup.add(new THREE.Line(g,mat));}
function textSprite(text,{color='#18324a',bg='rgba(255,255,255,.78)',font=42,scale=.025}={}){const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');x.font=`700 ${font}px Arial`;x.textAlign='center';x.textBaseline='middle';if(bg){x.fillStyle=bg;x.roundRect(4,7,248,82,16);x.fill();}x.fillStyle=color;x.fillText(text,128,50);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(scale*2.66,scale,1);s.renderOrder=20;return s}
for(let deg=0;deg<360;deg+=10){const a=THREE.MathUtils.degToRad(deg);const s=textSprite(`${deg}°`,{font:34,scale:.015,bg:'rgba(255,255,255,.58)'});s.position.set(.188*Math.cos(a),.003,.188*Math.sin(a));polarGroup.add(s)}

// Rótula: visualmente unida a la torre; físicamente es una articulación esférica sin momento.
const socketMat=new THREE.MeshStandardMaterial({color:0xb8c0c7,metalness:.9,roughness:.2});
const socketBase=new THREE.Mesh(new THREE.CylinderGeometry(.034,.042,.016,48),socketMat);socketBase.position.y=BASE_THICK/2+.008;socketBase.castShadow=true;scene.add(socketBase);
const ball=new THREE.Mesh(new THREE.SphereGeometry(.015,36,24),new THREE.MeshStandardMaterial({color:0xdfe4e8,metalness:.95,roughness:.12}));ball.position.y=PIVOT_Y;ball.castShadow=true;scene.add(ball);

function cylinderBetween(a,b,r,mat,parent){const dir=b.clone().sub(a),len=dir.length();const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),mat);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());mesh.castShadow=true;parent.add(mesh);return mesh}
function buildTowerVisual(model,h,com){
  if(towerVisual) scene.remove(towerVisual);
  towerVisual=new THREE.Group(); scene.add(towerVisual);
  const info=MODEL_INFO[model], dowel=new THREE.MeshStandardMaterial({color:info.color,roughness:.62}), brace=new THREE.MeshStandardMaterial({color:0xc69a63,roughness:.72}), glue=new THREE.MeshStandardMaterial({color:0xf0ece5,roughness:.75}), markerMat=new THREE.MeshStandardMaterial({color:0x244fca,roughness:.35});
  const y0=-com, yt=h-com, r0=Math.min(.042,.026+h*.045);
  const feet=[];for(let k=0;k<3;k++){const a=2*Math.PI*k/3+Math.PI/2;feet.push(new THREE.Vector3(r0*Math.cos(a),y0,r0*Math.sin(a)))}
  const top=new THREE.Vector3(0,yt,0);
  feet.forEach(p=>cylinderBetween(p,top,.0028,dowel,towerVisual));
  const levels=model==='prototype'?[.16,.35,.56]:model==='lattice'?[.13,.27,.42,.58,.73]:[.18,.36,.54,.72];
  levels.forEach(fr=>{const y=y0+h*fr,rr=r0*(1-fr*.93),pts=[];for(let k=0;k<3;k++){const a=2*Math.PI*k/3+Math.PI/2;pts.push(new THREE.Vector3(rr*Math.cos(a),y,rr*Math.sin(a)))}for(let k=0;k<3;k++)cylinderBetween(pts[k],pts[(k+1)%3],.0016,brace,towerVisual)});
  if(model==='lattice'){for(let k=0;k<3;k++){for(let q=0;q<4;q++){const f1=.12+q*.18,f2=f1+.18;const a=2*Math.PI*k/3+Math.PI/2;const b=2*Math.PI*((k+1)%3)/3+Math.PI/2;const p1=new THREE.Vector3(r0*(1-f1*.93)*Math.cos(a),y0+h*f1,r0*(1-f1*.93)*Math.sin(a));const p2=new THREE.Vector3(r0*(1-f2*.93)*Math.cos(b),y0+h*f2,r0*(1-f2*.93)*Math.sin(b));cylinderBetween(p1,p2,.00125,brace,towerVisual)}}}
  if(model==='mast'){const inner=.012;for(let k=0;k<3;k++){const a=2*Math.PI*k/3+Math.PI/2;cylinderBetween(new THREE.Vector3(inner*Math.cos(a),y0+.025,inner*Math.sin(a)),new THREE.Vector3(0,yt-.02,0),.0015,brace,towerVisual)}}
  const marker=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,Math.min(.095,h*.34),20),markerMat);marker.position.set(0,y0+Math.min(.10,h*.35),0);marker.castShadow=true;towerVisual.add(marker);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.019,24),glue);cap.position.copy(top);cap.castShadow=true;towerVisual.add(cap);
  // pequeño cuello desde la bola al entramado: conexión visual inequívoca
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.006,.009,.025,20),socketMat);neck.position.y=y0+.0125;towerVisual.add(neck);
}
function rebuildTower({preserveOrientation=false}={}){
  const model=$('towerModel').value,h=+$('height').value/100,info=MODEL_INFO[model],com=h*info.comFrac;
  let q=new CANNON.Quaternion(),av=new CANNON.Vec3(); if(preserveOrientation&&towerBody){q.copy(towerBody.quaternion);av.copy(towerBody.angularVelocity)}
  if(towerConstraint) world.removeConstraint(towerConstraint); if(towerBody) world.removeBody(towerBody);
  towerH=h;towerCom=com;towerMass=info.mass*(.72+.28*h/.34);
  towerBody=new CANNON.Body({mass:towerMass,position:new CANNON.Vec3(0,PIVOT_Y+com,0),angularDamping:.56,linearDamping:.16});
  towerBody.addShape(new CANNON.Box(new CANNON.Vec3(.018,h*.5,.018)),new CANNON.Vec3(0,h*.5-com,0));
  if(preserveOrientation){towerBody.quaternion.copy(q);towerBody.angularVelocity.copy(av)}
  world.addBody(towerBody);
  towerConstraint=new CANNON.PointToPointConstraint(towerBody,new CANNON.Vec3(0,-com,0),groundBody,new CANNON.Vec3(0,PIVOT_Y,0),1e7);world.addConstraint(towerConstraint);
  previousVel.copy(towerBody.velocity);smoothAccel.set(0,0,0);buildTowerVisual(model,h,com);syncTowerVisual();
}
function syncTowerVisual(){if(!towerBody||!towerVisual)return;towerVisual.position.set(towerBody.position.x,towerBody.position.y,towerBody.position.z);towerVisual.quaternion.set(towerBody.quaternion.x,towerBody.quaternion.y,towerBody.quaternion.z,towerBody.quaternion.w)}

// Poleas, cuerdas, masas y etiquetas.
const pulleyGroups=[],ropeLines=[],massGroups=[],labelSprites=[],massLabelSprites=[];const anchors=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
const vecColors=[0x2563eb,0xef4444,0x16a34a], ropeColor=0x1c5fb8;
function buildPulley(i){const g=new THREE.Group();const metal=new THREE.MeshStandardMaterial({color:0xc5ccd1,metalness:.82,roughness:.25});const gold=new THREE.MeshStandardMaterial({color:0xb88a27,metalness:.78,roughness:.19});const foot=new THREE.Mesh(new THREE.BoxGeometry(.033,.006,.025),metal);foot.position.y=.003;foot.castShadow=true;g.add(foot);const cheek1=new THREE.Mesh(new THREE.BoxGeometry(.005,.025,.022),metal);cheek1.position.set(-.012,.015,0);g.add(cheek1);const cheek2=cheek1.clone();cheek2.position.x=.012;g.add(cheek2);const wheel=new THREE.Mesh(new THREE.TorusGeometry(.011,.0038,12,30),gold);wheel.rotation.y=Math.PI/2;wheel.position.y=.022;wheel.castShadow=true;g.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.0035,.0035,.029,14),metal);hub.rotation.z=Math.PI/2;hub.position.y=.022;g.add(hub);scene.add(g);pulleyGroups[i]=g;
  const lab=textSprite(`P${i+1}`,{color:i===0?'#2563eb':i===1?'#dc2626':'#15803d',font:44,scale:.022});scene.add(lab);labelSprites[i]=lab;
  const mg=new THREE.Group();const mmat=new THREE.MeshStandardMaterial({color:0x687681,metalness:.58,roughness:.32});const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.010,.011,.024,24),mmat);cyl.castShadow=true;mg.add(cyl);const ring=new THREE.Mesh(new THREE.TorusGeometry(.005,.0014,8,20),mmat);ring.rotation.x=Math.PI/2;ring.position.y=.014;mg.add(ring);scene.add(mg);massGroups[i]=mg;
  const ml=textSprite(`m${i+1}`,{color:'#23384a',font:36,scale:.017,bg:'rgba(255,255,255,.82)'});scene.add(ml);massLabelSprites[i]=ml;
}
for(let i=0;i<3;i++)buildPulley(i);
function updateLine(slot,points,color=ropeColor){if(ropeLines[slot])scene.remove(ropeLines[slot]);const geo=new THREE.BufferGeometry().setFromPoints(points);const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,linewidth:1}));scene.add(line);ropeLines[slot]=line;return line}
const rVectorGroup=new THREE.Group();scene.add(rVectorGroup);
function polar(rCm,aDeg){const r=rCm/100,a=THREE.MathUtils.degToRad(aDeg);return new THREE.Vector3(r*Math.cos(a),BASE_THICK/2+.005,r*Math.sin(a))}
function readState(){return {m:[+$('m1').value/1000,+$('m2').value/1000,+$('m3').value/1000],r:[+$('r1').value,+$('r2').value,+$('r3').value],a:[+$('a1').value,+$('a2').value,+$('a3').value],h:+$('height').value/100}}
function topWorldThree(){const p=new CANNON.Vec3(0,towerH-towerCom,0),w=new CANNON.Vec3();towerBody.pointToWorldFrame(p,w);return new THREE.Vector3(w.x,w.y,w.z)}
function cmWorldThree(){return new THREE.Vector3(towerBody.position.x,towerBody.position.y,towerBody.position.z)}
function updateGeometry(){const s=readState();for(let i=0;i<3;i++){anchors[i].copy(polar(s.r[i],s.a[i]));pulleyGroups[i].position.copy(anchors[i]).setY(BASE_THICK/2+.004);pulleyGroups[i].rotation.y=-THREE.MathUtils.degToRad(s.a[i]);labelSprites[i].position.copy(anchors[i]).add(new THREE.Vector3(0,.046,0));const radial=new THREE.Vector3(anchors[i].x,0,anchors[i].z).normalize();const outsideR=Math.max(BASE_RADIUS+.032,s.r[i]/100+.035);const out=new THREE.Vector3(radial.x*outsideR,BASE_THICK/2+.028,radial.z*outsideR);const hang=new THREE.Vector3(out.x,-.075,out.z);updateLine(i,[topWorldThree(),anchors[i].clone().setY(BASE_THICK/2+.03),out,hang],ropeColor);massGroups[i].position.copy(hang).add(new THREE.Vector3(0,-.014,0));const massScale=.78+Math.min(1.25,s.m[i]/.008)*.18;massGroups[i].scale.setScalar(massScale);massLabelSprites[i].position.copy(hang).add(new THREE.Vector3(0,-.055,0));const labelTex=massLabelSprites[i].material.map.image,ctx=labelTex.getContext('2d');ctx.clearRect(0,0,labelTex.width,labelTex.height);ctx.fillStyle='rgba(255,255,255,.82)';ctx.roundRect(4,7,248,82,16);ctx.fill();ctx.font='700 32px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#23384a';ctx.fillText(`m${i+1} = ${(s.m[i]*1000).toFixed(2)} g`,128,50);massLabelSprites[i].material.map.needsUpdate=true}
  while(rVectorGroup.children.length)rVectorGroup.remove(rVectorGroup.children[0]);for(let i=0;i<3;i++){const r=new THREE.Vector3(anchors[i].x,0,anchors[i].z);rVectorGroup.add(new THREE.ArrowHelper(r.clone().normalize(),new THREE.Vector3(0,BASE_THICK/2+.012,0),r.length(),vecColors[i],.012,.006))}
  updateOutputs();updateDCLVisual();}

// Equilibrio analítico. Se conserva el radio actual de r3 para cerrar la solución única.
function idealSolution(){const s=readState(),H=s.h;const R1=polar(s.r[0],s.a[0]);R1.y=0;const R2=polar(s.r[1],s.a[1]);R2.y=0;const rho3=s.r[2]/100;const L1=Math.hypot(H,s.r[0]/100),L2=Math.hypot(H,s.r[1]/100),L3=Math.hypot(H,rho3);const q=R1.multiplyScalar(s.m[0]/L1).add(R2.multiplyScalar(s.m[1]/L2));const qmag=q.length();if(qmag<1e-12)return {m3:0,r3:new THREE.Vector3(rho3,0,0),a3:0};const r3=q.clone().normalize().multiplyScalar(-rho3);const m3=L3*qmag/rho3;let a3=THREE.MathUtils.radToDeg(Math.atan2(r3.z,r3.x));if(a3<0)a3+=360;return {m3,r3,a3}}
function calcEquilibrium(){const sol=idealSolution();$('m3').value=Math.min(30,Math.max(.5,sol.m3*1000));$('a3').value=Math.round(sol.a3);resetTowerPose();updateGeometry()}

function cableForce(i){const s=readState(),top=topWorldThree(),anchor=anchors[i].clone().setY(BASE_THICK/2+.03),dir=anchor.sub(top).normalize();return dir.multiplyScalar(s.m[i]*G)}
function staticMomentVector(){
  const s=readState();
  const rTop=new THREE.Vector3(0,s.h,0); // vector desde la rótula hasta la punta, en posición vertical
  const topWorld=new THREE.Vector3(0,PIVOT_Y+s.h,0);
  let tau=new THREE.Vector3();
  for(let i=0;i<3;i++){
    const R=polar(s.r[i],s.a[i]); R.y=0;
    const anchorWorld=R.clone().setY(BASE_THICK/2+.03);
    const F=anchorWorld.sub(topWorld).normalize().multiplyScalar(s.m[i]*G);
    tau.add(rTop.clone().cross(F));
  }
  // En la posición vertical el peso pasa por O y no produce momento.
  return tau;
}
function staticMomentMagnitude(){return staticMomentVector().length()}
function applyCableForces(){const topLocal=new CANNON.Vec3(0,towerH-towerCom,0),topW=new CANNON.Vec3();towerBody.pointToWorldFrame(topLocal,topW);const s=readState();for(let i=0;i<3;i++){const a=anchors[i];const dir=new CANNON.Vec3(a.x-topW.x,(BASE_THICK/2+.03)-topW.y,a.z-topW.z);dir.normalize();dir.scale(s.m[i]*G,dir);towerBody.applyForce(dir,topW)}
  // Tope mecánico suave: representa contacto/limitación física de la rótula y el tablero, no una gravedad artificial.
  const up=new CANNON.Vec3(0,1,0);towerBody.quaternion.vmult(up,up);const tilt=Math.acos(Math.max(-1,Math.min(1,up.y)));const soft=THREE.MathUtils.degToRad(42);if(tilt>soft){const axis=new CANNON.Vec3(up.z,0,-up.x);if(axis.lengthSquared()>1e-10){axis.normalize();const k=0.045*(tilt-soft);axis.scale(-k,axis);towerBody.torque.vadd(axis,towerBody.torque)}}}
function resetTowerPose(){if(!towerBody)return;towerBody.position.set(0,PIVOT_Y+towerCom,0);towerBody.quaternion.set(0,0,0,1);towerBody.velocity.set(0,0,0);towerBody.angularVelocity.set(0,0,0);towerBody.force.set(0,0,0);towerBody.torque.set(0,0,0);previousVel.copy(towerBody.velocity);smoothAccel.set(0,0,0);syncTowerVisual()}

const dclGroup=new THREE.Group();scene.add(dclGroup);dclGroup.visible=false;let dclOn=false;
function clearGroup(g){while(g.children.length)g.remove(g.children[0])}
function addComponentArrow(origin,axisValue,axis,color,label){if(Math.abs(axisValue)<1e-5)return;const scale=.18,vec=new THREE.Vector3();vec[axis]=axisValue*scale;const ar=new THREE.ArrowHelper(vec.clone().normalize(),origin,Math.max(.025,vec.length()),color,.012,.006);dclGroup.add(ar);const s=textSprite(label,{color:'#17212b',font:38,scale:.017,bg:'rgba(255,255,255,.82)'});s.position.copy(origin).add(vec).add(new THREE.Vector3(0,.012,0));dclGroup.add(s)}
function updateDCLVisual(){
  if(!towerBody)return;
  clearGroup(dclGroup);
  const top=topWorldThree(), cm=cmWorldThree();
  const Fs=[cableForce(0),cableForce(1),cableForce(2)];
  const weight=new THREE.Vector3(0,-towerMass*G,0);
  const sumExt=Fs[0].clone().add(Fs[1]).add(Fs[2]).add(weight);
  // Como la rótula fija el punto O, la reacción traslacional es la opuesta
  // a la suma de las fuerzas aplicadas. La rótula no aporta momento.
  const reaction=sumExt.clone().multiplyScalar(-1);

  const offsets=[-.028,0,.028];
  for(let i=0;i<3;i++){
    const o=top.clone().add(new THREE.Vector3(offsets[i],offsets[i]*.35,-offsets[i]*.25));
    addComponentArrow(o,Fs[i].x,'x',vecColors[i],`T${i+1}x`);
    addComponentArrow(o,Fs[i].y,'y',vecColors[i],`T${i+1}y`);
    addComponentArrow(o,Fs[i].z,'z',vecColors[i],`T${i+1}z`);
  }
  const ro=new THREE.Vector3(0,PIVOT_Y+.012,0);
  addComponentArrow(ro,reaction.x,'x',0xf59e0b,'Rx');
  addComponentArrow(ro,reaction.y,'y',0xf59e0b,'Ry');
  addComponentArrow(ro,reaction.z,'z',0xf59e0b,'Rz');

  // El peso solo tiene componente y: W=(0,-mg,0).
  const visualScale=.18;
  const wv=weight.clone().multiplyScalar(visualScale);
  if(wv.length()>1e-7){
    dclGroup.add(new THREE.ArrowHelper(wv.clone().normalize(),cm,Math.max(.035,wv.length()),0x111827,.012,.006));
    const ws=textSprite('Wy',{font:38,scale:.017});
    ws.position.copy(cm).add(wv).add(new THREE.Vector3(0,.012,0));
    dclGroup.add(ws);
  }

  const f=n=>Math.abs(n)<5e-7?'0.000':n.toFixed(3);
  $('t1x').textContent=f(Fs[0].x);$('t1y').textContent=f(Fs[0].y);$('t1z').textContent=f(Fs[0].z);
  $('t2x').textContent=f(Fs[1].x);$('t2y').textContent=f(Fs[1].y);$('t2z').textContent=f(Fs[1].z);
  $('t3x').textContent=f(Fs[2].x);$('t3y').textContent=f(Fs[2].y);$('t3z').textContent=f(Fs[2].z);
  $('rx').textContent=f(reaction.x);$('ry').textContent=f(reaction.y);$('rz').textContent=f(reaction.z);
  $('wx').textContent='0.000';$('wy').textContent=f(weight.y);$('wz').textContent='0.000';
}

function updateOutputs(){const s=readState(),sol=idealSolution();const f=(v,n=1)=>Number(v).toFixed(n);$('heightOut').textContent=f(s.h*100,0)+' cm';for(let i=0;i<3;i++)$(`m${i+1}Out`).textContent=f(s.m[i]*1000,2)+' g';for(let i=0;i<3;i++){$(`r${i+1}Out`).textContent=f(s.r[i],1)+' cm';$(`a${i+1}Out`).textContent=f(s.a[i],0)+'°';const R=polar(s.r[i],s.a[i]);$(`r${i+1}VecOut`).textContent=`(${f(R.x*100,1)}, ${f(R.z*100,1)}) cm`}$('idealM3Out').textContent=f(sol.m3*1000,3)+' g';$('idealR3Out').textContent=`(${f(sol.r3.x*100,2)}, ${f(sol.r3.z*100,2)}) cm`;const M=staticMomentMagnitude();$('momentOut').textContent=M.toExponential(2)+' N·m';const up=new THREE.Vector3(0,1,0).applyQuaternion(towerVisual?.quaternion||new THREE.Quaternion());const tilt=THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(up.y,-1,1)));$('tiltOut').textContent=f(tilt,1)+'°';const scale=Math.max(1e-7,(s.m[0]+s.m[1]+s.m[2])*G*s.h),err=M/scale;const st=$('status');st.className='status '+(err<.003?'ok':err<.035?'warn':'bad');st.innerHTML=`<span></span>${err<.003?'Equilibrada':err<.035?'Ligera inclinación':'Desequilibrada'}`}

function bindRealtime(){['m1','m2','m3','r1','a1','r2','a2','r3','a3'].forEach(id=>$(id).addEventListener('input',()=>{updateGeometry()}));$('height').addEventListener('input',()=>{rebuildTower({preserveOrientation:false});updateGeometry()});$('towerModel').addEventListener('change',()=>{rebuildTower({preserveOrientation:false});updateGeometry()});}
$('calcBalance').addEventListener('click',calcEquilibrium);
$('resetTower').addEventListener('click',()=>{resetTowerPose();updateGeometry()});
$('resetPulleys').addEventListener('click',()=>{for(const [id,v] of [['r1',DEFAULTS.r1cm],['a1',DEFAULTS.a1],['r2',DEFAULTS.r2cm],['a2',DEFAULTS.a2],['r3',DEFAULTS.r3cm],['a3',DEFAULTS.a3]])$(id).value=v;updateGeometry()});
$('resetMasses').addEventListener('click',()=>{for(const [id,v] of [['m1',DEFAULTS.m1g],['m2',DEFAULTS.m2g],['m3',DEFAULTS.m3g]])$(id).value=v;updateGeometry()});
$('resetAll').addEventListener('click',()=>{$('towerModel').value=DEFAULTS.model;$('height').value=DEFAULTS.hCm;for(const [id,v] of Object.entries({m1:DEFAULTS.m1g,m2:DEFAULTS.m2g,m3:DEFAULTS.m3g,r1:DEFAULTS.r1cm,a1:DEFAULTS.a1,r2:DEFAULTS.r2cm,a2:DEFAULTS.a2,r3:DEFAULTS.r3cm,a3:DEFAULTS.a3}))$(id).value=v;cam={radius:.78,yaw:.72,pitch:.48,mode:'free'};setRotationMode('free');dclOn=false;dclGroup.visible=false;$('dclPanel').hidden=true;$('toggleDCL').classList.remove('active');rebuildTower();updateGeometry()});

function setRotationMode(mode){cam.mode=mode;$('rotH').classList.toggle('active',mode==='h');$('rotV').classList.toggle('active',mode==='v');$('rotFree').classList.toggle('active',mode==='free')}
$('rotH').onclick=()=>setRotationMode('h');$('rotV').onclick=()=>setRotationMode('v');$('rotFree').onclick=()=>setRotationMode('free');$('zoomIn').onclick=()=>cam.radius=Math.max(.40,cam.radius-.07);$('zoomOut').onclick=()=>cam.radius=Math.min(1.35,cam.radius+.07);$('resetCamera').onclick=()=>{cam.radius=.78;cam.yaw=.72;cam.pitch=.48};$('toggleDCL').onclick=()=>{dclOn=!dclOn;dclGroup.visible=dclOn;$('dclPanel').hidden=!dclOn;$('toggleDCL').classList.toggle('active',dclOn)};
let drag=false,lastX=0,lastY=0,pinchDist=null;canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(cam.mode==='h'||cam.mode==='free')cam.yaw-=dx*.008;if(cam.mode==='v'||cam.mode==='free')cam.pitch=THREE.MathUtils.clamp(cam.pitch-dy*.006,.10,1.33)});canvas.addEventListener('wheel',e=>{e.preventDefault();cam.radius=THREE.MathUtils.clamp(cam.radius+e.deltaY*.0007,.40,1.35)},{passive:false});
function updateCamera(){camera.position.set(cam.radius*Math.sin(cam.yaw)*Math.cos(cam.pitch),.12+cam.radius*Math.sin(cam.pitch),cam.radius*Math.cos(cam.yaw)*Math.cos(cam.pitch));camera.lookAt(0,Math.min(.30,towerH*.42),0)}
function resize(){const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));if(canvas.width!==w||canvas.height!==h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}}

function physicsStep(dt){
  if(!towerBody)return;
  // Visualización cuasiestática sobreamortiguada: se usa el momento real obtenido
  // con T_i=m_i g y g=9.81 m/s², pero se evita deliberadamente cualquier rebote.
  // Si ΣM_O≈0, la solución objetivo es exactamente vertical y no deriva por errores numéricos.
  const s=readState();
  const tau=staticMomentVector();
  const M=tau.length();
  const scale=Math.max(1e-9,(s.m[0]+s.m[1]+s.m[2])*G*s.h);
  const err=M/scale;

  let targetQ=new THREE.Quaternion();
  if(err>5e-5 && M>1e-10){
    const axis=new THREE.Vector3(tau.x,0,tau.z);
    if(axis.lengthSq()>1e-14){
      axis.normalize();
      // Un desequilibrio pequeño produce una inclinación pequeña. Se limita la
      // representación a 28° para mantener visible el montaje, sin "caída y rebote".
      const targetTilt=Math.min(THREE.MathUtils.degToRad(28),err*THREE.MathUtils.degToRad(170));
      targetQ.setFromAxisAngle(axis,targetTilt);
    }
  }

  const currentQ=new THREE.Quaternion(towerBody.quaternion.x,towerBody.quaternion.y,towerBody.quaternion.z,towerBody.quaternion.w);
  const alpha=1-Math.exp(-6.5*Math.max(dt,0)); // respuesta monótona, sin sobrepaso
  currentQ.slerp(targetQ,alpha).normalize();

  towerBody.quaternion.set(currentQ.x,currentQ.y,currentQ.z,currentQ.w);
  towerBody.velocity.set(0,0,0);
  towerBody.angularVelocity.set(0,0,0);
  towerBody.force.set(0,0,0);
  towerBody.torque.set(0,0,0);

  // Mantener exactamente el punto de la rótula O unido a la torre.
  const localPivot=new THREE.Vector3(0,-towerCom,0).applyQuaternion(currentQ);
  towerBody.position.set(-localPivot.x,PIVOT_Y-localPivot.y,-localPivot.z);
  smoothAccel.set(0,0,0);
  previousVel.set(0,0,0);
  syncTowerVisual();
}
let last=performance.now();function animate(now){requestAnimationFrame(animate);resize();updateCamera();const dt=Math.min(.025,Math.max(.001,(now-last)/1000));last=now;physicsStep(dt);updateGeometry();renderer.render(scene,camera)}

bindRealtime();rebuildTower();calcEquilibrium();requestAnimationFrame(animate);
