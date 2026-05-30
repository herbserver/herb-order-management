const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '213.210.21.40',
  port: 22,
  username: 'root',
  password: 'HerbOnN@2026',
  readyTimeout: 99999
};

const script = `
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/herbserver').then(async () => {
  const Order = mongoose.model('Order', new mongoose.Schema({ timestamp: mongoose.Schema.Types.Mixed }, {strict: false}), 'orders');
  const orders = await Order.find({}, {orderId: 1, timestamp: 1, _id: 0}).sort({_id: -1}).limit(10).lean();
  console.log("Found orders:");
  orders.forEach(o => {
    console.log(o.orderId, typeof o.timestamp, o.timestamp instanceof Date ? "DATE" : "STRING", o.timestamp);
  });
  process.exit(0);
}).catch(console.error);
`;

const cmd = `cat << 'EOF' > /var/www/oms-app/test_db.js\n${script}\nEOF\ncd /var/www/oms-app && node test_db.js`;

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
