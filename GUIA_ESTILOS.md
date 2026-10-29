# GUÍA DE ESTILOS — NetDiag (interfaz minimalista)

> Complementa a [PLAN_IMPLEMENTACION.md](./PLAN_IMPLEMENTACION.md). Todo valor visual de la app sale de **`src/theme/tokens.ts`**. **Prohibido** escribir colores, tamaños de fuente o espaciados "a mano" en los componentes.

---

## 1. Principios

1. **Primero la información.** Cada pantalla responde una sola pregunta ("¿qué hay en la red?", "¿está levantado este equipo?"). Lo demás es secundario.
2. **Un solo color de acento.** El color se reserva para **acciones** (acento) y **estados** (semánticos). Todo lo demás va en neutros.
3. **Bordes, no sombras.** Las superficies se separan con bordes de 1 px y cambios sutiles de fondo. Sin sombras ni gradientes.
4. **Legible bajo el sol.** El técnico trabaja en exteriores: alto contraste, texto base de 16 px y áreas táctiles de 48 dp como mínimo.
5. **Datos técnicos en monoespaciada.** IPs, MACs, OIDs, contadores y salidas de consola siempre en JetBrains Mono.
6. **Movimiento mínimo.** Las animaciones sólo comunican cambios de estado; nunca decoran.

---

## 2. Color

### 2.1 Paleta (tema claro = predeterminado para exteriores)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg` | `#FFFFFF` | `#0B0D10` | Fondo de pantalla |
| `surface` | `#F6F7F9` | `#14171C` | Tarjetas, inputs, filas presionadas |
| `surfaceAlt` | `#EEF0F3` | `#1C2027` | Chips, segmentados, terminal (claro) |
| `border` | `#E3E6EA` | `#262B33` | Bordes y divisores |
| `borderStrong` | `#C9CED6` | `#3A414C` | Borde de un input con foco y de los botones secundarios |
| `textPrimary` | `#0E1116` | `#F3F4F6` | Títulos y valores |
| `textSecondary` | `#4A5361` | `#A3ABB8` | Etiquetas y descripciones |
| `textTertiary` | `#8A93A1` | `#6B7380` | Placeholders, metadatos y marcas de tiempo |
| `accent` | `#2F5BEA` | `#6E8BFF` | Botón primario, enlaces, foco, pestaña activa |
| `accentPressed` | `#2449C4` | `#5873E0` | Estado presionado |
| `accentSubtle` | `#EBF0FE` | `#1A2240` | Fondo de la selección, badge informativo |
| `onAccent` | `#FFFFFF` | `#0B0D10` | Texto sobre el acento |
| `success` | `#15803D` | `#4ADE80` | Interfaz *up*, sincronizado |
| `successSubtle` | `#E8F6EE` | `#10291A` | Fondo de badge |
| `danger` | `#C62828` | `#F87171` | Interfaz *down*, error, acción destructiva |
| `dangerSubtle` | `#FDECEC` | `#2E1414` | Fondo de badge |
| `warning` | `#B45309` | `#FBBF24` | Pendiente de sincronizar, GPS impreciso |
| `warningSubtle` | `#FEF4E6` | `#2E2210` | Fondo de badge |
| `terminalBg` | `#F6F7F9` | `#08090B` | Fondo de `TerminalView` |
| `terminalText` | `#1F2733` | `#D7DCE3` | Texto de `TerminalView` |
| `overlay` | `rgba(14,17,22,0.45)` | `rgba(0,0,0,0.6)` | Fondo detrás de `Sheet` |

### 2.2 Reglas
- Contraste mínimo **WCAG AA**: 4.5:1 para texto normal y 3:1 para íconos y texto ≥ 20 px. Los pares `textPrimary/bg`, `textSecondary/bg`, `onAccent/accent` y los semánticos sobre su `*Subtle` cumplen AA; `textTertiary` **sólo** para información no esencial.
- El estado **nunca** se comunica sólo con color: siempre color + texto (o ícono). Ej.: `● Activa`, no sólo un punto verde.
- Como máximo **un** botón con fondo `accent` por pantalla.

---

## 3. Tipografía

