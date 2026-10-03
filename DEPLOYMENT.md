# 🚀 Free Cloud Deployment Guide for BillEase Pro

This guide explains how to deploy the entire BillEase Pro stack (Frontend, Backend API, and Database) **100% free of cost**.

---

## Architecture Overview

```mermaid
graph LR
    Browser[Client Browser / POS Terminal] -->|HTTPS| Vercel[Frontend on Vercel<br/>(100% Free CDN)]
    Vercel -->|REST API| Render[Backend API on Render.com<br/>(Free Docker Web Service)]
    Render -->|EF Core Connection| DB[Database: Azure SQL Free Tier / Oracle Cloud<br/>(100% Free Cloud DB)]
```

---

## Part 1: Free Database Setup

You have two primary free options for SQL Server:

### Option A: Microsoft Azure SQL Database (Recommended - Permanent Free Offer)
1. Sign up for a free Azure account at [azure.microsoft.com/free](https://azure.microsoft.com/free/).
2. In the Azure Portal, create an **Azure SQL Database**.
3. Under **Compute + storage**, select the **Free limit offer** (provides **32 GB storage** and **100,000 vCore seconds/month** free).
4. In the database networking tab:
   - Allow Azure services to access server: **Yes**
   - Add your client IP to firewall rules so you can manage it if needed.
5. Copy your connection string:
   ```text
   Server=tcp:<your-server-name>.database.windows.net,1433;Initial Catalog=BillEaseProDb;Persist Security Info=False;User ID=<your-username>;Password=<your-password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

### Option B: Oracle Cloud Always Free VM
1. Create an [Oracle Cloud Always Free account](https://www.oracle.com/cloud/free/).
2. Provision an **Ampere A1 Compute VM** (up to 4 ARM CPUs and 24 GB RAM free for life).
3. Run SQL Server in Docker with one command:
   ```bash
   docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourPassword@123" \
      -p 1433:1433 --name sqlserver --restart always \
      -d mcr.microsoft.com/azure-sql-edge
   ```

---

## Part 2: Backend API Deployment on Render.com (100% Free)

The project includes a ready-to-use [`Dockerfile`](file:///c:/Dev/Billing%20Sw/Dockerfile) and [`render.yaml`](file:///c:/Dev/Billing%20Sw/render.yaml) for automated container deployment.

1. Push your repository to GitHub.
2. Sign up at [render.com](https://render.com) using your GitHub account.
3. Click **New** → **Web Service** → Select your repository (`Billing-Sw`).
4. Configuration:
   - **Name**: `billease-pro-api`
   - **Environment**: `Docker`
   - **Region**: Any (e.g. Oregon / Frankfurt)
   - **Branch**: `main`
   - **Plan**: **Free** ($0/month)
5. Under **Environment Variables**, add:
   - `ConnectionStrings__DefaultConnection`: *<Your Azure SQL / Database Connection String>*
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `Database__AutoMigrate`: `true` *(Automatically applies EF Core migrations and seeds initial data on first boot!)*
6. Click **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, for example:
   ```text
   https://billease-pro-api.onrender.com
   ```
   You can verify it by opening `https://billease-pro-api.onrender.com/swagger`.

---

## Part 3: Frontend Deployment on Vercel (100% Free)

The frontend is already configured with [`web/billease-pro-web/vercel.json`](file:///c:/Dev/Billing%20Sw/web/billease-pro-web/vercel.json) to handle Single Page Application (SPA) routing.

1. Sign up at [vercel.com](https://vercel.com) using GitHub.
2. Click **Add New...** → **Project** → Import your repository.
3. In the project setup screen:
   - **Root Directory**: Click *Edit* and select `web/billease-pro-web`.
   - **Framework Preset**: `Angular`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/billease-pro-web/browser`
4. Expand **Environment Variables** (Optional, or use default):
   - You can point to your backend API by adding:
     - Key: `NG_APP_API_URL` (or update `web/billease-pro-web/src/environments/environment.prod.ts`)
5. Click **Deploy**.
6. Vercel will build and assign you a free HTTPS URL (e.g., `https://billing-sw.vercel.app`).

---

## Live API URL Configuration (No Rebuild Required!)

The Angular frontend includes a dynamic runtime fallback. If your frontend is on Vercel and your backend is on Render:

1. Open your Vercel deployment in your browser.
2. Open Browser DevTools (<kbd>F12</kbd> or <kbd>Ctrl+Shift+I</kbd>) → **Console**.
3. Run this single command to connect to your live backend:
   ```javascript
   localStorage.setItem('billease_api_url', 'https://billease-pro-api.onrender.com/api/v1');
   location.reload();
   ```
4. All future requests will immediately route to your live backend API!

---

## Seed Accounts for Testing

Once deployed and initialized, you can log in immediately using:

| Email | Password | Role |
| :--- | :--- | :--- |
| `superadmin@billeasepro.local` | `Password@123` | SuperAdmin |
| `admin@billeasepro.local` | `Password@123` | Admin |
| `operator@billeasepro.local` | `Password@123` | Operator (Cashier) |
