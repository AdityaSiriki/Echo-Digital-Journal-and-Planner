const app = require('./app'); // Import the app
const PORT = process.env.PORT || 3001; // Ensure the port is set to 3001

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
