# CORE — prototype cliquable

Maquette front-end de CORE (Creators & Originals Resource Exchange), curated by The Art Plug. Aucun backend : l'état (rôle, suivis, demandes, modifications) vit dans le navigateur (`localStorage`).

## Ouvrir

```bash
cd core-prototype
python3 -m http.server 8765
# puis http://localhost:8765
```

Ouvrir `index.html` directement dans le navigateur marche aussi.

## Naviguer

Le bouton **Prototype** en bas à gauche liste les 10 écrans et permet de changer de rôle :

| Rôle | Persona | Écrans clés |
|---|---|---|
| Visiteur | non connecté | accueil, découverte, profils, œuvres |
| Collectionneur | Sam Rivera, Miami | ma collection, demandes envoyées |
| Créatrice | Inès Moreau, Paris | studio : stats, œuvres, demandes, profil, abonnement |
| Admin | Marcel Katz, The Art Plug | validation des profils, modération, rotation du spotlight |

« Reset prototype data » remet tout à zéro.

## Fichiers

- `js/data.js` : créateurs, œuvres, demandes, file d'admin (tout est fictif).
- `js/art.js` : génère les visuels des œuvres à partir d'une palette et d'une graine. Pour passer à de vraies photos, remplacer `Art.src()`.
- `js/app.js` : routeur et écrans.
- `css/styles.css` : design system (tokens en tête de fichier) et animations.

## À fournir par The Art Plug

- Logo officiel et photos (Power House, murals, collabs) pour remplacer les éléments typographiques.
- Le handle Instagram exact à afficher (la presse cite `@theartplugpowerhouse`).
