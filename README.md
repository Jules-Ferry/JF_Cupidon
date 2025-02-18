# Cupidon 💘

**Plateforme du service Cupidon**  
*Utilisée lors de la Saint-Valentin pour la distribution des roses, Cupidon gère la prise de commande, le suivi des paiements et la distribution des roses.*

---

## Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Configuration](#configuration)
- [Installation et lancement](#installation-et-lancement)
- [Utilisation](#utilisation)
- [Licence](#licence)
---

## Présentation

Cupidon est une plateforme web dédiée à la gestion des commandes de roses lors de la Saint-Valentin. Conçue pour assurer une distribution fluide et sécurisée, elle permet de suivre l'état des paiements et la livraison des roses. Inspirée par la magie de l'amour, cette application allie simplicité d'utilisation et robustesse administrative pour un service qui se veut aussi festif qu'efficace.

---

## Fonctionnalités

- **Gestion des commandes** : Prise en charge des commandes de roses avec quantité configurable (entre 1 et 5 roses par commande).
- **Suivi des paiements** : Trois statuts possibles (en attente, payée, gratuité) gérés par des alias numériques.
- **Distribution des roses** : Planification et suivi de la distribution entre une date de début et une date de fin.
- **Sécurité** : Authentification basée sur JWT avec une clé secrète robuste.
- **Interface web** : Serveur web tournant sur le port `8099` et accessible via `localhost:8099`.
- **Gestion des contacts** : Renseignements sur le super administrateur et le manager pour la maintenance du service.
- **Personnalisation scolaire** : Le service est rattaché au *Lycée de l'Arc-en-Ciel*, ce qui peut servir pour contextualiser la plateforme dans un environnement éducatif.

---

## Configuration

Le fichier de configuration (au format JSON) permet d'adapter les paramètres clés du service :

- **Web**
  - **Port** : `8099`
  - **URL** : `localhost:8099`
  - **Contacts** :
    - **SuperAdmin** :  
      - Nom : *Gilles Lazure*  
      - Mail : `exemple@exemple.fr`
    - **Manager** :  
      - Nom : *JUILLIARD Jessica*  
      - Mail : `jessica.julliard@fournisseur.fr`  
      - Téléphone : `+33 6 00 00 00 00`  
      - Rôle : *CPE*
  - **Établissement scolaire** :  
    - Nom : *Lycée de l'Arc-en-Ciel*

- **JWT**
  - **Secret** : Une clé de chiffrement longue et complexe pour sécuriser les tokens.

- **Roses**
  - **Quantité** : Minimum 1 rose, Maximum 5 roses par commande.
  - **Tarification** :  
    - 1 rose = 3€  
    - 2 roses = 6€  
    - 3 roses = 8€  
    - 4 roses = 10€  
    - 5 roses = 12€  
  - **Prix par défaut** : 2€ (si aucune valeur spécifique n'est définie).
  - **Période de distribution** :  
    - Début : `2025-01-22T08:00:00+01:00`  
    - Fin : `2026-02-05T20:19:00+01:00`

- **Authentification**
  - Autorise tous les domaines (`"trusted": ["/*"]`).

- **Alias pour les statuts de commande**
  - `"en attente": "0"`
  - `"payée": "1"`
  - `"Gratuité": "2"`

Vous pouvez adapter ces paramètres dans le fichier de configuration afin de personnaliser le service selon vos besoins.

---

## Installation et lancement

### Prérequis

- [Node.js](https://nodejs.org/) (version recommandée LTS)
- [Git](https://git-scm.com/)

### Étapes d'installation

1. **Cloner le dépôt**  
   ```bash
   git clone https://github.com/Jules-Ferry/JF_Cupidon.git
   cd JF_Cupidon
   ```

2. **Installer les dépendances**  
   ```bash
   npm install
   ```

3. **Configurer l'application**  
   Vérifiez le fichier de configuration (ex. `config.json`) et adaptez-le si nécessaire.

4. **Lancer le serveur**  
   ```bash
   npm start
   ```
   L'application sera alors accessible sur [http://localhost:8099](http://localhost:8099).

---

## Utilisation

- **Accès au service** : Rendez-vous sur [http://localhost:8099](http://localhost:8099) pour accéder à l'interface de gestion.
- **Gestion des commandes** : Suivez l'état des commandes (en attente, payée ou gratuite) et gérez la distribution des roses.
- **Administration** : Les administrateurs (superAdmin et manager) peuvent se connecter via des interfaces dédiées pour gérer les commandes et la configuration du service.

---

## Licence

Ce projet est distribué sous une licence **open source** garantissant que le code reste accessible et modifiable par la communauté.  
*(Précisez ici la licence choisie pour le projet, par exemple la GPL-3.0 ou AGPL-3.0 si c’est votre choix.)*

---

*Cupidon - La magie de la Saint-Valentin au service de l'amour et de la gestion intelligente des commandes de roses.*