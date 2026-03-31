# 🎨 C-PRojeTs — Design System & Identité Visuelle

> Document de référence visuelle. Tout développeur travaillant sur C-PRojeTs doit respecter
> ces spécifications pour maintenir la cohérence du rendu sur l'ensemble de l'application.

---

## 1. Philosophie du design

### Concept directeur

**"Interface de commandement"** — C-PRojeTs s'adresse à des chefs de projet travaillant sur des
infrastructures critiques (postes 400kV, HTB). L'interface doit inspirer **rigueur, maîtrise et
efficacité**. Pas de fantaisie, pas de légèreté. Tout doit sembler solide, fiable, professionnel.

### Trois principes fondateurs

**Densité maîtrisée** — Beaucoup d'information visible simultanément, sans jamais paraître surchargé.
Chaque pixel est intentionnel. Les espacements sont généreux là où la hiérarchie l'exige, compressés
là où l'information se répète.

**Obscurité lumineuse** — Le fond est très sombre (presque noir), mais les éléments porteurs de sens
sont lumineux, colorés, contrastés. L'œil est guidé naturellement vers l'essentiel sans effort.

**Sobriété animée** — Les animations existent mais ne se font pas remarquer. Elles accompagnent
l'action sans la perturber. On les remarque seulement quand elles manquent.

---

## 2. Palette de couleurs

### 2.1 Couleurs de fond (arrière-plans)

| Variable CSS      | Valeur    | Utilisation                          |
| ----------------- | --------- | ------------------------------------ |
| `--bg-app`        | `#0e1117` | Fond global de l'application         |
| `--bg-sidebar`    | `#131720` | Sidebar et header                    |
| `--bg-panel`      | `#181f2d` | Panel droit (messagerie, calendrier) |
| `--bg-card`       | `#1e2736` | Cartes, éléments flottants           |
| `--bg-card-hover` | `#232e42` | Cartes au survol                     |
| `--bg-col`        | `#161c28` | Fond des colonnes                    |
| `--bg-input`      | `#252f42` | Champs de saisie, zones de fond      |

> **Règle** : chaque niveau de profondeur est légèrement plus clair que le précédent.
> L'œil perçoit naturellement la hiérarchie spatiale sans bordures explicites.

### 2.2 Bordures

| Variable CSS      | Valeur                   | Utilisation                                    |
| ----------------- | ------------------------ | ---------------------------------------------- |
| `--border`        | `rgba(255,255,255,0.07)` | Bordures standards — séparations discrètes     |
| `--border-strong` | `rgba(255,255,255,0.13)` | Bordures accentuées — survol, focus, sélection |

> **Règle** : les bordures sont des suggestions, pas des murs. Elles guident sans enfermer.
> Ne jamais utiliser de bordures opaques ou de couleurs vives pour délimiter les zones.

### 2.3 Textes

| Variable CSS      | Valeur    | Utilisation                                          |
| ----------------- | --------- | ---------------------------------------------------- |
| `--txt-primary`   | `#e8edf5` | Titres, contenus principaux                          |
| `--txt-secondary` | `#7d8fa8` | Labels, métadonnées, descriptions                    |
| `--txt-muted`     | `#4a5568` | Éléments désactivés, placeholders, compteurs mineurs |

> **Règle** : trois niveaux de texte seulement, jamais plus. La hiérarchie textuelle
> se construit par la couleur ET la taille, jamais par la couleur seule.

### 2.4 Couleur accent principale

| Variable CSS    | Valeur                  | Utilisation                                       |
| --------------- | ----------------------- | ------------------------------------------------- |
| `--accent`      | `#3b82f6`               | Bleu — sélection active, boutons primaires, focus |
| `--accent-glow` | `rgba(59,130,246,0.25)` | Lueur d'ombre portée de l'accent                  |
| `--accent-soft` | `rgba(59,130,246,0.12)` | Fond teinté des éléments actifs                   |

> **Règle** : l'accent bleu est la seule couleur systémique. Il signifie toujours
> "actif, sélectionné, action principale". Ne jamais utiliser d'autre couleur pour cet usage.

