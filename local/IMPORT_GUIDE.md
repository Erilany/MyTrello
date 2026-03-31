# C-PRojeTs - Guide de sauvegarde et import

## Emplacement des répertoires

### Répertoire de travail

```
C:\Users\<username>\Documents\C-PRojeTs\local
```

**Commande de lancement :**
```batch
cd /d "C:\Users\<username>\Documents\C-PRojeTs\local"
npx vite --host
```

---

### Répertoire d'import (fichiers JSON de sauvegarde)

```
C:\Users\<username>\Documents\C-PRojeTs\local\public\imports\
```

**Instructions :**
- Placer le fichier JSON de sauvegarde dans ce répertoire
- Le nom du fichier doit correspondre à l'un des noms attendus :
  - `c-projets-backup-2026-03-31.json`
  - `c-projets-backup.json`
  - `backup.json`
  - `import.json`
- Au prochain lancement de l'application, le fichier sera automatiquement détecté et chargé
- L'application démarre vide si aucun fichier n'est présent

---

### Répertoire Base de données SQLite (optionnel)

```
C:\Users\<username>\Documents\C-PRojeTs\local\src\database\
```

Ce répertoire contient la base de données `mytrello.db` (si elle existe).

---

## Fonctionnement de l'import automatique

### Logique de chargement au démarrage

1. **Vérification du répertoire `public/imports/`**
2. **Recherche d'un fichier JSON** parmi les noms attendus
3. **Chargement des données** si un fichier est trouvé :
   - `databases.core` → boards, cards, columns, categories, subcategories
   - `libraryFavorites` → favoris de la bibliothèque
4. **Import dans localStorage** pour persistance
5. **Démarrage de l'application** avec les données chargées

### Si aucun fichier JSON n'est trouvé

L'application démarre avec :
- Aucune donnée (vide)
- Library Templates par défaut (modèles de bibliothèque)

---

## Résumé

| Action | Emplacement |
|--------|-------------|
| Lancer l'application | `C:\Users\<username>\Documents\C-PRojeTs\local` → `npx vite --host` |
| Importer une sauvegarde | `...\local\public\imports\` |
| Base de données SQLite | `...\local\src\database\` |

---

## Notes

- L'application cherche automatiquement le premier fichier JSON valide dans le répertoire imports
- Après chargement réussi, les données sont stockées dans localStorage
- Pour démarrer complètement vierge : vider le localStorage ou naviguer en mode privé
