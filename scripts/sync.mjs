// Trae los datos que cambian fuera de este repo. Si algo falla se conserva la copia guardada en data/.
//   - data/cronograma.csv  <- planilla del cronograma (Google Sheets, "cualquiera con el link puede ver")
//   - data/classes.json    <- manifiesto que publica el repo de clases
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const curso = JSON.parse(readFileSync(join(ROOT, 'data/curso.json'), 'utf8'))

const CSV_URL =
  process.env.CRONOGRAMA_CSV_URL ??
  `https://docs.google.com/spreadsheets/d/${curso.cronogramaId}/export?format=csv${process.env.CRONOGRAMA_GID ? `&gid=${process.env.CRONOGRAMA_GID}` : ''}`
const CLASSES_URL = process.env.CLASSES_URL ?? 'https://ddsutn-k3003.github.io/clases/classes.json'

async function traer(nombre, url, valido, destino) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) })
    const texto = await r.text()
    if (!r.ok || !valido(texto)) throw new Error(`respuesta no válida (${r.status})`)
    writeFileSync(join(ROOT, destino), texto)
    console.log(`OK    ${nombre} actualizado`)
  } catch (e) {
    console.warn(`AVISO ${nombre}: no se pudo actualizar (${e.message}); se usa la copia guardada`)
  }
}

await traer('cronograma', CSV_URL, (t) => /Fecha/.test(t) && t.split('\n').length > 10, 'data/cronograma.csv')
await traer('clases', CLASSES_URL, (t) => { try { return Array.isArray(JSON.parse(t).classes) } catch { return false } }, 'data/classes.json')
