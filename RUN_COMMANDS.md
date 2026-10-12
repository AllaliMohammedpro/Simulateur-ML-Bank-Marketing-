# Comment lancer l'application

## Entraîner les modèles optimisés

Depuis le dossier `backend`, installez les dépendances puis lancez :

```bash
python -m app.train
```

Cette commande compare SVM, Random Forest et MLP par validation croisée, règle
leurs seuils pour le F1 de la classe `yes`, puis écrit les modèles et le rapport
`backend/app/artifacts/training_report.json`. Le jeu de test fixe (20 %, graine
42) sert uniquement à l'évaluation finale. Après un nouvel entraînement,
redémarrez le backend pour charger les nouveaux artefacts.

Voici les commandes pour exécuter l'application la prochaine fois. L'application est divisée en deux parties : le frontend (interface utilisateur) et le backend (API).

## 1. Démarrer le Backend (API)

Ouvrez un terminal, placez-vous dans le dossier `backend` et exécutez le serveur avec `uvicorn` :

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Le backend sera disponible sur `http://localhost:8000`.

*Note: Si vous modifiez les modèles ou souhaitez les réentraîner, vous devez exécuter `python -m app.train` depuis le dossier backend avant de lancer le serveur.*

## 2. Démarrer le Frontend (Interface Utilisateur)

Ouvrez un nouveau terminal, placez-vous dans le dossier `frontend`, installez les dépendances si ce n'est pas déjà fait, puis démarrez le serveur de développement Vite :

```bash
cd frontend
npm install
npm run dev
```
Le frontend sera accessible dans votre navigateur (généralement à l'adresse `http://localhost:5173`).

## Commandes PowerShell avec l'environnement créé pour ce projet

Depuis la racine du projet :

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.train
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Dans un deuxième terminal, depuis `frontend`, lancez `npm run dev`. Si vous
réentraînez les modèles, arrêtez puis relancez le backend afin qu'il recharge
les fichiers `.joblib`.
