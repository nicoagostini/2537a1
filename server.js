const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');
const bcrypt = require('bcrypt');
const MongoStore = require('connect-mongo'); 
const MongoClient = require('mongodb').MongoClient;
const Joi = require('joi');


dotenv.config();

const saltRounds = Number(process.env.SALT_ROUNDS);

const expireTime = parseInt(process.env.EXPIRE_TIME);

const port = process.env.PORT || 3000;

const mongoUri = process.env.MONGO_URI;

const client = new MongoClient(mongoUri);

const app = express();

app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/public", express.static("./public"));


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
    store: MongoStore.create({ mongoUrl: mongoUri, crypto: { secret: process.env.SESSION_SECRET } }),
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000
    }
}));

app.get('/', (req, res) => {

    if(!req.session.authenticated){
        console.log("User not authenticated");
        res.render('index', { session: req.session });
        return;
    }
    console.log("User authenticated");
    res.render('index', { session: req.session });
    return;
});

app.get('/login', (req, res) => {
    res.render('login');
    return;
});

app.post('/login', async (req, res) => {
    
    if(req.session.authenticated){
        console.log("User already logged in");
        res.redirect('/members');
        return;
    }

    var { username, password } = req.body;
    var db = await connectToDB();

    const schema = Joi.object(
        {
        username: Joi.string().email().required(),
        password: Joi.string().max(20).required()
        });
    const validationResult = schema.validate(req.body);
    if(validationResult.error){
        console.log("Validation failed");
        res.render('signupError', { error: validationResult.error.details[0].message });
        return;
    }
    try{
        
        var user = await db.collection('users').findOne({ username: username });
        if(user.username == username){
            if(bcrypt.compareSync(password, user.password)){
                req.session.authenticated = true;
                req.session.name = user.name;
                console.log("User logged in");
                console.log(req.session);
                res.redirect('/members');
                return;
            }
            console.log("Invalid password but checking");
            res.redirect('/login');
            return;
        }
        console.log("Invalid username or password yolo");
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
    res.render('signup');
});
app.post('/signup', async (req, res) => {

    const schema = Joi.object(
        {
        name: Joi.string().alphanum().max(20).required(),   
        username: Joi.string().email().required(),
        password: Joi.string().max(20).required()
        });

    const validationResult = schema.validate(req.body);
    console.log(validationResult.error.details[0].message);
    if(validationResult.error){
        console.log("Validation failed");
        res.render('signupError', { error: validationResult.error.details[0].message });
        return;
    }
    var { name, username, password } = req.body;
    if(!name){
        res.render('signupError', { error: 'Name is required' });
        return;
    }
    if(!username){
        res.render('signupError', { error: 'Email is required' });
        return;
    }
    if(!password){
        res.render('signupError', { error: 'Password is required' });
        return;
    }

    var db = await connectToDB();

    if(await db.collection('users').findOne({ username: username })) {
        res.render('signupError', { error: 'Email already exists' });
        return;
    }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
    var user = {
        name: name,
        username: username,
        password: hashedPassword
    };

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
    if(!req.session.authenticated){
        console.log("User not authenticated");
        res.redirect('/login');
        return;
    }
    var randImgId = Math.floor(Math.random() * 3) + 1;
    console.log("User authenticated");
    res.render('members', { name: req.session.name , imageId: randImgId});
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