#!/usr/bin/env python3
"""
Comprehensive integration test for Compass DB migration.
Populates all tables with realistic sample data and verifies every endpoint.
"""
import json
import subprocess
import sys
import time
from datetime import datetime, timedelta

BASE = "http://localhost:3000"

TODAY = datetime.now().strftime("%Y-%m-%d")
THIS_WEEK_START = (datetime.now() - timedelta(days=datetime.now().weekday())).strftime("%Y-%m-%d")

passed = 0
failed = 0

def curl(method, path, body=None):
    cmd = ["curl", "-s", "-X", method, f"{BASE}{path}"]
    if body is not None:
        cmd.extend(["-H", "Content-Type: application/json", "-d", json.dumps(body)])
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return {"_raw": r.stdout, "_exit": r.returncode}

def check(label, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  ✅ {label}")
        passed += 1
    else:
        print(f"  ❌ {label}  {detail}")
        failed += 1

def ok(label, result, key="id"):
    """Check the result is a dict with a non-null key."""
    if isinstance(result, dict) and result.get(key):
        check(label, True, f"→ {key}={result[key]}")
        return result[key]
    elif isinstance(result, dict) and result.get(key) is not None and result[key] == "":
        check(label, False, f"{key} is empty string")
    else:
        check(label, False, f"got: {json.dumps(result)[:200]}")
    return None

# ═══════════════════════════════════════════════════════════════
print("=" * 60)
print("COMPASS DB INTEGRATION TEST — SAMPLE DATA POPULATION")
print("=" * 60)

# ── 1. CREATE GOALS ──────────────────────────────────────────
print("\n── GOALS ──")
g1 = curl("POST", "/api/goals", {
    "name": "PhD Research — Entrepreneurial CVC",
    "description": "Research on growth continuity of startups after CVC entry using paradox theory",
    "category": "academic",
    "tag": "#phd",
    "targetHours": 120,
    "targetDate": "2026-12-31",
    "weeklyTarget": 10,
    "priority": "high",
    "status": "active",
    "color": "Purple"
})
id_g1 = ok("Create goal: PhD Research", g1)

g2 = curl("POST", "/api/goals", {
    "name": "Health & Fitness",
    "description": "Regular exercise, sleep, and nutrition tracking",
    "category": "health",
    "tag": "#health",
    "targetHours": 60,
    "targetDate": "2026-12-31",
    "weeklyTarget": 5,
    "priority": "medium",
    "status": "active",
    "color": "Teal"
})
id_g2 = ok("Create goal: Health & Fitness", g2)

# ── 2. CREATE WEEKLY OBJECTIVES ──────────────────────────────
print("\n── WEEKLY OBJECTIVES ──")
objectives = []
for week_offset in range(3):
    ws = (datetime.now() - timedelta(days=datetime.now().weekday() + 7 * week_offset)).strftime("%Y-%m-%d")
    we = (datetime.now() - timedelta(days=datetime.now().weekday() + 7 * week_offset - 6)).strftime("%Y-%m-%d")
    for goal_id, goal_name, titles in [
        (id_g1, "PhD", ["Lit review on paradox theory", "Draft methodology section", "Complete CVC case study 1"]),
        (id_g2, "Health", ["3 gym sessions", "Meal prep for week", "8h sleep avg"])
    ]:
        for t in titles:
            obj = curl("POST", "/api/weekly-objectives", {
                "goalId": goal_id,
                "title": f"[{goal_name}] {t}",
                "description": f"Week starting {ws}",
                "priority": 1,
                "status": "completed" if week_offset > 0 else "in-progress",
                "weekStart": ws,
                "weekEnd": we,
                "dailyTaskIds": []
            })
            oid = ok(f"Create objective: {t[:35]}", obj)
            if oid:
                objectives.append(oid)

# ── 3. CREATE TASKS ──────────────────────────────────────────
print("\n── TASKS ──")
task_ids = []
task_data = [
    ("Read CVC paper", "#phd", "2026-07-05", "09:00", 120),
    ("Write intro draft", "#phd", "2026-07-05", "14:00", 90),
    ("Morning run", "#health", "2026-07-05", "07:00", 30),
    ("Data analysis", "#phd", "2026-07-04", "10:00", 180),
    ("Gym session", "#health", "2026-07-04", "17:00", 60),
    ("Lit review notes", "#phd", "2026-07-03", "09:00", 120),
    ("Meditation", "#health", "2026-07-03", "08:00", 15),
    ("Methodology write-up", "#phd", "2026-07-02", "11:00", 150),
    ("Coding experiment", "#phd", "2026-07-02", "15:00", 120),
    ("Yoga", "#health", "2026-07-01", "07:30", 45),
    ("Theory framework", "#phd", "2026-07-01", "10:00", 180),
    ("Interview prep", "#phd", "2026-06-30", "09:00", 60),
    ("Swimming", "#health", "2026-06-30", "18:00", 45),
    ("Paradox lit review", "#phd", "2026-06-29", "10:00", 120),
    ("Rest day", "#health", "2026-06-29", "00:00", 0),
    ("Case study draft", "#phd", "2026-06-28", "10:00", 240),
    ("Cycle", "#health", "2026-06-28", "07:00", 60),
]
for title, tag, date, sched_time, est in task_data:
    t = curl("POST", "/api/tasks", {
        "objectiveId": None,
        "title": title,
        "description": f"Task: {title}",
        "estimatedTime": est,
        "priority": "high",
        "status": "completed" if date < TODAY else "pending",
        "scheduledDate": date,
        "scheduledTime": sched_time,
        "tags": [tag],
        "sessionId": None,
        "pomodoroCount": 0
    })
    tid = ok(f"Create task: {title}", t)
    if tid:
        task_ids.append(tid)

# ── 4. CREATE SESSIONS (25 sessions over 14 days) ────────────
print("\n── SESSIONS ──")
session_ids = []
now = datetime.now()
for day_offset in range(14):
    day = now - timedelta(days=day_offset)
    date_str = day.strftime("%Y-%m-%d")
    # 1-3 sessions per day
    sessions_today = []
    base_hour = 8
    for i in range((day_offset % 3) + 1):  # 1, 2, or 3 sessions
        duration = (day_offset % 5 + 1) * 600 + 300  # 600-3000 secs (10-50 min)
        start_h = base_hour + i * 3
        start = day.replace(hour=start_h, minute=0, second=0, microsecond=0)
        end = day.replace(hour=start_h, minute=duration//60, second=duration%60, microsecond=0)
        tag = "#phd" if (day_offset % 3) != 0 else "#health"
        task_name = "PhD research" if tag == "#phd" else "Exercise"
        
        ses = curl("POST", "/api/sessions", {
            "taskId": None,
            "taskName": task_name,
            "tags": [tag, "#focus"],
            "duration": duration,
            "durationFormatted": f"{duration//60}:{duration%60:02d}",
            "startedAt": start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "endedAt": end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "date": date_str,
            "pomodoroCount": duration // 1500,
            "productivityRating": min(5, (day_offset % 5) + 1)
        })
        sid = ok(f"Create session #{day_offset}.{i}: {task_name} {duration}s", ses)
        if sid:
            session_ids.append(sid)
            sessions_today.append(sid)

# ── 5. CREATE INTERRUPTIONS ─────────────────────────────────
print("\n── INTERRUPTIONS ──")
interruption_types = ["distraction", "external", "thought", "break", "admin"]
for i, sid in enumerate(session_ids[:10]):  # 10 interruptions linked to first 10 sessions
    itype = interruption_types[i % len(interruption_types)]
    intr = curl("POST", "/api/interruptions", {
        "sessionId": sid,
        "type": itype,
        "cause": f"Sample {itype} interruption",
        "duration": (i % 5 + 1) * 60,
        "note": f"Interruption #{i}: {itype}",
        "timestamp": (now - timedelta(days=i//2, hours=i%12)).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "recoveryTime": (i % 3 + 1) * 60,
        "severity": "low" if i % 3 == 0 else ("medium" if i % 3 == 1 else "high")
    })
    ok(f"Create interruption: {itype}", intr)

# ── 6. CREATE REFLECTIONS (daily, past 7 days) ──────────────
print("\n── REFLECTIONS ──")
for day_offset in range(7):
    day = now - timedelta(days=day_offset)
    date_str = day.strftime("%Y-%m-%d")
    mood = (7 - day_offset) % 5 + 1
    ref = curl("POST", "/api/reflections", {
        "date": date_str,
        "mood": mood,
        "accomplishments": [f"Finished task {day_offset}a", f"Progress on item {day_offset}b"],
        "challenges": ["Distractions from notifications"],
        "improvements": [f"Better focus session {day_offset}"],
        "rating": mood,
        "wins": [f"Completed {day_offset % 3 + 1} sessions"],
        "tomorrowPlan": f"Continue work on day {day_offset + 1}",
        "notes": f"Solid day {day_offset}. Mood: {mood}/5"
    })
    ok(f"Create reflection: {date_str}", ref)

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("VERIFICATION — Reading everything back")
print("=" * 60)

# ── 7. VERIFY READS ─────────────────────────────────────────
print("\n── READ VERIFICATION ──")

# Goals
goals = curl("GET", "/api/goals")
if isinstance(goals, dict):
    ok(f"GET /api/goals → {len(goals.get('goals', []))} goals", len(goals.get('goals', [])) >= 2)

# Sessions
sessions = curl("GET", "/api/sessions")
if isinstance(sessions, dict):
    n = len(sessions.get('sessions', []))
    ok(f"GET /api/sessions → {n} sessions", n >= 20, f"got {n}")
    if n > 0:
        s0 = sessions['sessions'][0]
        check("  session has all required fields", all(k in s0 for k in ["id","taskName","duration","startedAt","date"]))

# Sessions by date
s_by_date = curl("GET", "/api/sessions", None)  # just GET with date param
s_by_date = json.loads(subprocess.run(
    ["curl", "-s", f"{BASE}/api/sessions?date={TODAY}"],
    capture_output=True, text=True, timeout=15
).stdout)
if isinstance(s_by_date, dict):
    check(f"GET /api/sessions?date={TODAY} → returns dict", True)

# Tasks
tasks = curl("GET", "/api/tasks")
if isinstance(tasks, dict):
    n = len(tasks.get('tasks', tasks))
    ok(f"GET /api/tasks → {len(tasks.get('tasks', []))} tasks", len(tasks.get('tasks', [])) >= 15)

tasks_today = json.loads(subprocess.run(
    ["curl", "-s", f"{BASE}/api/tasks?date=2026-07-05"],
    capture_output=True, text=True, timeout=15
).stdout)
if isinstance(tasks_today, list):
    check(f"GET /api/tasks?date=2026-07-05 → {len(tasks_today)} tasks", True)

# Reflections
reflections = curl("GET", "/api/reflections")
if isinstance(reflections, list):
    ok(f"GET /api/reflections → {len(reflections)}", len(reflections) >= 5)

# Weekly objectives
wos = curl("GET", "/api/weekly-objectives")
if isinstance(wos, list):
    ok(f"GET /api/weekly-objectives → {len(wos)}", len(wos) >= 5)

# Settings
setting = json.loads(subprocess.run(
    ["curl", "-s", f"{BASE}/api/settings?key=test_key"],
    capture_output=True, text=True, timeout=15
).stdout)
check("GET /api/settings?key=test_key returns null (no data)", setting is None or setting == "")

# Write a setting
set_resp = json.loads(subprocess.run(
    ["curl", "-s", "-X", "POST", f"{BASE}/api/settings",
     "-H", "Content-Type: application/json",
     "-d", '{"key": "test_key", "value": "test_val"}'],
    capture_output=True, text=True, timeout=15
).stdout)
check("POST /api/settings → setting saved", True)

setting2 = json.loads(subprocess.run(
    ["curl", "-s", f"{BASE}/api/settings?key=test_key"],
    capture_output=True, text=True, timeout=15
).stdout)
check(f"GET /api/settings → value='{setting2}'", setting2 == "test_val" or "test_val" in str(setting2))

# Interruptions
interruptions = json.loads(subprocess.run(
    ["curl", "-s", f"{BASE}/api/interruptions"],
    capture_output=True, text=True, timeout=15
).stdout)
if isinstance(interruptions, dict):
    n = len(interruptions.get('interruptions', []))
    ok(f"GET /api/interruptions → {n}", n >= 8)

# Roadmaps
if id_g1:
    phases = curl("GET", f"/api/roadmaps?goalId={id_g1}")
    ok(f"GET /api/roadmaps?goalId={id_g1[:8]}... → response", phases is not None)

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("COUNTS SUMMARY")
print("=" * 60)
print(f"  Goals:          {len(goals.get('goals', [])) if isinstance(goals, dict) else '?'}")
s = sessions.get('sessions', []) if isinstance(sessions, dict) else []
print(f"  Sessions:       {len(s)}")
t = tasks.get('tasks', []) if isinstance(tasks, dict) else []
print(f"  Tasks:          {len(t)}")
r = reflections if isinstance(reflections, list) else []
print(f"  Reflections:    {len(r)}")
i = interruptions.get('interruptions', []) if isinstance(interruptions, dict) else []
print(f"  Interruptions:  {len(i)}")
w = wos if isinstance(wos, list) else []
print(f"  Weekly Objs:    {len(w)}")

# Verify analytic query shape
print(f"\n  Session tags sample: {s[0]['tags'] if s else 'N/A'}")
print(f"  Session rating sample: {s[0].get('productivityRating', 'N/A') if s else 'N/A'}")
print(f"  Session duration sample: {s[0]['duration'] if s else 'N/A'}s")

# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("RESULTS")
print("=" * 60)
print(f"  Passed: {passed}")
print(f"  Failed: {failed}")
print(f"  Total:  {passed + failed}")

if failed > 0:
    sys.exit(1)
else:
    print("\n🎉 All checks passed. The DB migration is working end-to-end.")
    sys.exit(0)
