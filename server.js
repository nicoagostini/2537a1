const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

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