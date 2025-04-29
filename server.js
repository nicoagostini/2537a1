const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');

dotenv.config();

const app = express();


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// app.get('*', (req, res) => {
//     res.status(404);
//     res.send('404 Not Found');
// });

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});