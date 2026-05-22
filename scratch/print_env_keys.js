require('dotenv').config();
console.log('Environment Keys:');
Object.keys(process.env).forEach(key => {
    if (key.includes('META') || key.includes('WA') || key.includes('MONGODB')) {
        console.log(`- ${key}: ${process.env[key] ? 'SET (length: ' + process.env[key].length + ')' : 'EMPTY'}`);
    }
});
