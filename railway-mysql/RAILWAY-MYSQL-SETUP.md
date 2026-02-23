# Step-by-Step: MySQL 5.5 on Railway for iVMS-4200

This runs a **MySQL 5.5** container on Railway with **SSL disabled** and legacy auth, matching compatibility for **iVMS-4200 Client 3.13.x** (documented to work with MySQL 5.0.45; 5.5 is the closest available in Docker). Your API (on Render) and iVMS both point to this database.

---

## Prerequisites

- A [Railway](https://railway.app) account (same one you use for the existing MySQL or a new project).
- This folder (`railway-mysql`) in a **GitHub repo** that Railway can access (e.g. push it to your XTrimFitGym-Api repo or a new repo).

---

## Part 1: Push the MySQL Docker files to GitHub

1. **Confirm the folder contents** (in your repo):
   - `railway-mysql/Dockerfile`
   - `railway-mysql/custom.cnf`
   - `railway-mysql/01-attendance.sql`
   - `railway-mysql/02-init-user.sh`

2. **Commit and push** to your GitHub repo (e.g. `XTrimFitGym-Api`):
   ```bash
   git add railway-mysql/
   git commit -m "Add Railway MySQL 5.5 Docker for iVMS compatibility"
   git push origin main
   ```

---

## Part 2: Create the MySQL 5.5 service on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard) and open your project (or create a new one).

2. **Add a new service**
   - Click **"+ New"** → **"Empty Service"** (or **"GitHub Repo"** if you prefer to connect the repo first).

3. **Connect the repo** (if you chose Empty Service):
   - Click the new service → **Settings** → **Source**.
   - Connect your GitHub account and select the repo that contains `railway-mysql`.
   - Set **Root Directory** to: `railway-mysql`  
     (so Railway uses only that folder and its Dockerfile).

4. **Configure build**
   - In the same service, go to **Settings** → **Build**.
   - **Builder**: set to **Dockerfile**.
   - **Dockerfile path**: leave default (e.g. `Dockerfile` when Root Directory is `railway-mysql`).

5. **Set environment variables**
   - In the service, open the **Variables** tab.
   - Add these (replace with your own secure values):

   | Variable              | Value (example)           | Required |
   | --------------------- | ------------------------- | -------- |
   | `MYSQL_ROOT_PASSWORD` | Your strong root password | Yes      |
   | `MYSQL_DATABASE`      | `railway`                 | Yes      |
   | `MYSQL_IVMS_PASSWORD` | Password for iVMS user    | Yes      |
   - **Important:** The init script creates user `ivms` with `MYSQL_IVMS_PASSWORD`. Use a strong password you’ll also enter in iVMS and (optionally) in Render.

6. **Deploy**
   - Save and let Railway **deploy** the service (or trigger **Deploy** from the **Deployments** tab).
   - Wait until the deployment is **Success** and the service is **Running**.
   - **If you had a previous MySQL 5.7 service:** This is a new stack (5.5). Use a new service or redeploy; the first run will create a fresh database and `attendance` table via the init scripts.

---

## Part 3: Expose MySQL on the public TCP proxy

1. Open the **MySQL 5.5 service** you just deployed.

2. Go to **Settings** (or **Variables** / **Networking**, depending on Railway’s UI).

3. Find **Networking** or **TCP Proxy**:
   - Enable **Public Networking** / **TCP Proxy** for this service.
   - Set the **port** to **3306** (the port MySQL listens on inside the container).

4. After saving, Railway will show:
   - A **TCP proxy hostname** (e.g. `xxx.proxy.rlwy.net`).
   - A **TCP proxy port** (e.g. `12345`).

5. **Note these down** (or copy from Variables if Railway injects them):
   - `RAILWAY_TCP_PROXY_DOMAIN` → e.g. `xxx.proxy.rlwy.net`
   - `RAILWAY_TCP_PROXY_PORT` → e.g. `12345`

6. **Get the numeric IP** (for iVMS “Server IP” if it only accepts IP):
   - In Command Prompt or PowerShell run:
     ```bash
     nslookup <RAILWAY_TCP_PROXY_DOMAIN>
     ```
   - Use the **Address** shown (e.g. `66.33.22.238`) as the Server IP in iVMS.

---

## Part 4: Configure iVMS-4200

1. Open iVMS-4200 → **Apply to Database** / **Third-party database** configuration.

2. Use these values:

   | Field             | Value                                                                         |
   | ----------------- | ----------------------------------------------------------------------------- |
   | Database Type     | MySQL                                                                         |
   | Server IP Address | Numeric IP from step 3.6 above (or the TCP proxy hostname if iVMS accepts it) |
   | Port              | The **TCP proxy port** from step 3.5 (e.g. `12345`), **not** 3306             |
   | Database Name     | `railway`                                                                     |
   | User Name         | `ivms`                                                                        |
   | User Password     | The value you set for `MYSQL_IVMS_PASSWORD`                                   |
   | Table Name        | `attendance`                                                                  |

3. Keep your **Table Field** mapping in iVMS to match the attendance table:
   - **id**, **authDateTime**, **authDate**, **authTime**, **direction**, **deviceName**, **deviceSerNum**, **personName**, **cardNo**

   See `railway-mysql/ATTENDANCE-SCHEMA.md` and `railway-mysql/03-defensive-insert-examples.sql` for schema details and defensive insert options (INSERT IGNORE / ON DUPLICATE KEY UPDATE) to avoid disconnect on duplicate or retry inserts.

4. Click **Save**. The connection should succeed because MySQL 5.7 uses **mysql_native_password** by default.

---

## Part 5: Point your Render API to this MySQL

1. In **Render** → your **API service** → **Environment**.

2. Set (or update) these variables to the **same** MySQL 5.5 instance:

   | Variable        | Value                                                                    |
   | --------------- | ------------------------------------------------------------------------ |
   | `MYSQLHOST`     | `RAILWAY_TCP_PROXY_DOMAIN` (e.g. `xxx.proxy.rlwy.net`) or its numeric IP |
   | `MYSQLPORT`     | `RAILWAY_TCP_PROXY_PORT` (e.g. `12345`)                                  |
   | `MYSQLUSER`     | `ivms`                                                                   |
   | `MYSQLPASSWORD` | Same as `MYSQL_IVMS_PASSWORD`                                            |
   | `MYSQLDATABASE` | `railway`                                                                |

3. **Redeploy** the API on Render so it uses the new env.

---

## Summary

- **Railway** runs **MySQL 5.5** in Docker (iVMS 3.13.x compatible; SSL disabled). Init creates the `railway` database, `attendance` table, and `ivms` user.
- **TCP Proxy** exposes that MySQL publicly; you use the proxy host/port (and optionally the resolved IP for iVMS).
- **iVMS** writes to this MySQL using `ivms` + the chosen password.
- **Render API** reads from the same MySQL using the same host, port, user, and database.

If iVMS still fails, confirm in iVMS: **Port** in iVMS is the **TCP proxy port**, not 3306. If your plan doesn’t show TCP Proxy for this service, use the same Docker setup on **Fly.io** or a **VPS** and expose 3306 there instead.