**Familias:** `Inter` (UI) y `JetBrains Mono` (datos técnicos). Archivos: `Inter-Regular`, `Inter-Medium`, `Inter-SemiBold`, `JetBrainsMono-Regular`.

| Token | Familia | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|---|
| `display` | Inter | 28 / 34 | SemiBold | Número protagonista (cantidad de hosts, uptime) |
| `title` | Inter | 22 / 28 | SemiBold | Título de pantalla |
| `heading` | Inter | 17 / 24 | SemiBold | Título de sección o tarjeta |
| `body` | Inter | 16 / 24 | Regular | Texto general y valores de un input |
| `bodyStrong` | Inter | 16 / 24 | Medium | Título de fila de lista, texto de botón |
| `label` | Inter | 14 / 20 | Medium | Etiquetas de campo, chips, pestañas |
| `caption` | Inter | 13 / 18 | Regular | Metadatos, ayudas, marcas de tiempo |
| `overline` | Inter | 12 / 16 | SemiBold, mayúsculas, `letterSpacing: 0.6` | Encabezados de grupo ("INTERFACES") |
| `mono` | JetBrains Mono | 14 / 20 | Regular | IP, MAC, OID, contadores |
| `monoSmall` | JetBrains Mono | 12 / 18 | Regular | Salida de terminal |

Reglas: respetar el escalado de fuente del sistema (`allowFontScaling` activado) pero limitarlo con `maxFontSizeMultiplier={1.3}`. Nunca usar cursiva. Números en columnas: `fontVariant: ['tabular-nums']`.

---

## 4. Espaciado, grilla y forma

- **Base de 4 pt.** Tokens: `xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · xxxl 48`.
- Margen lateral de pantalla: `lg` (16). Separación entre secciones: `xl` (24). Separación dentro de una tarjeta: `md` (12).
- **Radios:** `sm 6` (badges, chips) · `md 10` (inputs, botones) · `lg 14` (tarjetas, sheets) · `full 999` (indicadores circulares).
- **Bordes:** siempre `StyleSheet.hairlineWidth` × 2 ≈ 1 px con el color `border`.
- **Áreas táctiles:** mínimo 48 × 48 dp (usar `hitSlop` si el elemento visual es más chico).
- **Elevación:** ninguna. La única excepción es `Sheet`, que se diferencia por el `overlay`.

---

## 5. Iconografía

- Librería única: **lucide-react-native**, trazo `strokeWidth={1.75}`.
- Tamaños: `16` (en línea con texto), `20` (filas, botones), `24` (barra de pestañas, header).
- Color: `textSecondary` por defecto; `accent` sólo si es interactivo y está activo; semántico si representa un estado.

| Concepto | Ícono |
|---|---|
| Red / escaneo | `Radar` |
| Historial | `History` |
| Ajustes | `Settings2` |
| Equipo genérico | `Router` |
| SNMP | `Activity` |
| SSH | `TerminalSquare` |
| QR / código | `ScanLine` |
| Foto | `Camera` |
| Ubicación | `MapPin` |
| PDF | `FileText` |
| Compartir | `Share2` |
| Sincronizado | `CloudCheck` (si no existe en la versión instalada: `Cloud`) |
| Pendiente de sincronizar | `CloudUpload` |
| Sin conexión | `CloudOff` |
| Credenciales | `KeyRound` |
| Advertencia | `TriangleAlert` |

---

## 6. Movimiento

| Token | Duración | Curva | Uso |
|---|---|---|---|
| `fast` | 120 ms | `Easing.out(Easing.quad)` | Estado presionado, cambio de color |
| `base` | 200 ms | `Easing.out(Easing.cubic)` | Aparición de filas, toasts, sheets |
| `slow` | 320 ms | `Easing.inOut(Easing.cubic)` | Transición entre pantallas (la nativa del stack) |

- Implementar con la `Animated` API de React Native (sin reanimated en v1).
- Filas que aparecen durante el escaneo: *fade* 0→1 + `translateY` 4→0 en `base`.
- Indicador de escaneo: barra de progreso lineal de 2 px bajo el header, **determinada** (`scanned/total`). Sin spinners de pantalla completa.
- Respetar `AccessibilityInfo.isReduceMotionEnabled()`: si está activo, todas las duraciones pasan a 0.

---

## 7. Componentes (especificación)

