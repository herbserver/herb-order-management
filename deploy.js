const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const config = {
  host: '213.210.21.40',
  port: 22,
  username: 'root',
  password: 'HerbOnN@2026',
  readyTimeout: 99999
};

const filesToUpload = [
  { local: 'public/app.js', remote: '/var/www/oms-app/public/app.js' },
  { local: 'public/admin.html', remote: '/var/www/oms-app/public/admin.html' },
  { local: 'public/employee.html', remote: '/var/www/oms-app/public/employee.html' },
  { local: 'public/js/panels/employee.js', remote: '/var/www/oms-app/public/js/panels/employee.js' }
];

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let uploads = filesToUpload.length;
    filesToUpload.forEach(file => {
      const localPath = path.join(__dirname, file.local);
      sftp.fastPut(localPath, file.remote, (err) => {
        if (err) console.error('Failed to upload', file.local, err);
        else console.log('Successfully uploaded', file.local);
        
        uploads--;
        if (uploads === 0) {
          // Restart PM2 after upload
          conn.exec('pm2 restart oms-app', (err, stream) => {
             if (err) throw err;
             stream.on('close', () => {
                 console.log("PM2 restarted. Done!");
                 conn.end();
             }).on('data', (data) => console.log('PM2: ' + data));
          });
        }
      });
    });
  });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(config);
