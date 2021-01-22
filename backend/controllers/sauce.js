const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {res.status(200).json(sauce)})
    .catch(error => res.status(404).json({ error }));
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: '0',
        dislikes: '0'
    });
    sauce.save()
    .then(() => res.status(201).json({ message: 'Nouvelle sauce créée !' }))
    .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {    
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
        
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
            .catch(error => res.status(500).json({ error }));
        })
    })
};

exports.voteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {        
        const like = JSON.parse(req.body.like);
        let userId = req.body.userId;
        
        if (like === 1 && !sauce.usersLiked.includes(userId)) {
            sauce.usersLiked.push(userId);
            sauce.likes++;
            console.log(sauce.usersLiked);
            Sauce.updateOne({ _id: req.params.id }, { likes: sauce.likes, usersLiked: sauce.usersLiked })
            .then(() => res.status(200).json({ message: 'Vous aimez cette sauce !'}))
            .catch(error => res.status(400).json({ error }));
        }
        if (like === -1 && !sauce.usersDisliked.includes(userId)) {
            sauce.usersDisliked.push(userId);
            sauce.dislikes++;
            console.log(sauce.usersDisliked);
            Sauce.updateOne({ _id: req.params.id }, { dislikes: sauce.dislikes, usersDisliked: sauce.usersDisliked })
            .then(() => res.status(200).json({ message: "Vous n'aimez pas cette sauce !"}))
            .catch(error => res.status(400).json({ error }));
        }

        if (like === 0) {
            if (sauce.usersLiked.includes(userId)) {
                let index = sauce.usersLiked.indexOf(userId);
                sauce.usersLiked.splice(index, 1);
                sauce.likes--;
                console.log(sauce.usersLiked);

                Sauce.updateOne({ _id: req.params.id }, { likes: sauce.likes, usersLiked: sauce.usersLiked })
                .then(() => res.status(200).json({ message: "Votre avis a été retiré !"}))
                .catch(error => res.status(400).json({ error }));
                
            }
            if (sauce.usersDisliked.includes(userId)) {
                let index = sauce.usersDisliked.indexOf(userId);
                sauce.usersDisliked.splice(index, 1);
                sauce.dislikes --;
                console.log(sauce.dislikes);
                console.log(sauce.usersDisliked);

                Sauce.updateOne({ _id: req.params.id }, { dislikes: sauce.dislikes, usersDisliked: sauce.usersDisliked })
                .then(() => res.status(200).json({ message: "Votre avis a été retiré !"}))
                .catch(error => res.status(400).json({ error }));
            }
        }
    })
    .catch(error => res.status(404).json({ error }));
};