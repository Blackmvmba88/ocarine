BLACKMAMBA OCARINA — ACOUSTIC / MANUFACTURING PASS V2
=====================================================

RESULTADO DE ESTE PASE
- Sustituye los pozos visuales de V1 por perforaciones reales.
- Crea una cámara hueca de referencia de 77.8935 cm³.
- Crea un windway interno inclinado de 1.4 × 9.5 mm.
- Abre una ventana de voz inferior de 14 × 8 mm.
- Añade un labio de corte separado para poder retocarlo.
- Calcula seis agujeros piloto para una escala lineal C5–B5.
- Guarda OCARINA_ACOUSTIC_V2.blend y OCARINA_ACOUSTIC_V2.glb.
- Comprueba automáticamente objetos, dimensiones y bordes no-manifold.
- Genera OCARINA_ACOUSTIC_V2_CUTAWAY.blend y un render transversal PNG.

IMPORTANTE
Esta V2 ya contiene la arquitectura física de una ocarina, pero sigue siendo
un prototipo de calibración. El cálculo de Helmholtz da un punto de partida;
la afinación final depende del chorro, el labium, pérdidas, rugosidad, material,
impresión y presión de soplo. Por eso los agujeros salen 0.4 mm menores que su
diámetro teórico y deben abrirse poco a poco mientras se mide con afinador.

USO EN MAC
1. Descomprime la carpeta.
2. Doble clic en apply_ocarina_acoustic_v2.command.
3. Si macOS lo bloquea: clic derecho > Abrir.
4. Abre OCARINA_ACOUSTIC_V2.blend para inspeccionar el corte interno.
5. Revisa OCARINA_ACOUSTIC_V2_CUTAWAY.png: deben verse cámara, windway,
   ventana inferior y labium sin paredes flotantes.

PRIMERA PRUEBA FÍSICA
1. Imprime en PETG o resina tenaz, 0.16–0.20 mm de capa.
2. Mantén los agujeros piloto como salen; no los agrandes antes de probar.
3. Comprueba primero que el C5 cerrado arranque limpio.
4. Si no habla, ajusta antes el labium y el windway; no ataques los agujeros.
5. Cuando el C5 sea estable, abre H1, mide D5 y agranda H1 en pasos de 0.1 mm.
6. Repite H2–H6 en orden. Abrir un agujero eleva la nota; no se puede deshacer.

ARCHIVOS
- acoustic_design_v2.json       parámetros canónicos
- helmholtz_tuning_v2.py        cálculo reproducible y reporte
- acoustic_report_v2.json       diámetros piloto/objetivo
- build_ocarina_acoustic_v2.py  generador Blender no destructivo
- validate_ocarina_acoustic_v2.py inspección de manifold y medidas
- render_cutaway_v2.py          sección transversal y render técnico
- apply_ocarina_acoustic_v2.command  lanzador Mac

REFERENCIAS DE FÍSICA
- Kobayashi et al., 3D Calculation with Compressible LES for Sound Vibration
  of Ocarina: https://arxiv.org/abs/0911.3567
- Miyamoto et al., Numerical study on an air-reed instrument with LES:
  https://arxiv.org/abs/1005.3413

SIGUIENTE CHECKPOINT
- Render de corte transversal en Blender.
- Primera impresión de prueba.
- Tabla de afinación medida: nota, Hz, cents, diámetro real y presión de soplo.
