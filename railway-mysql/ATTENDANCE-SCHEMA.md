# Attendance table schema (iVMS-4200 + MySQL)

## Corrected `CREATE TABLE` (01-attendance.sql)

- **id** `VARCHAR(50)` **PRIMARY KEY** (not INT; IVMS can send string event IDs).
- **authDateTime** `DATETIME` **NOT NULL** (canonical event time; no numeric-only type).
- All text fields **VARCHAR**: personName, cardNo, direction, deviceName, deviceSerNum; authDate/authTime kept as VARCHAR for IVMS mapping.
- **No strict constraints**: DEFAULT '' or NULL so normal inserts do not fail.
- **UNIQUE** only on id (PK implies uniqueness).
- **Charset** `utf8mb4` (table and database).
- **Insert logging**: `attendance_insert_log` + `BEFORE INSERT` trigger log every attempt (including attempts that later fail on duplicate key).

Defensive options (see `03-defensive-insert-examples.sql`):

- **INSERT IGNORE** – duplicate id is skipped; no error, connection stays up.
- **ON DUPLICATE KEY UPDATE** – overwrite row on duplicate id.
- **Stored procedure** `SP_Attendance_Insert` – logs and uses INSERT IGNORE (use from proxy/middleware if IVMS cannot call it).

---

## Why schema mismatch or constraint failure causes IVMS to disconnect and retry stale data

1. **Insert failure**  
   When the table uses types or constraints that reject IVMS's payload (e.g. INT PK with overflow, NOT NULL on an empty string, wrong type for a column), MySQL returns an error to the client (IVMS).

2. **Client treats error as connection failure**  
   Many clients, including iVMS-4200, do not always distinguish "statement error" from "connection lost." On error they may close the socket and report "disconnected."

3. **Buffered / retry behaviour**  
   After "reconnecting," the client may:
   - Retry the same failed insert again, and/or  
   - Flush a buffer of events that was built before or during the disconnect.  
   That can mean:
   - The same event (e.g. second scan) is sent again.
   - Stale or default data (e.g. wrong person name like "Jack Williams", direction OUT, wrong metadata) that was in the buffer or from a bad internal state is sent.

4. **Result**  
   You see: disconnect on second scan → reconnect → one or more wrong/non-existent rows (e.g. "Jack Williams", OUT) written. The root cause is the **first** insert failing (schema/constraint), not the reconnect itself.

**Fix on the database side:**

- Use a **permissive schema** (VARCHAR for text, DATETIME for time, VARCHAR(50) PK, DEFAULTs, no unnecessary NOT NULL).
- Use **defensive inserts** (INSERT IGNORE or ON DUPLICATE KEY UPDATE, or a procedure that does so) so duplicate or retry inserts do not cause another error and another disconnect.
- Use **insert logging** (`attendance_insert_log` + trigger) to see every attempt and spot duplicates/corrupt payloads.

---

## Files

| File | Purpose |
|------|---------|
| `01-attendance.sql` | Corrected schema + log table + trigger (fresh installs). |
| `03-defensive-insert-examples.sql` | INSERT IGNORE / ON DUPLICATE KEY UPDATE examples + `SP_Attendance_Insert`. |
| `04-migrate-attendance-schema.sql` | One-time migration from old table (id INT AUTO_INCREMENT, authDateTime VARCHAR) to corrected (id VARCHAR(50) PK, authDateTime DATETIME). **Run this before using the updated API** if your database still has the old schema. |

In iVMS-4200 Third-Party Database, map fields to:

- **id** (Event ID / primary key, VARCHAR 50)
- **authDateTime** (event time as DATETIME)
- **authDate**, **authTime**, **personName**, **cardNo**, **direction**, **deviceName**, **deviceSerNum**