### 2.5 Couleurs de priorité

| Priorité  | Couleur | Code hex  | Fond associé            |
| --------- | ------- | --------- | ----------------------- |
| `urgent`  | Rouge   | `#ef4444` | `rgba(239,68,68,0.12)`  |
| `waiting` | Orange  | `#f59e0b` | `rgba(245,158,11,0.12)` |
| `normal`  | Bleu    | `#3b82f6` | `rgba(59,130,246,0.12)` |
| `done`    | Vert    | `#22c55e` | `rgba(34,197,94,0.12)`  |

> **Règle** : ces quatre couleurs de priorité sont réservées aux badges de statut.
> Elles ne doivent jamais être utilisées pour décorer ou habiller d'autres éléments.

### 2.6 Couleurs des colonnes

| Colonne  | Couleur                   | Usage                                               |
| -------- | ------------------------- | --------------------------------------------------- |
| Études   | `#6366f1` (violet-indigo) | Point de couleur colonne + barre accentuation carte |
| En cours | `#f59e0b` (ambre)         | Point de couleur colonne + barre accentuation carte |
| Réalisé  | `#22c55e` (vert)          | Point de couleur colonne + barre accentuation carte |
| Archivé  | `#475569` (ardoise)       | Point de couleur colonne + barre accentuation carte |

> **Règle** : chaque colonne a sa propre couleur identitaire. Les cartes héritent
> visuellement de la couleur de leur colonne via la barre d'accentuation supérieure.

---

## 3. Typographie

### 3.1 Familles de polices

| Famille     | Variable CSS     | Google Fonts                                | Rôle                                                |
| ----------- | ---------------- | ------------------------------------------- | --------------------------------------------------- |
| **Syne**    | `--font-display` | `Syne:wght@400;500;600;700;800`             | Police d'affichage — titres, noms de colonnes, logo |
| **DM Sans** | `--font-body`    | `DM Sans:ital,wght@0,300;0,400;0,500;1,300` | Police de corps — tout le reste                     |

**Pourquoi ces polices ?**
Syne est géométrique, technique, légèrement inhabituelle. Elle évoque la précision de l'ingénierie
sans rigidité. DM Sans est neutre, lisible à petite taille, douce. Elle contraste avec la technicité
de Syne sans la contredire. Ensemble elles forment un duo sérieux mais pas austère.

> **Règle absolue** : ne jamais remplacer ces polices par Inter, Roboto, Arial ou toute
> autre police générique. Ce choix typographique est au cœur de l'identité visuelle.

### 3.2 Échelle typographique

| Usage            | Police  | Taille  | Poids   | Lettre-espacement |
| ---------------- | ------- | ------- | ------- | ----------------- |
| Logo             | Syne    | 18px    | 800     | -0.5px            |
| Titre tableau    | Syne    | 17px    | 700     | -0.3px            |
| Titre colonne    | Syne    | 13px    | 700     | 0.2px             |
| Titre carte      | Syne    | 13px    | 600     | -0.1px            |
| Mois calendrier  | Syne    | 12px    | 700     | —                 |
| Labels SCREAMING | DM Sans | 10px    | 600     | 1–1.2px           |
| Corps texte      | DM Sans | 13px    | 400     | —                 |
| Métadonnées      | DM Sans | 12px    | 400–500 | —                 |
| Micro-labels     | DM Sans | 10–11px | 500–600 | 0.3px             |
| Nano-labels      | DM Sans | 9–10px  | 600     | 0.5px             |

> **Règle** : les titres sont toujours en Syne. Tout ce qui est sous 12px utilise
> toujours un `font-weight` supérieur ou égal à 500 pour conserver la lisibilité.

---

## 4. Espacements et géométrie

### 4.1 Rayons de bordure

| Variable CSS  | Valeur | Utilisation                      |
| ------------- | ------ | -------------------------------- |
| `--radius-sm` | `6px`  | Boutons, badges, éléments inline |
| `--radius-md` | `10px` | Cartes projet                    |
| `--radius-lg` | `14px` | Colonnes, panels flottants       |
| `--radius-xl` | `18px` | Modals, overlays larges          |

