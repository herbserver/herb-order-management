const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '213.210.21.40',
  port: 22,
  username: 'root',
  password: 'HerbOnN@2026',
  readyTimeout: 99999
};

const cmd = `cat << 'EOF' > patch.js
const fs = require('fs');
let code = fs.readFileSync('/var/www/oms-app/dataAccess.js', 'utf8');
code = code.replace(
    /const searchQuery = buildOrderSearchQuery\\(search\\);\\n    if \\(searchQuery\\) Object\\.assign\\(dateQuery, searchQuery\\);\\n\\n    if \\(mongoConnected\\) {/g,
    \`const searchQuery = buildOrderSearchQuery(search);
    if (searchQuery) Object.assign(dateQuery, searchQuery);
    console.log("DEBUG getOrdersByStatus dateQuery:", JSON.stringify(dateQuery));
    if (mongoConnected) {\`
);
fs.writeFileSync('/var/www/oms-app/dataAccess.js', code);
EOF
node patch.js
pm2 restart oms-app
sleep 2
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
