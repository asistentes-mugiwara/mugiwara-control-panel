# Arquitectura del Control Panel

El panel es un monolito modular con un backend FastAPI y un frontend Next.js. Es una consola de observación y navegación, no un orquestador de agentes.

## De las fuentes a la interfaz

| Capa | Responsabilidad |
| --- | --- |
| **Fuentes** | Aportan la información que el panel puede presentar. No todas están disponibles en cada entorno. |
| **Backend** | Decide qué fuentes se pueden consultar y transforma sus datos en modelos de lectura. La interfaz no accede directamente a esas fuentes. |
| **Contrato** | Separa los datos del estado de la respuesta y de su contexto, para que puedan interpretarse por separado. |
| **Frontend** | Presenta los modelos de lectura e indica cuándo la información falta, está desactualizada o procede de un respaldo. |

## Estado degradado y alcance de esta página

Que una vista esté disponible no significa que lo esté la fuente ni que el sistema observado funcione correctamente. Si faltan datos o no se puede confirmar su vigencia, se indica esa limitación. Una vista de respaldo no representa telemetría actual.

Esta página describe el diseño sin mostrar datos reales, configuración de despliegue ni acceso a fuentes privadas. No acredita el estado de ningún entorno.