### 7.1 `Text`
Props: `variant` (token de §3), `color` (token de §2, por defecto `textPrimary`), `numberOfLines`. Único componente que renderiza `<Text>` nativo.

### 7.2 `Button`
| Variante | Fondo | Texto | Borde |
|---|---|---|---|
| `primary` | `accent` | `onAccent` | — |
| `secondary` | transparente | `textPrimary` | `borderStrong` |
| `ghost` | transparente | `accent` | — |
| `danger` | transparente | `danger` | `danger` |

- Alto 48, radio `md`, padding horizontal `lg`, texto `bodyStrong`, ícono opcional de 20 a la izquierda con un hueco de `sm`.
- Presionado: `primary` → `accentPressed`; el resto → fondo `surface`.
- `loading`: reemplaza el texto por un `ActivityIndicator` pequeño y mantiene el ancho. `disabled`: opacidad 0.4.
- `fullWidth` por defecto dentro de formularios.

### 7.3 `Input`
- Etiqueta (`label`, `textSecondary`) arriba con un hueco de `xs`; campo de alto 48, fondo `surface`, borde `border`, radio `md`, padding `md`.
- Foco: borde `accent` de 1.5 px. Error: borde `danger` + mensaje `caption` en `danger` debajo.
- `mono` como prop para IP, MAC y comunidad. `secure` agrega el botón de mostrar/ocultar (`Eye`/`EyeOff`).

### 7.4 `Card`
Fondo `bg`, borde `border`, radio `lg`, padding `lg`. Título opcional (`heading`) y acción opcional a la derecha (`ghost` pequeño). Sin sombra.

### 7.5 `ListRow`
- Alto mínimo 64, padding vertical `md`, horizontal `lg`.
- Estructura: `[ícono 20 opcional] [título bodyStrong + subtítulo caption/mono] ··· [valor o Badge] [ChevronRight 16 textTertiary si navega]`.
- Divisor de 1 px `border` con sangría izquierda igual al inicio del texto.
- Presionada: fondo `surface`.

### 7.6 `Badge`
Alto 24, padding horizontal `sm`, radio `sm`, texto `label` 12 px, punto de 6 px a la izquierda.

| Estado | Fondo | Texto/punto | Texto |
|---|---|---|---|
| `up` | `successSubtle` | `success` | "Activa" |
| `down` | `dangerSubtle` | `danger` | "Caída" |
| `unknown` | `surfaceAlt` | `textSecondary` | "Desconocido" |
| `pending` | `warningSubtle` | `warning` | "Pendiente" |
| `synced` | `successSubtle` | `success` | "Sincronizado" |
| `failed` | `dangerSubtle` | `danger` | "Error de envío" |
| `info` | `accentSubtle` | `accent` | variable |

### 7.7 `TerminalView`
- Fondo `terminalBg`, borde `border`, radio `md`, padding `md`, fuente `monoSmall` en `terminalText`.
- Cada comando: línea `$ comando` en `textSecondary` + salida + duración en `caption` alineada a la derecha.
- Desplazamiento horizontal para líneas largas (sin ajuste de línea). Texto seleccionable. Botón `Copy` arriba a la derecha.
- Error de un comando: la línea de error en `danger`.

### 7.8 `EmptyState`
Centrado verticalmente: ícono de 32 en `textTertiary`, título `heading`, descripción `body` en `textSecondary` (máx. 2 líneas), un botón opcional `secondary`.

### 7.9 `SyncIndicator`
En el header, a la derecha: ícono de 20 + número en `label`.
- 0 pendientes y online → `CloudCheck` en `textTertiary`, sin número.
- N pendientes → `CloudUpload` en `warning` + N.
- Algún `FAILED` → `CloudUpload` en `danger` + N.
- Offline → `CloudOff` en `textTertiary` + N si hay pendientes.

### 7.10 `Toast`
Abajo, sobre la barra de pestañas, margen `lg`. Fondo `textPrimary`, texto `bg` (invertido), radio `md`, padding `md`, máx. 2 líneas, 3 s. Una sola a la vez. Para errores **no** se usa toast: se muestra en línea dentro de la pantalla.

