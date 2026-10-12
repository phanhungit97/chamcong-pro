const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DB_FILE = path.join(ROOT_DIR, 'data', 'database.js');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // API Auto-Save directly to data/database.js
    if (req.method === 'POST' && req.url === '/api/save-database') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                const fileContent = `/**
 * File dữ liệu lưu trữ cố định trong thư mục dự án (tinhcong/data/database.js).
 * Tự động cập nhật mỗi khi bạn chấm công!
 */
window.CHAM_CONG_DEFAULT_DATA = ${JSON.stringify(parsed, null, 2)};
`;
                // Đảm bảo thư mục data tồn tại
                const dataDir = path.dirname(DB_FILE);
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }

                fs.writeFileSync(DB_FILE, fileContent, 'utf-8');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Đã tự động ghi vào data/database.js' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // Static Files
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, decodeURIComponent(reqPath));

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Ứng dụng Chấm Công Pro đang chạy tại: port ${PORT}`);
    console.log(`💾 Tính năng TỰ ĐỘNG GHI vào data/database.js ĐANG BẬT!`);
    console.log(`========================================\n`);

    // Tự động mở trình duyệt nếu chạy trên Windows máy cá nhân
    if (process.platform === 'win32' && !process.env.RENDER) {
        exec(`start http://localhost:${PORT}`);
    }
});
