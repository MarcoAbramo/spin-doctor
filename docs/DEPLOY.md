# Deployment

Production runs as four containers from `docker-compose.prod.yml` on one VPS:

| Service | Image | What |
|---|---|---|
| `web` | `ghcr.io/<owner>/spin-doctor-web` | Caddy: HTTPS (Let's Encrypt), the static client, `/api` → server |
| `server` | `ghcr.io/<owner>/spin-doctor-server` | Fastify API; runs the DB migrations on start |
| `db` | `postgres:17-alpine` | data in the `pgdata` volume |
| `backup` | `postgres:17-alpine` | `deploy/backup.sh`: a gzipped `pg_dump` into `./backups` every day, kept 14 days |

## How a release reaches the server

1. Merging to `main` makes release-please open/update a release PR.
2. Merging the release PR creates the tag and GitHub release, then calls the **deploy**
   workflow (`.github/workflows/deploy.yml`).
3. `deploy` builds both images, pushes them to GHCR as `:<tag>` and `:latest`, copies
   `docker-compose.prod.yml` and `deploy/backup.sh` to the VPS and runs
   `docker compose pull && up -d` there, then checks `$PUBLIC_URL/api/health`.

Pushing a `v*` tag by hand or *Actions → deploy → Run workflow* (any tag or branch) does
the same. **Rollback** = run the workflow with the previous tag.

Without the secrets below the images are still published; only the rollout is skipped.

## One-time setup

### VPS
```sh
# Docker Engine + compose plugin, then:
sudo mkdir -p /opt/spin-doctor && sudo chown "$USER" /opt/spin-doctor
cd /opt/spin-doctor
curl -fsSLO https://raw.githubusercontent.com/MarcoAbramo/spin-doctor/main/.env.example
mv .env.example .env   # set DOMAIN, ACME_EMAIL, passwords, DATABASE_URL, CORS_ORIGIN
```
Point the domain's A/AAAA records at the VPS and open ports 80 and 443 (TCP) and 443 (UDP).

GHCR packages are private by default. Either make both packages public
(*GitHub → Packages → spin-doctor-web / -server → Package settings → Change visibility*)
or log the VPS in once with a token that has `read:packages`:
```sh
echo "$TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
```

A deploy user that may run Docker, with its own SSH key:
```sh
ssh-keygen -t ed25519 -f deploy_key -N ''        # on your machine
# append deploy_key.pub to ~deploy/.ssh/authorized_keys on the VPS
ssh-keyscan -t ed25519 your.vps.example           # → DEPLOY_KNOWN_HOSTS
```

### GitHub
*Settings → Environments → New environment* `production` (optionally with required
reviewers), then:

| Kind | Name | Value |
|---|---|---|
| secret | `DEPLOY_HOST` | VPS host name or IP |
| secret | `DEPLOY_USER` | the deploy user |
| secret | `DEPLOY_SSH_KEY` | content of `deploy_key` (private key) |
| secret | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan` |
| variable | `DEPLOY_PATH` | `/opt/spin-doctor` (default) |
| variable | `PUBLIC_URL` | `https://your.domain` (enables the health check) |

Secrets live only in that environment, never in the repository or the workflow file.

## Backups

- Written to `/opt/spin-doctor/backups/spin-<UTC time>.sql.gz`, one per day
  (`BACKUP_INTERVAL_SEC`), older than `BACKUP_KEEP_DAYS` (14) are deleted.
- They sit on the same disk as the database: copy them off the box regularly, e.g.
  `rsync -a deploy@your.vps:/opt/spin-doctor/backups/ ./spin-backups/`.
- Check: `docker compose -f docker-compose.prod.yml logs backup`.

### Restore
```sh
cd /opt/spin-doctor
docker compose -f docker-compose.prod.yml stop server           # no writes during restore
gunzip -c backups/spin-2026-09-28T030000Z.sql.gz \
  | docker compose -f docker-compose.prod.yml exec -T db \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1
docker compose -f docker-compose.prod.yml start server
```
The dumps are made with `--clean --if-exists`, so restoring replaces the existing tables.
CI proves this on every change to the backup setup (`.github/workflows/backup-test.yml`:
write a row → dump → drop the table → restore → the row is back).

## Build on the box instead
`docker compose -f docker-compose.prod.yml up -d --build` builds both images from a
checkout (slow on small VPS; the workflow is preferred).
