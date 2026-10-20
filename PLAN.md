# Plan de implementación — futbol-stats

Web personal (no se publica) para analizar un partido de fútbol usando **API-Football v3 (plan gratuito)**.
Al seleccionar un partido, muestra los últimos 5 partidos de cada equipo, los últimos 5 enfrentamientos directos,
estadísticas agregadas y probabilidades de victoria/empate.

## Instrucciones para el agente

- Entorno: **Windows**. Usa comandos compatibles con **CMD** (no `mkdir -p`, no `printf`, no `rm -rf`).
- Gestor de paquetes: **pnpm** (workspaces). Ejecuta siempre `pnpm install` desde la raíz.
- En el monorepo debe existir **un solo** `pnpm-workspace.yaml` y **un solo** `pnpm-lock.yaml`, ambos en la raíz.
  Si un generador crea alguno dentro de `apps/*` o `packages/*`, elimínalo y mueve su configuración a la raíz.
- Trabaja **fase por fase**. Al terminar cada paso, ejecuta su validación y no avances si falla.
- Responde y comenta en **español neutro**.
- Nunca subas ni imprimas la API key. Vive en `apps/api/.env`.

## Estado actual (ya hecho)

- Raíz `futbol-stats` con `package.json` y `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'

  onlyBuiltDependencies:
    - esbuild
    - better-sqlite3

  allowBuilds:
    esbuild: true
    better-sqlite3: true
  ```
- `apps/web`: Vite + React + TypeScript (generado).
- `apps/api`: Hono, template `nodejs` (generado; se eliminó su `pnpm-workspace.yaml`).

---

## Fase 1 — Terminar el setup del monorepo

### 1.1 Verificar workspace
```cmd
type pnpm-workspace.yaml
dir apps\api
dir apps\web
```
**Validación:** ningún `pnpm-workspace.yaml` ni `pnpm-lock.yaml` dentro de `apps\api` o `apps\web`.

### 1.2 Crear `packages/core`
```cmd
mkdir packages\core\src
cd packages\core
pnpm init
cd ..\..
```
Configurar `packages/core/package.json`:
- `"name": "@futbol/core"`, `"type": "module"`, `"private": true`
- `"main": "./src/index.ts"`, `"types": "./src/index.ts"` (se consume como TS directo, sin build)
- Crear `packages/core/src/index.ts` (exporta todo) y `packages/core/tsconfig.json` (strict, `moduleResolution: "bundler"`).

**Validación:** `dir packages\core\src` muestra `index.ts`.

### 1.3 Renombrar paquetes
| Archivo | `"name"` |
|---|---|
| `apps/web/package.json` | `web` |
| `apps/api/package.json` | `api` |
| `packages/core/package.json` | `@futbol/core` |

### 1.4 Dependencias
```cmd
pnpm --filter api add drizzle-orm better-sqlite3 zod p-limit dotenv
pnpm --filter api add -D drizzle-kit @types/better-sqlite3
pnpm --filter api add @futbol/core@workspace:*
pnpm --filter web add @tanstack/react-query recharts
pnpm --filter web add @futbol/core@workspace:*
pnpm --filter @futbol/core add zod
pnpm add -D -w vitest typescript
```
**Validación:** `pnpm -r ls --depth -1` lista `web`, `api` y `@futbol/core` sin errores.
Si `better-sqlite3` falla con `node-gyp`: verificar Node LTS (20/22) con `node -v`; si persiste, instalar
Visual Studio Build Tools (C++) y reintentar. Si aparece "Ignored build scripts", ejecutar `pnpm approve-builds`.

### 1.5 Tailwind + shadcn/ui en `apps/web`
Seguir la guía oficial actual de shadcn/ui para Vite (Tailwind v4 con `@tailwindcss/vite`, alias `@/`).
Agregar componentes: `button`, `card`, `input`, `command`, `popover`, `table`, `tabs`, `badge`, `skeleton`.

**Validación:** `pnpm --filter web build` termina sin errores.

### 1.6 Scripts en la raíz (`package.json`)
```json
"scripts": {
  "dev:api": "pnpm --filter api dev",
  "dev:web": "pnpm --filter web dev",
  "test": "vitest run",
  "typecheck": "pnpm -r exec tsc --noEmit"
}
```

