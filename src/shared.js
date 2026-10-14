// Lógica compartida entre el build (HTML estático) y el navegador (se actualiza con la fecha de hoy).
export const ETIQUETA = {
  clase: 'Clase',
  preparcial: 'Pre-parcial',
  parcial: 'Parcial',
  recuperatorio: 'Recuperatorio',
  tpa: 'TPA',
  'sin-clases': 'Sin clases',
  receso: 'Receso',
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function hoyISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function proximas(dias, hoy, n = 4) {
  return dias.filter((d) => d.fecha >= hoy).slice(0, n)
}

const SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export function renderProximas(lista, hoy, primera) {
  if (!lista.length) {
    return '<p class="prox-vacio">No hay más fechas en este cronograma. El del próximo año se publica acá.</p>'
  }
  return lista
    .map((d, i) => {
      const [y, m, dd] = d.fecha.split('-').map(Number)
      const dow = SEMANA[new Date(Date.UTC(y, m - 1, dd, 12)).getUTCDay()]
      const marca = d.fecha === hoy ? 'Hoy' : d.fecha === primera ? 'Primera clase' : i === 0 ? 'Próxima fecha' : ''
      const items = d.items
        .map((it) => `<li><span class="b b-${it.tipo}">${esc(ETIQUETA[it.tipo] ?? it.tipo)}</span><span class="prox-t">${esc(it.titulo)}</span></li>`)
        .join('')
      const virtual = /virtual/i.test(d.modalidad) ? '<span class="prox-mod">virtual</span>' : ''
      return `<li class="prox-dia${i === 0 ? ' es-primera' : ''}"><div class="prox-fecha"><span class="prox-num">${d.texto ? `${String(m).padStart(2, '0')}/${y}` : `${String(dd).padStart(2, '0')}/${String(m).padStart(2, '0')}`}</span><span class="prox-dow">${d.texto ? esc(d.texto) : dow}</span></div><div class="prox-cuerpo">${marca ? `<span class="prox-marca">${marca}</span>` : ''}<ul>${items}</ul>${virtual}</div></li>`
    })
    .join('')
}

