const passwordValidator = require('password-validator');

const schema = new passwordValidator();

schema
.is().min(8)                    // Longueur minimale: 8
.is().max(100)                  // Longueur maximale: 100
.has().uppercase()              // Doit contenir des majuscules
.has().lowercase()              // Doit contenir des minuscules
.has().digits()                 // Doit contenir des chiffres
.has().symbols()                // Doit contenir des caractères spéciaux
.has().not().spaces()           // Ne doit pas contenir d'espaces


module.exports = (req, res, next) => {
    try {        
        if (schema.validate(req.body.password)) {
            next();
        } else {
            throw 'Invalid password !';
        }
    } catch {
        res.status(400).json({
            error: new Error('Invalid password, must be at least 8 characters containing at least one lower case, one upper case, one number and one special character.')
        });
    }
}