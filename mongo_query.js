const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '213.210.21.40',
  port: 22,
  username: 'root',
  password: 'HerbOnN@2026',
  readyTimeout: 99999
};

const cmd = `mongosh herbserver --eval 'db.orders.find({}, {orderId:1, timestamp:1, _id:0}).sort({timestamp: -1}).limit(10).toArray()'`;

conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log(out);
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
