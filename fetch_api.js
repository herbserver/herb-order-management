const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '213.210.21.40',
  port: 22,
  username: 'root',
  password: 'HerbOnN@2026',
  readyTimeout: 99999
};

const cmd = `curl -s 'http://localhost:3000/api/orders?status=Pending&startDate=2026-05-28&endDate=2026-05-28'`;

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log("Response length:", out.length);
      console.log("Sample:", out.substring(0, 500));
      conn.end();
    }).on('data', (data) => {
      out += data;
    }).stderr.on('data', (data) => {
      // ignore
    });
  });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(config);
