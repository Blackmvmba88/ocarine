# 🎼 BlackMamba Ocarina 3D

> **Instrumento. Videojuego. Tutor musical. Interfaz gestual.**
>
> Una ocarina virtual en 3D que puedes tocar con un control, soplar con el micrófono y aprender directamente sobre un pentagrama interactivo.

## 🐍 Visión

**BlackMamba Ocarina 3D** nace de una pregunta simple:

> ¿Qué pasaría si una ocarina pudiera comportarse como un instrumento real, un control de videojuego y un profesor de música al mismo tiempo?

La respuesta es una interfaz musical interactiva donde el usuario puede:

- ver una ocarina en **3D en tiempo real**;
- conectar un **gamepad Bluetooth o USB**;
- tocar notas mediante combinaciones de botones;
- utilizar el **micrófono como soplido real**;
- controlar expresión mediante movimiento;
- ver cada nota sobre un **pentagrama dinámico**;
- aprender qué botón, digitación o gesto corresponde a cada nota;
- practicar canciones, improvisar, grabar y convertir melodías en experiencias jugables.

La intención no es simular un instrumento desde lejos.

La intención es crear **un instrumento digital nuevo**.

---

## ✨ Concepto central

```text
                 ┌───────────────────┐
                 │    PENTAGRAMA     │
                 │  ♩ ♪ ♫ ♬          │
                 └─────────┬─────────┘
                           │
                           ▼
┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│   GAMEPAD    │───▶│ MUSICAL CORE  │◀───│  MICRÓFONO   │
│ A B X Y      │    │               │    │   SOPLIDO    │
│ D-PAD        │    │ Nota / gesto  │    │ Intensidad   │
│ STICKS       │    │ Digitación    │    │ Ataque       │
│ TRIGGERS     │    │ Expresión     │    │ Dinámica     │
└──────────────┘    └───────┬───────┘    └──────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  OCARINA 3D   │
                    │   ● ● ● ●     │
                    └───────┬───────┘
                            │
                            ▼
                     🔊 AUDIO ENGINE
```

---

# 🎮 Gamepad como instrumento

La primera interfaz física será cualquier control compatible con **Gamepad API**.

| Entrada | Función inicial |
|---|---|
| A | Agujero 1 |
| B | Agujero 2 |
| X | Agujero 3 |
| Y | Agujero 4 |
| D-Pad | Digitaciones adicionales |
| L1 | Modificador |
| R1 | Cambio de octava |
| L2 | Control expresivo |
| R2 | Soplido virtual |
| Stick izquierdo | Navegación / funciones musicales |
| Stick derecho | Vibrato / pitch bend |

El mapeo no será rígido. Se contemplan perfiles para:

- Xbox
- PlayStation
- Nintendo
- Generic USB
- MIDI controllers
- Custom hardware

---

# 🫁 Soplido real

En dispositivos con micrófono, la ocarina podrá responder al aire del usuario.

El micrófono podrá determinar:

- inicio de nota;
- intensidad;
- volumen;
- ataque;
- duración;
- articulación.

```text
Micrófono
   ↓
Audio Input
   ↓
Envelope Follower
   ↓
Breath Level
   ↓
Synth / Sample Engine
```

La nota puede requerir una combinación realista:

```text
DIGITACIÓN + SOPLIDO = NOTA
```

---

# 🌀 Expresión gestual

El teléfono también puede convertirse en parte del instrumento mediante:

- acelerómetro;
- giroscopio;
- orientación;
- sensores táctiles.

Ejemplo conceptual:

```text
Inclinar izquierda  → pitch bend -
Inclinar derecha    → pitch bend +
Oscilar suavemente  → vibrato
Levantar teléfono   → cambio expresivo
Movimiento rápido   → articulación
```

El instrumento deja de ser una colección de botones y se convierte en un **objeto musical gestual**.

---

# 🪈 Ocarina 3D

La pieza central de la interfaz será una ocarina renderizada en tiempo real.

El usuario podrá:

- rotarla;
- acercarla y alejarla;
- inspeccionarla;
- ver digitaciones;
- observar agujeros abiertos y cerrados.

Cada entrada física tendrá representación visual:

```text
Presiono A
     ↓
Input Engine
     ↓
Hole #1 = CLOSED
     ↓
Modelo 3D actualiza
     ↓
Digitación recalculada
     ↓
Nota nueva
```

---

# 🎼 Pentagrama interactivo

La aplicación mostrará **música real en tiempo real**, no solamente botones.

```text
       ♩
───────●─────────
─────────────────
─────────────────
─────────────────
─────────────────

      SOL
```

Debajo de una nota podrán aparecer simultáneamente:

```text
SOL
A + ↑

● ● ○ ●

G4
392 Hz
```

Así el usuario aprende a la vez:

- notación musical;
- nombre de la nota;
- posición;
- frecuencia;
- digitación;
- combinación del control.

---

# 🎯 Modo aprendizaje

La aplicación muestra una nota objetivo y espera al usuario.

```text
OBJETIVO

♩  SOL

CONTROL
A + ↑

DIGITACIÓN
● ● ○ ●
```

El motor compara:

```text
Expected Note
     ↓
Performed Note
     ↓
Validation
```

Con el tiempo podrá medir:

- precisión;
- ritmo;
- duración;
- dinámica;
- anticipación;
- consistencia.

---

# 🎵 Modo canción

Una melodía completa puede convertirse en una secuencia interactiva.

```text
♪     ♪     ♩       ♫
DO    RE    MI      SOL
A     B     X       ↑+A
```

El sistema podrá incluir:

- tempo;
- cuenta previa;
- metrónomo;
- loop;
- ralentización;
- repetición de compases;
- zonas difíciles;
- puntuación.

---

# 🕹️ Game Mode

Las melodías también pueden representarse mediante combinaciones inspiradas en videojuegos clásicos:

```text
↑  ←  →  A  B
```

Las combinaciones no tienen que limitarse a notas. También pueden ejecutar **acciones musicales**.

```text
↑ ↑ ↓       → cambiar escala
← A →       → arpegio
B + R1      → cambio de octava
R2 + Stick  → vibrato
↓ ↓ A B     → frase musical
```

El instrumento puede tener su propio lenguaje de comandos musicales.

---

# 🧠 Musical Mapping Engine

El corazón del proyecto será un motor capaz de traducir entradas físicas en eventos musicales.

```text
INPUT
  ↓
CONTROL MAPPING
  ↓
FINGERING STATE
  ↓
NOTE RESOLUTION
  ↓
EXPRESSION
  ↓
AUDIO
```

Contrato conceptual:

```ts
interface MusicalInput {
  buttons: string[]
  breath: number
  pitchGesture: number
  velocity: number
}

interface FingeringState {
  holes: boolean[]
}

interface MusicalNote {
  note: string
  octave: number
  frequency: number
  velocity: number
}
```

---

# 🎹 Tabla de digitaciones

Cada instrumento tendrá una tabla independiente.

| Agujeros | Nota | MIDI |
|---|---:|---:|
| ● ● ● ● | C4 | 60 |
| ● ● ● ○ | D4 | 62 |
| ● ● ○ ○ | E4 | 64 |
| ● ○ ○ ○ | F4 | 65 |
| ○ ○ ○ ○ | G4 | 67 |

Posteriormente podrán soportarse:

- ocarinas de 4, 6, 10 y 12 agujeros;
- digitaciones personalizadas;
- afinaciones alternativas.

---

# 🔊 Motor de audio

Primera implementación:

```text
Web Audio API
```

Posibles extensiones:

```text
Physical Modeling
Samples
Wavetable
Granular synthesis
Hybrid synthesis
```

El objetivo final es que el sonido responda continuamente a:

```text
soplido
presión
gesto
digitación
velocidad
articulación
```

No únicamente a:

```text
button → sample.wav
```

---

# 🧬 Arquitectura propuesta

```text
ocarine/
│
├── apps/
│   └── web/
│
├── packages/
│   ├── audio-engine/
│   ├── gamepad-engine/
│   ├── notation-engine/
│   ├── ocarina-core/
│   ├── sensor-engine/
│   └── ui/
│
├── assets/
│   ├── models/
│   │   └── ocarina.glb
│   ├── audio/
│   └── songs/
│
├── data/
│   ├── fingerings/
│   ├── mappings/
│   └── songs/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── GAMEPAD.md
│   ├── FINGERINGS.md
│   └── AUDIO_ENGINE.md
│
└── README.md
```

