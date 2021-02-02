const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauce');

const app = express();

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    // Limitation du nombre de requêtes à 100 par tranche de 10min.
    windowMs: 10*60*1000,
    max: 100,
    message: 'Too many requests, please try again later.'
});

require("dotenv").config();
let username = process.env.DB_USER;
let password = process.env.DB_PASS;
let host = process.env.DB_HOST;
let collection = process.env.DB_COLL;

mongoose.connect(`mongodb+srv://${username}:${password}@${host}/${collection}?retryWrites=true&w=majority`,
    { useNewUrlParser: true,
      useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(helmet());
app.use(limiter);

app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

module.exports = app;