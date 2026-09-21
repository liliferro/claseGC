'use client';

import { useCallback, useEffect, useState } from 'react';
import { sb } from '../../../lib/supabase';
import { PREGUNTAS } from '../../../lib/preguntas';

export default function Sala({ params }) {
  const codigo = params.codigo;
  const llave = 'asistente:' + codigo;

  const [fase, setFase] = useState('cargando');   // entrada | encuesta | espera | cuaderno
  const [yo, setYo] = useState(null);             // { asistente_id, nombre }
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState({});
  const [ejercicios, setEjercicios] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Si ya entró antes (recargó, se le trabó el celular), lo recuperamos.
  useEffect(() => {
    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem(llave) || 'null'); } catch (e) {}
    if (guardado && guardado.asistente_id) {
      setYo(guardado);
      setFase(guardado.termino ? 'espera' : 'encuesta');
      setPaso(guardado.paso || 0);
    } else {
      setFase('entrada');
    }
  }, [llave]);

  const recuerda = useCallback((datos) => {
    try { localStorage.setItem(llave, JSON.stringify(datos)); } catch (e) {}
  }, [llave]);

  async function entrar(nombre, oficio) {
    setError(''); setGuardando(true);
    const { data, error: err } = await sb.rpc('entrar_sala', {
      p_codigo: codigo, p_nombre: nombre, p_oficio: oficio
    });
    setGuardando(false);
    if (err) {
      setError(err.message.includes('cerrada')
        ? 'La sala ya cerró. Avísale a Liliana y te agrega a mano.'
        : 'No pude entrar. Revisa tu conexión y vuelve a intentar.');
      return;
    }
    const nuevo = { asistente_id: data.asistente_id, nombre, paso: 0, termino: false };
    setYo(nuevo); recuerda(nuevo); setFase('encuesta');
  }

  async function responder(pregunta, valor) {
    setGuardando(true);
    const { error: err } = await sb.rpc('responder', {
      p_asistente_id: yo.asistente_id, p_pregunta: pregunta, p_valor: valor
    });
    setGuardando(false);
    if (err) { setError('No se guardó esa respuesta. Intenta de nuevo.'); return false; }
    setError('');
    return true;
  }

  async function avanzar() {
    const p = PREGUNTAS[paso];
    const v = valores[p.id];
    const ok = await responder(p.id, v);
    if (!ok) return;
    const siguiente = paso + 1;
    if (siguiente >= PREGUNTAS.length) {
      recuerda({ ...yo, paso: siguiente, termino: true });
      setFase('espera');
    } else {
      recuerda({ ...yo, paso: siguiente, termino: false });
      setPaso(siguiente);
    }
  }

  // En espera: preguntamos cada 3 segundos si ya publicó los ejercicios.
  useEffect(() => {
    if (fase !== 'espera') return;
    let vivo = true;
    async function mirar() {
      const { data } = await sb.rpc('conteo_sala', { p_codigo: codigo });
      if (!vivo || !data) return;
      if (data.estado === 'publicada') {
        const { data: ejs } = await sb.from('ejercicios').select('*').order('orden');
        if (vivo && ejs) { setEjercicios(ejs); setFase('cuaderno'); }
      }
    }
    mirar();
    const t = setInterval(mirar, 3000);
    return () => { vivo = false; clearInterval(t); };
  }, [fase, codigo]);

  if (fase === 'cargando') return <div className="movil" />;
  if (fase === 'entrada') return <Entrada onEntrar={entrar} error={error} ocupado={guardando} />;

  if (fase === 'encuesta') {
    const p = PREGUNTAS[paso];
    return (
      <Encuesta
        pregunta={p}
        indice={paso}
        total={PREGUNTAS.length}
        valor={valores[p.id]}
        onCambio={(v) => setValores({ ...valores, [p.id]: v })}
        onAvanzar={avanzar}
        error={error}
        ocupado={guardando}
      />
    );
  }

  if (fase === 'espera') {
    return (
      <div className="movil">
        <div className="centro espera">
          <h2>Listo{yo?.nombre ? ', ' + yo.nombre.split(' ')[0] : ''}.</h2>
          <p className="tenue">Voltea a la pantalla grande. En un rato te llegan aquí tus ejercicios.</p>
          <div style={{ marginTop: 28 }}>
            <span className="punto" /><span className="punto" /><span className="punto" />
          </div>
        </div>
      </div>
    );
  }

  return <Cuaderno ejercicios={ejercicios} asistenteId={yo.asistente_id} />;
}

/* ---------- pantallas ---------- */

