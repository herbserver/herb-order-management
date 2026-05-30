const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '213.210.21.40',
  port: 22,
  username: 'root',
  password: 'HerbOnN@2026',
  readyTimeout: 99999
};

const cmd = `
echo "Fixing Git LFS for Pincode JSON..."
apt-get install -y git-lfs
cd /var/www/oms-app
git lfs install
git lfs pull

echo "Fixing DNS for MongoDB SRV..."
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 1.1.1.1" >> /etc/resolv.conf

echo "Restarting PM2 app..."
pm2 restart oms-app
pm2 logs oms-app --lines 20 --nostream
`;

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(config);
