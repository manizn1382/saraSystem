/* Optional local demo auth. Enable with: localStorage.setItem('sarasystem.demoMode', 'true') */
(function () {
  const users = {
    student: {
      password: 'demo1234',
      token: 'demo-token-student',
      user: {
        id: 9001,
        username: 'student',
        first_name: 'سارا',
        last_name: 'دانشجو',
        student_id: '400123456',
        national_id: '0012345678',
        phone: '09120000001',
        email: 'student@sarasystem.test',
        role: 'student',
        roles: ['student'],
        is_active: true,
        is_verified: true
      },
      dashboard: './dashboard/student.html'
    },
    dormadmin: {
      password: 'demo1234',
      token: 'demo-token-dormitory-admin',
      user: {
        id: 9002,
        username: 'dormadmin',
        first_name: 'مینا',
        last_name: 'مسئول خوابگاه',
        staff_id: 'DA-102',
        phone: '09120000002',
        email: 'supervisor@sarasystem.test',
        assigned_dormitory: 'خوابگاه یک',
        role: 'dormitory_admin',
        roles: ['dormitory_admin'],
        is_active: true,
        is_verified: true
      },
      dashboard: './dashboard/dormitory-admin.html'
    },
    supervisor: {
      password: 'demo1234',
      token: 'demo-token-dormitory-admin',
      user: {
        id: 9002,
        username: 'supervisor',
        first_name: 'مینا',
        last_name: 'مسئول خوابگاه',
        staff_id: 'DA-102',
        phone: '09120000002',
        email: 'supervisor@sarasystem.test',
        assigned_dormitory: 'خوابگاه یک',
        role: 'dormitory_admin',
        roles: ['dormitory_admin'],
        is_active: true,
        is_verified: true
      },
      dashboard: './dashboard/dormitory-admin.html'
    },
    admin: {
      password: 'demo1234',
      token: 'demo-token-admin',
      user: {
        id: 9003,
        username: 'admin',
        first_name: 'علی',
        last_name: 'مدیر سیستم',
        staff_id: 'SA-001',
        phone: '09120000003',
        email: 'admin@sarasystem.test',
        role: 'system_admin',
        roles: ['system_admin'],
        is_active: true,
        is_verified: true
      },
      dashboard: './dashboard/admin.html'
    },
    support: {
      password: 'demo1234',
      token: 'demo-token-support',
      user: {
        id: 9004,
        username: 'support',
        first_name: 'رضا',
        last_name: 'پشتیبان',
        staff_id: 'SP-204',
        phone: '09120000004',
        email: 'support@sarasystem.test',
        role: 'support_staff',
        roles: ['support_staff'],
        is_active: true,
        is_verified: true
      },
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
