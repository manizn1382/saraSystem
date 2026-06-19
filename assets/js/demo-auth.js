/* Optional local demo auth. Enable with: localStorage.setItem('sarasystem.demoMode', 'true') */
(function () {
  const users = {
    student: {
      password: 'demo1234',
      token: 'demo-token-student',
      user: { username: 'student', first_name: 'دانشجو', last_name: 'آزمایشی', roles: ['student'] },
      dashboard: './dashboard/student.html'
    },
    dormadmin: {
      password: 'demo1234',
      token: 'demo-token-dormitory-admin',
      user: { username: 'dormadmin', first_name: 'مسئول', last_name: 'خوابگاه', roles: ['dormitory_admin'] },
      dashboard: './dashboard/dormitory-admin.html'
    },
    supervisor: {
      password: 'demo1234',
      token: 'demo-token-dormitory-admin',
      user: { username: 'supervisor', first_name: 'مسئول', last_name: 'خوابگاه', roles: ['dormitory_admin'] },
      dashboard: './dashboard/dormitory-admin.html'
    },
    admin: {
      password: 'demo1234',
      token: 'demo-token-admin',
      user: { username: 'admin', first_name: 'مدیر', last_name: 'سیستم', roles: ['system_admin'] },
      dashboard: './dashboard/admin.html'
    },
    support: {
      password: 'demo1234',
      token: 'demo-token-support',
      user: { username: 'support', first_name: 'واحد', last_name: 'پشتیبانی', roles: ['support_staff'] },
      dashboard: './dashboard/support.html'
    }
  };

  function isEnabled() {
    return window.SaraAuth?.isDemoMode?.() === true;
  }

  function login(username, password) {
    if (!isEnabled()) return null;
    const account = users[String(username || '').trim().toLowerCase()];
    if (!account || account.password !== password) return null;

    /* Demo sessions must survive navigation between standalone HTML pages. */
    window.SaraAuth?.setSession?.({
      accessToken: account.token,
      user: account.user,
      demoMode: true
    }, { remember: true });

    return account;
  }

  window.SaraDemoAuth = { users, isEnabled, login };
})();
