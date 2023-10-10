// Dependencies
const mongoose = require('mongoose');
const { app } = require('./server.js');


// Configs
const { mongoDB_URI, port } = global.configs; // require('../config')

// some code that will only happen once when the app starts for the first time,
//  a new admin account will be created and added to the database when there are no accounts.
//  admin@mail.com:admin123456
const init = require('./init.js');



// init Mongoose
// const mongoDB_URI = 'mongodb://127.0.0.1:27017/balkam_crm?retryWrites=true&w=majorit'
// const mongoDB_URI = 'mongodb://127.0.0.1:27017/balkam_crm'

(async () => {
    console.log('Connecting to Database...')
    await mongoose.connect(mongoDB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // autoIndex: true,
        // useCreateIndex: true,
    })
        .then(() => {
            console.info('db is conncected...');
            // start server
            // app.listen((port), () => { console.log('App is running on port: ' + port) })
            
            // initiating the app
            init()
        })
        .catch((error) => { 
            console.error(error)
            app.use('*', (req, res) => res.send("Can't connect to database"));
        });
})()





// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//     console.log('Connected to MongoDB');
// });



module.exports = mongoose;
