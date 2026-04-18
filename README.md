# MISW4204-Frontend-Grupo11-Cloud

Frontend del curso **MISW4204** (Grupo 11), cliente del API del backend del proyecto.

# Desarrollo de Soluciones Cloud — Grupo 11

## Integrantes

| Nombre | Correo |
|--------|--------|
| German Andres Gonzalez Ortega | ga.gonzalezo1@uniandes.edu.co |
| Laura Pinzon Moreno | l.pinzonm2@uniandes.edu.co |
| Santiago Mora Félix | s.moraf@uniandes.edu.co |
| Sebastian Camilo Pineda Romero | sc.pineda@uniandes.edu.co |

---

## Documentación

- [Guía de implementación](docs/GUIA-IMPLEMENTACION.md)

## App Angular (`misw4204-web/`)

Desde la carpeta `misw4204-web`:

```bash
npm install
npm start
```

Navegador: [http://localhost:4200](http://localhost:4200) (redirige a `/home` o `/login` según sesión). El proxy reenvía `/api` al backend en `http://localhost:8080` (ver `proxy.conf.json`).


## Requisitos

- Node.js (LTS recomendado) y Angular CLI.
- API del backend accesible (local con `proxy.conf.json` o URL desplegada).
