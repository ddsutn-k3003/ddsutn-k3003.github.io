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
  if (/^TPA\s*-\s*Entrega/i.test(t)) return 'tpa'
  return 'clase'
}

const PRIORIDAD = ['sin-clases', 'receso', 'parcial', 'recuperatorio', 'preparcial', 'tpa', 'clase']

export function parseCronograma(csv) {
  const filas = parseCsv(csv)
  const titulo = (filas[0]?.[0] ?? '').replace(/-+/g, ' ').replace(/\s+/g, ' ').trim()
  const dias = []
  for (const f of filas.slice(2)) {
    const [a = '', b = '', c = '', , , tp = ''] = f.map((x) => x.trim())
    const m = a.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(.+))?$/)
    if (!m) continue
    const items = []
    for (const texto of [b, c]) {
      if (texto && !items.some((i) => i.titulo === texto)) items.push({ tipo: tipoDe(texto), titulo: texto.replace(/\s+/g, ' ') })
    }
    if (/Entrega/i.test(tp) && !items.some((i) => i.titulo === tp)) items.push({ tipo: 'tpa', titulo: tp })
    if (!items.length) continue
    const tipo = PRIORIDAD.find((p) => items.some((i) => i.tipo === p)) ?? 'clase'
    dias.push({ fecha: `${m[3]}-${m[2]}-${m[1]}`, modalidad: m[4] ?? '', tipo, items })
  }
  dias.sort((x, y) => x.fecha.localeCompare(y.fecha))
  return { titulo, dias }
}
