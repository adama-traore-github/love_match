# Documentation du Projet LoveMatch

## Vue d'ensemble
LoveMatch est une application de rencontre web basée sur une architecture **Java EE**.
Le backend est développé en Java (Servlets, WebSocket) et le frontend en HTML/CSS/JS.
Le projet utilise **Maven** pour la gestion des dépendances et le déploiement sur un serveur **Tomcat**.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants :

1.  **Java JDK 8** (ou version supérieure compatible).
2.  **Maven** (outil de build et gestion de projet).
    *   Commande de vérification : `mvn -version`
3.  **PostgreSQL** (Serveur de base de données).

> **Note** : Bien que des fichiers Node.js (`package.json`, `server.js`) soient présents, le lancement principal pour le développement Java se fait via Maven.

## Installation et Configuration

### 1. Récupération du Projet
Clonez le dépôt Git ou extrayez l'archive du projet.

### 2. Configuration de la Base de Données
1.  Connectez-vous à votre serveur PostgreSQL.
2.  Créez une base de données nommée `lovematch`.
3.  Créez un utilisateur `nostra` avec le mot de passe `nostra` (ou adaptez la configuration dans le code Java `DatabaseConnection.java` ou équivalent).

```sql
CREATE DATABASE lovematch;
CREATE USER nostra WITH PASSWORD 'nostra';
GRANT ALL PRIVILEGES ON DATABASE lovematch TO nostra;
```

4.  **Initialisation du Schéma** : Exécutez le script `src/main/resources/database_schema.sql`.

5.  **Peuplement des Données (Population)** :
    Il est impératif de peupler la base de données pour que l'application fonctionne correctement (utilisateurs de test, intérêts, etc.).
    Exécutez le script `src/main/resources/populate_data.sql`.



### 3. Installation des Dépendances
À la racine du projet (là où se trouve `pom.xml`), lancez :

```bash
mvn clean install
```
Cette commande va télécharger toutes les dépendances Java nécessaires (JUnit, Servlet API, PostgreSQL Driver, etc.).

## Lancement de l'Application

Pour démarrer le serveur de développement (Tomcat 7 via Maven), utilisez la commande suivante :

```bash
mvn tomcat7:run
```

*   Le serveur démarrera généralement sur le port **8080** (configuré dans `pom.xml`).
*   Accédez à l'application via : **http://localhost:8080/LoveMatch** (ou simplement http://localhost:8080 selon la configuration du context path).

## Structure du Code

*   **`src/main/java/`** : Code source Java (Backend).
    *   Contient les Servlets, les WebSockets endpoints, et la logique métier.
*   **`src/main/resources/`** : Fichiers de configuration et scripts SQL.
    *   `database_schema.sql` : Création des tables.
    *   `populate_data.sql` : Données de test.
*   **`src/main/webapp/`** : Code source Frontend (Fichiers publics).
    *   `index.html`, `connexion.html`, `decouverte.html` : Pages HTML.
    *   `css/`, `js/` : Styles et scripts.
*   **`pom.xml`** : Descripteur de projet Maven (Dépendances, Plugins de build).

## Dépannage

*   **Erreur de connexion BDD** : Vérifiez que PostgreSQL est lancé et que les identifiants dans le code Java correspondent à ceux de votre base.
*   **Port déjà utilisé** : Si le port 8080 est pris, modifiez la configuration dans le `pom.xml` (section `tomcat7-maven-plugin`).
