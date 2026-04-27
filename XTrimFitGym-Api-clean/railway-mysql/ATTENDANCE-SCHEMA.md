# Attendance table schema (iVMS-4200 + MySQL)

## Corrected `CREATE TABLE` (01-attendance.sql)

- **Composite PRIMARY KEY (id, authDateTime)** — iVMS sends the same `id` (employee/card identifier) for every scan by that person. A single-column PK on `id` would make the **second insert** (same person, second scan) fail with duplicate key, so IVMS disconnects and the second log is never stored. With composite PK, each (person, time) is one row: 1st scan = IN, 2nd scan = OUT, etc.
- **id** `VARCHAR(50)` — employee/card/record identifier from IVMS (same value for each scan by that person).
- **authDateTime** `DATETIME` **NOT NULL** — event time; with `id` forms the unique row.
- All text fields **VARCHAR**: personName, cardNo, direction, deviceName, deviceSerNum; authDate/authTime kept as VARCHAR for IVMS mapping.
- **No strict constraints**: DEFAULT '' or NULL so normal inserts do not fail.
- **Charset** `utf8mb4` (table and database).
- **Insert logging**: `attendance_insert_log` + `BEFORE INSERT` trigger.
- **Stable connection**: `custom.cnf` sets `wait_timeout` and `interactive_timeout` (e.g. 86400 s) so the server does not close the connection between scans.

Defensive options (see `03-defensive-insert-examples.sql`):

- **INSERT IGNORE** – duplicate (id, authDateTime) is skipped; no error, connection stays up.
- **ON DUPLICATE KEY UPDATE** – overwrite row on duplicate (id, authDateTime).
- **Stored procedure** `SP_Attendance_Insert` – logs and uses INSERT IGNORE.

---

## Why second scan disconnects and second log is not stored (same issue online)

1. **iVMS sends the same `id` per person**  
   The field mapped to `id` is typically an employee/card identifier, not a unique event ID. So the first scan (IN) and the second scan (OUT) for the same person both send the same `id`, with different `authDateTime`.

2. **Single-column PRIMARY KEY (id)**  
   With `PRIMARY KEY (id)`, the first INSERT succeeds. The second INSERT (same `id`, new `authDateTime`) fails with **duplicate key** because `id` is already in the table.

3. **IVMS treats insert error as connection failure**  
   Many clients, including iVMS-4200, do not cleanly separate “statement error” from “connection lost.” On duplicate key (or other SQL error), the client may close the socket and show “disconnected.”

4. **Second log never stored**  
   After “reconnect,” the client may not retry the failed insert, or the retry may be dropped. So the second attendance log (OUT) is never written.

**Fix (applied in this project):**

- **Composite PRIMARY KEY (id, authDateTime)** so each (person, time) is one row. First and second (and later) scans all succeed; each gets a row with correct direction (IN/OUT).
- **MySQL timeouts** in `custom.cnf` (`wait_timeout`, `interactive_timeout`) so the server does not close idle connections between scans (stable connection).

Reference: [The Console Handshake — Validating Hikvision iVMS-4200 SQL Sync](https://kapothi.com/the-console-handshake-validating-hikvision-ivms-4200-sql-sync/) (Kapothi Tech Blog), which documents the same duplicate-key behaviour and the composite-key fix for SQL Server; the same logic applies to MySQL.

---

## Why schema mismatch or constraint failure causes IVMS to disconnect

1. **Insert failure**  
   When the table rejects the payload (wrong type for `id`, NOT NULL violation, or **duplicate key**), MySQL returns an error to the client (IVMS).

2. **Client treats error as connection failure**  
   IVMS may close the socket and report “disconnected” instead of only reporting an insert error.

3. **Result**  
   You see: disconnect on second scan, second log not stored. The root cause is the **first** failing insert (e.g. duplicate key on second scan), not the reconnect itself.

**Fix on the database side:**

- Use **composite PK (id, authDateTime)** so every scan inserts a new row.
- Use a **permissive schema** (VARCHAR for text, DATETIME for time, DEFAULTs).
- Use **defensive inserts** (INSERT IGNORE or ON DUPLICATE KEY UPDATE) if you need to tolerate duplicate (id, authDateTime).
- Use **insert logging** (`attendance_insert_log` + trigger) to inspect attempts.
- Use **longer timeouts** in `custom.cnf` so the connection is not closed between scans.

---

## Files

| File | Purpose |
|------|---------|
| `01-attendance.sql` | Corrected schema (composite PK) + log table + trigger (fresh installs). |
| `custom.cnf` | MySQL timeouts for stable connection (wait_timeout, interactive_timeout). |
| `03-defensive-insert-examples.sql` | INSERT IGNORE / ON DUPLICATE KEY UPDATE examples + `SP_Attendance_Insert`. |
| `04-migrate-attendance-schema.sql` | One-time migration from old table to corrected schema with composite PK. Run if your database still has the old schema. |

In iVMS-4200 Third-Party Database, map fields to:

- **id** (employee/card/record identifier from IVMS; same for each scan by that person)
- **authDateTime** (event time as DATETIME)
- **authDate**, **authTime**, **personName**, **cardNo**, **direction**, **deviceName**, **deviceSerNum**