### 7.11 `Sheet`
Modal inferior: fondo `bg`, radio `lg` superior, asa de 36×4 en `borderStrong`, padding `xl`, overlay `overlay`. Se cierra deslizando o tocando el overlay.

### 7.12 `Screen`
Safe area + fondo `bg` + título `title` alineado a la izquierda con padding `lg`. Header nativo del stack sin sombra (`headerShadowVisible: false`), título pequeño (`heading`) en las pantallas internas.

### 7.13 Barra de pestañas
Alto 64, fondo `bg`, borde superior `border`. Ícono 24 + etiqueta `caption`. Activa: `accent`; inactiva: `textTertiary`. Sin indicadores ni fondos.

---

## 8. Pantallas (estructura)

> Los esquemas definen jerarquía y orden, no medidas exactas.

### 8.1 Red (`ScanScreen`)
```
┌─────────────────────────────────┐
│ Red                    ☁↑ 2     │  title + SyncIndicator
│ Wi-Fi "Taller" · 192.168.1.0/24 │  caption textSecondary (mono para la red)
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░░░░░░░░░░ │  progreso 2 px (sólo al escanear)
│                                 │
│  14                             │  display
│  equipos encontrados            │  caption
│                                 │
│ EQUIPOS                         │  overline
│ ⌂ 192.168.1.1          12 ms  › │  ListRow: IP mono + hostname caption
│   router.lan · 22 80 443        │
│ ⌂ 192.168.1.20         31 ms  › │
│ …                               │
│                                 │
│ [ Escanear red ]  (primary)     │  fijo abajo; al escanear → "Detener" (secondary)
│   Agregar IP manualmente (ghost)│
└─────────────────────────────────┘
```
Estados: inicial (EmptyState `Radar` "Buscá equipos en esta red"), escaneando, resultados, sin Wi-Fi (EmptyState `CloudOff` "Conectate a una red Wi-Fi" + botón "Abrir ajustes de Wi-Fi"), sin resultados ("No encontramos equipos" + "Agregar IP manualmente").

### 8.2 Equipo (`DeviceScreen`)
```
192.168.88.1                       title en mono
MikroTik hAP ac2 · S/N HGA12345    caption
[Badge: Visto hace 2 min]

┌ Diagnóstico ───────────────────┐
│ ⚡ SNMP                     ›   │
│ ⌘ SSH                       ›   │
│ 🔑 Credenciales             ›   │
└────────────────────────────────┘
┌ Identificación ────────────────┐
│ MAC   aa:bb:cc:dd:ee:ff  (mono)│
│ Serie HGA12345           (mono)│
│ [ Escanear código ] (secondary)│
└────────────────────────────────┘
ÚLTIMOS DIAGNÓSTICOS
 SNMP · hoy 10:21        Éxito
 SSH  · hoy 10:24        Éxito
[ Nueva instalación ] (primary, fijo abajo)
```

### 8.3 SNMP (`SnmpScreen`)
Tarjeta **Sistema**: `sysName` (heading), `sysDescr` (caption, máx. 3 líneas, expandible), "Encendido hace" → `display` con el uptime formateado (`3 d 4 h`).
Sección **INTERFACES** (overline + contador "8 · 5 activas"): `InterfaceRow` = nombre (bodyStrong) · MAC (monoSmall) · Badge up/down · `↓ 1,2 GB  ↑ 340 MB` (mono caption).
Botón fijo: "Consultar" (primary) → mientras carga, `loading`. Error en línea: Card con borde `danger`, ícono `TriangleAlert`, mensaje y "Reintentar".

### 8.4 SSH (`SshScreen`)
Selector de perfil (segmentado desplazable de chips, el sugerido marcado con "Sugerido" en caption) → lista de comandos del perfil en `monoSmall` `textSecondary` → `TerminalView` → botón "Ejecutar" (primary). Si faltan credenciales: EmptyState `KeyRound` "Cargá las credenciales SSH de este equipo" + botón.

