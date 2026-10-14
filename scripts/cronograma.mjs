// Convierte el CSV del cronograma (exportado de la planilla de Google) en una lista de días.
// Las celdas combinadas llegan en el CSV como una celda con valor y las demás vacías.

export function parseCsv(texto) {
  const filas = []
  let fila = []
  let celda = ''
  let comillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++ }
      else if (c === '"') comillas = false
      else celda += c
    } else if (c === '"') comillas = true
    else if (c === ',') { fila.push(celda); celda = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(celda); filas.push(fila); fila = []; celda = ''
    } else celda += c
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila) }
  return filas
}

/** Clasifica un texto del cronograma. */
export function tipoDe(texto) {
  const t = texto.trim()
  if (/^SIN CLASES/i.test(t)) return 'sin-clases'
  if (/^RECESO/i.test(t)) return 'receso'
  if (/^Pre-?Parcial/i.test(t)) return 'preparcial'
  if (/Recuperatorio/i.test(t)) return 'recuperatorio'
  if (/^(Primer|Segundo) Parcial/i.test(t)) return 'parcial'
  if (/^TPA\s*-+\s*Entrega/i.test(t)) return 'tpa'
  return 'clase'
}

const PRIORIDAD = ['sin-clases', 'receso', 'parcial', 'recuperatorio', 'preparcial', 'tpa', 'clase']
// Los "T11 - " del comienzo son numeración interna del cronograma y no coincide entre cursadas: no se muestra.
const limpiar = (t) => t.replace(/\s*-{2,}\s*/g, ' - ').replace(/\s+/g, ' ').replace(/^T\d+\s*-\s*/, '').trim()

/** Fechas que no son un día: "1er Quincena Feb. 2028". */
function fechaAproximada(a) {
  const m = a.match(/^(1er|2da)\s+Quincena\s+(\w+)\.?\s+(\d{4})$/i)
  if (!m) return null
  const mes = { ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06', jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12' }[m[2].slice(0, 3).toLowerCase()]
  if (!mes) return null
  const primera = /^1er/i.test(m[1])
  return { fecha: `${m[3]}-${mes}-${primera ? '01' : '16'}`, texto: `${primera ? '1ª' : '2ª'} quincena de ${m[2].toLowerCase()}.` }
}

/**
 * Columnas del cronograma 2027 (la primera es de adorno):
 *   Fecha / Modalidad | Parcialito | Clase | Clase (2ª del día) | Trabajo Práctico / Material | Complementario
 * Se ubican por la columna "Fecha" del encabezado, así que un corrimiento de columnas no rompe nada.
 */
export function parseCronograma(csv) {
  const filas = parseCsv(csv)
  const titulo = (filas.flat().find((c) => /CRONOGRAMA/i.test(c)) ?? '').replace(/\s+/g, ' ').trim()
  const cab = filas.findIndex((f) => f.some((c) => /Fecha/i.test(c)))
  const col = cab >= 0 ? Math.max(0, filas[cab].findIndex((c) => /Fecha/i.test(c))) : 1
  const dias = []
  for (const f of filas.slice(cab + 1)) {
    const celda = (n) => (f[col + n] ?? '').trim()
    const a = celda(0)
    const m = a.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(.+))?$/)
    const aprox = m ? null : fechaAproximada(a)
    if (!m && !aprox) continue
    const items = []
    for (const crudo of [celda(1), celda(2), celda(3)]) {
      const texto = limpiar(crudo)
      if (texto && texto !== '-' && !items.some((i) => i.titulo === texto)) items.push({ tipo: tipoDe(texto), titulo: texto })
    }
    const tp = limpiar(celda(4))
    if (/Entrega/i.test(tp) && !items.some((i) => i.titulo === tp)) items.push({ tipo: 'tpa', titulo: tp })
    if (!items.length) continue
    const tipo = PRIORIDAD.find((p) => items.some((i) => i.tipo === p)) ?? 'clase'
    const dia = m
      ? { fecha: `${m[3]}-${m[2]}-${m[1]}`, modalidad: m[4] ?? '', tipo, items }
      : { fecha: aprox.fecha, texto: aprox.texto, modalidad: '', tipo, items }
    dias.push(dia)
  }
  dias.sort((x, y) => x.fecha.localeCompare(y.fecha))
  return { titulo, dias }
}