function Entrada({ onEntrar, error, ocupado }) {
  const [nombre, setNombre] = useState('');
  const [oficio, setOficio] = useState('');
  return (
    <div className="movil">
      <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
        <h1>Trabaja mejor, no más</h1>
        <p className="tenue">
          Dos datos y arrancamos. Lo que contestes arma la clase de hoy, en vivo.
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
          <input className="campo" placeholder="Tu nombre" value={nombre}
            onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" />
          <input className="campo" placeholder="A qué te dedicas" value={oficio}
            onChange={(e) => setOficio(e.target.value)} />
        </div>
        {error ? <div className="mal">{error}</div> : null}
        <button className="btn" disabled={!nombre.trim() || ocupado}
          onClick={() => onEntrar(nombre, oficio)}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

function Encuesta({ pregunta, indice, total, valor, onCambio, onAvanzar, error, ocupado }) {
  const esTexto = pregunta.tipo === 'texto';
  const varias = pregunta.tipo === 'varias';
  const marcadas = Array.isArray(valor) ? valor : [];

  const listo = esTexto
    ? (!pregunta.obligatoria || String(valor || '').trim().length > 2)
    : varias ? marcadas.length > 0 : Boolean(valor);

  function alternar(op) {
    if (!varias) { onCambio(op); return; }
    onCambio(marcadas.includes(op) ? marcadas.filter((x) => x !== op) : [...marcadas, op]);
  }

  return (
    <div className="movil">
      <div className="progreso"><i style={{ width: ((indice) / total) * 100 + '%' }} /></div>
      <h2>{pregunta.texto}</h2>
      {pregunta.ayuda ? <p className="tenue" style={{ marginTop: -4 }}>{pregunta.ayuda}</p> : null}

      {esTexto ? (
        <textarea className="campo" style={{ marginTop: 18 }} value={valor || ''}
          onChange={(e) => onCambio(e.target.value)}
          placeholder="Por ejemplo: todos los días copio a mano los pedidos que me llegan por correo a una hoja de cálculo." />
      ) : (
        <div className="opciones">
          {pregunta.opciones.map((op) => {
            const activa = varias ? marcadas.includes(op) : valor === op;
            return (
              <button key={op} className="opcion" aria-pressed={activa}
                onClick={() => alternar(op)}>{op}</button>
            );
          })}
        </div>
      )}

      {error ? <div className="mal">{error}</div> : null}
      <button className="btn" disabled={!listo || ocupado} onClick={onAvanzar}>
        {ocupado ? 'Guardando…' : indice + 1 === total ? 'Terminar' : 'Siguiente'}
      </button>
      <p className="tenue" style={{ textAlign: 'center', fontSize: '.85rem', marginTop: 16 }}>
        {indice + 1} de {total}
      </p>
    </div>
  );
}

function Cuaderno({ ejercicios, asistenteId }) {
  return (
    <div className="movil">
      <h2>Tus ejercicios</h2>
      <p className="tenue" style={{ marginTop: -4 }}>
        Copia el prompt, pégalo en la IA que uses y guarda aquí lo que te salga para llevártelo.
      </p>
      <div style={{ marginTop: 22 }}>
        {ejercicios.map((e, i) => (
          <Ejercicio key={e.id} ejercicio={e} indice={i} asistenteId={asistenteId} />
        ))}
      </div>
    </div>
  );
}

function Ejercicio({ ejercicio, indice, asistenteId }) {
  const [copiado, setCopiado] = useState(false);
  const [resultado, setResultado] = useState('');
  const [estado, setEstado] = useState('');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(ejercicio.prompt);
      setCopiado(true); setTimeout(() => setCopiado(false), 1800);
    } catch (e) {
      setEstado('Tu navegador no dejó copiar. Selecciona el texto a mano.');
    }
  }

  async function guardar() {
    setEstado('Guardando…');
    const { error } = await sb.rpc('guardar_entrega', {
      p_asistente_id: asistenteId, p_ejercicio_id: ejercicio.id, p_resultado: resultado
    });
    setEstado(error ? 'No se guardó. Intenta otra vez.' : 'Guardado');
  }

  const pasos = Array.isArray(ejercicio.pasos) ? ejercicio.pasos : [];

  return (
    <div className="ej">
      <div className="num">Ejercicio {indice + 1}</div>
      <h3>{ejercicio.titulo}</h3>
      {ejercicio.a_quien_sirve ? <p className="tenue" style={{ fontSize: '.88rem', margin: 0 }}>{ejercicio.a_quien_sirve}</p> : null}
      {pasos.length ? <ol>{pasos.map((p, i) => <li key={i}>{p}</li>)}</ol> : null}
      <div className="prompt">{ejercicio.prompt}</div>
      <button className="btn fantasma" style={{ marginTop: 12 }} onClick={copiar}>
        {copiado ? 'Copiado' : 'Copiar el prompt'}
      </button>
      <textarea className="campo" style={{ marginTop: 12, minHeight: 90 }}
        placeholder="Pega aquí lo que te respondió, para llevártelo"
        value={resultado} onChange={(e) => setResultado(e.target.value)} />
      <button className="btn fantasma" style={{ marginTop: 10 }}
        disabled={!resultado.trim()} onClick={guardar}>Guardar lo mío</button>
      {estado ? <p className="tenue" style={{ fontSize: '.82rem' }}>{estado}</p> : null}
    </div>
  );
}