### 8.5 Instalación (`InstallationFormScreen`)
Formulario de una columna, secciones separadas por `xl` con un `overline`: **SITIO** (Sitio, Cliente, Técnico) · **EQUIPO** (fila de solo lectura + "Escanear código") · **DIAGNÓSTICOS** (checklist) · **EVIDENCIA** (`PhotoGrid` 3 columnas, celdas cuadradas con radio `md`, celda "+" con borde punteado `borderStrong`; el tipo de foto como caption bajo cada miniatura) · **UBICACIÓN** (botón secondary `MapPin` "Obtener ubicación" → al obtenerla: `-34.603722, -58.381592` en mono + "± 8 m" + Badge `warning` si es imprecisa) · **OBSERVACIONES**.
Pie fijo: requisitos faltantes en `caption` `textSecondary` ("Falta: 1 foto, ubicación") + "Finalizar y generar PDF" (primary, deshabilitado hasta que se cumplan).
Indicador "Borrador guardado" en `caption` `textTertiary` bajo el título.

### 8.6 Cámara y escáner
Fondo negro a pantalla completa (excepción a los tokens: `#000`). Controles en blanco. Escáner: marco cuadrado de 240 con esquinas de 24 px en blanco, texto "Apuntá al código QR o de barras" debajo. Cámara: chips de tipo de foto arriba, disparador circular de 72 (anillo blanco de 4 px) abajo, miniatura de la última foto a la izquierda y contador `3/12` a la derecha.
Permiso denegado: EmptyState `Camera` "Necesitamos acceso a la cámara" + "Abrir ajustes".

### 8.7 Historial
Segmentado (Instalaciones | Diagnósticos) bajo el título, buscador (`Input` con ícono `Search`, placeholder "Buscar por sitio, IP o serie"). Filas: título = sitio o IP; subtítulo = cliente · fecha relativa; derecha = Badge de sincronización. Agrupar por día con un `overline` ("HOY", "AYER", "12 OCT").

### 8.8 Ajustes
Lista agrupada: **APARIENCIA** (Tema: Sistema/Claro/Oscuro) · **SNMP** (Comunidad por defecto, enmascarada) · **SINCRONIZACIÓN** (URL del servidor en mono, "Probar conexión", pendientes/fallidos) · **ACERCA DE** (versión).

---

## 9. Redacción (UX writing)

- Español rioplatense con **voseo** consistente: "Escaneá", "Conectate", "Tocá". Nunca mezclar con "tú" o "usted".
- Botones con **verbo en infinitivo**: "Escanear red", "Consultar", "Ejecutar", "Generar PDF".
- Oraciones cortas, sin signos de exclamación, sin jerga innecesaria en los mensajes (la jerga técnica sí va en los datos).
- Mayúscula inicial sólo en la primera palabra ("Nueva instalación", no "Nueva Instalación").
- Unidades: `12 ms`, `1,2 GB` (coma decimal, espacio antes de la unidad), fechas `29/10/2026 10:45`, relativas "hace 2 min".

Mensajes de error (`utils/errors.ts → userMessage`):

| Código | Mensaje |
|---|---|
| `TIMEOUT` | El equipo no respondió. Revisá la IP y que el servicio esté habilitado. |
| `NETWORK_UNREACHABLE` | No hay conexión con la red. Conectate al Wi-Fi del equipo. |
| `AUTH_FAILED` | Usuario o contraseña incorrectos. |
| `PERMISSION_DENIED` | Falta un permiso para continuar. Podés habilitarlo en Ajustes. |
| `PARSE_ERROR` | El equipo respondió con datos que no pudimos leer. |
| `SNMP_ERROR` | El equipo rechazó la consulta SNMP. Revisá la comunidad. |
| `NOT_FOUND` | No encontramos este registro. |
| `STORAGE_ERROR` | No se pudo guardar en el teléfono. Revisá el espacio disponible. |
| `UNKNOWN` | Algo salió mal. Probá de nuevo. |

---

## 10. Reporte PDF (versión impresa)

