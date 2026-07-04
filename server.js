const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 8000;
const isVercel = Boolean(process.env.VERCEL);

// Connect to SQLite Database (/tmp is writable on Vercel serverless)
const dbPath = isVercel
  ? path.join('/tmp', 'gym.db')
  : path.join(__dirname, 'gym.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    runMigrations();
  }
});

// Create tables if they do not exist
function runMigrations() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS ourlog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT,
        user TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating ourlog table:', err.message);
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS myinfo (
        id INTEGER PRIMARY KEY,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        gender TEXT NOT NULL
      )
    `, (err) => {
      if (err) console.error('Error creating myinfo table:', err.message);
    });
  });
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Default route fallback to homepage
app.get('/', (req, res) => {
  res.redirect('/Home/assig.html');
});

// Intercept routing for PHP endpoints
// 1. Home contex.php (Login / Signup)
app.post('/Home/contex.php', (req, res) => {
  const action = req.body.action || 'login';
  const email = req.body.email ? req.body.email.trim() : '';
  const password = req.body.password;

  if (!email || !password) {
    return res.send(`
      <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center;">
        <h3>Error: Email and password are required fields.</h3>
        <button onclick="history.back()" style="padding: 10px 20px; background: #ff6b00; border: none; color: white; border-radius: 8px; cursor: pointer;">Go Back</button>
      </body>
    `);
  }

  if (action === 'signup') {
    const fullname = req.body.fullname ? req.body.fullname.trim() : '';
    const confirm_password = req.body.confirm_password;

    if (password !== confirm_password) {
      return res.send(`
        <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center;">
          <h3>Error: Password confirmation does not match.</h3>
          <button onclick="history.back()" style="padding: 10px 20px; background: #ff6b00; border: none; color: white; border-radius: 8px; cursor: pointer;">Go Back</button>
        </body>
      `);
    }

    // Check if user already exists
    db.get('SELECT id FROM ourlog WHERE user = ?', [email], (err, row) => {
      if (err) {
        return res.send(`<h3>Error checking user database: ${err.message}</h3>`);
      }
      if (row) {
        return res.send(`
          <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center;">
            <h3>Error: An account with this email already exists.</h3>
            <button onclick="history.back()" style="padding: 10px 20px; background: #ff6b00; border: none; color: white; border-radius: 8px; cursor: pointer;">Go Back</button>
          </body>
        `);
      }

      // Hash password securely
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.run('INSERT INTO ourlog (fullname, user, password) VALUES (?, ?, ?)', [fullname, email, hashedPassword], function(err) {
        if (err) {
          return res.send(`<h3>Error creating account: ${err.message}</h3>`);
        }
        res.send(`
          <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center;">
            <div style="max-width: 400px; margin: 40px auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
              <h2 style="color: #ff6b00;">Sign Up Successful!</h2>
              <p>Registration successful! You have successfully signed up. Toggling back to Login page...</p>
            </div>
            <script>
              setTimeout(() => {
                window.location.href = 'assig.html';
              }, 2000);
            </script>
          </body>
        `);
      });
    });

  } else {
    // Login Verification
    db.get('SELECT * FROM ourlog WHERE user = ?', [email], (err, row) => {
      if (err) {
        return res.send(`<h3>Error accessing database: ${err.message}</h3>`);
      }
      if (row) {
        const passwordMatches = bcrypt.compareSync(password, row.password) || password === row.password;
        if (passwordMatches) {
          return res.send(`
            <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center;">
              <div style="max-width: 400px; margin: 40px auto; background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
                <h2 style="color: #4CAF50;">Success</h2>
                <p>You Have Successfully logged in! Redirecting to dashboard...</p>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '../Core/Workout plan and Diet plan.html';
                }, 1500);
              </script>
            </body>
          `);
        }
      }

      res.send(`
        <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center;">
          <h3>Error: You Have Entered Incorrect Password or Username</h3>
          <button onclick="history.back()" style="padding: 10px 20px; background: #ff6b00; border: none; color: white; border-radius: 8px; cursor: pointer;">Go Back</button>
        </body>
      `);
    });
  }
});

// 2. Core index.php (Membership Submit & Fetch List)
app.post('/Core/index.php', (req, res) => {
  const id = parseInt(req.body.id);
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const gender = req.body.gender;

  if (isNaN(id) || !firstname || !lastname || !gender) {
    return res.send(`
      <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 40px; text-align: center;">
        <h3>Error: All fields are required.</h3>
        <button onclick="history.back()" style="padding: 10px 20px; background: #ff6b00; border: none; color: white; border-radius: 8px; cursor: pointer;">Go Back</button>
      </body>
    `);
  }

  // Insert securely
  db.run('INSERT OR REPLACE INTO myinfo (id, firstname, lastname, gender) VALUES (?, ?, ?, ?)', [id, firstname, lastname, gender], (err) => {
    if (err) {
      console.error('Error inserting member info:', err.message);
    }
    
    // Retrieve and show all members in a styled page
    db.all('SELECT id, firstname, lastname, gender FROM myinfo', [], (err, rows) => {
      if (err) {
        return res.send(`<h3>Error fetching members: ${err.message}</h3>`);
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="style.css">
          <title>Member Registration Status</title>
        </head>
        <body style="padding: 40px; background: #0f172a; color: #f8fafc; font-family: 'Outfit', sans-serif;">
          <div class="calc" style="max-width: 600px; margin: 40px auto; border-radius: 24px; text-align: left; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="color: #ff6b00; border-bottom: 2px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 20px;">Registration Status</h2>
            <p style="color: #4CAF50; font-weight: bold; margin-bottom: 30px;">New record created successfully!</p>
            
            <h3 style="color: #f8fafc; margin-bottom: 15px; font-size: 20px;">Registered Gym Members:</h3>
            <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px;">
              ${rows.map(row => `
                <li style="background: rgba(15, 23, 42, 0.4); padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                  ID: <span style="color: #94a3b8;">${row.id}</span> &mdash; Name: <strong style="color: #f8fafc;">${row.firstname} ${row.lastname}</strong> 
                  <span style="float: right; font-size: 14px; background: rgba(255, 107, 0, 0.1); color: #ff6b00; padding: 2px 8px; border-radius: 6px;">${row.gender === 'm' ? 'Male' : 'Female'}</span>
                </li>
              `).join('')}
            </ul>
            <br><br>
            <button onclick="window.location.href='Workout plan and Diet plan.html'" style="width: 100%; border: none; padding: 14px; border-radius: 12px; color: white; background: linear-gradient(135deg, #ff6b00 0%, #ff8e53 100%); font-weight: bold; font-size: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 107, 0, 0.4); transition: transform 0.2s;">Go Back</button>
          </div>
        </body>
        </html>
      `);
    });
  });
});

module.exports = app;

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
