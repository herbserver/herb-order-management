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
echo "Fixing systemd-resolved DNS..."
mkdir -p /etc/systemd/resolved.conf.d
echo "[Resolve]" > /etc/systemd/resolved.conf.d/dns_servers.conf
echo "DNS=8.8.8.8 8.8.4.4" >> /etc/systemd/resolved.conf.d/dns_servers.conf
systemctl restart systemd-resolved

echo "Restarting PM2 app..."
pm2 restart oms-app
sleep 5
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
