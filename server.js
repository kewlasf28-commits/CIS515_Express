// CIS 515
// Module 11 - Project Part 7
// Authentication and Authorization

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const Message = require('./models/message');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// EXPRESS CONFIGURATION
// ==========================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// SESSION CONFIGURATION
// ==========================================

app.use(session({
    secret: process.env.SESSION_SECRET || 'cis515-development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Make logged-in user available to all EJS pages
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.username = req.session.user?.username || '';
    res.locals.message = '';
    next();
});

// ==========================================
// HOME PAGE
// ==========================================

app.get('/', (req, res) => {
    res.render('index', {
        message: req.query.message || ''
    });
});

// ==========================================
// ABOUT PAGE
// ==========================================

app.get('/about', (req, res) => {
    res.render('about', {
        message: ''
    });
});

// ==========================================
// CONTACT PAGE
// ==========================================

app.get('/contact', (req, res) => {
    res.render('contact', {
        message: ''
    });
});

// ==========================================
// SAVE CONTACT MESSAGE
// ==========================================

app.post('/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        const newMessage = new Message({
            name,
            email,
            message
        });

        await newMessage.save();

        console.log('Contact message saved successfully!');

        res.render('thanks', {
            name,
            email,
            message
        });

    } catch (error) {
        console.error('Contact error:', error);

        res.status(500).send(
            'Your message could not be saved.'
        );
    }
});

// ==========================================
// REGISTRATION PAGE
// ==========================================

app.get('/register', (req, res) => {
    res.render('register', {
        message: req.query.message || ''
    });
});

// ==========================================
// REGISTER NEW USER
// ==========================================

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== 'string' ||
            typeof password !== 'string' ||
            !username.trim() ||
            !password
        ) {
            return res.redirect(
                '/register?message=Username and password are required.'
            );
        }

        if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.redirect(
                '/register?message=Password must contain at least 8 characters and no more than 72 bytes.'
            );
        }

        const cleanUsername = username.trim();

        const existingUser = await User.findOne({
            username: cleanUsername
        });

        if (existingUser) {
            return res.redirect(
                '/register?message=Username already exists. Try another.'
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: cleanUsername,
            password: hashedPassword
        });

        await newUser.save();

        console.log('New user registered successfully!');

        return res.redirect(
            '/register?message=You have been successfully registered!'
        );

    } catch (error) {
        console.error('REGISTRATION ERROR:', error.message);
        console.error('ERROR CODE:', error.code);

        if (error.code === 11000) {
            return res.redirect(
                '/register?message=Username already exists.'
            );
        }

        return res.redirect(
            '/register?message=Registration failed. Check server terminal.'
        );
    }
});

// ==========================================
// LOGIN PAGE
// ==========================================

app.get('/login', (req, res) => {
    res.render('login', {
        message: req.query.message || ''
    });
});

// ==========================================
// LOGIN USER
// ==========================================

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== 'string' ||
            typeof password !== 'string' ||
            !username.trim() ||
            !password
        ) {
            return res.redirect(
                '/login?message=Username and password are required.'
            );
        }

        const user = await User.findOne({
            username: username.trim()
        });

        if (!user) {
            return res.redirect(
                '/login?message=Invalid username or password.'
            );
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.redirect(
                '/login?message=Invalid username or password.'
            );
        }

        req.session.regenerate((error) => {
            if (error) {
                console.error('Session error:', error.message);
                return res.status(500).send('Login failed.');
            }

            req.session.user = {
                id: user._id.toString(),
                username: user.username
            };

            req.session.save((error) => {
                if (error) {
                    console.error('Session error:', error.message);
                    return res.status(500).send('Login failed.');
                }

                console.log('User logged in successfully!');

                res.redirect(
                    '/?message=' +
                    encodeURIComponent(
                        `Welcome back, ${user.username}!`
                    )
                );
            });
        });

    } catch (error) {
        console.error('LOGIN ERROR:', error.message);

        res.redirect(
            '/login?message=Login failed. Please try again.'
        );
    }
});

// ==========================================
// PROTECTED DASHBOARD
// ==========================================

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect(
            '/login?message=Please login to access your dashboard.'
        );
    }

    res.render('dashboard', {
        username: req.session.user.username
    });
});

// ==========================================
// LOGOUT
// ==========================================

app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('Logout error:', error.message);

            return res.status(500).send('Logout failed.');
        }

        res.clearCookie('connect.sid');

        res.redirect(
            '/?message=You have been successfully logged out.'
        );
    });
});

// ==========================================
// CONNECT TO MONGODB AND START SERVER
// ==========================================

mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'cis515',
    serverSelectionTimeoutMS: 10000
})
.then(() => {
    console.log('MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
})
.catch((error) => {
    console.error('MONGODB CONNECTION FAILED:', error.message);
    process.exit(1);
});