const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const chalk = require('chalk');
const { checkAccessibility } = require('./accessibility/checker');

let server = null;
let io = null;

/**
 * Start the preview server
 * @param {string} docRoot - Documentation root directory
 * @param {number} port - Port to listen on
 */
function start(docRoot, port = 3000) {
  const app = express();
  server = http.createServer(app);
  io = socketIo(server);
  
  // Serve static files
  app.use(express.static(path.resolve(docRoot)));
  
  // Inject socket.io client
  app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
      res.sendFile(path.resolve(docRoot, req.path), {}, (err) => {
        if (err) next(err);
      });
    } else {
      next();
    }
  });
  
  // Fallback to index.html for SPA-like navigation
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.includes('.')) {
      res.sendFile(path.resolve(docRoot, 'index.html'), {}, (err) => {
        if (err) next(err);
      });
    } else {
      next();
    }
  });
  
  // API endpoint for accessibility checking
  app.post('/api/check-accessibility', express.text({ type: '*/*' }), async (req, res) => {
    try {
      const htmlContent = req.body;
      const issues = await checkAccessibility(htmlContent);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Handle accessibility testing requests
    socket.on('test-accessibility', async (data) => {
      try {
        const issues = await checkAccessibility(data.html);
        socket.emit('accessibility-results', issues);
      } catch (error) {
        socket.emit('accessibility-results', { error: error.message });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
  
  // Start server
  server.listen(port, () => {
    console.log(chalk.green(`Server running at http://localhost:${port}`));
  });
  
  // Handle server errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(chalk.red(`Port ${port} is already in use. Try another port.`));
      process.exit(1);
    } else {
      console.error(chalk.red(`Server error: ${err.message}`));
    }
  });
  
  return server;
}

/**
 * Check if server is running
 * @returns {boolean} True if server is running
 */
function isRunning() {
  return server !== null;
}

/**
 * Notify clients of changes
 */
function notifyChanges() {
  if (io) {
    io.emit('changes', { timestamp: new Date().toISOString() });
  }
}

/**
 * Stop the server
 */
function stop() {
  if (server) {
    server.close();
    server = null;
    io = null;
  }
}

module.exports = {
  start,
  stop,
  isRunning,
  notifyChanges
};