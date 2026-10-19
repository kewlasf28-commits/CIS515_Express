// CIS 515 - Module 9 Project Part 5
// Express.js Server and Contact Form Handler

const express = require('express');
const app = express();
const PORT = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to read form data
app.use(express.urlencoded({ extended: true }));

// Serve files from the public directory
app.use(express.static('public'));

// Route for home page
app.get('/', (req, res) => {
    res.render('index', { message: '' });
});

// Route for contact page
app.get('/contact', (req, res) => {
    res.render('contact', { message: '' });
});

// Route for about page
app.get('/about', (req, res) => {
    res.render('about', { message: '' });
});

// Route to handle contact form submissions
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    console.log('Form Data Received:');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);

    // Display submitted information on thank-you page
    res.render('thanks', {
        name: name,
        email: email,
        message: message
    });
});

// Start the Express server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});