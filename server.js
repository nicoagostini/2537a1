const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcrypt');
const MongoStore = require('connect-mongo');
const MongoClient = require('mongodb').MongoClient;


dotenv.config();

const saltRounds = Number(process.env.SALT_ROUNDS);

const expireTime = Number(process.env.EXPIRE_TIME);

const port = process.env.PORT || 3000;

const mongoUri = process.env.MONGO_URI;

const client = new MongoClient(mongoUri);

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({
    mongoUrl: mongoUri,
    crypto: {
        secret: process.env.SESSION_SECRET
    }
});

async function connectToDB() {
    try {
      await client.connect();
      console.log('Connected to MongoDB Atlas');
      return client.db(process.env.DB_NAME);
    } catch (e) {
      console.error('MongoDB connection failed:', e);
      return;
    }
}


app.use(session({
    secret: process.env.SESSION_SECRET,
    store: mongoStore,
    resave: true,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
    return;
});

app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: __dirname });
    return;
});

app.post('/login', async (req, res) => {
    var { username, password } = req.body;
    var db = await connectToDB();

    try{
        var user = await db.collection('users').findOne({ username: username });
        if(user.username == username){
            if(bcrypt.compareSync(password, user.password)){
                req.session.authenticated = true;
                req.session.username = username;
                req.session.cookie.maxAge = expireTime;
                console.log("User logged in");
                res.redirect('/members');
                return;
            }
        }
        console.log("Invalid username or password");
        res.redirect('/login');
        return;

    }catch(e){
        console.log("User not found");
        res.redirect('/login');
        return;
    }

});

app.get('/logout', (req, res) => {
    req.session.destroy();
    console.log("User logged out");
    res.redirect('/');
    return;
});

app.get('/signup', (req, res) => {
    res.sendFile('signup.html', { root: __dirname });
});
app.post('/signup', async (req, res) => {
    var { name, username, password } = req.body;
    var hashedPassword = await bcrypt.hash(password, saltRounds);
    var user = {
        name: name,
        username: username,
        password: hashedPassword
    };
    
    var db = await connectToDB();

    try{
        await db.collection('users').insertOne(user);
        console.log("User created: " + user.username);
        res.redirect('/login');
        return;
    }catch(e){
        console.log("User not created: " + user.username);
        console.log(e);
        res.redirect('/signup');
        return;
    }
})

app.get('/members', (req, res) => {
    // if(!req.session.authenticated){
    //     console.log("User not authenticated");
    //     res.redirect('/login');
    //     return;
    // }
    console.log("User authenticated");
    res.sendFile('members.html', { root: __dirname });
    return;
})

app.get('/*splat', (req, res) => {
    res.status(404);
    res.send('404 Not Found');
    return;
});

app.listen(port, () => {
    console.log('Server is running on port ' + port);
});