const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Support large drawing data

// Serve static files from the frontend build
const CLIENT_BUILD_PATH = path.join(__dirname, '../../../dist/apps/web');
app.use(express.static(CLIENT_BUILD_PATH));

// Root route (API availability check)
// app.get('/', (req, res) => {
//   res.send('Drawnix Server is running');
// });

// List all drawings with pagination and search
app.get('/api/drawings', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const title = req.query.title || '';
  const offset = (page - 1) * pageSize;

  let countSql = 'SELECT COUNT(*) as total FROM drawings';
  let dataSql = 'SELECT id, title, created_at, updated_at FROM drawings';
  let params = [];

  if (title) {
    const whereClause = ' WHERE title LIKE ?';
    countSql += whereClause;
    dataSql += whereClause;
    params.push(`%${title}%`);
  }

  dataSql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';

  db.get(countSql, params, (err, countRow) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    const total = countRow.total;
    const dataParams = [...params, pageSize, offset];

    db.all(dataSql, dataParams, (err, rows) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        message: 'success',
        total,
        data: rows
      });
    });
  });
});

// Get a single drawing
app.get('/api/drawings/:id', (req, res) => {
  const sql = 'SELECT * FROM drawings WHERE id = ?';
  const params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Drawing not found' });
      return;
    }
    res.json({
      message: 'success',
      data: row
    });
  });
});

// Create a new drawing
app.post('/api/drawings', (req, res) => {
  const { title, data } = req.body;
  const sql = 'INSERT INTO drawings (title, data) VALUES (?, ?)';
  const params = [title, JSON.stringify(data)];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      data: {
        id: this.lastID,
        title
      }
    });
  });
});

// Update a drawing
app.put('/api/drawings/:id', (req, res) => {
  const { title, data } = req.body;
  const sql = `UPDATE drawings SET 
               title = COALESCE(?, title), 
               data = COALESCE(?, data), 
               updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?`;
  const params = [title, JSON.stringify(data), req.params.id];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'success',
      changes: this.changes
    });
  });
});

// Delete a drawing
app.delete('/api/drawings/:id', (req, res) => {
  const sql = 'DELETE FROM drawings WHERE id = ?';
  const params = [req.params.id];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: 'deleted',
      changes: this.changes
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// All other requests return the React app, so it can handle routing
app.get('*', (req, res) => {
  res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});
