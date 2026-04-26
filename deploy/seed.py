#!/usr/bin/env python3
"""Seed the deployed system with the data needed for the sustentación demo.

Idempotent-ish: creating an admin twice fails with 409, which is fine — we
swallow it and continue. Logging credentials are printed at the end so the
demo presenter can sign in.

Usage:
    BASE_URL=http://136.113.45.16 ./seed.py
"""
import os, json, datetime, urllib.request, urllib.error, sys

BASE = os.environ.get("BASE_URL", "http://136.113.45.16")

# All four team members (per project_context memory).
ADMIN     = ("Santiago Mora Felix",            "s.moraf@uniandes.edu.co",      "demo-admin-1234")
PROFESSOR = ("German Andres Gonzalez Ortega",  "ga.gonzalezo1@uniandes.edu.co", "demo-prof-1234")
MONITOR_1 = ("Laura Pinzon Moreno",            "l.pinzonm2@uniandes.edu.co",   "demo-mon-1234")
MONITOR_2 = ("Sebastian Camilo Pineda Romero", "sc.pineda@uniandes.edu.co",    "demo-mon-1234")

PERIOD_CODE = "2026-10"
SPACE_NAME  = "Computación en la Nube — MISW4204"


def req(method, path, body=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    if body is not None:
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(BASE + path, headers=h,
                               data=json.dumps(body).encode() if body is not None else None,
                               method=method)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, json.loads(resp.read().decode() or "null")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode() or "null")
        except Exception: return e.code, None


def get_id(obj):
    if not isinstance(obj, dict): return None
    return obj.get("id") or obj.get("ID")


def login(email, pw):
    code, body = req("POST", "/api/v1/auth/login", {"email": email, "password": pw})
    if code != 200:
        sys.exit(f"login failed for {email}: {code} {body}")
    return body["token"]


def create_user(name, email, pw, role, admin_token):
    code, body = req("POST", "/api/v1/users",
                     {"name": name, "email": email, "password": pw, "roles": [role]},
                     token=admin_token)
    print(f"  user {email} ({role}) -> {code}")
    if code in (200, 201): return get_id(body)
    if code == 409:  # already exists, look it up
        code, body = req("GET", f"/api/v1/users?role={role}", token=admin_token)
        for u in (body or {}).get("users", []):
            if u.get("email") == email:
                return get_id(u)
    return None


def main():
    print(f">> 1. bootstrap admin {ADMIN[1]} (skipped if DB has users)")
    code, body = req("POST", "/api/v1/users",
                     {"name": ADMIN[0], "email": ADMIN[1], "password": ADMIN[2], "roles": ["administrador"]})
    print(f"   bootstrap -> {code}")

    print(">> 2. login admin")
    admin_token = login(ADMIN[1], ADMIN[2])

    print(f">> 3. ensure period {PERIOD_CODE}")
    today = datetime.date.today().isoformat()
    end = (datetime.date.today() + datetime.timedelta(days=180)).isoformat()
    code, _ = req("POST", "/api/v1/periods",
                  {"code": PERIOD_CODE, "start_date": today, "end_date": end},
                  token=admin_token)
    print(f"   period -> {code}")
    code, body = req("GET", "/api/v1/periods", token=admin_token)
    periods = body if isinstance(body, list) else (body or {}).get("periods", [])
    period = next((p for p in periods if (p.get("code") or p.get("Code")) == PERIOD_CODE), None)
    period_id = get_id(period)
    assert period_id, periods

    print(">> 4. create users")
    create_user(*PROFESSOR, "profesor", admin_token)
    mon1_id = create_user(*MONITOR_1, "monitor", admin_token)
    mon2_id = create_user(*MONITOR_2, "monitor", admin_token)
    assert mon1_id and mon2_id

    print(">> 5. login professor + create space")
    prof_token = login(PROFESSOR[1], PROFESSOR[2])
    code, body = req("POST", "/api/v1/spaces",
                     {"name": SPACE_NAME, "type": "course",
                      "academic_period_id": period_id,
                      "start_date": today, "end_date": end,
                      "observations": "Curso de demostración para sustentación."},
                     token=prof_token)
    print(f"   space -> {code}")
    space_id = get_id(body)
    if not space_id:
        code, body = req("GET", "/api/v1/spaces", token=prof_token)
        space_id = get_id(next((s for s in (body or []) if (s.get("name") or s.get("Name")) == SPACE_NAME), None))
    assert space_id, body

    print(">> 6. create assignments for both monitors")
    a1_id = a2_id = None
    for mon_id, label in ((mon1_id, "monitor 1"), (mon2_id, "monitor 2")):
        code, body = req("POST", f"/api/v1/spaces/{space_id}/assignments",
                         {"user_id": mon_id, "role_in_assignment": "monitor", "contracted_hours_per_week": 6},
                         token=prof_token)
        print(f"   assignment for {label} -> {code}")
        aid = get_id(body)
        if aid is None:
            code, body = req("GET", f"/api/v1/spaces/{space_id}/assignments", token=prof_token)
            aid = next((get_id(x) for x in (body or []) if (x.get("user_id") or x.get("UserID")) == mon_id), None)
        if mon_id == mon1_id: a1_id = aid
        else: a2_id = aid

    print(">> 7. seed sample tasks for both monitors (current week)")
    d = datetime.date.today()
    monday = d - datetime.timedelta(days=d.weekday())
    sample_tasks = [
        ("Revisión de talleres semana 1",      "Revisé y retroalimenté los entregables de la semana.",                  "finalizado",     2),
        ("Atención de tutorías",               "Sesiones de acompañamiento con los estudiantes inscritos.",              "en_desarrollo",  3),
        ("Preparación de material de lab",     "Armado del cuaderno de prácticas para la próxima sesión.",               "abierto",        1),
    ]
    for assign_id, mon_creds in ((a1_id, MONITOR_1), (a2_id, MONITOR_2)):
        if not assign_id: continue
        mon_token = login(mon_creds[1], mon_creds[2])
        for title, desc, status, hours in sample_tasks:
            code, _ = req("POST", "/api/v1/tasks",
                          {"title": title, "description": desc, "status": status,
                           "week_start": monday.isoformat(), "time_invested": hours,
                           "assignment_id": assign_id, "observations": "Reporte semanal de demostración."},
                          token=mon_token)
            print(f"   task '{title[:35]}' for assignment {assign_id} -> {code}")

    print()
    print("=" * 60)
    print("SEED DONE — credentials for the demo:")
    print("=" * 60)
    for label, who in (("ADMIN ", ADMIN), ("PROF  ", PROFESSOR),
                       ("MON 1 ", MONITOR_1), ("MON 2 ", MONITOR_2)):
        print(f"  {label}  {who[1]:40s}  {who[2]}")
    print(f"\n  URL:   {BASE}/login")
    print(f"  Bucket: gs://miso-494501-files/  (PDFs land in /reports/, attachments in /attachments/)")


if __name__ == "__main__":
    main()
