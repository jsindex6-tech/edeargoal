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

## Cuentas

El registro solicita nombre, apodo, equipo favorito, correo, contraseña y la
aceptación de las Condiciones de uso y la Política de privacidad. La cuenta
queda iniciada inmediatamente, sin códigos de verificación ni envío de correo.
El perfil conserva la fecha de registro y la fecha y versión de la aceptación.
Las contraseñas se guardan como hashes salados.

Configura `AUTH_SESSION_SECRET` como un secreto aleatorio largo en el servicio
de alojamiento; no lo guardes en Git ni lo compartas en mensajes.

Al desactivar la verificación, el sistema no confirma que una persona controle
la dirección de correo que registra. Las cuentas antiguas pendientes se activan
al iniciar sesión correctamente con su contraseña. Sus perfiles muestran su
nombre como apodo y no tienen un equipo favorito ni una aceptación registrada
hasta que se soliciten esos datos en una actualización futura.
