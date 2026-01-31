// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 1. Aktifkan CORS untuk Frontend kita
app.use(cors());

// 2. Middleware untuk menembus CORS Dramabox
const dramaboxProxy = createProxyMiddleware({
    target: 'https://hwztchapter.dramaboxdb.com', // Target API Asli
    changeOrigin: true, // VITAL: Ini yang mengubah header Origin biar lolos
    pathRewrite: {
        '^/api': '/api', // Biar path tetap /api/...
    },
    onProxyReq: (proxyReq, req, res) => {
        // Opsional: Tambahkan header agar terlihat seperti request asli (User-Agent dll)
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
    }
});

// 3. Terapkan Proxy ke route /api
app.use('/api', dramaboxProxy);

// 4. Sajikan file Frontend (index.html)
app.use(express.static(path.join(__dirname)));

// 5. Route default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server Proxy jalan di http://localhost:${PORT}`);
    console.log(`🚀 Buka browser: http://localhost:${PORT}`);
});
