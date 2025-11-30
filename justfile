# Default recipe - show available commands
default:
    @just --list

# Start everything (docker + dev server)
up:
    docker-compose up -d

# Stop docker containers
down:
    docker-compose down

# Restart everything
restart:
    docker-compose down && docker-compose up -d && npm run dev

# View docker logs
logs:
    docker-compose logs -f

# Database commands
db-generate:
    npx dotenv -e .env -- prisma generate

db-migrate name="":
    npx dotenv -e .env -- prisma migrate dev {{ if name != "" { "--name " + name } else { "" } }}

db-push:
    npx dotenv -e .env -- prisma db push

db-deploy:
    npx dotenv -e .env -- prisma migrate deploy && npx dotenv -e .env -- prisma generate

db-reset:
    npx dotenv -e .env -- prisma migrate reset

db-studio:
    npx dotenv -e .env -- prisma studio

db-seed:
    npx dotenv -e .env -- tsx prisma/seed.ts

db-clear:
    npx dotenv -e .env -- tsx prisma/clear.ts

# Build the app
build:
    npm run build

# Run linting
lint:
    npm run lint

# Update user password by email
# Usage: just update-password user@example.com newpassword
update-password email password:
    node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcryptjs'); const prisma = new PrismaClient(); (async () => { try { const hash = await bcrypt.hash('{{password}}', 10); const user = await prisma.user.update({ where: { email: '{{email}}' }, data: { password: hash } }); console.log('Password updated for:', user.email); } catch (e) { console.error('Error:', e.message); } finally { await prisma.\$disconnect(); } })();"
