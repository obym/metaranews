const fs = require('fs');
const https = require('https');

function download(url, dest) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) {
      console.log('Redirecting to:', res.headers.location);
      return download(res.headers.location, dest);
    }
    if (res.statusCode !== 200) {
      console.error('Failed to download, status code:', res.statusCode);
      return;
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded successfully to', dest);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Error downloading:', err.message);
  });
}

download('https://drive.google.com/uc?export=download&id=16MUhUG_rwJiGwuGzgYKg4lCFnOWMbI-v', 'public/lampiran_penawaran.pdf');
