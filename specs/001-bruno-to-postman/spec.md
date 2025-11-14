# Spécification de Fonctionnalité : Convertisseur Bruno vers Postman

**Feature Branch**: `001-bruno-to-postman`
**Created**: 2025-11-14
**Status**: Draft
**Input**: User description: "construit une ligne de commande permettant de convertir des request REST de l'application Bruno vers de request Postman. A terme cette commande nous permettra de convertir tous les fichiers bruno utilisé par les dev en collection postman. Toute les spécifications seront en français mais tous le code sera en anglais"

## Clarifications

### Session 2025-11-14

- Q: Stratégie de conversion des scripts de test (le plus gros challenge) - quel niveau de fidélité attendu ? → A: Conversion avec avertissements pour incompatibilités - Tenter de convertir le maximum, générer des commentaires `// ATTENTION: conversion partielle` dans le script Postman pour les parties non traduisibles + avertissement CLI
- Q: Mapping de la structure de répertoires Bruno vers collections/folders Postman → A: 1er niveau de répertoire = nom de collection, tous les niveaux suivants (2, 3, 4, etc.) = folders Postman imbriqués (Postman supporte l'imbrication illimitée)
- Q: Comportement pour hiérarchies >2 niveaux → A: Créer des sous-folders Postman imbriqués - tous les niveaux de répertoires sont convertis en folders Postman hiérarchiques
- Q: Ordre de développement des fonctionnalités → A: Phase 1 (MVP) = conversion unitaire d'un fichier .bru vers une collection Postman contenant une seule requête avec approche regex best-effort. Phase 2 = ajout du flag --experimental-ast pour conversion robuste avec AST parsing. Phase 3 = conversion par répertoire avec hiérarchie (batch). Phase 4 = export des environnements
- Q: Comportement quand le fichier de sortie existe déjà → A: Demander confirmation à l'utilisateur - Afficher un prompt "Le fichier existe, voulez-vous l'écraser ? (y/n)" sauf si option --force utilisée (pour automatisation CI/CD)
- Q: Comportement en cas d'erreur de parsing sur un fichier en mode batch → A: Continuer et collecter les erreurs - Convertir tous les fichiers valides, collecter les erreurs pour les invalides, afficher un rapport final détaillé avec succès et échecs
- Q: Format du rapport de conversion (FR-015) → A: Deux formats selon option CLI - Par défaut : rapport human-readable en anglais avec couleurs et formatage. Avec option `--json` : sortie JSON structurée pour intégration CI/CD et parsing programmatique
- Q: Langue de TOUS les messages CLI (confirmations, prompts, succès, rapports) → A: Tous les messages utilisateur en **anglais** pour un usage international et open source (erreurs, avertissements, confirmations, prompts, rapports). Les commentaires insérés dans les scripts Postman convertis sont également en anglais (ex: `// WARNING: partial conversion - review manually`)
- Q: Lors de la conversion batch d'un dossier Bruno, comment le système doit-il déterminer s'il y a une collection Bruno existante? → A: Chercher un fichier `bruno.json` à la racine du dossier - s'il existe, l'utiliser pour les métadonnées de la collection (nom, description) et scanner les sous-dossiers pour les requêtes. S'il n'existe pas, utiliser le nom du dossier comme nom de collection
- Q: Quelle est la structure exacte du fichier `bruno.json` que le système doit parser pour extraire les métadonnées de collection? → A: Bruno standard : parser `name`, `version`, `type`, ignorer les autres champs (configuration, scripts, etc.) - seuls name et version sont utilisés pour la collection Postman
- Q: Avec l'ajout du support de `bruno.json`, quelle est la priorité de résolution pour le nom de la collection entre option CLI `--name`, fichier `bruno.json`, et nom du dossier? → A: CLI > bruno.json > dossier, avec validation - L'option CLI a la priorité absolue si fournie, sinon bruno.json (si valide), sinon nom du dossier. Si bruno.json est invalide/corrompu, afficher un warning et utiliser le nom du dossier comme fallback
- Q: La conversion de scripts par regex/string est fragile. Faut-il améliorer avec du parsing AST maintenant ou plus tard? → A: Ajouter comme Phase 2 (P2) - Garder l'approche regex best-effort pour P1 (MVP), puis créer P2 dédiée à l'amélioration de la conversion de scripts avec parsing AST (Babel/acorn) pour gérer les cas complexes de manière robuste. Batch (P3) et Environnements (P4) viennent ensuite
- Q: Pour la phase P2 (AST parsing), comment gérer la coexistence avec l'approche regex existante lors du déploiement? → A: Flag optionnel `--experimental-ast` - L'approche regex reste le défaut pour stabilité. Les utilisateurs peuvent opt-in avec le flag pour tester l'AST. Après validation terrain, l'AST devient le défaut dans une version majeure suivante

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conversion d'une requête Bruno unique (Priority: P1)

Un développeur souhaite convertir un fichier de requête Bruno individuel en format Postman pour pouvoir l'utiliser dans l'application Postman.

**Why this priority**: Il s'agit de la fonctionnalité de base qui démontre la valeur immédiate de l'outil. Sans cette capacité, l'outil n'a aucune utilité. C'est le MVP qui permet de valider la faisabilité technique.

**Independent Test**: Peut être testé en fournissant un fichier .bru en entrée et en vérifiant que la sortie générée est un fichier JSON valide compatible avec Postman qui contient les mêmes informations (URL, méthode, headers, body).

**Acceptance Scenarios**:

1. **Given** un fichier Bruno valide contenant une requête GET simple, **When** l'utilisateur exécute la commande de conversion, **Then** un fichier JSON Postman valide est créé avec l'URL, la méthode et les headers corrects
2. **Given** un fichier Bruno contenant une requête POST avec un body JSON, **When** l'utilisateur exécute la commande de conversion, **Then** le fichier Postman généré contient le body JSON correctement formaté
3. **Given** un fichier Bruno avec des variables d'environnement ({{variable}}), **When** l'utilisateur exécute la commande de conversion, **Then** les variables sont préservées dans le format Postman équivalent
4. **Given** un fichier Bruno avec des headers personnalisés (Authorization, Content-Type, etc.), **When** l'utilisateur exécute la commande de conversion, **Then** tous les headers sont présents dans le fichier Postman généré

---

### User Story 2 - Conversion robuste de scripts avec AST parsing (Priority: P2)

Un développeur souhaite que les scripts de test Bruno complexes (contenant des boucles, conditions, fonctions imbriquées, expressions avancées) soient convertis de manière fiable et précise vers Postman sans perte de logique ni risque d'erreurs de syntaxe.

**Why this priority**: La conversion unitaire (P1) avec regex best-effort fonctionne pour les scripts simples, mais les scripts complexes nécessitent une approche plus robuste. Cette phase P2 ajoute le support AST avant les fonctionnalités batch (P3) et environnements (P4), permettant de garantir une qualité de conversion maximale dès le début, même si le flag reste optionnel pour la stabilité.

**Independent Test**: Peut être testé en fournissant des fichiers Bruno avec des scripts complexes (boucles for/while, conditions imbriquées, closures, destructuring) et en vérifiant que le code Postman généré est syntaxiquement correct et préserve la logique.

**Acceptance Scenarios**:

1. **Given** un script Bruno contenant une boucle for avec des appels bru.setVar imbriqués, **When** l'utilisateur exécute la conversion avec `--experimental-ast`, **Then** le script Postman généré utilise pm.environment.set correctement à l'intérieur de la boucle avec la même logique
2. **Given** un script Bruno avec des expressions complexes (template literals, spread operators, destructuring), **When** l'utilisateur exécute la conversion avec `--experimental-ast`, **Then** le système parse et transforme ces expressions via AST au lieu de regex, garantissant une conversion syntaxiquement valide
3. **Given** un script Bruno avec des variables de scope complexe (closures, functions), **When** l'utilisateur exécute la conversion avec `--experimental-ast`, **Then** les références de variables et contextes d'exécution sont préservés correctement dans le script Postman
4. **Given** un script Bruno contenant des appels API Bruno non mappables (fonctions custom), **When** l'utilisateur exécute la conversion avec `--experimental-ast`, **Then** ces appels sont détectés précisément et marqués avec des warnings explicites sans casser la syntaxe du reste du script
5. **Given** un utilisateur exécute la conversion sans le flag `--experimental-ast`, **When** le système rencontre un script complexe, **Then** l'approche regex best-effort est utilisée (comportement par défaut stable), et les parties non convertibles sont marquées avec warnings comme dans P1

---

### User Story 3 - Conversion en lot d'un dossier Bruno (Priority: P3)

Un développeur souhaite convertir un dossier entier de requêtes Bruno en une collection Postman organisée, pour migrer tout un projet en une seule opération.

**Why this priority**: Cette fonctionnalité répond au besoin exprimé "convertir tous les fichiers bruno utilisé par les dev". Elle offre une vraie valeur pratique pour l'adoption en équipe. Placée en P3 après le support AST (P2), elle bénéficie d'une conversion de scripts robuste dès le départ pour les utilisateurs qui utilisent le flag --experimental-ast.

**Independent Test**: Peut être testé en fournissant un dossier contenant plusieurs fichiers .bru et en vérifiant que la collection Postman générée contient toutes les requêtes avec la même organisation hiérarchique.

**Acceptance Scenarios**:

1. **Given** un dossier contenant 5 fichiers Bruno, **When** l'utilisateur exécute la commande de conversion en lot, **Then** une collection Postman unique est créée contenant les 5 requêtes
2. **Given** un dossier avec une structure hiérarchique (sous-dossiers), **When** l'utilisateur exécute la commande de conversion, **Then** la hiérarchie est préservée dans la collection Postman (folders/sub-folders)
3. **Given** une structure `mon-api/users/admin/get.bru` (3 niveaux), **When** l'utilisateur exécute la commande de conversion, **Then** une collection nommée "mon-api" est créée avec folder "users" contenant sous-folder "admin" contenant la requête "get"
4. **Given** un dossier contenant un fichier `bruno.json` avec les métadonnées de collection (nom: "My API", version: "v1.0"), **When** l'utilisateur exécute la commande de conversion en lot, **Then** la collection Postman générée utilise les métadonnées du fichier bruno.json (nom "My API") plutôt que le nom du dossier
5. **Given** un dossier sans fichier `bruno.json`, **When** l'utilisateur exécute la commande de conversion en lot, **Then** le système utilise le nom du dossier comme nom de collection Postman par défaut
6. **Given** un dossier contenant des fichiers Bruno et d'autres types de fichiers, **When** l'utilisateur exécute la commande de conversion, **Then** seuls les fichiers .bru sont traités et les autres sont ignorés silencieusement
7. **Given** un dossier vide ou sans fichiers .bru, **When** l'utilisateur exécute la commande de conversion, **Then** un message clair indique qu'aucun fichier Bruno n'a été trouvé

---

### User Story 4 - Export avec gestion des environnements (Priority: P4)

Un développeur souhaite exporter non seulement les requêtes mais aussi les configurations d'environnement Bruno (variables) vers le format d'environnement Postman.

**Why this priority**: Cette fonctionnalité améliore l'expérience mais n'est pas critique. Les variables peuvent être recréées manuellement dans Postman si nécessaire. Elle vient en dernier car elle ajoute une migration vraiment complète une fois que la conversion de requêtes (P1), les scripts robustes (P2) et le batch (P3) sont en place.

**Independent Test**: Peut être testé en fournissant un fichier d'environnement Bruno et en vérifiant que le fichier d'environnement Postman généré contient toutes les variables avec leurs valeurs.

**Acceptance Scenarios**:

1. **Given** un fichier d'environnement Bruno avec 10 variables, **When** l'utilisateur exécute la conversion d'environnement, **Then** un fichier d'environnement Postman est créé avec les 10 variables et leurs valeurs
2. **Given** plusieurs environnements Bruno (dev, staging, prod), **When** l'utilisateur exécute la conversion, **Then** plusieurs fichiers d'environnement Postman sont créés, un par environnement

---

### Edge Cases

- Que se passe-t-il lorsqu'un fichier Bruno contient une syntaxe invalide ou est corrompu ? → En mode fichier unique : afficher une erreur claire et arrêter. En mode batch : continuer avec les autres fichiers, collecter l'erreur, et l'inclure dans le rapport final avec le nom du fichier et la raison de l'échec
- Comment le système gère-t-il les caractères spéciaux dans les noms de fichiers ou de variables ?
- Que se passe-t-il si l'utilisateur n'a pas les permissions d'écriture dans le dossier de destination ?
- Comment sont gérées les requêtes Bruno utilisant des fonctionnalités non supportées par Postman ?
- Que se passe-t-il si deux fichiers Bruno ont le même nom dans des sous-dossiers différents ?
- Comment sont gérés les fichiers Bruno très volumineux (>10MB) ?
- Que se passe-t-il si le fichier de sortie existe déjà ? → Le système affiche un prompt en anglais "File X already exists. Overwrite? (y/n)" et attend la réponse de l'utilisateur. Si option `--force` est utilisée, le fichier est écrasé automatiquement sans prompt
- Comment sont gérés les scripts de test Bruno contenant des API spécifiques à Bruno non mappables vers Postman (ex: fonctions personnalisées, bibliothèques externes) ? → Le système insère un commentaire en anglais `// WARNING: partial conversion - review manually` avant le code non traduit, affiche un avertissement CLI en anglais avec le nom du fichier concerné, et continue la conversion
- Que se passe-t-il si un fichier `bruno.json` existe mais contient du JSON invalide ou malformé ? → Le système affiche un avertissement en anglais indiquant que le fichier bruno.json est invalide et ne peut être parsé, puis continue la conversion en utilisant le nom du dossier comme fallback pour le nom de collection

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT accepter en entrée un chemin vers un fichier .bru individuel ou un dossier contenant des fichiers .bru
- **FR-002**: Le système DOIT parser correctement le format de fichier Bruno et extraire toutes les informations de requête (méthode HTTP, URL, headers, query parameters, body)
- **FR-003**: Le système DOIT générer un fichier JSON valide conforme au format de collection Postman v2.1
- **FR-004**: Le système DOIT préserver les variables d'environnement Bruno (format {{variable}}) dans le format Postman équivalent
- **FR-005**: Le système DOIT supporter toutes les méthodes HTTP standard (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **FR-006**: Le système DOIT mapper la structure de répertoires Bruno vers la hiérarchie Postman selon ces règles : le 1er niveau de répertoire détermine le nom de la collection, tous les niveaux suivants (2+) deviennent des folders Postman imbriqués (sans limite de profondeur), préservant ainsi complètement l'organisation hiérarchique
- **FR-007**: Le système DOIT permettre à l'utilisateur de spécifier le nom de la collection Postman générée
- **FR-008**: Le système DOIT permettre à l'utilisateur de spécifier le dossier de destination pour le fichier généré
- **FR-009**: Le système DOIT afficher tous les messages utilisateur (erreurs, avertissements, confirmations, prompts, rapports de conversion) en **anglais** de manière claire et actionnelle, pour garantir un usage international et faciliter la distribution open source. Les commentaires insérés dans les scripts Postman convertis sont également en anglais (ex: `// WARNING: partial conversion - review manually`)
- **FR-010**: Le système DOIT valider que les fichiers d'entrée sont bien au format Bruno avant de tenter la conversion
- **FR-011**: Le système DOIT créer le dossier de destination s'il n'existe pas
- **FR-012**: Le système DOIT convertir les scripts de test Bruno (pre-request, tests) vers le format Postman équivalent en utilisant une approche best-effort : convertir automatiquement les appels API mappables (bru.setVar → pm.environment.set, bru.getVar → pm.environment.get, etc.), insérer des commentaires en anglais `// WARNING: partial conversion - review manually` pour les constructions non traduisibles, et afficher un avertissement CLI listant les fichiers avec scripts partiellement convertis
- **FR-013**: Le système DOIT gérer les différents types de body (JSON, XML, form-data, raw text, binary)
- **FR-014**: Le système DOIT préserver l'ordre des requêtes tel que défini dans la structure Bruno
- **FR-015**: Le système DOIT afficher un résumé de la conversion avec deux formats de sortie : par défaut un rapport human-readable en **anglais** avec couleurs, formatage et symboles (✓/✗), et avec l'option `--json` un rapport JSON structuré contenant les mêmes informations (nombre de requêtes converties, erreurs rencontrées, avertissements, fichiers traités) pour intégration CI/CD
- **FR-016**: Le système DOIT détecter si le fichier de sortie existe déjà et demander confirmation à l'utilisateur avant écrasement (prompt interactif en anglais "File already exists. Overwrite? (y/n)"), sauf si l'option `--force` est fournie auquel cas l'écrasement est automatique
- **FR-017**: En mode batch (conversion de dossier), le système DOIT adopter une stratégie de récupération d'erreur : continuer le traitement des fichiers restants si un fichier échoue au parsing, collecter toutes les erreurs, et générer un rapport final détaillé listant les fichiers convertis avec succès et les fichiers en échec avec raison de l'échec
- **FR-018**: En mode batch, le système DOIT détecter la présence d'un fichier `bruno.json` à la racine du dossier source. Si ce fichier existe, le système DOIT parser les champs `name` et `version` (ignorer les autres champs comme `type`, `configuration`, `scripts`) et les inclure dans les métadonnées de la collection Postman générée. Si le fichier n'existe pas ou ne contient pas de champ `name`, le système DOIT utiliser le nom du dossier comme nom de collection par défaut
- **FR-019**: Le système DOIT supporter un flag optionnel `--experimental-ast` pour activer la conversion de scripts via parsing AST (Abstract Syntax Tree) au lieu de l'approche regex par défaut. Sans ce flag, le système DOIT utiliser l'approche regex best-effort pour maintenir la stabilité et la compatibilité. Ce flag permet une adoption progressive de la technologie AST avant qu'elle ne devienne le défaut dans une version majeure future

### Key Entities

- **Requête Bruno**: Représente une requête HTTP définie dans un fichier .bru, contenant méthode, URL, headers, query parameters, body, scripts pre-request et post-request
- **Collection Bruno (bruno.json)**: Fichier JSON optionnel à la racine d'un dossier Bruno contenant les métadonnées de la collection (nom, description, version, configuration). Sa présence indique une collection Bruno structurée plutôt qu'un simple dossier de requêtes
- **Collection Postman**: Représente une collection de requêtes au format Postman, organisée hiérarchiquement avec des folders, contenant des métadonnées (nom, description, version)
- **Variable d'environnement**: Paire clé-valeur utilisée pour paramétrer les requêtes, peut avoir différentes valeurs selon l'environnement (dev, staging, prod)
- **Folder/Dossier**: Conteneur logique permettant d'organiser les requêtes de manière hiérarchique
- **Script**: Code exécutable avant (pre-request) ou après (test) l'exécution d'une requête

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur peut convertir un fichier Bruno unique en moins de 2 secondes
- **SC-002**: Le système convertit correctement 100% des requêtes Bruno standard (GET, POST, PUT, DELETE) sans perte d'information
- **SC-003**: Un utilisateur peut convertir un dossier de 50 fichiers Bruno en moins de 10 secondes
- **SC-004**: 95% des fichiers Postman générés s'importent sans erreur dans l'application Postman desktop
- **SC-005**: Les messages d'erreur en anglais permettent à 90% des utilisateurs de corriger le problème sans assistance supplémentaire
- **SC-006**: La structure hiérarchique (folders) est préservée à 100% lors de la conversion d'un dossier
- **SC-007**: 100% des variables d'environnement Bruno sont correctement converties au format Postman
- **SC-008**: Au moins 80% des scripts de test Bruno sont convertis automatiquement sans nécessiter d'intervention manuelle, et 100% des scripts partiellement convertis incluent des commentaires explicites en anglais indiquant les sections nécessitant révision (ex: `// WARNING: partial conversion - review manually`)

## Assumptions

- Les fichiers Bruno suivent le format standard défini par l'application Bruno
- Les utilisateurs ont une version récente de Postman (v9.0+) qui supporte le format de collection v2.1
- Les fichiers Bruno sont encodés en UTF-8
- Les chemins de fichiers fournis sont accessibles en lecture pour le système
- Le système d'exploitation supporte les chemins de fichiers standards (POSIX ou Windows)
- Les utilisateurs comprennent les concepts de base de requêtes HTTP et d'API REST
- L'outil est destiné à une distribution open source internationale, donc tous les messages utilisateur sont en anglais pour maximiser l'accessibilité mondiale
