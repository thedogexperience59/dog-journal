# 🐾 Documentation Technique — Mon Journal de Bord
## The Dog Experience — Guide de Maintenance
### Dernière mise à jour : Mars 2026

Ce fichier contient tout ce qu'il faut pour maintenir, dépanner et faire évoluer l'application.
En cas de bug complexe, joindre ce fichier dans une nouvelle discussion Claude.

---

## 1. ARCHITECTURE GÉNÉRALE

| Composant | Service | Détail |
|-----------|---------|--------|
| Front-end | Netlify | React app — https://suivithedogexperience.netlify.app |
| Base de données | Supabase | PostgreSQL — https://vfvtimkkwczagytnjtfn.supabase.co |
| Code source | GitHub | https://github.com/thedogexperience59/dog-journal |
| Logo | Imgur | https://i.imgur.com/rq4rDYi.png |

---

## 2. STRUCTURE COMPLÈTE DE LA BASE DE DONNÉES (5 tables)

### Table `journal_entries` — Journal quotidien
```sql
create table public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null,
  dog_name text not null,
  date date not null,
  emotion_home text,               -- serein | peu_tendu | stresse | anxieux
  emotion_outside text,            -- null si mise au vert
  no_walk boolean default false,
  stimuli integer default 0,       -- Éléments déclencheurs
  triggers integer default 0,      -- Déclenchements
  barks integer default 0,         -- Aboiements
  notes text
);
```

### Table `client_profiles` — Authentification clients
```sql
create table public.client_profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null,
  dog_name text not null,
  password text not null           -- Chiffré SHA-256
);
```

### Table `articles` — Ressources
```sql
create table public.articles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  category text,
  summary text,
  content text,
  image_url text,
  video_url text
);
```

### Table `appointments` — Rendez-vous
```sql
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null,
  dog_name text not null,
  date date not null,
  time text,
  location text,
  notes text
);
```

### Table `client_messages` — Messages personnalisés
```sql
create table public.client_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null,
  dog_name text not null,
  message text not null,
  article_id uuid,
  article_title text,
  read boolean default false
);
```

---

## 3. SCRIPT DE CRÉATION COMPLET (nouveau projet Supabase)

```sql
create table public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null, dog_name text not null,
  date date not null, emotion_home text, emotion_outside text,
  no_walk boolean default false, stimuli integer default 0,
  triggers integer default 0, barks integer default 0, notes text
);

create table public.client_profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null, dog_name text not null, password text not null
);

create table public.articles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null, category text, summary text,
  content text, image_url text, video_url text
);

create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null, dog_name text not null,
  date date not null, time text, location text, notes text
);

create table public.client_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  human_name text not null, dog_name text not null,
  message text not null, article_id uuid,
  article_title text, read boolean default false
);

alter table public.journal_entries enable row level security;
alter table public.client_profiles enable row level security;
alter table public.articles enable row level security;
alter table public.appointments enable row level security;
alter table public.client_messages enable row level security;

create policy "je_all" on public.journal_entries for all using (true) with check (true);
create policy "profiles_all" on public.client_profiles for all using (true) with check (true);
create policy "articles_all" on public.articles for all using (true) with check (true);
create policy "appointments_all" on public.appointments for all using (true) with check (true);
create policy "messages_all" on public.client_messages for all using (true) with check (true);

select pg_notify('pgrst', 'reload schema');
```

---

## 4. VARIABLES D'ENVIRONNEMENT NETLIFY

| Variable | Utilité |
|----------|---------|
| `REACT_APP_ADMIN_PASSWORD` | Mot de passe Admin |

Netlify → Site configuration → Environment variables → Add variable → Redeploy

---

## 5. FONCTIONNALITÉS

### Interface client
- Identification mémorisée (localStorage)
- Mot de passe personnel chiffré SHA-256
- Saisie progressive dans la journée (compteurs additionnés, notes concaténées)
- Récap de ce qui a déjà été saisi pour le jour sélectionné
- Sélecteur 7 derniers jours (pour rattraper les oublis)
- États émotionnels maison + extérieur (4 niveaux)
- Case "Mise au vert"
- Compteurs : éléments déclencheurs / déclenchements / aboiements
- Notes libres
- Résumé en langage humain (8 phrases contextuelles)
- Graphique 90 jours avec toggle par courbe (5 courbes)
- Explication contextuelle de la courbe
- Messages de la comportementaliste visibles en haut du journal
- Rendez-vous à venir affichés en haut du journal
- Onglet Ressources avec recherche + filtres par catégorie

### Interface Admin (onglets par client)
- 📈 Suivi : graphique + historique des entrées
- 📅 RDV : ajouter/supprimer des rendez-vous
- 💬 Message : message personnalisé + suggestion de ressource
- Réinitialisation mot de passe client
- Suppression client (toutes données)
- Gestion des ressources (CRUD articles)

