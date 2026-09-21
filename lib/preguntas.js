// IDs estables para conservar las respuestas existentes.
export const PREGUNTAS = [
  { id: 'nivel', tipo: 'una', texto: 'Qué tanto usas IA hoy',
    opciones: ['Nunca', 'La probé alguna vez', 'Un par de veces por semana', 'Todos los días'] },

  { id: 'cuales', tipo: 'varias', texto: 'Cuáles usas', ayuda: 'Puedes marcar varias',
    opciones: ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity', 'La de WhatsApp', 'Grok', 'NotebookLM', 'Otra', 'Ninguna'] },

  { id: 'paraque', tipo: 'varias', texto: 'Para qué la usas', ayuda: 'Puedes marcar varias',
    opciones: ['Escribir', 'Resumir', 'Buscar información', 'Traducir', 'Ideas', 'Imágenes', 'Analizar datos', 'No la uso'] },

  { id: 'tarea', tipo: 'texto', obligatoria: true,
    texto: 'Qué tarea repetitiva te quita más tiempo cada semana',
    ayuda: 'Cuéntala como se la contarías a un amigo. De aquí sale tu ejercicio de hoy.' },

  { id: 'horas', tipo: 'una', texto: 'Cuántas horas a la semana te quita',
    opciones: ['Menos de 1', '1 a 3', '3 a 6', 'Más de 6'] },

  { id: 'donde', tipo: 'varias', texto: 'Dónde vive esa información', ayuda: 'Puedes marcar varias',
    opciones: ['WhatsApp', 'Correo', 'Excel o Sheets', 'Calendario', 'Papel o mi cabeza', 'Un sistema o app', 'Redes sociales'] },

  { id: 'freno', tipo: 'una', texto: 'Qué te frena',
    opciones: ['No sé por dónde empezar', 'No confío en lo que responde', 'Me preocupa la privacidad', 'No tengo tiempo de aprender', 'Creo que no aplica a lo mío'] },

  { id: 'laptop', tipo: 'una', texto: 'Traes laptop',
    opciones: ['Sí', 'Solo celular'] },
  { id: 'resultado', tipo: 'texto', obligatoria: true, texto: '¿Qué te gustaría tener listo al terminar?', ayuda: 'Por ejemplo: una agenda revisada, una tabla de ventas o un mensaje para tus clientes.' },
  { id: 'acceso', tipo: 'una', texto: '¿Qué acceso tienes a la IA que usarás?', opciones: ['Cuenta gratuita', 'Cuenta de pago', 'No sé', 'Necesito ayuda para entrar'] },
  { id: 'permiso', tipo: 'una', texto: '¿Podemos usar tu caso como ejemplo?', ayuda: 'La facilitadora verá tus respuestas para preparar la clase. No incluyas datos confidenciales ni de otras personas.', opciones: ['Sí, de forma anónima', 'Solo para orientar la clase, sin mostrar mi caso'] }
];

export const HORAS_VALOR = { 'Menos de 1': 0.5, '1 a 3': 2, '3 a 6': 4.5, 'Más de 6': 8 };