- Tamaño A4, márgenes de 18 mm, fondo blanco, texto `#0E1116`; **sin** el tema oscuro.
- Fuente: `Helvetica, Arial, sans-serif` (las fuentes del sistema de impresión; no se incrustan las de la app); datos técnicos en `"Courier New", monospace`.
- Encabezado: "NetDiag" en 11 pt `#4A5361` a la izquierda; "Reporte de instalación" en 20 pt semibold; a la derecha N.º y fecha en 10 pt. Línea divisoria de 1 px `#E3E6EA`.
- Secciones: título de 12 pt en mayúsculas `#4A5361` con `letter-spacing: 0.6px`, separación de 16 pt.
- Tablas: sin bordes verticales, filas separadas por 1 px `#E3E6EA`, encabezado en 9 pt `#8A93A1`.
- Estados en tablas: texto "Activa"/"Caída" coloreado con `#15803D`/`#C62828` (legible también impreso en B/N gracias al texto).
- Fotos: grilla de 2 columnas, radio de 6 px, epígrafe de 9 pt. `page-break-inside: avoid` en cada foto y tabla.
- Pie: "Firma del técnico" con una línea de 60 mm y el nombre debajo; número de página si la librería lo permite.

---

## 11. Implementación de referencia de los tokens

`src/theme/tokens.ts`:

```ts
const palette = {
  light: {
    bg: '#FFFFFF', surface: '#F6F7F9', surfaceAlt: '#EEF0F3',
    border: '#E3E6EA', borderStrong: '#C9CED6',
    textPrimary: '#0E1116', textSecondary: '#4A5361', textTertiary: '#8A93A1',
    accent: '#2F5BEA', accentPressed: '#2449C4', accentSubtle: '#EBF0FE', onAccent: '#FFFFFF',
    success: '#15803D', successSubtle: '#E8F6EE',
    danger: '#C62828', dangerSubtle: '#FDECEC',
    warning: '#B45309', warningSubtle: '#FEF4E6',
    terminalBg: '#F6F7F9', terminalText: '#1F2733',
    overlay: 'rgba(14,17,22,0.45)',
  },
  dark: {
    bg: '#0B0D10', surface: '#14171C', surfaceAlt: '#1C2027',
    border: '#262B33', borderStrong: '#3A414C',
    textPrimary: '#F3F4F6', textSecondary: '#A3ABB8', textTertiary: '#6B7380',
    accent: '#6E8BFF', accentPressed: '#5873E0', accentSubtle: '#1A2240', onAccent: '#0B0D10',
    success: '#4ADE80', successSubtle: '#10291A',
    danger: '#F87171', dangerSubtle: '#2E1414',
    warning: '#FBBF24', warningSubtle: '#2E2210',
    terminalBg: '#08090B', terminalText: '#D7DCE3',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ColorToken = keyof typeof palette.light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 6, md: 10, lg: 14, full: 999 } as const;

const F = { regular: 'Inter-Regular', medium: 'Inter-Medium', semibold: 'Inter-SemiBold', mono: 'JetBrainsMono-Regular' };

export const typography = {
  display:    { fontFamily: F.semibold, fontSize: 28, lineHeight: 34 },
  title:      { fontFamily: F.semibold, fontSize: 22, lineHeight: 28 },
  heading:    { fontFamily: F.semibold, fontSize: 17, lineHeight: 24 },
  body:       { fontFamily: F.regular,  fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: F.medium,   fontSize: 16, lineHeight: 24 },
  label:      { fontFamily: F.medium,   fontSize: 14, lineHeight: 20 },
  caption:    { fontFamily: F.regular,  fontSize: 13, lineHeight: 18 },
  overline:   { fontFamily: F.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  mono:       { fontFamily: F.mono,     fontSize: 14, lineHeight: 20 },
  monoSmall:  { fontFamily: F.mono,     fontSize: 12, lineHeight: 18 },
} as const;
export type TypographyToken = keyof typeof typography;

export const motion = { fast: 120, base: 200, slow: 320 } as const;
export const layout = { touchTarget: 48, rowMinHeight: 64, tabBarHeight: 64, buttonHeight: 48 } as const;

export const themes = {
  light: { scheme: 'light' as const, colors: palette.light, spacing, radius, typography, motion, layout },
  dark:  { scheme: 'dark'  as const, colors: palette.dark,  spacing, radius, typography, motion, layout },
};
export type Theme = (typeof themes)['light'] | (typeof themes)['dark'];
```

`ThemeProvider` toma la preferencia (`system | light | dark`) de `settingsStore`, resuelve `system` con `useColorScheme()` y expone el `Theme` por contexto. `useTheme()` devuelve el tema actual. La `StatusBar` usa `dark-content` en claro y `light-content` en oscuro, con el fondo `bg`.
