import app from './app.js';

const PORT = 3000;

// Start the server here so app.js can be imported without opening a port.
app.listen(PORT, () => {
  console.log(`TaskFlow API is running at http://localhost:${PORT}`);
});
