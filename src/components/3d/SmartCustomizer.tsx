"use client";
import React, { Suspense, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, useGLTF, Environment, Bounds, Decal } from '@react-three/drei';
import * as THREE from 'three';

interface PrintZone { id: string; label: string; type: 'image'|'text'|'both'; position:[number,number,number]; rotation:[number,number,number]; width:number; height:number; defaultImageUrl?:string; allowCustomColor:boolean; }
interface Model3DConfig { id:string; name:string; modelUrl:string; printZones:PrintZone[]; }
interface ZoneUpload { texture: THREE.Texture|null; text: string; textColor: string; }

const PRESET_COLORS = ['#ffffff','#111111','#dc2626','#16a34a','#1d4ed8','#ca8a04','#7c3aed','#0e7490','#ea580c','#be185d','#374151','#92400e'];

function createTextTexture(text:string, color='#ffffff', weight='900'): THREE.Texture|null {
  if (!text.trim()) return null;
  const c = document.createElement('canvas'); c.width=1024; c.height=512;
  const ctx = c.getContext('2d')!; ctx.clearRect(0,0,1024,512);
  ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=20;
  ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='middle';
  let size=280; ctx.font=`${weight} ${size}px "Arial Black",Arial,sans-serif`;
  while(ctx.measureText(text).width>984 && size>60){ size-=10; ctx.font=`${weight} ${size}px "Arial Black",Arial,sans-serif`; }
  ctx.fillText(text,512,256);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.flipY=false; t.needsUpdate=true; return t;
}

function ZoneDecalMesh({mesh,zone,texture}:{mesh:THREE.Mesh; zone:PrintZone; texture:THREE.Texture}) {
  const ref = {current:mesh} as React.MutableRefObject<THREE.Mesh>;
  return (
    <Decal mesh={ref} position={zone.position} rotation={zone.rotation} scale={[zone.width,zone.height,1]} debug={false}>
      <meshStandardMaterial map={texture} transparent depthTest polygonOffset polygonOffsetFactor={-10} toneMapped={false}/>
    </Decal>
  );
}

function ConfiguredModel({url,zones,uploads,colors,activeMaterial,setActiveMaterial,onMeshesLoaded}:{url:string;zones:PrintZone[];uploads:Record<string,ZoneUpload>;colors:Record<string,string>;activeMaterial:string|null;setActiveMaterial:(m:string)=>void;onMeshesLoaded:(m:string[])=>void}) {
  const {scene}=useGLTF(url);
  const cloned=useMemo(()=>{
    const s=scene.clone();
    s.traverse(c=>{ const m=c as THREE.Mesh; if(m.isMesh&&m.material){ m.material=Array.isArray(m.material)?m.material.map(x=>x.clone()):(m.material as THREE.Material).clone(); } });
    return s;
  },[scene]);

  useEffect(()=>{
    const mats=new Set<string>();
    cloned.traverse(c=>{ const m=c as THREE.Mesh; if(m.isMesh&&m.material){ (Array.isArray(m.material)?m.material:[m.material]).forEach(x=>{ if(x.name) mats.add(x.name); }); } });
    onMeshesLoaded(Array.from(mats));
  },[cloned]);

  useEffect(()=>{
    cloned.traverse(c=>{ const m=c as THREE.Mesh; if(!m.isMesh) return; (Array.isArray(m.material)?m.material:[m.material]).forEach(mat=>{ if(mat instanceof THREE.MeshStandardMaterial && colors[mat.name]) { mat.color.set(colors[mat.name]); mat.emissive.setHex(0); } }); });
  },[cloned,colors]);

  const meshMap=useMemo(()=>{
    const map:Record<string,THREE.Mesh>={};
    cloned.traverse(c=>{ const m=c as THREE.Mesh; if(m.isMesh) map[m.uuid]=m; });
    return map;
  },[cloned]);

  const renderNode=(node:THREE.Object3D):React.ReactNode=>{
    const mesh=node as THREE.Mesh;
    if(mesh.isMesh){
      const matName=Array.isArray(mesh.material)?mesh.material[0]?.name:mesh.material?.name;
      const sel=activeMaterial===matName;
      return (
        <mesh key={mesh.uuid} geometry={mesh.geometry} material={mesh.material} position={mesh.position} rotation={mesh.rotation} scale={mesh.scale}
          onPointerUp={e=>{e.stopPropagation();if(matName)setActiveMaterial(matName);}}
          onPointerOver={e=>{e.stopPropagation();document.body.style.cursor='pointer';}}
          onPointerOut={()=>{document.body.style.cursor='auto';}}>
          {sel&&<mesh geometry={mesh.geometry} scale={1.015}><meshBasicMaterial color="#f97316" side={THREE.BackSide}/></mesh>}
        </mesh>
      );
    }
    if(node.children?.length) return <group key={node.uuid} position={node.position} rotation={node.rotation} scale={node.scale}>{node.children.map(renderNode)}</group>;
    return null;
  };

  const zoneTextures = useMemo(()=>{
    const out:Record<string,THREE.Texture|null>={};
    zones.forEach(z=>{
      const up=uploads[z.id];
      if(!up){ out[z.id]=z.defaultImageUrl?null:null; return; }
      if(up.texture){ out[z.id]=up.texture; return; }
      if(up.text&&(z.type==='text'||z.type==='both')){ out[z.id]=createTextTexture(up.text,'#ffffff'); return; }
      out[z.id]=null;
    });
    return out;
  },[zones,uploads]);

  const firstMesh=Object.values(meshMap)[0]??null;

  return (
    <group>
      {cloned.children.map(renderNode)}
      {zones.map(z=>{
        const tex=zoneTextures[z.id];
        if(!tex||!firstMesh) return null;
        return <ZoneDecalMesh key={z.id} mesh={firstMesh} zone={z} texture={tex}/>;
      })}
    </group>
  );
}

