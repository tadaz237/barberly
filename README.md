# Barberly

Une base MVP full-stack construite avec Next.js App Router pour présenter des services de coiffure et permettre l'ajout de nouveaux services depuis un espace admin simple.

## Objectif du projet

Ce projet illustre une marketplace légère de prestations beauté / coiffure à domicile avec :

- une page publique orientée découverte des services ;
- une page admin pour ajouter des prestations ;
- une API interne Next.js pour lire et créer des services ;
- une base de documentation DevOps pour préparer la conteneurisation et le déploiement.

## Stack technique

- Next.js 16 + App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui déjà présent dans le projet
- Stockage en mémoire côté serveur pour le MVP

## Fonctionnalités MVP

- consultation de la liste des services via `GET /api/services`
- ajout d'un service via `POST /api/services`
- données seedées pour démarrer rapidement
- structure Docker
- manifeste Kubernetes d'exemple
- workflow GitHub Actions pour build et publication d'image

## Architecture MVP

```text
app/
  page.tsx                -> page publique
  admin/page.tsx          -> espace admin
  api/services/route.ts   -> API GET/POST des services

src/
  lib/services-store.ts   -> stockage mémoire + type ServiceItem

k8s/
  frontend-deployment.yaml
  frontend-service.yaml

.github/workflows/
  deploy.yml
```

## API

### Type partagé

```ts
type ServiceItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  location: string;
  description: string;
  featured?: boolean;
};
```

### GET `/api/services`

Réponse :

```json
{
  "services": [
    {
      "id": "srv-brushing-premium",
      "name": "Brushing premium à domicile",
      "category": "Coiffure femme",
      "price": 45,
      "duration": 60,
      "location": "Paris et petite couronne",
      "description": "Un brushing soigné réalisé à domicile pour une coiffure nette, brillante et durable.",
      "featured": true
    }
  ]
}
```

### POST `/api/services`

Payload attendu :

```json
{
  "name": "Chignon événement",
  "category": "Coiffure femme",
  "price": 80,
  "duration": 90,
  "location": "Bordeaux",
  "description": "Coiffure élégante pour mariage, soirée ou shooting.",
  "featured": true
}
```

Réponse :

```json
{
  "service": {
    "id": "chignon-evenement-1712345678901",
    "name": "Chignon événement",
    "category": "Coiffure femme",
    "price": 80,
    "duration": 90,
    "location": "Bordeaux",
    "description": "Coiffure élégante pour mariage, soirée ou shooting.",
    "featured": true
  },
  "message": "Service ajouté avec succès."
}
```

## Lancement local

Installer les dépendances puis lancer le serveur de développement :

```bash
npm install
npm run dev
```

Application disponible ensuite sur `http://localhost:3000`.

## Stockage des données

Le stockage est volontairement simple pour ce MVP :

- données seedées dans `src/lib/services-store.ts`
- conservation en mémoire serveur
- aucun SGBD ni ORM
- les données ajoutées sont perdues à chaque redémarrage du serveur

Ce choix permet de livrer rapidement une démonstration cohérente sans ajouter de dépendances.

## Docker

### Build de l'image

```bash
docker build -t coiffure-mvp .
```

### Lancer avec Docker

```bash
docker run -p 3000:3000 coiffure-mvp
```

### Lancer avec Docker Compose

```bash
docker compose up --build
```

## Kubernetes

Deux manifestes d'exemple sont fournis :

- `k8s/frontend-deployment.yaml`
- `k8s/frontend-service.yaml`

Déploiement type :

```bash
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

> Pensez à remplacer l'image `ghcr.io/owner/coiffure-mvp:latest` par l'image réelle de votre registre.

## CI/CD

Le workflow GitHub Actions `.github/workflows/deploy.yml` :

1. récupère le code ;
2. installe Node.js ;
3. installe les dépendances ;
4. lance le build Next.js ;
5. construit et pousse une image Docker sur GHCR ;
6. prépare un point d'extension pour un vrai déploiement cloud/Kubernetes.

## Aperçu Cloud

Cette base peut être déployée de plusieurs façons :

- **Vercel** pour un déploiement Next.js rapide ;
- **Azure Container Apps** ou **Azure Kubernetes Service** ;
- **Google Cloud Run** ou **GKE** ;
- **AWS ECS/Fargate** ou **EKS** ;
- tout cluster Kubernetes compatible avec une image OCI.

## Limites du MVP

- stockage non persistant ;
- pas d'authentification admin ;
- validation volontairement minimale ;
- pas de pagination, recherche ou filtres avancés ;
- pas de réservation ni de paiement ;
- manifestes DevOps fournis comme base de travail, à adapter selon l'environnement cible.

## Évolutions recommandées

- ajouter une vraie base de données ;
- mettre en place une authentification sécurisée pour l'admin ;
- historiser les créations de services ;
- ajouter observabilité, logs structurés et métriques ;
- intégrer des environnements `staging` et `production` distincts.