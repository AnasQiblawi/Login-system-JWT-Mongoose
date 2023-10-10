// Dependencies
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); // for auth
const morgan = require('morgan'); // for logger
const cors = require('cors'); // security


// configs
const { port } = global.configs; // require('../config.js');


// Setup server ---
const app = express();
// const router = express.Router();


// Middleware
// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // for auth
app.use(cors()); // security


// Set rendering engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "pages"));



// Logger
app.use(morgan("dev"));


// Start Server
app.listen(port, () => console.log(`Server started on port ${port}`));


// Export
module.exports = { express, app }