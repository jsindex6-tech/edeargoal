# Backend de EdearGoal

## Datos de fútbol

La API intenta usar API-Football y football-data.org cuando sus claves y planes
permiten la temporada solicitada. Para las competiciones con cobertura
comprobada, también usa el marcador público de ESPN sin requerir otra clave.
Las respuestas se guardan en caché para reducir consultas a los proveedores.

La correspondencia de las competiciones y temporadas de ESPN está en
`src/services/espnSoccer.js`. El proveedor no entrega una tabla general fiable
para todos los formatos: EdearGoal calcula puntos solo para las ligas de tabla
única indicadas allí. En copas, grupos y ligas con fases separadas se muestran
partidos y clubes, pero no se inventa una clasificación combinada.

La cobertura gratuita no incluye todas las competiciones de la navegación. Si
ninguna fuente conectada dispone de una competición, la API responde con un
mensaje explícito en lugar de presentar datos antiguos como actuales.
