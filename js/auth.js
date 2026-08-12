// Client Auth Check & Hashed Verification

// Pre-hashed SHA-256 values:
// username "admin" -> "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
// password "Mohand@1234" -> "a96a1fb090c2941df3c1535eb0ee6c3ff5c1bfd67568853b0c804f85e49efb66"
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

      if ((userVal === 'admin' && passVal === 'Mohand@1234') || (userHash === TARGET_USER_HASH && passHash === TARGET_PASS_HASH)) {
        sessionStorage.setItem('naskly_auth_session', 'authenticated_user_' + Date.now());
        window.location.href = 'index.html';
      } else {
        errorEl.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة!';
        errorEl.style.color = '#ef4444';
      }
    });
  }
});
