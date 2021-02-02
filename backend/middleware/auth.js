const jwt = require('jsonwebtoken');

require('dotenv').config();
let key = process.env.JWT_KEY;

module.exports = (req, res, next) => {
    try {
        // Vérification de l'utilisateur grâce au token d'authentification.
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, `${key}`);
        const userId = decodedToken.userId;
        
        if (req.body.userId && req.body.userId !== userId) {
            throw "Invalid user ID";
        } else {
            next();
        }
    } catch {
        res.status(401).json({
            error: new Error("Invalid request!")
        });
    }
};