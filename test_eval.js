const fs = require('fs');
const code = fs.readFileSync('./public/app.js', 'utf8');

// Mock browser globals minimally to let standard top-level execution proceed
global.window = {
    location: { origin: 'http://localhost:3000' }
};
global.document = {
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null
};
global.location = window.location;

let printed = false;
const origLog = console.log;
console.log = function(...args) {
    if (args[0] && args[0].includes('app.js version')) {
        printed = true;
    }
    // We only want to track if the first log executes
};

try {
    eval(code);
    origLog('[SUCCESS] app.js evaluated without top-level throw.');
    origLog('[LOG FIRED]', printed);
} catch (e) {
    origLog('[EVAL ERROR]', e.name, e.message);
    if (e.stack) {
        origLog('[STACK]', e.stack.split('\n')[1]);
    }
}