export interface SmartCustomizerProps { modelConfig: Model3DConfig; onSave?: (data:{colors:Record<string,string>;zones:Record<string,{type:string;imageUrl?:string;text?:string}>})=>void; }

export function SmartCustomizer({modelConfig,onSave}:SmartCustomizerProps) {
  const [materials,setMaterials]=useState<string[]>([]);
  const [colors,setColors]=useState<Record<string,string>>({});
  const [activeMaterial,setActiveMaterial]=useState<string|null>(null);
  const [uploads,setUploads]=useState<Record<string,ZoneUpload>>({});
  const [activeZoneId,setActiveZoneId]=useState<string|null>(modelConfig.printZones[0]?.id??null);
  const [tab,setTab]=useState<'colors'|'zones'>('colors');
  const prevTexRef=useRef<Record<string,THREE.Texture|null>>({});

  const handleMeshesLoaded=useCallback((mats:string[])=>{ setMaterials(mats); setActiveMaterial(p=>p||mats[0]||null); },[]);

  const handleImageUpload=async(e:React.ChangeEvent<HTMLInputElement>,zoneId:string)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const url=URL.createObjectURL(file);
    const texture=await new Promise<THREE.Texture>(res=>new THREE.TextureLoader().load(url,t=>{t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;res(t);}));
    const prev=prevTexRef.current[zoneId];
    if(prev) prev.dispose();
    prevTexRef.current[zoneId]=texture;
    setUploads(p=>({...p,[zoneId]:{texture,text:'',textColor:'#ffffff'}}));
  };

  const activeZone=modelConfig.printZones.find(z=>z.id===activeZoneId);
  const activeUpload=activeZoneId?uploads[activeZoneId]:undefined;

  return (
    <div style={{fontFamily:"'Barlow Condensed','Arial Narrow',Arial,sans-serif"}} className="flex flex-col lg:flex-row w-full h-[750px] bg-[#0a0a0f] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Canvas */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'radial-gradient(circle at 50% 30%,#1a1a2e 0%,#0a0a0f 70%)'}}/>
        <Canvas dpr={[1,2]} camera={{position:[0,0,4],fov:45}} style={{background:'transparent'}}>
          <Suspense fallback={null}>
            <Environment preset="studio"/>
            <ambientLight intensity={0.5}/><directionalLight position={[5,10,5]} intensity={1.2}/>
            <Bounds fit margin={1.2}><Center>
              <ConfiguredModel url={modelConfig.modelUrl} zones={modelConfig.printZones} uploads={uploads} colors={colors} activeMaterial={activeMaterial} setActiveMaterial={m=>{setActiveMaterial(m);setTab('colors');}} onMeshesLoaded={handleMeshesLoaded}/>
            </Center></Bounds>
            <OrbitControls makeDefault enablePan={false} maxPolarAngle={Math.PI/1.8}/>
          </Suspense>
        </Canvas>
        <div className="absolute top-5 left-5 pointer-events-none">
          <p className="text-white text-2xl font-black uppercase tracking-[.2em]" style={{textShadow:'0 0 30px rgba(249,115,22,.5)'}}>3D STUDIO</p>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">Drag · Rotate · Customize</p>
        </div>
      </div>

      {/* Panel */}
      <div className="w-full lg:w-[380px] flex flex-col bg-[#111118] border-l border-white/10">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['colors','zones'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${tab===t?'text-orange-400 border-b-2 border-orange-400 bg-white/5':'text-white/30 hover:text-white/60'}`}>
              {t==='colors'?'🎨 Colors':'🖨 Print Zones'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Colors tab */}
          {tab==='colors'&&(
            <>
              {activeMaterial&&<div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full border-2 border-white/20" style={{backgroundColor:colors[activeMaterial]??'#ccc'}}/><span className="text-white/60 text-xs uppercase tracking-widest font-bold">Editing: <span className="text-white">{activeMaterial.replace(/_/g,' ')}</span></span></div>}
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Select Part</p>
                {materials.length===0?<p className="text-white/20 text-xs italic">Loading...</p>:(
                  <div className="grid grid-cols-2 gap-2">
                    {materials.map(mat=>(
                      <button key={mat} onClick={()=>setActiveMaterial(mat)} className={`px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-left flex items-center gap-2 transition-all ${activeMaterial===mat?'bg-orange-500/20 border border-orange-500/50 text-orange-300':'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}`}>
                        <span className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" style={{backgroundColor:colors[mat]??'#555'}}/>{mat.replace(/_/g,' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {activeMaterial&&(
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Color</p>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map(hex=>(
                      <button key={hex} onClick={()=>setColors(p=>({...p,[activeMaterial]:hex}))} className={`aspect-square rounded-lg transition-all hover:scale-110 border-2 ${colors[activeMaterial]===hex?'border-white scale-110':'border-transparent'}`} style={{backgroundColor:hex}}/>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md border border-white/20" style={{backgroundColor:colors[activeMaterial]??'#ccc'}}/>
                    <input type="color" value={colors[activeMaterial]??'#cccccc'} onChange={e=>setColors(p=>({...p,[activeMaterial]:e.target.value}))} className="flex-1 h-8 rounded-md cursor-pointer bg-transparent border border-white/10 px-1"/>
                    <span className="text-white/30 text-xs font-mono">{colors[activeMaterial]??'—'}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Zones tab */}
          {tab==='zones'&&(
            <>
              <div className="space-y-1.5">
                {modelConfig.printZones.length===0?(
                  <div className="text-center py-8 text-white/20 text-xs uppercase tracking-widest">No print zones configured for this model</div>
                ):modelConfig.printZones.map(zone=>{
                  const up=uploads[zone.id];
                  const hasContent=!!(up?.texture||up?.text);
                  return (
                    <button key={zone.id} onClick={()=>setActiveZoneId(zone.id)} className={`w-full px-4 py-3 rounded-xl text-left flex items-center justify-between transition-all ${activeZoneId===zone.id?'bg-orange-500/15 border border-orange-500/40 text-white':'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'}`}>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider">{zone.label}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{zone.type}</p>
                      </div>
                      {hasContent&&<span className="w-2 h-2 rounded-full bg-orange-400"/>}
                    </button>
                  );
                })}
              </div>

              {activeZone&&(
                <div className="border-t border-white/10 pt-5 space-y-4">
                  <p className="text-white text-sm font-black uppercase tracking-wider">{activeZone.label}</p>

                  {(activeZone.type==='image'||activeZone.type==='both')&&(
                    <label className="block w-full bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/15 hover:border-orange-500/50 transition-all rounded-2xl p-6 text-center cursor-pointer">
                      <p className="text-white/50 text-xs uppercase tracking-widest">Upload Logo / Image</p>
                      <p className="text-white/20 text-[10px] mt-1">Transparent PNG recommended</p>
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={e=>handleImageUpload(e,activeZone.id)}/>
                    </label>
                  )}

                  {(activeZone.type==='text'||activeZone.type==='both')&&(
                    <div>
                      <label className="text-white/30 text-[10px] uppercase tracking-widest block mb-1.5">Text</label>
                      <input type="text" maxLength={20} placeholder="Enter text..." value={activeUpload?.text??''} onChange={e=>setUploads(p=>({...p,[activeZone.id]:{...p[activeZone.id]??{texture:null,textColor:'#fff'},text:e.target.value.toUpperCase()}}))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black uppercase text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"/>
                    </div>
                  )}

                  {activeUpload?.texture&&(
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] text-orange-400 uppercase tracking-widest font-black">✓ Image uploaded</p>
                    </div>
                  )}

                  {activeUpload&&(
                    <button onClick={()=>{ const t=prevTexRef.current[activeZone.id]; if(t) t.dispose(); delete prevTexRef.current[activeZone.id]; setUploads(p=>{const n={...p};delete n[activeZone.id];return n;}); }} className="text-[10px] text-red-400/70 hover:text-red-400 uppercase tracking-wider">✕ Clear Zone</button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="flex gap-1.5 mb-3">
            {modelConfig.printZones.map(z=>{
              const hasContent=!!(uploads[z.id]?.texture||uploads[z.id]?.text);
              return <div key={z.id} className={`flex-1 h-1 rounded-full transition-all ${hasContent?'bg-orange-400':'bg-white/10'}`}/>;
            })}
          </div>
          <button onClick={()=>onSave?.({colors,zones:Object.fromEntries(modelConfig.printZones.map(z=>[z.id,{type:uploads[z.id]?.texture?'image':'text',text:uploads[z.id]?.text,imageUrl:undefined}]))})}
            className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 active:scale-95 transition-all shadow-xl shadow-orange-500/25">
            Save Design →
          </button>
        </div>
      </div>
    </div>
  );
}
