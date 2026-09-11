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

PROTOCOLO DE VALIDACIÓN FÍSICA
La afinación no se acepta con una sola lectura. Para cada nota C5–B5:

1. Usa el mismo afinador/micrófono y la misma posición relativa.
2. Registra al menos 3 ataques estables independientes.
3. Registra Hz y una referencia de soplido en cada toma:
   - `breath_level` normalizado si usas micrófono/app; o
   - `breath_pressure_pa` si cuentas con manómetro/sensor de presión.
4. Registra el diámetro físico del agujero que corresponda después de cada pase de ajuste.
5. Copia `physical_measurements_template.json` a `physical_measurements.json`.
6. Rellena únicamente datos realmente medidos; no sustituyas faltantes con predicciones.
7. Ejecuta:

   python3 analyze_physical_validation.py physical_measurements.json

El reporte exige por defecto:
- 3 muestras o más por nota;
- error medio <= ±10 cents;
- desviación estándar <= 5 cents;
- referencia de soplido presente en todas las tomas.

Sólo cuando C5–B5 cumplan simultáneamente afinación, repetibilidad y referencia
de soplido se considera `ready_for_profile_promotion = true`. Hasta entonces el
perfil BM-OC-002 debe permanecer `prototype`.

REGLA DE AJUSTE
- Una nota plana indica que todavía falta afinación, pero el sistema es acoplado:
  no conviertas una única lectura en una orden automática de perforado.
- Antes de retirar material confirma tendencia con varias tomas estables.
- C5 cerrado depende principalmente de cámara/voicing; no se corrige atacando H1–H6.
- H1–H6 se trabajan secuencialmente y en incrementos pequeños porque retirar material
  es irreversible.

AUTOPRUEBA DEL ANALIZADOR
Sin hardware se puede validar la lógica matemática y el gate:

   python3 analyze_physical_validation.py --self-test

Debe terminar con:

   physical validation self-test: PASS

ARCHIVOS
- acoustic_design_v2.json         parámetros canónicos
- helmholtz_tuning_v2.py          cálculo reproducible y reporte
- acoustic_report_v2.json         diámetros piloto/objetivo
- build_ocarina_acoustic_v2.py    generador Blender no destructivo
- validate_ocarina_acoustic_v2.py inspección de manifold y medidas
- render_cutaway_v2.py            sección transversal y render técnico
- apply_ocarina_acoustic_v2.command lanzador Mac
- physical_measurements_template.json plantilla de laboratorio C5–B5
- analyze_physical_validation.py  gate de Hz/cents/repetibilidad/soplido
- physical_validation_report.json reporte generado después de medir

REFERENCIAS DE FÍSICA
- Kobayashi et al., 3D Calculation with Compressible LES for Sound Vibration
  of Ocarina: https://arxiv.org/abs/0911.3567
- Miyamoto et al., Numerical study on an air-reed instrument with LES:
  https://arxiv.org/abs/1005.3413

SIGUIENTE CHECKPOINT
- Ejecutar el pase Blender y publicar `public/models/BM-OC-002.glb`.
- Primera impresión de prueba.
- Capturar 3+ mediciones por C5–B5 con referencia de soplido.
- Generar `physical_validation_report.json`.
- Afinar secuencialmente y repetir hasta que el gate permita promover el perfil.
- Probar teléfono: micrófono → calibración → soplido → nota → GLB → pentagrama.
