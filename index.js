// Configs (Assign all configurations to the global object so that I can simply access them throughout all files)
global.configs = require('./config.js');


// Dependencies
const { express, app } = require('./lib/server')
const { mongoose } = require('./lib/mongoose');




// ROUTES --------------------------------------------------

// Routes functions
const { authenticateToken, isAdmin, isAllowed, isNotAllowed } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users'); // users CURD Route


// auth
app.use('/api/auth', authRoutes);

// Users
app.use('/api/users', authenticateToken, usersRoutes);


// Protected route example
app.get('/dashboard', authenticateToken, (req, res) => {
  // req.user contains the user information extracted from the JWT
  return res.status(200).json({ message: 'Welcome to the dashboard!', user: req.user });
});




// Example usage of isAdmin middleware to protect a route
app.get('/admin', authenticateToken, isAdmin, (req, res) => {
  // Only Admins can access this route
  return res.status(200).json({ message: 'Welcome, Admin!' });
});

// Example usage of isAllowed middleware to protect a route
app.get('/sales', authenticateToken, isAllowed(['Sales', 'Admin']), (req, res) => {
  // Only users with 'Sales' or 'Admin' role can access this route
  return res.status(200).json({ message: 'Welcome, Sales team!' });
});

// Example usage of isNotAllowed middleware to protect a route
app.get('/marketing', authenticateToken, isNotAllowed(['Sales', 'Support']), (req, res) => {
  // All roles except 'Admin' can access this route
  return res.status(200).json({ message: 'Welcome, Marketing team!' });
});



