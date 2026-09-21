import {OTROS} from './respuestas.mjs';
const BASE = [
 {id:'nivel',tipo:'una',texto:'¿Cómo va tu relación con la IA?',opciones:['Ni nos conocemos','Salimos una vez y no hubo química','Nos vemos de vez en cuando','Es mi compañera de trabajo diaria']},
 {id:'horas',tipo:'una',texto:'¿Cuántas horas a la semana se te van en tareas repetitivas?',ayuda:'Piensa en todas esas tareas, no solo en una. Estimamos tiempo dedicado; no prometemos recuperarlo todo.',opciones:['Menos de 2','2 a 5','5 a 10','Más de 10 (mis fines de semana lloran)','No sé estimarlo']},
 {id:'tarea',tipo:'texto',obligatoria:true,texto:'Confiésate: ¿qué repites cada semana y piensas «esto debería hacerlo un robot»?',ayuda:'Mientras más concreta, mejor podremos elegir un ejercicio. No incluyas datos de clientes ni información confidencial.',placeholder:'Todos los lunes copio a mano los pedidos que llegan por correo a un Excel.'},
 {id:'origen',tipo:'una',texto:'Esa tarea empieza en…',ayuda:'Elige su punto de partida principal.',opciones:['WhatsApp','Correos','Documentos o PDFs','Hojas de cálculo','Juntas o llamadas','Mi cabeza','Otro lugar']},
 {id:'destino',tipo:'una',texto:'…y termina en…',ayuda:'Elige el resultado principal que necesitas.',opciones:['Un mensaje o respuesta','Un documento o reporte','Una tabla o lista','Mi agenda','Una publicación en redes','Una decisión','Otro resultado']},
 {id:'superpoder',tipo:'una',texto:'Si la IA te diera un superpoder mañana, ¿cuál eliges?',ayuda:'Tu voto ayuda a elegir las prácticas. Los tiempos dependerán de la tarea.',opciones:['Escribir más rápido, con mi estilo','Leer lo largo y encontrar lo importante','Poner orden en mi agenda y pendientes','Sacar conclusiones de mis números','Preparar mis respuestas de siempre','Crear presentaciones, imágenes o contenido']},
 {id:'freno',tipo:'una',texto:'¿Qué te ha frenado hasta ahora?',opciones:['No sé ni qué preguntarle','Inventa cosas y no le creo','¿Y mis datos a dónde van?','No tengo tiempo de aprender','Siento que no es para mi trabajo','Nada me frena: quiero ir más allá']},
 {id:'herramienta',tipo:'una',texto:'¿Qué IA sueles usar comúnmente?',ayuda:'Elige la que usas con más frecuencia. Si no usas IA, selecciona Ninguna.',opciones:['ChatGPT','Claude','Gemini','Otra IA','Ninguna']},
 {id:'sueno',tipo:'texto',obligatoria:false,texto:'Si recuperara parte de ese tiempo, lo usaría para…',ayuda:'Opcional. También se vale dejarlo para después.',placeholder:'…llegar a cenar con mis hijos.'}
];

export const PREGUNTAS=BASE.map(p=>OTROS[p.id]?{...p,otro:OTROS[p.id],opciones:p.opciones.includes(OTROS[p.id])?p.opciones:[...p.opciones,OTROS[p.id]]}:p);