### 1.7 Proxy del frontend
En `apps/web/vite.config.ts`, proxy de `/api` → `http://localhost:3000` para evitar CORS.

### 1.8 API key
```cmd
echo API_FOOTBALL_KEY=REEMPLAZAR> apps\api\.env
echo .env>> .gitignore
echo *.db>> .gitignore
```
Crear también `apps/api/.env.example` con `API_FOOTBALL_KEY=`.

### 1.9 Prueba de humo
- `pnpm dev:api` → http://localhost:3000 responde.
- `pnpm dev:web` → http://localhost:5173 carga.

---

## Fase 2 — `packages/core`: tipos y cálculos (sin red)

### 2.1 Esquemas Zod de API-Football
Respuesta genérica: `{ get, parameters, errors, results, paging, response: T[] }`.
**Ojo:** `errors` puede ser `[]` o un objeto (`{ requests: "..." }`, `{ token: "..." }`) — tratar ambos.

Modelar solo lo necesario:
- `Team`: `team.id`, `team.name`, `team.logo`, `team.country`.
- `Fixture`: `fixture.id`, `fixture.date`, `fixture.status.short`, `league.{id,name,season,logo}`,
  `teams.home/away.{id,name,logo,winner}`, `goals.home/away`, `score.fulltime`,
  y opcional `statistics` (viene embebido al consultar `/fixtures?ids=`).
- `FixtureStatistics`: `[{ team: {id,name}, statistics: [{ type: string, value: number | string | null }] }]`.
- `Prediction`: `predictions.percent.{home,draw,away}` (strings tipo `"45%"`), `comparison`.

### 2.2 Normalización de estadísticas
Función `extractTeamStats(fixture, teamId)` que devuelve:
```ts
{
  goalsFor, goalsAgainst,
  cornersFor, cornersAgainst,       // "Corner Kicks"
  shotsTotal,                        // "Total Shots"
  shotsOnTarget,                     // "Shots on Goal"
  saves,                             // "Goalkeeper Saves"
  yellowCards, redCards,             // "Yellow Cards", "Red Cards"
  hasStats: boolean
}
```
- `value: null` → `0` **solo** para tarjetas; para el resto, `null` (no disponible).
- Si el fixture no trae `statistics`, `hasStats = false` y los promedios se calculan solo sobre partidos con datos.

### 2.3 Agregados
`aggregate(matches)` → por cada métrica: total, promedio por partido y `n` (partidos con dato).
Incluir: córners a favor, córners totales del partido (a favor + en contra), tiros, tiros al arco,
atajadas, amarillas, rojas, goles a favor/en contra, promedio de goles a favor, en contra y total del partido.
Calcular también forma (W/D/L) de los últimos 5.

### 2.4 Probabilidades (Poisson)
- λA = (GF_prom_A + GC_prom_B) / 2 ; λB = (GF_prom_B + GC_prom_A) / 2 (sobre últimos 5).
- Si hay H2H con datos: mezclar con promedios de goles del H2H, peso 0.3 para H2H y 0.7 para forma reciente.
- Matriz de marcadores 0..10 × 0..10 con `P(i)·P(j)`; sumar para P(gana A), P(empate), P(gana B).
- Devolver también el marcador más probable y P(más de 2.5 goles).
- Normalizar para que sumen 1. Evitar λ = 0 (mínimo 0.1).

### 2.5 Tests (Vitest)
Casos: estadísticas `null`, fixture sin `statistics`, porcentajes `"45%"`, Poisson suma ≈ 1,
equipos idénticos → probabilidades A y B iguales.

**Validación:** `pnpm test` en verde.

---

## Fase 3 — `apps/api`: cliente, caché y endpoints

### 3.1 Cliente API-Football
- Base URL: `https://v3.football.api-sports.io`
- Header: `x-apisports-key: <API_FOOTBALL_KEY>`
- Limitar a **10 req/min** con cola (`p-limit` + espaciado, o ventana deslizante).
- Leer y guardar `x-ratelimit-requests-remaining` (cuota diaria) en la tabla `quota`.
- Si quedan **< 10** requests diarios: no llamar a la API; servir desde caché o responder 429 con mensaje claro.
- Validar respuestas con los esquemas Zod de `@futbol/core`. Si `errors` no está vacío, lanzar error descriptivo.

