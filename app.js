const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const db = new sqlite3.Database('Users.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

// Serve the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the login page at /login
app.get(['/login','/login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the journal, planner, and track pages
app.get('/j.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'j.html'));
});

app.get('/p.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'p.html'));
});

app.get('/t.html', (req, res) => {
    res.sendFile(path.join(__dirname, 't.html'));
});

// Route to serve registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'reg.html'));
});

// Serve the home page
app.get('/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});


// Handle login requests without the .html extension
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Query to find user in the database
    const sql = 'SELECT * FROM Users WHERE email = ? AND password = ?';
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (row) {
            return res.status(200).json({ 
                message: 'Login successful', 
                redirect: '/home.html',
                userId: row.id  // Sending userId back to the client
            });
        } else {
            // User not found, send failure response
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    });
});




// Register route to add user to the database
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    // SQL to insert a new user
    const sql = `INSERT INTO Users (email, password) VALUES (?, ?)`;
    db.run(sql, [email, password], (err) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Database error: ' + err.message);
        }

        res.send('Registration successful! You can now log in.');
    });
});


// Endpoint to save a journal entry
app.post('/save-entry', (req, res) => {
    const { user_id, entry_date, entry_text } = req.body;
    console.log('Received data:', { user_id, entry_date, entry_text }); 
    // Insert the journal entry into the database
    const sql = `INSERT INTO JournalEntries (user_id, entry_date, entry_text) VALUES (?, ?, ?)`;
    db.run(sql, [user_id, entry_date, entry_text], function (err) {
        if (err) {
            console.error('Error saving entry:', err.message);
            return res.status(500).json({ message: 'Error saving entry' });
        }
        res.json({ message: 'Entry saved successfully!' });
    });
});

// Endpoint to retrieve journal entries
app.get('/entries', (req, res) => {
    const { user_id, start_date, end_date } = req.query;

    // Fetch entries for the user within the specified date range
    const sql = `SELECT entry_date, entry_text FROM JournalEntries 
                 WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date ASC`;
    db.all(sql, [user_id, start_date, end_date], (err, rows) => {
        if (err) {
            console.error('Error fetching entries:', err.message);
            return res.status(500).json({ message: 'Error fetching entries' });
        }
        res.json(rows);
    });
});


// Close the database connection when the app exits
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database closed');
        process.exit(0);
    });
});

module.exports = app;