---

# ⚙️ Stack inicial

### Frontend

- TypeScript
- React
- Vite

### 3D

- Three.js
- React Three Fiber

### Gamepad

- Gamepad API

### Audio

- Web Audio API
- Tone.js

### Pentagrama

- VexFlow

### Sensores

- DeviceMotion
- DeviceOrientation
- Web Audio Input

---

# 🖥️ Interfaz inicial

```text
┌──────────────────────────────────────────────────────┐
│                    PENTAGRAMA                        │
│      ♩       ♪       ♫        ♩                     │
│                                                      │
├───────────────────────────────┬──────────────────────┤
│                               │                      │
│                               │    NOTA ACTUAL       │
│         OCARINA 3D            │                      │
│                               │        G4            │
│          ● ● ○ ●              │      392 Hz          │
│                               │                      │
│                               │   Breath: 71%        │
│                               │   Pitch: +2 cents    │
│                               │                      │
├───────────────────────────────┴──────────────────────┤
│                                                      │
│               GAMEPAD VISUALIZER                     │
│                                                      │
│           ↑                                          │
│        ←  +  →          Y                            │
│           ↓            X A                           │
│                         B                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

# 🚀 Modos

## Free Play

Tocar libremente, sin puntuación ni restricciones.

## Learn

La aplicación enseña una nota y espera al usuario.

## Song

Interpretación guiada de melodías.

## Sight Reading

El pentagrama aparece sin mostrar los botones.

## Ear Training

El sistema reproduce un sonido y el usuario debe encontrar la digitación.

## Game

Combinaciones visuales inspiradas en interfaces de videojuegos.

## Composer

La interpretación puede convertirse automáticamente en notación:

```text
Performance
    ↓
Note Events
    ↓
Quantization
    ↓
Score
```

---

# 🔴 Grabación

Una sesión podrá producir:

- MIDI
- MusicXML
- WAV
- JSON Performance

Ejemplo:

```json
{
  "note": "G4",
  "start": 4.821,
  "duration": 0.442,
  "velocity": 0.78,
  "breath": 0.69,
  "pitch": 391.7
}
```

Esto permitirá reconstruir exactamente una interpretación.

---

# 📚 Librería de canciones

Las canciones podrán definirse como datos:

```json
{
  "title": "Demo Melody",
  "bpm": 90,
  "notes": [
    { "note": "C4", "beat": 0, "duration": 1 },
    { "note": "D4", "beat": 1, "duration": 1 }
  ]
}
```

El mismo archivo podrá alimentar:

- pentagrama;
- tutor;
- gameplay;
- reproducción;
- evaluación.

**Una sola fuente de verdad.**

---

# 🛠️ Prototipo físico BM-OC-002

El repositorio incluye un pase de ingeniería para convertir la geometría visual
en una ocarina hueca y calibrable:

- cámara acústica de referencia de 77.8935 cm³;
- windway interno inclinado;
- ventana de voz y labium editable;
- seis agujeros piloto calculados para C5–B5;
- generador automático de `.blend` y `.glb`;
- validación de manifold y dimensiones;
- render automático de corte transversal.

El código y las instrucciones están en:

[`hardware/ocarina-acoustic-v2`](hardware/ocarina-acoustic-v2)

En macOS, con Blender instalado, se puede generar todo el pase con:

```bash
cd hardware/ocarina-acoustic-v2
chmod +x apply_ocarina_acoustic_v2.command
./apply_ocarina_acoustic_v2.command
```

> BM-OC-002 es un prototipo de calibración. Los agujeros se generan menores que
> su diámetro teórico para afinarlos progresivamente sobre una impresión real.

---

# 🧪 MVP

El primer MVP necesita demostrar solamente este circuito:

```text
CONTROL CONECTADO
       ↓
PRESIONAR BOTÓN
       ↓
OCARINA 3D REACCIONA
       ↓
SE CALCULA UNA NOTA
       ↓
SUENA
       ↓