---

## 6. WORKFLOW ONBOARDING CLIENT

1. Envoyer le lien + guide PDF
2. Client ouvre dans Safari (iPhone) ou Chrome (Android)
3. Entre prénom + nom du chien + choisit un mot de passe
4. Lit la mention confidentialité
5. Confirme → compte créé automatiquement
6. Remplit sa première entrée → apparaît dans Admin
7. Admin : vérifier la fiche + ajouter les prochains RDV

---

## 7. PROCÉDURES DE DÉPANNAGE

### Erreur PGRST205 (table introuvable)
```sql
select pg_notify('pgrst', 'reload schema');
-- Si insuffisant : Supabase → Project Settings → Restart project
```

### Mot de passe client oublié
Admin → fiche du chien → bouton Réinit. MDP
Ou SQL :
```sql
delete from client_profiles 
where human_name ilike 'Prénom' and dog_name ilike 'NomDuChien';
```
Le client recrée son mot de passe à la prochaine connexion.

### Supprimer un client complet
```sql
delete from journal_entries where human_name ilike 'P' and dog_name ilike 'N';
delete from client_profiles where human_name ilike 'P' and dog_name ilike 'N';
delete from appointments where human_name ilike 'P' and dog_name ilike 'N';
delete from client_messages where human_name ilike 'P' and dog_name ilike 'N';
```
Ou depuis Admin → fiche du chien → bouton Supprimer (automatique)

### Netlify Failed
1. Netlify → Deploys → deploy rouge → Building → lire l'erreur
2. Retour version précédente : ancien deploy vert → "Publish deploy"
3. Cause fréquente : doublon App.jsx à la racine du projet GitHub

### App blanche / version pas à jour
1. Se déconnecter puis se reconnecter sur l'app (solution la plus simple)
2. Ou Ctrl+Shift+R sur navigateur
3. Si PWA installée : désinstaller et réinstaller depuis Safari/Chrome
4. En dernier recours : Netlify → Trigger deploy → "Deploy project without cache"

### ⚠️ Doublon App.jsx dans GitHub
Symptôme : l'app déploie mais n'affiche pas les modifications
Cause : fichier App.jsx présent à la racine ET dans src/
Solution : supprimer le fichier App.jsx à la racine (Edit → icône poubelle → Commit)

### Projets Supabase suspendus
Dépassement crédits gratuits (300/mois)
Solution : Supabase → Billing → plan Personal (9$/mois) ou attendre renouvellement mensuel

---

## 8. DÉPLOIEMENT STANDARD

1. Télécharger App.jsx
2. GitHub → src/App.jsx → Edit → Ctrl+A → Supprimer
3. Ouvrir avec Notepad → Ctrl+A → Ctrl+C → Coller dans GitHub
4. Commit changes
5. Netlify redéploie en 1-2 minutes
6. Clients : se déconnecter et reconnecter pour voir la nouvelle version

⚠️ Toujours passer par Notepad — ne jamais modifier App.jsx directement dans GitHub
⚠️ Vérifier qu'il n'y a PAS de fichier App.jsx à la racine du projet (seulement dans src/)

---

## 9. INFORMATIONS CLÉS

| Info | Valeur |
|------|--------|
| URL app | https://suivithedogexperience.netlify.app |
| Supabase URL | https://vfvtimkkwczagytnjtfn.supabase.co |
| GitHub | https://github.com/thedogexperience59/dog-journal |
| Mot de passe admin | Netlify → Env variables → REACT_APP_ADMIN_PASSWORD |
| Plan Supabase | Personal 9$/mois — renouvellement automatique |
| Plan Netlify | Gratuit |
| Logo | https://i.imgur.com/rq4rDYi.png |
| Nombre de lignes App.jsx | 1820 lignes (version actuelle) |

---

## 10. SÉCURITÉ

| Élément | Statut | Détail |
|---------|--------|--------|
| HTTPS | Actif | Netlify SSL automatique |
| Mots de passe clients | Chiffrés SHA-256 | Avant stockage |
| Mot de passe Admin | Variable d'environnement | Invisible dans GitHub |
| Clé Supabase anon | Visible (normal) | Protégée par RLS |
| RLS | Actif | Sur toutes les 5 tables |

---

## 11. ÉVOLUTIONS FUTURES

- [ ] Application chiot (projet séparé — voir résumé de réflexion)
- [ ] Bilan PDF mensuel par client
- [ ] Alertes clients inactifs depuis X jours
- [ ] Badges de progression

---

## 12. EN CAS DE BUG COMPLEXE

Ouvrir une nouvelle discussion Claude avec :
1. Ce fichier MAINTENANCE.md en pièce jointe
2. Capture d'écran de l'erreur
3. Description du problème

Claude pourra reconstituer le contexte et corriger rapidement.
