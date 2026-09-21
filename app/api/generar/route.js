import { createClient } from '@supabase/supabase-js';
import { resumir, INSTRUCCION, validarClase, promptGamma } from '../../../lib/clase.mjs';
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
 if(!process.env.ANTHROPIC_API_KEY)return Response.json({error:'La generación aún no está configurada. Usa Preparar manualmente.'},{status:503});
 const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:AbortSignal.timeout(50000),headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:6500,system:INSTRUCCION,messages:[{role:'user',content:JSON.stringify(r)}]})});
 if(!response.ok)return Response.json({error:response.status===429?'La API alcanzó su límite. Espera un momento.':'Anthropic no pudo generar la clase (código '+response.status+'). Revisa saldo y configuración.'},{status:502});
 const j=await response.json();if(j.stop_reason==='max_tokens')throw Error('La respuesta quedó incompleta. Intenta nuevamente.');
 const content=(j.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('');
 let c;try{c=JSON.parse(content.replace(/^```json\s*/,'').replace(/\s*```$/,''))}catch{throw Error('La IA devolvió un formato incompleto. Intenta nuevamente.')}
 validarClase(c,r);const prompt=promptGamma(c,r);
 const snapshot={...c,resumen:r,creada:new Date().toISOString(),prompt};
 const saved=await db.rpc('guardar_prompt',{p_codigo:b.codigo,p_pin:b.pin,p_prompt:JSON.stringify({version:3,...snapshot})});
 return Response.json({...snapshot,aviso:saved.error?'La clase se generó, pero no pudo guardarse en la base. Descárgala antes de cerrar.':null});
 }catch(e){return Response.json({error:e.name==='TimeoutError'?'La generación tardó demasiado. Intenta nuevamente.':e.message||'No se pudo generar.'},{status:502})}
}
