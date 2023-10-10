// Dependencies
const jwt = require('jsonwebtoken');
const { secretKey, cookieName, tokenExpiresDuration } = global.configs.JWT;


// Generate a JWT token for the new user with an expiration duration
// Eample: obj = { _id: User._id, role: newUser.role }
function generateToken(obj) {
  const token = jwt.sign(obj, secretKey, {
    expiresIn: tokenExpiresDuration, // Token expires duration, eg. "30d" == 30 days
  });

  return token;
};


// Check Authentication Token
function authenticateToken(req, res, next) {
  const token = req.cookies[cookieName];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  });
}






// Only Admin role cann pass
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only Admins allowed.' });
  }
  next();
}

// allowedRoles == array of allowed roles == [ 'Admin', 'Sales']
function isAllowed(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized: Role not allowed for this operation.' });
    }
    next();
  };
}


// isNotAllowed == array of not allowed roles == ['Marketing', 'Support']
function isNotAllowed(forbiddenRoles) {
  return (req, res, next) => {
    if (forbiddenRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized: Role not allowed for this operation.' });
    }
    next();
  };
}


// Exports
module.exports = {
  generateToken,
  authenticateToken,
  isAdmin,
  isAllowed,
  isNotAllowed,
};