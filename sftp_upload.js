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

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localPath = path.join(__dirname, 'dataAccess.js');
    const remotePath = '/var/www/oms-app/dataAccess.js';
    
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) throw err;
      console.log('File uploaded successfully via SFTP.');
      
      // Restart app
      conn.exec('pm2 restart oms-app && sleep 2 && pm2 logs oms-app --lines 10 --nostream', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
  });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(config);