> **Règle** : plus un élément est grand, plus son rayon est élevé. Ne jamais appliquer
> un grand rayon sur un petit élément ni un petit rayon sur un grand conteneur.

### 4.2 Dimensions fixes de l'interface

| Élément                 | Valeur                            |
| ----------------------- | --------------------------------- |
| Hauteur du header       | `56px`                            |
| Largeur de la sidebar   | `220px`                           |
| Largeur d'une colonne   | `310px`                           |
| Largeur du panel droit  | `280px`                           |
| Gap entre colonnes      | `14px`                            |
| Padding interne colonne | `10px` (cartes) · `14px` (header) |

### 4.3 Structure anatomique d'une carte

```
┌─────────────────────────────────┐
│ ▓▓▓ Barre accentuation 3px ▓▓▓  │  ← dégradé couleur de la colonne parente
├─────────────────────────────────┤
│  ⠿  Titre de la carte          ›│  ← drag handle + titre Syne + toggle
│                                 │
│  [badge priorité] [date] [📁 N] │  ← ligne badges métadonnées
│  [✉ N emails]          [avatar] │
│                                 │
│  ▓▓▓▓▓▓░░░░░░░░░░░  45%        │  ← barre de progression
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│  ← séparateur (si carte dépliée)
│  [catégorie 1]               › │
│    · sous-catégorie A      [✓] │
│    · sous-catégorie B      [→] │
│  [catégorie 2]               › │
└─────────────────────────────────┘
```

---

## 5. Ombres et effets de lumière

### 5.1 Ombres

| Variable CSS    | Valeur                                                   | Utilisation                         |
| --------------- | -------------------------------------------------------- | ----------------------------------- |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.35)`                            | Cartes au survol, éléments soulevés |
| `--shadow-glow` | `0 0 0 1px var(--accent), 0 4px 24px var(--accent-glow)` | Focus accent                        |

### 5.2 Lueurs colorées

Certains éléments émettent une légère lueur correspondant à leur couleur.
C'est ce qui donne à l'interface sa sensation de profondeur et d'éclairage interne.

| Élément                   | Lueur CSS                                                  |
| ------------------------- | ---------------------------------------------------------- |
| Logo (carré bleu)         | `box-shadow: 0 0 14px rgba(59,130,246,0.25)`               |
| Bouton primaire au survol | `box-shadow: 0 2px 18px rgba(59,130,246,0.25)`             |
| Point "RDV aujourd'hui"   | `box-shadow: 0 0 6px #f59e0b`                              |
| Microphone actif          | `box-shadow: 0 0 14–28px rgba(59,130,246,0.25–0.35)` animé |
| Dot non-lus emails        | `box-shadow: 0 0 5px rgba(59,130,246,0.25)`                |
| Jour actif calendrier     | `box-shadow: 0 0 8px rgba(59,130,246,0.25)`                |

> **Règle** : les lueurs ne dépassent jamais un rayon de 18px et une opacité de 25–35%.
> Elles doivent être perçues sans être consciemment identifiées.

---

## 6. Badges et indicateurs

### 6.1 Structure CSS commune à tous les badges

```css
display: inline-flex;
align-items: center;
gap: 4px;
padding: 2px 7px;
border-radius: 99px; /* toujours pill — jamais carré */
font-size: 10px;
font-weight: 600;
letter-spacing: 0.3px;
```

### 6.2 Catalogue des badges

