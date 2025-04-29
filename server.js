const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');

dotenv.config();

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const port = process.env.PORT || 3000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: __dirname });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    res.redirect('/members');
});

app.get('/logout', (req, res) => {
    res.sendFile('logout.html', { root: __dirname });
});

app.get('/signup', (req, res) => {
    res.sendFile('signup.html', { root: __dirname });
});
app.post('/signup', (req, res) => {
    const { name, username, password } = req.body;
    console.log(name, username, password);
    res.redirect('/members');
})

app.get('/members', (req, res) => {
    res.sendFile('members.html', { root: __dirname });
})

app.get('/*splat', (req, res) => {
    res.status(404);
    res.send('404 Not Found');
});

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});