### 3.2 Caché SQLite (Drizzle)
Archivo: `apps/api/data/cache.db` (crear la carpeta si no existe).
Tablas:
- `api_cache`: `key` (PK, path + query normalizado), `payload` (JSON), `fetched_at`, `expires_at` (nullable = nunca).
- `quota`: `id` (único), `remaining`, `updated_at`.

TTL por tipo:
| Petición | TTL |
|---|---|
| `/teams?search=` | 30 días |
| `/fixtures?team=&next=` | 6 h |
| `/fixtures?team=&last=5` | 12 h |
| `/fixtures/headtohead?h2h=&last=5` | 24 h |
| `/fixtures?ids=` (partidos con `status.short` = `FT`, `AET`, `PEN`) | para siempre |
| `/predictions?fixture=` | 12 h |

Además, guardar cada fixture terminado por ID individual, para que `/fixtures?ids=` solo pida los IDs que faltan.

### 3.3 Endpoints propios
- `GET /api/teams/search?q=` → lista de equipos (mínimo 3 caracteres; la API lo exige).
- `GET /api/teams/:id/next` → próximos partidos del equipo.
- `GET /api/fixtures/:id/analysis?predictions=false` → arma todo:
  1. Obtener el fixture (o recibir `home`/`away` por query para ahorrar una llamada).
  2. `/fixtures?team={home}&last=5` y `/fixtures?team={away}&last=5`.
  3. `/fixtures/headtohead?h2h={home}-{away}&last=5`.
  4. Unir los IDs (máx. 15, sin duplicados), filtrar los ya cacheados y pedir el resto con
     `/fixtures?ids=id1-id2-...` (máximo 20 IDs por llamada).
  5. Opcional: `/predictions?fixture={id}` solo si `predictions=true`.
  6. Calcular con `@futbol/core` y devolver un único JSON.
- `GET /api/quota` → requests restantes y hora de reinicio (medianoche UTC = 19:00 hora de Lima).

**Validación:** con la key real, consultar un partido de una liga con buena cobertura (revisar
`coverage.fixtures.statistics_fixtures` en `/leagues`). Repetir la misma consulta y confirmar en logs
que la segunda vez **no** consume requests.

**Nota del plan gratuito:** las temporadas disponibles son limitadas. Verificar al inicio si la temporada
actual está incluida; si no, `last=5` puede devolver vacío o un error en `errors`. Mostrarlo en la UI.

---

## Fase 4 — `apps/web`: interfaz

1. **Buscador**: combobox (shadcn `command`) con debounce de 400 ms, mínimo 3 caracteres → equipos.
2. **Selección de partido**: al elegir equipo, lista de próximos partidos → clic abre el análisis.
3. **Vista de análisis**:
   - Encabezado: escudos, liga, fecha (hora de Lima).
   - Tarjeta de probabilidades: barra Local / Empate / Visitante (Poisson) + marcador más probable.
     Si se pidió, mostrar la predicción de API-Football como referencia.
   - Tabs: "Últimos 5 — Local", "Últimos 5 — Visitante", "Cara a cara".
     Tabla por partido: rival, resultado, córners (a favor / total), tiros, tiros al arco, atajadas, amarillas, rojas.
   - Tabla comparativa de promedios lado a lado + gráfico de barras (Recharts).
   - Mostrar "N/D" cuando falten estadísticas e indicar sobre cuántos partidos se calculó cada promedio.
4. **Indicador de cuota** en el header (`/api/quota`), en rojo si quedan < 10.
5. TanStack Query con `staleTime` alto (30 min) para no repetir llamadas al navegar.

**Validación:** flujo completo buscar → elegir → ver análisis sin errores en consola;
`pnpm typecheck` y `pnpm --filter web build` en verde.

---

## Fase 5 — Pulido (opcional)

- Favoritos de equipos guardados en SQLite.
- Exportar análisis a PNG o CSV.
- Ajuste del modelo: ponderar partidos de local/visitante por separado.