| Type                | Fond                     | Texte     | Contenu         |
| ------------------- | ------------------------ | --------- | --------------- |
| Priorité urgente    | `rgba(239,68,68,0.12)`   | `#ef4444` | `● URGENT`      |
| Priorité en attente | `rgba(245,158,11,0.12)`  | `#f59e0b` | `● ATTENTE`     |
| Priorité normale    | `rgba(59,130,246,0.12)`  | `#3b82f6` | `● NORMAL`      |
| Priorité terminée   | `rgba(34,197,94,0.12)`   | `#22c55e` | `✓ TERMINÉ`     |
| Date standard       | `rgba(255,255,255,0.05)` | `#7d8fa8` | `📅 JJ/MM/AAAA` |
| Date dépassée       | `rgba(239,68,68,0.12)`   | `#ef4444` | `📅 ... !`      |
| Date proche         | `rgba(245,158,11,0.12)`  | `#f59e0b` | `📅 ...`        |
| Catégories          | `rgba(255,255,255,0.05)` | `#7d8fa8` | `📁 N`          |
| Emails liés         | `rgba(59,130,246,0.08)`  | `#60a5fa` | `✉ N`           |

---

## 7. Interactions et micro-animations

### 7.1 Durées de transition

```css
transition: all 0.15s ease; /* éléments très petits */
transition: all 0.18s ease; /* standard — la majorité */
transition: all 0.2s ease; /* éléments porteurs (cartes, boutons primaires) */
```

Ne jamais dépasser `0.3s` pour une transition UI courante.
Les animations d'entrée de page peuvent aller jusqu'à `0.4s`.

### 7.2 Survol des cartes

```
Normal  → bg: #1e2736 / border: rgba(255,255,255,0.07)
Survol  → bg: #232e42 / border: rgba(255,255,255,0.13)
          + transform: translateY(-1px)
          + box-shadow: 0 4px 24px rgba(0,0,0,0.35)
```

Le déplacement de `-1px` vers le haut donne la sensation que la carte se soulève.
C'est subtil mais fondamental pour rendre l'interface tactile.

### 7.3 Survol des boutons icônes (32x32px)

```
Normal  → transparent / border: rgba(255,255,255,0.07) / couleur: #7d8fa8
Survol  → bg: #1e2736 / border: rgba(255,255,255,0.13) / couleur: #e8edf5
Actif   → bg: rgba(59,130,246,0.12) / border: #3b82f6 / couleur: #3b82f6
```

### 7.4 Animation d'entrée des colonnes (cascade)

```css
@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.column:nth-child(1) {
  animation: fadeSlide 0.4s ease 0.05s both;
}
.column:nth-child(2) {
  animation: fadeSlide 0.4s ease 0.1s both;
}
.column:nth-child(3) {
  animation: fadeSlide 0.4s ease 0.15s both;
}
.column:nth-child(4) {
  animation: fadeSlide 0.4s ease 0.2s both;
}
```

### 7.5 Animation pulse (dot RDV + microphone actif)

```css
/* Dot "RDV aujourd'hui" dans le header */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Microphone en écoute */
@keyframes mic-pulse {
  0%,
  100% {
    box-shadow: 0 0 14px rgba(59, 130, 246, 0.25);
  }
  50% {
    box-shadow: 0 0 28px rgba(59, 130, 246, 0.35);
  }
}
```

### 7.6 Toggles (collapse / expand)

```css
.card-toggle,
.cat-toggle {
  transition: transform 0.15s–0.2s;
}
/* État déplié : rotation 90° */
.card.expanded .card-toggle,
.category.open .cat-toggle {
  transform: rotate(90deg);
}
```

---

## 8. Composants détaillés

### 8.1 Header

- Fond `var(--bg-sidebar)` + `backdrop-filter: blur(12px)` (effet verre)
- `position: fixed`, toujours visible au-dessus du contenu
- Séparateur `|` discret entre le logo et le nom du tableau
- Nom du tableau en `--txt-secondary` — informatif, non dominant
- Boutons d'action : carrés `32x32px`, rayon `6px`

### 8.2 Sidebar

- Largeur fixe `220px`, fond `var(--bg-sidebar)`, bordure droite `var(--border)`
- Item actif : barre verticale gauche `3px` couleur `var(--accent)` + fond `var(--accent-soft)`
- Labels de section : `10px / 600 / 1.2px letter-spacing / UPPERCASE / var(--txt-muted)`
- Compteurs d'alertes messagerie : fond `rgba(239,68,68,0.15)` / texte `#ef4444`

### 8.3 Barre d'accentuation des cartes

