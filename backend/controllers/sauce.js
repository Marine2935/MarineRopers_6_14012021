const Sauce = require('../models/Sauce');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }));
};

exports.createSauce = (req, res, next) => {
    // Vérifie que le fichier envoyé est bien une image.
    if (req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png') {
        const sauceObject = JSON.parse(req.body.sauce);

        // Suppression de l'id qui aurait pu être généré afin qu'il soit créé par MongoDB.
        delete sauceObject._id;

        // Filtrage du contenu reçu du formulaire de création de produit. Tout élément non autorisé (balises script, ...) est supprimé.
        for (let i in sauceObject) {        
        sauceObject[i] = sanitizeHtml(sauceObject[i]);
        }

        const sauce = new Sauce({        
            ...sauceObject,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
            likes: '0',
            dislikes: '0'
        });
        
        sauce.save()
        .then(() => res.status(201).json({ message: "Nouvelle sauce créée !" }))
        .catch(error => res.status(400).json({ error }));
    } else {
        res.status(400).json({ error: new Error("Invalid image format !") });
    }
};

exports.modifySauce = (req, res, next) => {   
    // Si une nouvelle image est envoyée, l'image initiale est supprimée du dossier images. 
    if (req.file) {
        Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            
            fs.unlink(`images/${filename}`, (error => {
                if (error) throw error;                
            }));
        })
        .catch(error => res.status(404).json({ error }));
    }

    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
        
        for (let i in sauceObject) {        
            sauceObject[i] = sanitizeHtml(sauceObject[i]);
        }

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {        
        const filename = sauce.imageUrl.split('/images/')[1];

        // Suppression de l'image stockée dans le dossier image puis suppression de la sauce sélectionnée.
        fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: "Sauce supprimée !" }))
            .catch(() => res.status(500).json({ error }));
        })
    })
    .catch(error => res.status(404).json({ error }))
};

exports.voteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {        
        const userId = req.body.userId;
        const userWantsToLike = (req.body.like === 1);
        const userWantsToDislike = (req.body.like === -1);
        const userWantsToCancel = (req.body.like === 0);
        const userHasAlreadyLiked = sauce.usersLiked.includes(userId);
        const userHasAlreadyDisliked = sauce.usersDisliked.includes(userId);
        
        if (userWantsToLike && !userHasAlreadyLiked) {
            sauce.usersLiked.push(userId);
        }

        if (userWantsToDislike && !userHasAlreadyDisliked) {
            sauce.usersDisliked.push(userId);
        }

        if (userWantsToCancel) {
            if (userHasAlreadyLiked) {
                let index = sauce.usersLiked.indexOf(userId);
                sauce.usersLiked.splice(index, 1);
            }

            if (userHasAlreadyDisliked) {
                let index = sauce.usersDisliked.indexOf(userId);
                sauce.usersDisliked.splice(index, 1);
            }
        }

        sauce.likes = sauce.usersLiked.length;
        sauce.dislikes = sauce.usersDisliked.length;

        Sauce.updateOne({ _id: req.params.id }, { likes: sauce.likes, dislikes: sauce.dislikes, usersLiked: sauce.usersLiked, usersDisliked: sauce.usersDisliked })
        .then(() => res.status(200).json({ message: "Votre avis a été pris en compte !"}))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(404).json({ error }));
};