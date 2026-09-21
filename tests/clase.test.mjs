import {tarjetasGamma, palabras, promptManual} from '../lib/gamma.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {resumir,seleccionar,validarClase,promptGamma,casosPublicos,PODERES} from '../lib/clase.mjs';
function sala(rows){return {asistentes:rows.map((r,i)=>({id:String(i),nombre:'Persona '+i,oficio:'Prueba'})),respuestas:rows.flatMap((r,i)=>Object.entries(r).map(([pregunta,valor])=>({asistente_id:String(i),pregunta,valor})))}}
test('intervalos abiertos, datos antiguos y respuestas incompletas no inventan precisión',()=>{
 const r=resumir(sala([{horas:'2 a 5',nivel:'Nunca',finalizada_v3:true},{horas:'5 a 10'},{horas:'Más de 10 (mis fines de semana lloran)'},{horas:'1 a 3'}]));
 assert.deepEqual(r.horas,{min:17,max:null,n:3,anteriores:1,texto:'Más de 17 h/semana'});assert.equal(r.completas,1);assert.equal(r.nunca,1);assert.equal(r.patrones.length,0);
 assert.equal(resumir(sala([{horas:'Menos de 2'},{horas:'2 a 5'}])).horas.texto,'2–7 h/semana');
});
test('proyección respeta el permiso y resumen para IA no incluye nombres del registro',()=>{
 const d=sala([{tarea:'Privada',permiso:'Solo para preparar la clase',sueno:'Privado'},{tarea:'Pública',permiso:'De forma anónima',sueno:'Cenar'},{tarea:'Pública con alias',permiso:'Con mi nombre o alias'},{tarea:'Sin permiso'}]);
 assert.equal(casosPublicos(d).length,2);assert.equal(casosPublicos(d)[0].nombre,'Anónimo');assert.equal(casosPublicos(d)[1].nombre,'Persona 2');assert.deepEqual(resumir(d).cierres,['Cenar']);assert.ok(!JSON.stringify(resumir(d)).includes('Persona 2'));
});
test('selección maximiza cobertura respetando diversidad y al menos dos votos del podio',()=>{
 const p=(id,n,capacidad,superpoder)=>({id,n,capacidad,superpoder,casos:Array.from({length:n},(_,i)=>id+i)});
 const r={votos:[{k:PODERES[0],n:8},{k:PODERES[1],n:6},{k:PODERES[3],n:3}],patrones:[p('a',20,'extraer',PODERES[2]),p('b',15,'extraer',PODERES[2]),p('c',8,'redactar',PODERES[0]),p('d',7,'resumir',PODERES[1]),p('e',3,'analizar',PODERES[3])]};
 const s=seleccionar(r);assert.equal(s.cobertura,35);assert.equal(s.coincidencias,2);assert.deepEqual(s.patrones.map(x=>x.id),['a','c','d']);assert.equal(seleccionar({...r,patrones:r.patrones.slice(0,2)}).patrones.length,1);
});
test('generación exige tres ejercicios y conserva la selección exacta y el prompt íntegro',()=>{
 const r=resumir(sala([{tarea:'Pedidos',origen:'Correos',destino:'Una tabla o lista',superpoder:PODERES[2]}]));
 const base={titulo:'Práctica',aQuienSirve:'Grupo',capacidad:'extraer',patron:r.seleccion.patrones[0].id,superpoder:PODERES[2],motivo:'Cobertura',casos:['caso-1'],pasos:['Leer','Pedir','Comprobar'],datos:'Venta: 10',prompt:'Conserva ```texto``` completo',resultado:'10',verificacion:'Comparar con fuente',adaptacion:'Repetir mañana'};
 const c={frenoEjercicio:1,frenoRespuesta:'Compara la salida con la fuente.',lectura:'Muestra parcial',objetivo:'Practicar',cierre:'¿Para qué usarías ese tiempo?',grupos:[],ejercicios:[base,{...base,patron:'complementario',casos:[],capacidad:'resumir'},{...base,patron:'complementario',casos:[],capacidad:'redactar'}]};
 c.ejercicios=c.ejercicios.map((e,i)=>({...e,origenCaso:i?'':'caso-1',origenResumen:'Pedidos por correo',tecnica:['entrevista','critica','alternativas'][i],loops:['Pregunta por el pedido que falta.','Corrige el pedido con la fuente.'],reto:'',combo:{frase:'El contexto guarda pedidos, el prompt ordena y la tabla permite comprobar.',cadena:['Contexto','Prompt manual','Tabla'],plan:'Disponibilidad por confirmar en la cuenta',protagonistas:[],apoyos:[],pasos:['Abre tu herramienta','Pega datos ficticios','Comprueba la tabla'],estado:'Manual',limitacion:'Traspaso manual, sin conexiones.',fuentes:[]}}));
 validarClase(c,r);assert.equal(tarjetasGamma(c,r).length,26);assert.ok(promptGamma(c,r).includes(base.prompt));assert.ok(promptGamma(c,r).startsWith('# Trabaja mejor'));assert.ok(promptGamma(c,r).includes('````text'));assert.throws(()=>validarClase({...c,ejercicios:c.ejercicios.map(e=>({...e,tecnica:'entrevista'}))},r));assert.ok(promptManual(r,'Reglas').includes('<respuestas>'));assert.throws(()=>validarClase({...c,ejercicios:c.ejercicios.slice(0,2)},r));assert.throws(()=>validarClase({...c,ejercicios:[{...base,casos:[]},...c.ejercicios.slice(1)]},r));
});
