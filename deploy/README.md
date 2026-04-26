# Despliegue — MISW4204 Entrega 2

Infraestructura como código (estilo *script*) para desplegar la solución del Grupo 11 en Google Cloud Platform.

## Topología

```
                       Internet
                          │
              ┌───────────┴────────────┐
              │      VM (e2-small)     │
              │   us-central1-a        │
              │   IP: 136.113.45.16    │
              │  ────────────────────  │
              │  docker compose:       │
              │   • nginx  (puerto 80) │──┐
              │     ├─ /          → estático (Angular)
              │     └─ /api/      → api:8080
              │   • backend Go (8080)  │
              │   • postgres (legado, fallback)
              │   • rabbitmq (cola de reportes)
              └────────────┬───────────┘
                           │  (SA: vm-runtime con storage.objectAdmin)
                           │
        ┌──────────────────┴───────────────────┐
        │                                      │
        ▼                                      ▼
┌────────────────────┐               ┌────────────────────┐
│  Cloud SQL         │               │  Cloud Storage     │
│  entrega2-db       │               │  miso-494501-files │
│  Postgres 16       │               │   ├─ attachments/  │
│  db-f1-micro       │               │   └─ reports/      │
│  IP: 136.115.165.183                │  miso-494501-web   │
│  TLS (sslmode=require)              │  (provisionado,   │
│  ACL: solo IP de la VM              │   no usado)       │
└────────────────────┘               └────────────────────┘
```

## Servicios de GCP utilizados

| Servicio          | Recurso                  | Propósito                                                |
|-------------------|--------------------------|----------------------------------------------------------|
| Compute Engine    | `entrega2-vm` (e2-small) | Aloja el backend, RabbitMQ y nginx en *containers*       |
| Cloud SQL         | `entrega2-db` (Postgres 16, db-f1-micro) | Base de datos durante la sustentación y las pruebas de carga |
| Cloud Storage     | `gs://miso-494501-files` | Adjuntos de tareas (RF-06.4) y reportes PDF (RF-14.5)    |
| Cloud Storage     | `gs://miso-494501-web`   | *Bucket* aprovisionado para *hosting* estático; no se utilizó porque el frontend usa URLs relativas y se prefirió mantener el mismo origen vía nginx para evitar CORS y modificar el código existente |
| IAM               | SA `vm-runtime`          | Identidad de la VM, con `storage.objectAdmin` sobre `gs://miso-494501-files` (autenticación por ADC, sin archivos de credenciales) |
| VPC firewall      | `allow-http-api`         | Abre `tcp:80` (y `tcp:8080` para depuración) hacia la VM |

## Aprovisionamiento (una sola vez)

```bash
cd deploy/
./provision.sh
```

El *script* es idempotente: cada comando tolera errores del tipo "ya existe", de modo que se puede volver a ejecutar sin romper nada.

## Despliegue del backend

Cuando `origin/develop` recibe nuevos *commits*:

```bash
./deploy/redeploy-backend.sh
```

Hace `git fetch`, extrae el código de `origin/develop`, lo copia a la VM, reconstruye solo el *contenedor* `api` y muestra el *SHA* desplegado al final. Aproximadamente **30 s**.

## Despliegue del frontend

```bash
./deploy/redeploy-frontend.sh
# Para desplegar otra rama (por ejemplo durante un desarrollo)
BRANCH=origin/feature/foo ./deploy/redeploy-frontend.sh
```

Hace `git fetch`, ejecuta `npm ci && ng build` localmente, sube el contenido de `dist/.../browser/` a la VM y reinicia `nginx`. Aproximadamente **1–2 min**.

## Cambio a Cloud SQL para la sustentación

Ver el procedimiento detallado en [`cloudsql-runbook.md`](./cloudsql-runbook.md). En resumen:

```bash
# 1. aprovisionar la instancia (≈ 8 min)
# 2. apuntar el backend a Cloud SQL editando /opt/app/.env
# 3. poblar datos iniciales con seed.py
# 4. tras la grabación: gcloud sql instances delete entrega2-db
```

## Disciplina de costos

- **Apagar la VM cuando no se trabaja activamente** (ahorra ≈ USD 0.20 al día):

  ```bash
  gcloud compute instances stop entrega2-vm --zone=us-central1-a
  gcloud compute instances start entrega2-vm --zone=us-central1-a
  ```

  Tras el reinicio la **IP pública cambia** (no se reservó IP estática para no consumir crédito mientras la VM está apagada). Los `redeploy-*.sh` aceptan la nueva IP automáticamente; lo único que cambia es la URL de acceso.

- **Borrar Cloud SQL inmediatamente después de la sustentación** (`gcloud sql instances delete entrega2-db --quiet`). Mientras esté detenida solo cobra almacenamiento (≈ USD 0.06/día); mientras está corriendo cobra ≈ USD 0.30/día adicionales.

- El presupuesto total previsto para toda la Entrega 2 está en torno a **USD 10–15** sobre los USD 50 de crédito disponibles. La alerta presupuestal está configurada al 50/90/100 % de USD 25 (notifica por correo, no detiene servicios).

## Documentación adicional en este directorio

| Archivo                  | Contenido                                                                  |
|--------------------------|----------------------------------------------------------------------------|
| `cloudsql-runbook.md`    | Procedimiento operativo para el cambio a Cloud SQL                          |
| `provision.sh`           | Aprovisionamiento *one-shot* de toda la infraestructura                     |
| `redeploy-backend.sh`    | Redepliegue del backend (≈ 30 s)                                            |
| `redeploy-frontend.sh`   | Redepliegue del frontend (≈ 1–2 min)                                        |
| `vm-startup.sh`          | *Startup script* de la VM: instala Docker en el primer arranque             |
| `docker-compose.vm.yml`  | Stack que corre dentro de la VM                                             |
| `nginx.conf`             | Configuración del proxy reverso                                             |
| `seed.py`                | Población de datos para la sustentación                                     |
