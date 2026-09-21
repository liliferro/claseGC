const CORTAS={
 'Ni nos conocemos':'Primer contacto','Salimos una vez y no hubo química':'La probaron','Nos vemos de vez en cuando':'Uso ocasional','Es mi compañera de trabajo diaria':'Uso diario',
 'Escribir más rápido, con mi estilo':'Escribir','Leer lo largo y encontrar lo importante':'Resumir','Poner orden en mi agenda y pendientes':'Organizar','Sacar conclusiones de mis números':'Analizar','Preparar mis respuestas de siempre':'Responder','Crear presentaciones, imágenes o contenido':'Crear contenido',
 'No sé ni qué preguntarle':'No sé qué pedir','Inventa cosas y no le creo':'No confío en la respuesta','¿Y mis datos a dónde van?':'Privacidad','No tengo tiempo de aprender':'Falta de tiempo','Siento que no es para mi trabajo':'No veo cómo aplicarla','Nada me frena: quiero ir más allá':'Quiero avanzar','Todavía no tengo una cuenta':'Sin cuenta'
};
export const etiqueta=k=>CORTAS[k]||k;
export function lideres(items=[]){const max=Math.max(0,...items.map(x=>x.n));return max?items.filter(x=>x.n===max):[];}
export function resumenConsenso(r){const ganan=lideres(r.votos);const nombres=ganan.slice(0,3).map(x=>CORTAS[x.k]||'Otra prioridad').join(' / ')+(ganan.length>3?` +${ganan.length-3}`:'');return {ganan,votacion:ganan.length?`${ganan.length>1?'Empate':'Más votado'}: ${nombres} (${ganan[0].n} ${ganan[0].n===1?'voto':'votos'}${ganan.length>1?' cada uno':''}).`:'Todavía no hay votos.',cobertura:`${r.seleccion.cobertura} de ${r.tareas.length} tareas representadas`,nivel:lideres(r.niveles),herramienta:lideres(r.herramientas),freno:lideres(r.frenos)};}
