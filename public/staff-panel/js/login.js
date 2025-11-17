// staff-panel/js/login.js
document.getElementById('staffLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://192.168.1.6:5000/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('staffToken', data.token);
      window.location.href = 'dashboard.html';
    } else {
      alert(data.message || 'Login failed');
    }

  } catch (err) {
    console.error('Error logging in:', err);
    alert('Server error');
  }
});
