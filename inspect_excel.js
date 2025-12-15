const xlsx = require('xlsx');
const workbook = xlsx.readFile('public/DATA.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const headers = [];
const range = xlsx.utils.decode_range(worksheet['!ref']);
const data = [];
for (let R = 0; R <= 5; ++R) {
    const row = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[xlsx.utils.encode_cell({ r: R, c: C })];
        row.push(cell ? cell.v : null);
    }
    data.push(row);
}
console.log(JSON.stringify(data, null, 2));
