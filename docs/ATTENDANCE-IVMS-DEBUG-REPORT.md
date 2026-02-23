# Attendance "Jack Williams" / IVMS Disconnect – Debug Report

**Date:** 2026-02-23  
**Issue:** When a user scans their fingerprint a second time, IVMS-4200 disconnects from the online MySQL database. After reconnect, wrong/non-existent data (e.g. "Jack Williams", direction OUT, wrong metadata) is written. No person named "Jack Williams" exists in IVMS.

---

## 1. Conclusion: Cause is not in this codebase

**The XTrimFitGym API does not write to the `attendance` table.**

- All attendance-related code only **reads** from MySQL (`SELECT` in `attendance-resolvers.ts` and `attendance-monitor.ts`).
- There are no `INSERT`/`UPDATE`/`DELETE` into `attendance` in the API.
- The API does not connect to IVMS-4200 or push any data to it.

So the bad records ("Jack Williams", OUT, wrong metadata) are **written by IVMS-4200** when it reconnects to MySQL, not by this application. The disconnect and the bad data on reconnect are an **IVMS-4200 / MySQL integration** issue.

---

## 2. What was found in the codebase

- **Source (`src/`):** No reference to "Jack Williams". No attendance-validation module. Resolvers and attendance-monitor only read from `attendance` and return data as stored.
- **Build output (`dist/`):** An older build referenced `attendance-validation.js` and filtered attendance to **registered users only** (and corrected `personName` from `cardNo`). That was a **mitigation** so ghost/corrupt records would not appear in the app; it did not stop IVMS from writing those records to MySQL. There is no corresponding `attendance-validation.ts` in `src/`, so that logic is not in the current source.

---

## 3. IVMS-4200 / MySQL documentation and recommendations

Public docs do not describe the exact scenario (second scan → disconnect → reconnect → "Jack Williams" / wrong data). The following is based on general IVMS–MySQL integration and connection issues.

### 3.1 Connection and stability

- **Third-party MySQL:** Users often see "Connection Failed" when IVMS-4200 connects to an external/third-party MySQL server. This suggests the client is sensitive to connection handling and reconnection.
- **MySQL version:** Some reports indicate **MySQL 5.0.45** works with IVMS-4200; newer or different versions may behave differently (timeouts, reconnects, encoding).
- **Error codes (Hikvision):**  
  - 7: Failed to connect / device offline / connection timeout (network, IP, ports).  
  - 9/10: Data reception failure / timeout (network or bandwidth).

So the “disconnect on second scan” may be triggered by:

- Connection timeout or keep-alive issues between IVMS and MySQL.
- How IVMS handles a second write (or second event) in quick succession (e.g. closing/reopening the connection and then pushing cached or default data on reconnect).

### 3.2 References

- **Setting up Time and Attendance in iVMS-4200**  
  https://supportusa.hikvision.com/support/solutions/articles/17000111224-setting-up-time-and-attendance-in-ivms-4200  

- **iVMS-4200 – third-party database “Connection Failed”**  
  https://www.use-ip.co.uk/forum/threads/issues-with-connecting-to-a-third-party-database-in-hikvisions-ivms-4200-software-connection-failed-error.10901/  

- **iVMS-4200 AC Client User Manual** (person/event configuration, device management)  
  Hikvision download page: ivms4200-series → software download (e.g. 4200-3-11-1-11) → AC Client User Manual.

- **iVMS-4200 Client Software – Error codes**  
  Hikvision technical bulletin: `ivms-4200_client_software_error_codes_list.pdf` (e.g. error 7, 9, 10).

- **HikCentral:** If IVMS–MySQL continues to be unstable, Hikvision positions HikCentral as having more straightforward database integration (including MySQL/PostgreSQL).

### 3.3 Recommended actions (IVMS / MySQL side)

