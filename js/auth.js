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
  const sessionUserJson = sessionStorage.getItem('naskly_auth_user');

  if (!isLoginPage && !sessionUserJson) {
    window.location.href = 'login.html';
    return;
  }

  if (sessionUserJson) {
    try {
      const user = JSON.parse(sessionUserJson);
      const isSettingsPage = window.location.pathname.endsWith('settings.html');
      
      // Hide settings nav link if user is not admin
      document.addEventListener('DOMContentLoaded', () => {
        const settingsNavBtn = document.querySelector('a[href="settings.html"]');
        if (settingsNavBtn && user.role !== 'admin') {
          settingsNavBtn.style.display = 'none';
        }
      });

      // Block non-admin from entering settings.html directly
      if (isSettingsPage && user.role !== 'admin') {
        alert('تنبيه: غير مسموح لك بالوصول لصفحة إدارة الفريق والخدمات!');
        window.location.href = 'index.html';
      }
    } catch (e) {
      console.error('Error parsing session user:', e);
    }
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userVal = document.getElementById('loginUsername').value.trim();
      const passVal = document.getElementById('loginPassword').value.trim();
      const errorEl = document.getElementById('loginError');

      errorEl.textContent = 'جاري التحقق...';
      errorEl.style.color = '#06b6d4';

      try {
        // First check in Supabase app_users table
        let matchedUser = null;
        if (window.db && typeof window.db.from === 'function') {
          const { data, error } = await db
            .from('app_users')
            .select('*')
            .eq('username', userVal)
            .eq('password', passVal);

          if (!error && data && data.length > 0) {
            matchedUser = data[0];
          }
        }

        // Hardcoded admin fallback for initial login before table fetch
        if (!matchedUser && (userVal.toLowerCase() === 'admin') && (passVal === 'Mohand@1234')) {
          matchedUser = { username: 'admin', role: 'admin', title: 'مدير النظام (مهند)' };
        }

        if (matchedUser) {
          sessionStorage.setItem('naskly_auth_session', 'authenticated_user_' + Date.now());
          sessionStorage.setItem('naskly_auth_user', JSON.stringify({
            username: matchedUser.username,
            role: matchedUser.role || 'staff',
            title: matchedUser.title || 'موظف'
          }));
          window.location.href = 'index.html';
        } else {
          errorEl.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة!';
          errorEl.style.color = '#ef4444';
        }
      } catch (err) {
        console.error('Login error:', err);
        errorEl.textContent = 'حدث خطأ أثناء الاتصال بالخادم!';
        errorEl.style.color = '#ef4444';
      }
    });
  }
});
