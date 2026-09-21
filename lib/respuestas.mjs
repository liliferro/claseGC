export const OTROS={nivel:'Otro caso',origen:'Otro lugar',destino:'Otro resultado',superpoder:'Otro superpoder',freno:'Otro motivo',herramienta:'Otra IA',dispositivo:'Otro dispositivo'};
export const textoRespuesta=v=>typeof v==='string'?v:v&&typeof v==='object'&&!Array.isArray(v)?String(v.texto||v.opcion||''):'';
export function prepararRespuesta(id,seleccion,detalle=''){if(seleccion!==OTROS[id])return seleccion??'';const texto=String(detalle).trim();if(texto.length<2||texto.length>400)throw Error('Escribe tu opción en el campo Otro (entre 2 y 400 caracteres).');return {opcion:seleccion,texto};}
export const claveTexto=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const TABLA='Una tabla o lista', DOC='Un documento o reporte', MSG='Un mensaje o respuesta', AGENDA='Mi agenda', SOCIAL='Una publicación en redes', DEC='Una decisión';
const PODERES=['Escribir más rápido, con mi estilo','Leer lo largo y encontrar lo importante','Poner orden en mi agenda y pendientes','Sacar conclusiones de mis números','Preparar mis respuestas de siempre','Crear presentaciones, imágenes o contenido'];
const CANON={origen:['WhatsApp','Correos','Documentos o PDFs','Hojas de cálculo','Juntas o llamadas','Mi cabeza'],destino:[MSG,DOC,TABLA,AGENDA,SOCIAL,DEC],superpoder:PODERES,freno:['No sé ni qué preguntarle','Inventa cosas y no le creo','¿Y mis datos a dónde van?','No tengo tiempo de aprender','Siento que no es para mi trabajo','Nada me frena: quiero ir más allá'],herramienta:['ChatGPT','Claude','Gemini','Grok','Copilot','Perplexity','NotebookLM','Todavía no tengo una cuenta'],dispositivo:['Celular','Laptop o tablet'],nivel:['Ni nos conocemos','Salimos una vez y no hubo química','Nos vemos de vez en cuando','Es mi compañera de trabajo diaria']};
const REGLAS={
 origen:[[/\b(whatsapp|wasap|wsp)\b/,'WhatsApp'],[/\b(correos?|emails?|e mail|gmail|outlook|buzon)\b/,'Correos'],[/\b(excel|sheets?|hojas? de calculo|spreadsheet|csv)\b/,'Hojas de cálculo'],[/\b(pdf|documentos?|word|contratos?)\b/,'Documentos o PDFs'],[/\b(juntas?|reuniones?|llamadas?|zoom|meet|grabaciones?)\b/,'Juntas o llamadas'],[/\b(mi cabeza|ideas? mentales|memoria)\b/,'Mi cabeza']],
 destino:[[/\b(excel|sheets?|hojas? de calculo|spreadsheet|csv|tablas?|listas?)\b/,TABLA],[/\b(agenda|calendario|calendar|citas?|horarios?)\b/,AGENDA],[/\b(publicacion|publicaciones|post|posts|redes|instagram|tiktok|reel|reels)\b/,SOCIAL],[/\b(mensaje|mensajes|respuesta|respuestas|correo|correos|whatsapp|email)\b/,MSG],[/\b(decision|decisiones|conclusiones?|recomendaciones?|diagnostico|analisis)\b/,DEC],[/\b(documento|reporte|informe|pdf|word|minuta)\b/,DOC]],
 superpoder:[[/\b(redactar|escribir|redaccion|minutas?)\b/,PODERES[0]],[/\b(resumir|resumen|resumenes|leer|lectura|sintetizar)\b/,PODERES[1]],[/\b(ordenar|organizar|agenda|pendientes|extraer|copiar|pasar|volcar|consolidar|excel|sheets|tabla)\b/,PODERES[2]],[/\b(analizar|analisis|conclusiones|numeros|estadisticas)\b/,PODERES[3]],[/\b(responder|contestar|respuestas|mensajes)\b/,PODERES[4]],[/\b(contenido|presentaciones|imagenes|redes|publicaciones|posts)\b/,PODERES[5]]],
 freno:[[/\b(no se.*(preguntar|pedir)|prompts?)\b/,'No sé ni qué preguntarle'],[/\b(inventa|alucina|mentiras|desconfianza|errores|no confio)\b/,'Inventa cosas y no le creo'],[/\b(privacidad|datos|confidencialidad|seguridad)\b/,'¿Y mis datos a dónde van?'],[/\b(tiempo|ocupad[oa])\b/,'No tengo tiempo de aprender'],[/\b(no.*(trabajo|profesion)|no me sirve)\b/,'Siento que no es para mi trabajo']],
 herramienta:[[/\b(chat ?gpt|openai)\b/,'ChatGPT'],[/\b(claude|anthropic)\b/,'Claude'],[/\b(gemini)\b/,'Gemini'],[/\b(grok)\b/,'Grok'],[/\b(copilot)\b/,'Copilot'],[/\b(perplexity)\b/,'Perplexity'],[/\b(notebook ?lm)\b/,'NotebookLM']],
 dispositivo:[[/\b(celular|telefono|iphone|android|smartphone)\b/,'Celular'],[/\b(laptop|tablet|ipad|computadora|ordenador|pc|macbook)\b/,'Laptop o tablet']],
 nivel:[[/\b(nunca|no he usado|primera vez)\b/,'Ni nos conocemos'],[/\b(una vez|solo probe)\b/,'Salimos una vez y no hubo química'],[/\b(a veces|ocasional|de vez en cuando)\b/,'Nos vemos de vez en cuando'],[/\b(diario|todos los dias|cada dia)\b/,'Es mi compañera de trabajo diaria']]
};
export function normalizarRespuesta(id,valor){
 const original=textoRespuesta(valor),k=claveTexto(original);const exacta=(CANON[id]||[]).find(v=>claveTexto(v)===k);
 if(exacta)return {original,grupo:exacta,estado:'opcion',motivo:'Coincide con una categoría.'};
 if(!k)return {original,grupo:'',estado:'vacia',motivo:'Sin respuesta.'};
 let candidatas=[...new Set((REGLAS[id]||[]).filter(([re])=>re.test(k)).map(([,grupo])=>grupo))];
 // El formato explícito aclara «reporte en Excel». El análisis es un objetivo diferente.
 if(id==='destino'&&candidatas.includes(TABLA)&&!candidatas.includes(DEC)&&! /\b(pdf|word)\b/.test(k))candidatas=candidatas.filter(x=>x!==DOC);
 if(id==='destino'&&candidatas.includes(DEC)&&! /\b(y|ademas|tambien)\b/.test(k))candidatas=candidatas.filter(x=>x!==TABLA&&x!==DOC);
 if(id==='superpoder'&&candidatas.includes(PODERES[3]))candidatas=candidatas.filter(x=>x!==PODERES[2]);
 if(id==='superpoder'&&candidatas.includes(PODERES[5]))candidatas=candidatas.filter(x=>x!==PODERES[0]);
 const negada=['origen','destino','superpoder','herramienta','dispositivo'].includes(id)&&/\b(no|ni|sin|excepto)\b/.test(k);
 if(candidatas.length===1&&!negada)return {original,grupo:candidatas[0],estado:'equivalencia',motivo:'Equivalencia por formato u objetivo explícito.'};
 return {original,grupo:original,estado:'revisar',motivo:candidatas.length>1||negada?'Varios objetivos o una negación: conservar por separado.':'No hay una equivalencia clara: conservar por separado.'};
}