1. **MySQL server**
   - Confirm MySQL version; if possible, test with a version known to work with IVMS (e.g. 5.0.45) in a lab.
   - Check `wait_timeout`, `interactive_timeout`, and connection limits so the server does not drop idle connections in a way that triggers IVMS reconnects during the second scan.
   - Ensure character set/collation and table schema match what IVMS expects (e.g. `attendance` table structure and column types).

2. **IVMS-4200 3.13.1.5**
   - In **Database** or **Third-party database** settings, verify:
     - Host, port, user, password, database name.
     - Any “test connection” or “keep connection alive” options.
   - Check whether there is a **demo/sample data** or **default user** option that could be written on (re)connect; disable it if present.
   - Look for **event export / attendance push** settings (e.g. “export to database on connect/reconnect”) and see if reconnection triggers an extra or incorrect export.

3. **Network**
   - Ensure stable connectivity between the machine running IVMS and the MySQL server (no firewall dropping long-lived connections, no NAT timeouts that could coincide with the second scan).

4. **Hikvision support**
   - Request specific guidance for **iVMS-4200 3.13.1.5**: “On second fingerprint scan the client disconnects from MySQL; after reconnect, incorrect attendance records (wrong person name e.g. ‘Jack Williams’, direction OUT, wrong metadata) are written. No such person exists in IVMS.” Ask for:
     - Known issues and patches.
     - Recommended MySQL version and connection/export settings.
     - Whether a “default/demo user” or cached event is written on reconnect.

---

## 4. Optional mitigation in this app (if you choose to re-add it)

If you want the web app to **hide** ghost/corrupt records even when they remain in MySQL (e.g. until IVMS or MySQL is fixed), you can re-introduce in the API:

- A module that defines “valid” attendance identities (e.g. from your user DB: `cardNo` / `attendanceId` and allowed `personName` variants).
- In `getAttendanceRecords` (and optionally in the attendance monitor when publishing new records), filter rows so only records matching those identities are returned (and optionally replace `personName` with the display name from your user DB when `cardNo` matches).

That would be a **display-side filter** only; it would not stop IVMS from writing "Jack Williams" or other bad data into MySQL.

---

---

## 5. Root cause and fix applied (second scan not stored)

**Observed:** When a user scans their fingerprint a second time, IVMS disconnects from MySQL; after reconnect the **second attendance log is not stored** (so OUT is missing). This repeats for any user who scans more than once.

**Root cause (see also [Kapothi Tech Blog](https://kapothi.com/the-console-handshake-validating-hikvision-ivms-4200-sql-sync/)):**

- iVMS sends the **same `id`** (employee/card identifier) for every scan by that person, not a unique ID per event.
- The table had **PRIMARY KEY (id)** only. The first INSERT (first scan) succeeds; the second INSERT (same `id`, new `authDateTime`) **fails with duplicate key**.
- IVMS treats the insert error as a connection failure → disconnects → second log is never stored.

**Fix applied in this project:**

1. **Composite PRIMARY KEY (id, authDateTime)** in `railway-mysql/01-attendance.sql` and `04-migrate-attendance-schema.sql`. Each (person, time) is one row; first scan (IN) and second scan (OUT) both insert successfully.
2. **MySQL timeouts** in `railway-mysql/custom.cnf` (`wait_timeout`, `interactive_timeout` = 86400 s) so the server does not close idle connections between scans.

**Next steps:**

- If the DB already exists with the old schema, run **`railway-mysql/04-migrate-attendance-schema.sql`** once (after backup).
- Restart/redeploy MySQL so `custom.cnf` is applied.
- Full schema and rationale: **`railway-mysql/ATTENDANCE-SCHEMA.md`**.

---

**Summary:** The wrong data is written by IVMS-4200 when it reconnects to MySQL; the API only reads. The “second scan → disconnect → second log not stored” issue was fixed by changing the attendance table to a **composite PRIMARY KEY (id, authDateTime)** and adding MySQL timeouts. See ATTENDANCE-SCHEMA.md and the IVMS/MySQL steps above for details.
