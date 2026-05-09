from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from collections import Counter

app = Flask(__name__)
CORS(app)

DB_PATH = "activities.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                name     TEXT    NOT NULL,
                activity TEXT    NOT NULL,
                hours    REAL    NOT NULL CHECK(hours > 0),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

@app.route("/activities", methods=["POST"])
def add_activity():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    name     = (data.get("name") or "").strip()
    activity = (data.get("activity") or "").strip()
    hours    = data.get("hours")

    errors = {}
    if not name:
        errors["name"] = "Name is required"
    if not activity:
        errors["activity"] = "Activity is required"
    if hours is None:
        errors["hours"] = "Hours is required"
    else:
        try:
            hours = float(hours)
            if hours <= 0:
                errors["hours"] = "Hours must be greater than 0"
        except (ValueError, TypeError):
            errors["hours"] = "Hours must be a number"

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 422

    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO activities (name, activity, hours) VALUES (?, ?, ?)",
            (name, activity, hours),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM activities WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()

    return jsonify(dict(row)), 201

@app.route("/activities", methods=["GET"])
def get_activities():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM activities ORDER BY created_at DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows]), 200

@app.route("/activities/<int:activity_id>", methods=["DELETE"])
def delete_activity(activity_id):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM activities WHERE id = ?", (activity_id,)
        ).fetchone()
        if not row:
            return jsonify({"error": "Activity not found"}), 404
        conn.execute("DELETE FROM activities WHERE id = ?", (activity_id,))
        conn.commit()
    return jsonify({"message": f"Activity {activity_id} deleted"}), 200

@app.route("/summary", methods=["GET"])
def get_summary():
    with get_db() as conn:
        rows = conn.execute("SELECT name, hours FROM activities").fetchall()

    if not rows:
        return jsonify({"total_entries": 0, "total_hours": 0, "most_active_user": None}), 200

    total_entries = len(rows)
    total_hours   = round(sum(r["hours"] for r in rows), 2)
    name_counts   = Counter(r["name"] for r in rows)
    most_active   = name_counts.most_common(1)[0][0]

    return jsonify({
        "total_entries": total_entries,
        "total_hours": total_hours,
        "most_active_user": most_active,
    }), 200

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)