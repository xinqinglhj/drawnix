# Server Deployment Guide (Minimal Upload)

Since you have already built the project locally (generating the `dist` folder), you can use the "Pre-built" deployment strategy to minimize what needs to be uploaded to the server.

## 1. Prepare Files
Create a folder on your server (e.g., `/opt/drawnix`) and upload **only** the following files and folders from your local project:

1.  **`dist/`**  
    (The entire folder containing `apps/web`. This is your built frontend.)
2.  **`apps/server/`**  
    (The source code for the backend.)
3.  **`Dockerfile.deploy`**  
    (The new optimized Dockerfile.)
4.  **`docker-compose.deploy.yml`**  
    (The deployment orchestration file.)

> **Note**: Do NOT upload `node_modules`, `.git`, or the root `packages/` folder.

## 2. Directory Structure on Server
Ensure your server directory looks like this:

```text
/opt/drawnix/
├── apps/
│   └── server/
│       ├── package.json
│       └── src/
├── dist/
│   └── apps/
│       └── web/
├── Dockerfile.deploy
└── docker-compose.deploy.yml
```

## 3. Start the Application
Run the following command in the server directory:

```bash
# -f specifies the deployment compose file
# -d runs in detached mode (background)
docker-compose -f docker-compose.deploy.yml up --build -d
```

## 4. Verify
Access your server: `http://<your-server-ip>:3000`

---
## Why this is minimal?
- You are **skipping** the upload of source code for the frontend (`packages/`, `apps/web/`).
- You are **skipping** the `npm install` and build process for the frontend on the server (saving CPU/RAM).
- You are only uploading the final compressed assets and the lightweight backend code.

## 5. Troubleshooting

### Docker Pull Timeout / Connection Error
If you see an error like `Get https://registry-1.docker.io/v2/: net/http: request canceled`, it means your server cannot connect to Docker Hub. This is common in some network environments.

**Solution**: Configure a Docker Registry Mirror.

1.  Edit or create `/etc/docker/daemon.json`:
    ```bash
    sudo vim /etc/docker/daemon.json
    ```
2.  Add the following content (using a reliable mirror source):
    ```json
    {
      "registry-mirrors": [
        "https://docker.m.daocloud.io",
        "https://huecker.io",
        "https://dockerhub.timeweb.cloud", 
        "https://noohub.ru"
      ]
    }
    ```
3.  Restart Docker:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    ```
4.  Retry deployment:
    ```bash
    docker-compose -f docker-compose.deploy.yml up --build -d
    ```

## 6. Nginx Deployment (Advanced / High Performance)

If you want to use **Nginx** (perhaps you already have it installed or want better performance for static files), use the `docker-compose.nginx.yml` configuration.

### How it works:
- **Nginx**: Directly serves the frontend files (`dist/`) on port **80**.
- **Node.js**: Runs in the background (port 3000 internally), handling only `/api` requests.
- **Proxy**: Nginx forwards any request starting with `/api` to the Node.js backend.

### Setup:
1.  Ensure you have `nginx.conf` and `docker-compose.nginx.yml` uploaded.
2.  Run:
    ```bash
    docker-compose -f docker-compose.nginx.yml up --build -d
    ```
3.  Access: `http://<your-server-ip>` (Port 80)
