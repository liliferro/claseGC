import { createClient } from '@supabase/supabase-js';
import { generarClaseLocal } from '../../../lib/generador.mjs';
import { resumir, validarClase, promptGamma } from '../../../lib/clase.mjs';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(req){
 try {
 const raw=await req.text();if(raw.length>4096)return Response.json({error:'Solicitud demasiado grande.'},{status:413});
 let b;try{b=JSON.parse(raw)}catch{return Response.json({error:'Solicitud inválida.'},{status:400})}
 if(!b||typeof b.codigo!=='string'||typeof b.pin!=='string'||b.codigo.length>80||b.pin.length>160)return Response.json({error:'Ingresa al panel de facilitadora.'},{status:401});
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_KEY,{auth:{persistSession:false}});
 const {data,error}=await db.rpc('resumen_sala',{p_codigo:b.codigo,p_pin:b.pin});
 if(error||!data)return Response.json({error:'No se pudo validar el acceso a esta sala.'},{status:403});
 const r=resumir(data);if(!r.tareas.length)return Response.json({error:'Necesitamos al menos una tarea descrita para personalizar la clase.'},{status:400});
 const c=generarClaseLocal(r);
 validarClase(c,r);const prompt=promptGamma(c,r);
 const snapshot={...c,resumen:r,creada:new Date().toISOString(),prompt};
 const saved=await db.rpc('guardar_prompt',{p_codigo:b.codigo,p_pin:b.pin,p_prompt:JSON.stringify({version:4,...snapshot})});
 return Response.json({...snapshot,aviso:saved.error?'La clase se generó, pero no pudo guardarse en la base. Descárgala antes de cerrar.':null});
 }catch(e){return Response.json({error:e.message||'No se pudo generar.'},{status:502})}
}
