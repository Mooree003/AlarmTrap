var express = require('express');
var path = require('path');
var router = express.Router();
var mysql = require('mysql2');

var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'myapp'
});

db.connect((err) => {
  if (err) {
      console.error('Database connection error:', err);
      process.exit(1);
  }
  console.log('Connected to database');
});

// Route to handle root access
router.get('/', function(req, res, next) {
  console.log('Checking for users in the database...');
  // Check if any users exist in the database
  db.query('SELECT COUNT(*) as count FROM users', (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return next(err);
    }

    const userCount = results[0].count;
    console.log(`Number of users found: ${userCount}`);

    // If no users found, redirect to signup
    if (userCount === 0) {
      console.log('No users found, redirecting to signup.');
      return res.redirect('/signup');
    }

    // If users exist, redirect to login
    console.log('Users found, redirecting to login.');
    return res.redirect('/login');
  });
});

router.get('/login', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.post('/login', function(req, res, next) {
  const { password } = req.body;

  db.query('SELECT * FROM users LIMIT 1', (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return next(err);
      }

      if (results.length === 0) {
          console.log('No users found');
          return res.redirect('/signup');
      }

      const user = results[0];

      // Compare the input password with the stored password
      if (password === user.password) {
          console.log('Password match');
          req.session.loggedIn = true;
          res.redirect('/home');
      } else {
          console.log('Invalid password');
          res.redirect('/login');
      }
  });
});

router.get('/home', function(req, res, next) {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, '../public/home.html'));
  } else {
    console.log('Session not found');
    res.redirect('/login');
  }
});


router.post('/change-password', function(req, res, next) {
  const { currentPassword, newPassword } = req.body;

  if (!req.session.loggedIn) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  db.query('SELECT * FROM users LIMIT 1', (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: "Database error" });
      }
      if (results.length === 0) {
          return res.status(404).json({ success: false, message: "User not found" });
      }

      const user = results[0];

      // Compare the current password with the stored password
      if (currentPassword !== user.password) {
          return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }

      // Update the password
      db.query('UPDATE users SET password = ? LIMIT 1', [newPassword], (err) => {
          if (err) {
              console.error('Database update error:', err);
              return res.status(500).json({ success: false, message: "Failed to update password" });
          }

          res.json({ success: true, message: "Password updated successfully" });
      });
  });
});

router.get('/logs', function(req, res, next) {
  if (req.session.loggedIn) {
    res.sendFile(path.join(__dirname, '../public/logs.html'));
  } else {
    console.log('Session not found');
    res.redirect('/login');
  }
});

router.get('/api/logs', function(req, res, next) {
  db.query('SELECT * FROM logs ORDER BY timestamp DESC', (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ error: 'Failed to retrieve logs' });
      }
      res.json(results.map(log => ({
          id: log.id,
          image: `data:image/jpeg;base64,${log.image.toString('base64')}`,
          timestamp: new Date(log.timestamp).toLocaleString()
      })));
  });
});

router.delete('/api/clear-logs', async function(req, res, next) {
  try {
    const [result] = await db.promise().query('DELETE FROM logs');
    await db.promise().query('ALTER TABLE logs AUTO_INCREMENT = 1');
    
    console.log('Logs cleared and auto-increment reset successfully');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

router.post('/set-activation-code', function(req, res, next) {
  const { code } = req.body;

  // Ensure the code is a 4-digit number
  if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ success: false, message: "Invalid code format. Code must be 4 digits." });
  }

  // Check if the code already exists
  db.query('SELECT * FROM codes WHERE activation_code = ?', [code], (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: "Database error while checking activation code." });
      }

      // If the code already exists, send an error message
      if (results.length > 0) {
          return res.status(400).json({ success: false, message: "This activation code already exists. Please choose a different code." });
      }

      // If the code doesn't exist, insert it
      db.query('INSERT INTO codes (activation_code) VALUES (?)', [code], (err, results) => {
          if (err) {
              console.error('Database query error:', err);
              return res.status(500).json({ success: false, message: "Database error while inserting activation code." });
          }
          res.json({ success: true, message: "Activation code added successfully!" });
      });
  });
});

// Verifies the activation code
router.post('/verify-activation-code', function(req, res, next) {
  const { code, action } = req.body;

  db.query('SELECT * FROM codes WHERE activation_code = ?', [code], (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: "Database error while verifying activation code." });
      }

      if (results.length === 0) {
          return res.status(400).json({ success: false, message: "Invalid activation code." });
      }
      
      res.json({ success: true, message: `Alarm system has been ${action === 'activate' ? 'activated' : 'deactivated'} successfully.` });
  });
});

// Get the current alarm state (0 for deactivated, 1 for activated)
router.get('/api/alarm-state', function(req, res, next) {
  db.query('SELECT state FROM alarm_state LIMIT 1', (err, results) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: 'Failed to retrieve alarm state' });
      }
      
      const alarmState = results.length > 0 ? results[0].state : 0;
      res.json({ success: true, state: alarmState });
  });
});

router.post('/update-alarm-state', (req, res) => {
  const { state } = req.body;
  
  const alarmState = parseInt(state, 10);
  
  if (alarmState !== 0 && alarmState !== 1) {
      return res.status(400).json({ success: false, message: 'Invalid state value. Must be 0 or 1.' });
  }

  db.query('UPDATE alarm_state SET state = ? LIMIT 1', [alarmState], (err, results) => {
      if (err) {
          console.error('Database update error:', err);
          return res.status(500).json({ success: false, message: 'Failed to update alarm state' });
      }
      res.json({ success: true, message: 'Alarm state updated successfully' });
  });
});

// Signup route and other existing routes remain unchanged
router.get('/signup', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

// Handle sign-up form submission
router.post('/signup', function(req, res, next) {
  const { email, password } = req.body;

  // Insert the new user into the database
  db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err) => {
    if (err) {
      console.error('Error inserting new user:', err);
      return res.status(500).send('Error signing up');
    }
    console.log('User signed up successfully');
    res.redirect('/login');
  });
});


module.exports = router;