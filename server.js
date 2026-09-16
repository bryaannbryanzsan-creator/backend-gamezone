const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi koneksi MySQL Aiven menggunakan pooling
const db = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-286ae7ba-coolbrosgits-ab78.f.aivencloud.com',
    port: process.env.DB_PORT || 28138,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD, // Diambil dari Environment Variable Render demi keamanan
    database: process.env.DB_NAME || 'defaultdb',
    waitForConnections: true,
    connectionLimit: 10,
    ssl: {
        rejectUnauthorized: false // Diperlukan agar bisa terkoneksi ke SSL MySQL Aiven dengan aman
    }
});

// Otomatis membuat tabel leaderboard jika belum ada saat backend dinyalakan
const createTableQuery = `
CREATE TABLE IF NOT EXISTS leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

db.query(createTableQuery, (err) => {
    if (err) console.error('Gagal membuat/mengecek tabel:', err.message);
    else console.log('Tabel leaderboard siap digunakan.');
});

// API 1: Mengambil 10 Skor Tertinggi
app.get('/api/leaderboard', (req, res) => {
    const sql = "SELECT username, score FROM leaderboard ORDER BY score DESC LIMIT 10";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// API 2: Memasukkan Skor Baru
app.post('/api/score', (req, res) => {
    const { username, score } = req.body;
    
    if (!username || score === undefined) {
        return res.status(400).json({ error: "Data nama atau skor tidak lengkap" });
    }

    const sql = "INSERT INTO leaderboard (username, score) VALUES (?, ?)";
    db.query(sql, [username, score], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Skor game berhasil masuk ke database!", id: result.insertId });
    });
});

// Cek koneksi server
app.get('/', (req, res) => {
    res.send('Backend Papan Peringkat GameZone Aktif! ðŸš€');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server leaderboard berjalan di port ${PORT}`);
});
