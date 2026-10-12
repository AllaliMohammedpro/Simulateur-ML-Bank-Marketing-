# Optimisation du F1 — Bank Marketing

La classe positive est `y = yes`. Le fichier contient 4 521 clients, dont 521
positifs (11,5 %). Le partage de test est celui du TP : 20 % des lignes,
`random_state=42`, avec stratification (905 clients, dont 104 positifs).

## Résultats mesurés sur le test fixe

| Modèle | F1 initial | F1 optimisé | Précision | Rappel | Seuil « yes » |
|---|---:|---:|---:|---:|---:|
| SVM | 0,266 | **0,555** | 0,493 | 0,635 | 0,274 |
| Random Forest | 0,390 | 0,515 | 0,429 | 0,644 | 0,449 |
| MLP | 0,373 | 0,530 | 0,455 | 0,635 | 0,261 |

Les paramètres et les valeurs non arrondies sont dans
`backend/app/artifacts/training_report.json`. Le SVM a le meilleur F1 sur ce
test. La validation croisée donne cependant 0,573 à Random Forest et 0,560 au
SVM : si le concours utilise un autre jeu de test, ce classement peut changer.
Le rapport nomme donc Random Forest comme modèle recommandé selon la
validation, avant observation du test.

## Méthode

1. Séparation du test avant tout prétraitement.
2. `OneHotEncoder` pour les catégories ; `StandardScaler` pour les variables
   numériques du SVM et du MLP. Chaque transformation appartient au pipeline
   du modèle et est réapprise dans chaque pli de validation.
3. Recherche aléatoire bornée des hyperparamètres, avec F1 comme critère et
   trois plis stratifiés sur la partie entraînement.
4. Recherche du seuil F1 sur des probabilités obtenues hors pli, avec cinq
   plis stratifiés sur cette même partie entraînement.
5. Réentraînement du modèle choisi sur toute la partie entraînement, puis une
   évaluation sur le test réservé. Le seuil est appliqué également dans l'API.

Le F1 initial provient des anciens modèles sauvegardés. Leur normalisation
avait été apprise avant le partage train/test ; la comparaison initiale est
donc indicative. Aucun choix du nouveau pipeline n'a été ajusté à partir des
étiquettes du test.

La variable `duration` est conservée, comme dans le TP. Elle n'est connue
qu'après l'appel ; ce modèle sert à comparer les algorithmes sur ce benchmark,
pas à prédire avant d'appeler le client.