Chaque carte a une barre de `3px` en haut — toujours un `linear-gradient` deux tons.

```css
/* Colonne Études */
background: linear-gradient(90deg, #6366f1, #3b82f6);
/* Colonne En cours */
background: linear-gradient(90deg, #f59e0b, #fbbf24);
/* Colonne Réalisé */
background: linear-gradient(90deg, #22c55e, #4ade80);
/* Colonne Archivé */
background: #475569; /* pas de dégradé — état éteint */
```

### 8.4 Drag handle

- Caractère Unicode `⠿` (braille pattern dots-123456)
- `opacity: 0` par défaut, `opacity: 1` au survol de la carte
- Couleur `var(--txt-muted)` — visible mais non intrusif

### 8.5 Panel droit — onglets

- Onglet actif : `border-bottom: 2px solid var(--accent)` + `color: var(--accent)`
- Onglet inactif : `color: var(--txt-muted)`
- Compteurs dans les onglets : pills colorées `var(--accent-soft)` ou `var(--urgent-soft)`

### 8.6 Sélecteur de tags

- Tags actifs : `border: 1px solid currentColor` + `box-shadow: 0 0 8px currentColor`
- Tags inactifs : `opacity: 0.45` — présents visuellement mais en retrait
- Couleurs de tags personnalisées par domaine métier (indigo, ambre, vert, rouge, bleu)

### 8.7 Mini-calendrier

- Grille 7 colonnes, chaque jour `aspect-ratio: 1`
- Jour actuel : fond `var(--accent)` plein + texte blanc + lueur bleue
- Jours avec événements : point ambre `4px` positionné en `bottom: 2px`
- Jours hors mois : `color: var(--txt-muted)`

### 8.8 Événements calendrier

- Bordure gauche `2px` colorée selon le tag de l'événement
- Heure : `min-width: 38px`, couleur `var(--txt-muted)`
- Titre : `11px / 500 / var(--txt-primary)`
- Lieu : `10px / var(--txt-muted)` avec emoji 📍

### 8.9 FAB Voix

- `position: fixed` en bas à gauche (au-delà de la sidebar)
- Fond `var(--bg-card)`, bordure `var(--border)`, rayon `14px`
- Survol : bordure → `var(--accent)` + lueur bleue
- Microphone : cercle `32px`, fond `var(--bg-input)` au repos, fond `var(--accent)` + pulse en écoute

---

## 9. États visuels spéciaux

| État                         | Traitement                                       |
| ---------------------------- | ------------------------------------------------ |
| Carte en colonne **Réalisé** | `opacity: 0.75`                                  |
| Carte en colonne **Archivé** | `opacity: 0.45`                                  |
| Sous-catégorie terminée      | Badge vert `✓`                                   |
| Sous-catégorie en cours      | Badge orange `→`                                 |
| Sous-catégorie à faire       | Badge gris `○`                                   |
| Application hors ligne       | Indicateur dans le header, fonctions API grisées |

> **Règle** : réduire l'opacité plutôt que de griser la couleur. Cela préserve
> la cohérence chromatique tout en créant une hiérarchie temporelle naturelle.

---

## 10. Scrollbars

```css
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
}
```

Discrètes, cohérentes avec le thème sombre. Ne jamais afficher une scrollbar
native non stylisée dans cette interface.

---

## 11. Interdits absolus

```
❌ Utiliser Inter, Roboto, Arial ou toute font système
❌ Utiliser un fond blanc ou clair
❌ Utiliser des dégradés violet sur blanc (cliché "design IA générique")
❌ Utiliser des bordures opaques pour délimiter les zones
❌ Mettre une couleur vive pleine sur un grand fond
❌ Créer un 4e niveau de texte au-delà de primary / secondary / muted
❌ Animer sans raison — chaque animation répond à une action utilisateur
❌ Appliquer le même border-radius sur des éléments de tailles différentes
❌ Utiliser la couleur accent bleue pour autre chose que "actif / action principale"
❌ Afficher une scrollbar native non stylisée
```

---

_C-PRojeTs — Design System & Identité Visuelle — 23 février 2026_
