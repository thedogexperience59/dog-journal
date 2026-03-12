# 🐾 Guide de Déploiement — Mon Journal de Bord
## The Dog Experience

---

## VUE D'ENSEMBLE

L'application utilise :
- **React** → interface utilisateur (front-end)
- **Supabase** → base de données en ligne GRATUITE (pas besoin de serveur)
- **Netlify** → hébergement web GRATUIT en quelques clics

---

## ÉTAPE 1 — Créer votre base de données Supabase (5 min)

### 1.1 Créer un compte
1. Allez sur **https://supabase.com**
2. Cliquez **"Start your project"**
3. Inscrivez-vous avec GitHub ou votre email

### 1.2 Créer un projet
1. Cliquez **"New Project"**
2. Donnez-lui un nom : `dog-journal`
3. Choisissez un mot de passe (notez-le quelque part)
4. Région : **West EU (Ireland)** (la plus proche de la France)
5. Cliquez **"Create new project"** → attendez ~2 minutes

### 1.3 Créer la table
1. Dans le menu de gauche, cliquez **"SQL Editor"**
2. Cliquez **"New query"**
3. Copiez-collez ce code SQL et cliquez **"Run"** :

```sql
create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null,
  dog_name text not null,
  date date not null,
  emotion_home text,
  emotion_outside text,
  no_walk boolean default false,
  stimuli integer default 0,
  triggers integer default 0,
  barks integer default 0,
  notes text
);

-- Autoriser l'accès public (lecture + écriture)
alter table journal_entries enable row level security;

create policy "Public access" on journal_entries
  for all using (true) with check (true);
```

### 1.4 Récupérer vos clés API
1. Dans le menu de gauche, cliquez **"Project Settings"** (icône engrenage)
2. Cliquez **"API"**
3. Notez ces deux valeurs :
   - **Project URL** → ressemble à `https://abcdefgh.supabase.co`
   - **anon public** key → une longue chaîne de caractères

---

## ÉTAPE 2 — Configurer le code (2 min)

Ouvrez le fichier `App.jsx` et modifiez les 2 lignes en haut du fichier :

```javascript
// AVANT (lignes 7-8) :
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

// APRÈS (remplacez par VOS valeurs) :
const SUPABASE_URL = "https://abcdefgh.supabase.co";   // votre URL
const SUPABASE_ANON_KEY = "eyJhbGc...";                // votre clé anon
```

---

## ÉTAPE 3 — Ajouter le logo (1 min)

1. Renommez votre logo en **`logo.png`**
2. Placez-le dans le dossier **`public/`** du projet

---

## ÉTAPE 4 — Déployer sur Netlify (5 min)

### Option A — Via GitHub (recommandé, mises à jour automatiques)

1. Créez un compte sur **https://github.com** (gratuit)
2. Créez un nouveau repository appelé `dog-journal`
3. Uploadez tous les fichiers du projet
4. Allez sur **https://netlify.com** → créez un compte gratuit
5. Cliquez **"Add new site"** → **"Import an existing project"**
6. Connectez GitHub → sélectionnez `dog-journal`
7. Build settings :
   - **Build command** : `npm run build`
   - **Publish directory** : `build`
8. Cliquez **"Deploy site"**
9. Après 2-3 minutes → votre app est en ligne ! 🎉

### Option B — Upload direct (plus simple)

1. Depuis le dossier du projet, ouvrez un terminal et tapez :
   ```
   npm install
   npm run build
   ```
2. Un dossier `build/` est créé
3. Allez sur **https://netlify.com** → créez un compte
4. Sur le tableau de bord, **glissez-déposez** le dossier `build/` dans la zone indiquée
5. Votre app est en ligne immédiatement ! 🎉

---

## ÉTAPE 5 — Personnaliser votre URL (optionnel)

Sur Netlify :
1. **Site settings** → **Domain management**
2. Cliquez **"Options"** → **"Edit site name"**
3. Choisissez par exemple : `journal-thedogexperience.netlify.app`

---

## RÉCAPITULATIF DES ACCÈS

| Qui | URL | Accès |
|-----|-----|-------|
| Vos clients | `https://votre-site.netlify.app` | Page Journal (onglet 🐾) |
| Vous | `https://votre-site.netlify.app` | Onglet 🔒 Admin → mot de passe : `qci35rd7` |

---

## FONCTIONNEMENT DE L'APP

### Côté client :
1. Le client entre son prénom + nom du chien
2. Il saisit son état émotionnel (maison + extérieur)
3. Il coche "Mise au vert" si pas de balade
4. Il incrémente les compteurs (stimuli, déclenchements, aboiements)
5. Il ajoute des notes
6. Il enregistre → peut voir sa courbe de progression

### Côté admin :
1. Cliquez sur l'onglet 🔒 Admin
2. Entrez le mot de passe : `qci35rd7`
3. Voyez la liste de tous les chiens
4. Cliquez sur un chien → graphiques + historique complet

---

## CHANGER LE MOT DE PASSE ADMIN

Dans `App.jsx`, ligne 18 :
```javascript
const ADMIN_PASSWORD = "qci35rd7"; // ← Changez ici
```

---

## COÛTS

| Service | Coût |
|---------|------|
| Supabase | **Gratuit** jusqu'à 500 MB de données |
| Netlify | **Gratuit** jusqu'à 100 GB de bande passante/mois |
| Domaine personnalisé | ~10€/an (optionnel) |

Pour votre usage (suivi comportemental), le plan gratuit est largement suffisant pour des années !

---

## BESOIN D'AIDE ?

Si vous êtes bloqué à une étape, cherchez sur YouTube :
- `"Supabase tutorial français"`
- `"Déployer React Netlify"`

Ou confiez cette étape technique à un développeur freelance (1-2h de travail).
