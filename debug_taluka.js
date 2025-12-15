console.log('=== DEBUG District Explorer ===');
console.log('District:', document.getElementById('districtExplorerTitle').textContent);
console.log('Data Array:', window.districtDataArray ? window.districtDataArray.length + ' talukas' : 'undefined');

if (window.districtDataArray) {
    window.districtDataArray.forEach(([name, offices], idx) => {
        console.log(`${idx}: ${name} - ${offices.length} offices`);
        if (name.toLowerCase().includes('jhand') || name.toLowerCase().includes('jand')) {
            console.log('  → Offices:', offices.map(o => o.Name).join(', '));
        }
    });
}
