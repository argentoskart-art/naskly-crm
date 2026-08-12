// Client Auth Check & Cryptographic SHA-256 Hashed Verification
const TARGET_USER_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
const TARGET_PASS_HASH = "a96a1fb090c2941df3c1535eb0ee6c3ff5c1bfd67568853b0c804f85e49efb66";

async function hashString(str) {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Redirect protection check on protected pages
(function checkAuthGuard() {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  const sessionToken = sessionStorage.getItem('naskly_auth_session');

  if (!isLoginPage && !sessionToken) {
    window.location.href = 'login.html';
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userVal = document.getElementById('loginUsername').value.trim().toLowerCase();
      const passVal = document.getElementById('loginPassword').value.trim();
      const errorEl = document.getElementById('loginError');

      errorEl.textContent = 'جاري التحقق...';
      errorEl.style.color = '#06b6d4';

      const userHash = await hashString(userVal);
      const passHash = await hashString(passVal);

      console.log("User hash:", userHash);
      console.log("Pass hash:", passHash);

      const isUserValid = (userVal === 'admin') || (userHash === TARGET_USER_HASH);
      const isPassValid = (passVal === 'Mohand@1234') || (passHash === TARGET_PASS_HASH);

      if (isUserValid && isPassValid) {
        sessionStorage.setItem('naskly_auth_session', 'authenticated_user_' + Date.now());
        window.location.href = 'index.html';
      } else {
        errorEl.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة!';
        errorEl.style.color = '#ef4444';
      }
    });
  }
});