APARECE EN EL PENTAGRAMA
```

Si ese circuito funciona, el concepto completo está vivo.

---

# 🛣️ Roadmap

## Phase 0 — Foundation

- [ ] Configurar TypeScript
- [ ] Configurar React + Vite
- [ ] Configurar motor 3D
- [ ] Definir contratos internos

## Phase 1 — Ocarina 3D

- [ ] Importar modelo `.glb`
- [ ] Cámara orbital
- [ ] Zoom y rotación
- [ ] Agujeros interactivos
- [ ] Animación open/closed
- [ ] Highlight de digitación

## Phase 2 — Gamepad

- [ ] Detectar control
- [ ] Identificar botones
- [ ] Visualizador en vivo
- [ ] Sistema de mappings
- [ ] Perfiles Xbox
- [ ] Perfiles PlayStation
- [ ] Perfiles Nintendo
- [ ] Perfil genérico

## Phase 3 — Musical Core

- [ ] `FingeringState`
- [ ] Fingering table
- [ ] Note resolver
- [ ] Octavas
- [ ] Alteraciones
- [ ] Escalas
- [ ] Eventos musicales

## Phase 4 — Audio

- [ ] Oscilador inicial
- [ ] Envelope / ADSR
- [ ] Dinámica
- [ ] Samples de ocarina
- [ ] Breath controller

## Phase 5 — Pentagrama

- [ ] Render de pentagrama
- [ ] Nota actual
- [ ] Historial de notas
- [ ] Cursor temporal
- [ ] Compases
- [ ] Tempo
- [ ] Playback

## Phase 6 — Learning Mode

- [ ] Nota objetivo
- [ ] Validación
- [ ] Feedback visual
- [ ] Accuracy
- [ ] Timing score
- [ ] Ejercicios

## Phase 7 — Songs

- [ ] Formato de canción
- [ ] Canciones desde JSON
- [ ] Loop
- [ ] Slow mode
- [ ] Practice sections
- [ ] Song progression

## Phase 8 — Real Breath

- [ ] Permiso de micrófono
- [ ] Input RMS
- [ ] Breath detection
- [ ] Noise gate
- [ ] Dynamic control
- [ ] Attack recognition

## Phase 9 — Motion

- [ ] Giroscopio
- [ ] Acelerómetro
- [ ] Vibrato
- [ ] Pitch bend
- [ ] Motion calibration

## Phase 10 — Recording

- [ ] Event recorder
- [ ] Playback
- [ ] MIDI export
- [ ] MusicXML export
- [ ] WAV rendering

---

# 🌌 Futuro

La arquitectura no tiene por qué quedarse en una ocarina.

```text
BlackMamba Instrument Engine
            │
            ├── Ocarina
            ├── Flute
            ├── Synth
            ├── Drums
            ├── Strings
            ├── Guitar
            ├── Percussion
            └── Experimental Instruments
```

El teléfono, el control y los sensores se convierten en piezas intercambiables.

**El instrumento es software.**

---

# 🧠 Principios

1. **La música es la fuente de verdad.** La interfaz debe representar correctamente la música.
2. **Una acción física debe tener una consecuencia visible.** `Input → Visual → Musical → Audio`.
3. **Aprender debe sentirse como jugar.** Jugar debe seguir enseñando música real.
4. **El instrumento debe responder, no reproducir.** La interpretación debe alterar el sonido continuamente.
5. **Hardware agnostic.** El sistema no debe depender de un único control.
6. **La arquitectura debe permitir instrumentos futuros.** Ocarina es el primero, no necesariamente el último.

---

# 🐍 BlackMamba Philosophy

Un instrumento tradicional une:

```text
cuerpo
aire
movimiento
oído
memoria
ritmo
```

Un instrumento digital normalmente reduce todo eso a:

```text
click
```

BlackMamba Ocarina busca recuperar la relación física con la música utilizando sensores modernos.

```text
Movimiento
    +
Soplido
    +
Control
    +
Visualización
    +
Notación
    =
Instrumento
```

---

# ⚡ Objetivo final

Que alguien conecte un control.

Abra la aplicación.

Vea la ocarina frente a él.

Aparezca una nota sobre el pentagrama.

El sistema le muestre:

```text
A + ↑
```

La toque.

Vea cómo se cierran los agujeros.

Escuche la nota.

Y piense:

> **“ALV... estoy tocando una ocarina.”**

---

**Iyari Gomez · BlackMamba**
