# Backend Barberly — Postgres + Prisma

Le backend repose sur **Next.js (API routes + server actions) + Prisma 7 + PostgreSQL**.
Les données (utilisateurs, KYC, services, catalogues) sont désormais **persistées** en base
— fini le stockage en mémoire qui s'effaçait à chaque redémarrage.

## Démarrage (développement local)

1. **Lancer Docker Desktop** (l'app doit tourner, icône dans la barre des tâches).

2. **Démarrer la base Postgres** :
   ```bash
   docker compose up -d db
   ```
   Postgres écoute sur `localhost:5432` (user `barberly`, db `barberly`).

3. **Appliquer le schéma** (crée les tables, à faire une fois ou après chaque modif du schéma) :
   ```bash
   npm run db:migrate
   ```
   (la première fois, donne un nom à la migration, ex. `init`)

4. **(Optionnel) Charger des services de démo** :
   ```bash
   npm run db:seed
   ```

5. **Lancer l'app** :
   ```bash
   npm run dev
   ```

## Scripts utiles

| Script | Rôle |
|---|---|
| `npm run db:migrate` | Crée/applique une migration (`prisma migrate dev`) |
| `npm run db:seed` | Insère les services de démonstration |
| `npm run db:studio` | Ouvre Prisma Studio (interface visuelle de la DB) |
| `npm run db:generate` | Régénère le client Prisma (après modif du schéma) |

## Fichiers clés

- `prisma/schema.prisma` — modèles (User, Kyc, Service, Catalogue, CataloguePhoto)
- `prisma.config.ts` — config Prisma 7 (datasource + seed), charge `.env` via dotenv
- `src/lib/prisma.ts` — client Prisma singleton (adapter `pg`)
- `src/lib/users-store.ts` / `services-store.ts` / `catalogues-store.ts` — couche d'accès aux données (API conservée, désormais async/Prisma)
- `.env` — `DATABASE_URL` (lue par Prisma CLI **et** Next.js)

## Production (docker-compose complet)

```bash
docker compose up -d        # lance db + app
```
Dans le conteneur `app`, `DATABASE_URL` pointe sur `@db:5432` (réseau interne Docker).
Pense à appliquer les migrations en prod via `prisma migrate deploy`.

## Notes

- Les images (avatars, photos KYC, photos services/catalogues) sont stockées en base64
  dans la base pour le MVP. Étape suivante recommandée : passer à un stockage objet
  (S3 / Cloudinary) et ne garder que les URLs en base.
- Le client Prisma utilise le driver `@prisma/adapter-pg` (requis par Prisma 7).
