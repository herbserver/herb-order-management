async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: 'test', password: 'test' })
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', data);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
