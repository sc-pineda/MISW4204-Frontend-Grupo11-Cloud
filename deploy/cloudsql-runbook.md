# Runbook — Migración a Cloud SQL

Procedimiento operativo para satisfacer el requisito de `Entrega2/03-despliegue-gcp.md`: durante la sustentación y las pruebas de carga, la base de datos del sistema **debe ser Cloud SQL**, no la instancia local de Postgres dentro del contenedor Docker.

> El cambio se hace **temporalmente** justo antes de la sustentación / las pruebas de carga, y la instancia se elimina inmediatamente después para preservar el presupuesto de USD 50 en créditos.

## Prerrequisitos

- La VM `entrega2-vm` está activa. Verificar con:

  ```bash
  gcloud compute instances describe entrega2-vm --zone=us-central1-a \
    --format='value(networkInterfaces[0].accessConfigs[0].natIP)'
  ```

- Los buckets `gs://miso-494501-files/` y `gs://miso-494501-web/` ya existen (creados por `provision.sh`).
- `gcloud` autenticado con un usuario *Owner* del proyecto `miso-494501`.

## A. Aprovisionar la instancia (≈ 8–10 min)

```bash
ROOT_PW=$(openssl rand -hex 24)
APP_PW=$(openssl rand -hex 24)
VM_IP=$(gcloud compute instances describe entrega2-vm --zone=us-central1-a \
  --format='value(networkInterfaces[0].accessConfigs[0].natIP)')

gcloud sql instances create entrega2-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro --edition=enterprise \
  --region=us-central1 --storage-size=10 --storage-type=SSD \
  --root-password="$ROOT_PW" \
  --authorized-networks="${VM_IP}/32"

gcloud sql users create app --instance=entrega2-db --password="$APP_PW"
gcloud sql databases create app --instance=entrega2-db
```

**Importante:** guardar `$APP_PW` en un lugar seguro y temporal (por ejemplo `/tmp/cloudsql-creds.env`). No se debe versionar.

> *Nota observada el 2026-04-26:* el comando `gcloud sql instances create` puede mostrar `INTERNAL_ERROR` y salir antes de tiempo, mientras la instancia continúa aprovisionándose en segundo plano. En ese caso esperar a que el estado pase a `RUNNABLE` con `gcloud sql instances describe entrega2-db --format='value(state)'`. Es un comportamiento conocido del CLI, no un fallo real.

## B. Apuntar el backend a Cloud SQL

```bash
DB_IP=$(gcloud sql instances describe entrega2-db \
  --format='value(ipAddresses[0].ipAddress)')

# Reemplazar el .env de la VM preservando el JWT_SECRET ya generado.
gcloud compute ssh entrega2-vm --zone=us-central1-a --command="
  set -e
  JWT=\$(sudo grep -oP '(?<=^JWT_SECRET=).+' /opt/app/.env)
  sudo tee /opt/app/.env > /dev/null <<EOF
JWT_SECRET=\$JWT
GCS_BUCKET_FILES=miso-494501-files
DATABASE_URL=postgres://app:$APP_PW@$DB_IP:5432/app?sslmode=require
EOF
  sudo chmod 600 /opt/app/.env
  cd /opt/app && sudo docker compose --env-file .env up -d api
"
```

Las migraciones del backend se ejecutan automáticamente sobre la base de datos vacía al arrancar el *contenedor* `api`. Esperar 10 s y verificar:

```bash
curl http://$VM_IP/health/ready    # esperado: {"status":"ready"}
```

## C. Poblar datos para la sustentación

```bash
BASE_URL=http://$VM_IP /home/sanmofe/Codigo/MISW4204-Frontend-Grupo11-Cloud/deploy/seed.py
```

El *script* imprime las credenciales al final. Los roles creados son:

| Rol         | Correo                          | Contraseña       |
|-------------|---------------------------------|------------------|
| admin       | s.moraf@uniandes.edu.co         | demo-admin-1234  |
| profesor    | ga.gonzalezo1@uniandes.edu.co   | demo-prof-1234   |
| monitor     | l.pinzonm2@uniandes.edu.co      | demo-mon-1234    |
| monitor     | sc.pineda@uniandes.edu.co       | demo-mon-1234    |

`seed.py` crea: un periodo académico (`2026-10`), un espacio académico (`Computación en la Nube — MISW4204`), una vinculación por cada monitor (6 horas semanales contratadas) y tres tareas semanales por monitor para la semana actual, cubriendo los tres estados (abierto / en desarrollo / finalizado).

## D. Verificación previa a la grabación

1. Abrir `http://$VM_IP/login` en un navegador.
2. Iniciar sesión como **profesor** (German).
3. En el dashboard del profesor confirmar que aparecen los dos monitores con sus tareas.
4. Hacer clic en **"Generar reportes"** para la semana actual → esperar entre 5 y 10 s.
5. La pestaña **"Mis reportes"** debe listar dos PDF (uno por monitor) con el resumen determinístico en español.
6. Descargar uno de los PDF y verificar el formato.
7. Confirmar que los archivos también están en el *bucket*:

   ```bash
   gcloud storage ls gs://miso-494501-files/reports/
   gcloud storage ls gs://miso-494501-files/attachments/   # tras subir un adjunto
   ```

## E. Después de la grabación — desmontar

```bash
gcloud sql instances delete entrega2-db --quiet
```

Detiene el cobro de Cloud SQL inmediatamente. Si el equipo prefiere conservar la base por si se necesita volver a grabar, alternativamente se puede **detener** la instancia (sigue cobrando solo el almacenamiento, ≈ USD 0.06/día):

```bash
gcloud sql instances patch entrega2-db --activation-policy=NEVER
# y para reanudarla:
gcloud sql instances patch entrega2-db --activation-policy=ALWAYS
```

Para regresar el backend a la base local de Docker (sin redesplegar el código), basta con eliminar `DATABASE_URL` del `.env` de la VM y reiniciar el *contenedor* `api`; el `docker-compose.vm.yml` toma como valor por omisión `postgres://app:app@postgres:5432/app?sslmode=disable`.

## F. Notas de costo

- `db-f1-micro` (edición Enterprise): ≈ **USD 0.012/h** corriendo, ≈ **USD 0.06/día** detenida (solo almacenamiento).
- Una sesión completa de pruebas de carga + grabación cabe holgadamente en **menos de USD 1**.
- El cuello de botella del presupuesto general **no es Cloud SQL** sino la VM (`e2-small`, ≈ USD 0.40/día corriendo); la disciplina importante es apagar la VM al cierre de cada jornada.
