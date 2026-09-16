import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, RoleAuthority } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface SystemUserRecord {
  username: string;
  password?: string;
  displayName: string;
  role: UserRole | string;
  createdAt: string;
  isSuperMasterAdmin?: boolean;
  allowedBranches?: string[]; // Branch access limitation; if empty/undefined, user has access to all branches
  canChangeTransactionBranch?: boolean; // Access to change branch on invoices/transactions
}

export const INITIAL_ROLES: RoleAuthority[] = [
  {
    id: 'superadmin',
    name: 'Super Master Admin',
    description: 'Root level control of every module, sub-module, financial adjustments, branch controls & user authorities.',
    isSystem: true,
    modules: {
      sales_pos: true,
      sales_return: true,
      quotations: true,
      purchase_invoice: true,
      purchase_orders: true,
      accounting: true,
      vouchers: true,
      inventory_masters: true,
      stock_transfer: true,
      price_lists: true,
      reports: true,
      master_control: true,
      change_branch: true,
    },
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Access to Financial Accounting & Ledgers, Inventory Masters, Purchases, and Financial Reports.',
    isSystem: true,
    modules: {
      sales_pos: true,
      sales_return: true,
      quotations: true,
      purchase_invoice: true,
      purchase_orders: true,
      accounting: true,
      vouchers: true,
      inventory_masters: true,
      stock_transfer: true,
      price_lists: true,
      reports: true,
      master_control: false,
    },
  },
  {
    id: 'manager',
    name: 'Store / Inventory Manager',
    description: 'Access to POS billing, inward purchases, stock transfers, price lists and inventory catalogs.',
    isSystem: true,
    modules: {
      sales_pos: true,
      sales_return: true,
      quotations: true,
      purchase_invoice: true,
      purchase_orders: true,
      accounting: false,
      vouchers: false,
      inventory_masters: true,
      stock_transfer: true,
      price_lists: true,
      reports: true,
      master_control: false,
    },
  },
  {
    id: 'cashier',
    name: 'POS Cashier / Operator',
    description: 'Front-desk point of sale billing, multi-bill queue, quotations and counter invoices.',
    isSystem: true,
    modules: {
      sales_pos: true,
      sales_return: true,
      quotations: true,
      purchase_invoice: false,
      purchase_orders: false,
      accounting: false,
      vouchers: false,
      inventory_masters: false,
      stock_transfer: false,
      price_lists: false,
      reports: false,
      master_control: false,
    },
  },
];

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  loginWithUsername: (username: string, password: string, selectedBranch?: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  changeUserPassword: (username: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  registerWithUsername: (username: string, password: string, displayName: string, role: UserRole) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;
  canChangeBranch: boolean;
  systemUsers: SystemUserRecord[];
  addUser: (record: SystemUserRecord) => void;
  updateUser: (username: string, updates: Partial<SystemUserRecord>) => void;
  deleteUser: (username: string) => void;
  updateUserRole: (username: string, newRole: UserRole | string) => void;
  roles: RoleAuthority[];
  addRole: (role: RoleAuthority) => void;
  updateRole: (id: string, updates: Partial<RoleAuthority>) => void;
  deleteRole: (id: string) => void;
}

// Built-in accounts including Super Master Admin (Tarun / 1234)
const INITIAL_SYSTEM_USERS: SystemUserRecord[] = [
  {
    username: 'Tarun',
    password: '1234',
    displayName: 'Tarun (Super Master Admin)',
    role: 'superadmin',
    createdAt: '2026-01-01T00:00:00.000Z',
    isSuperMasterAdmin: true,
    canChangeTransactionBranch: true,
  },
  {
    username: 'Prajith',
    password: 'admin',
    displayName: 'Prajith (Admin)',
    role: 'admin',
    createdAt: '2026-01-02T00:00:00.000Z',
    canChangeTransactionBranch: true,
  },
  {
    username: 'Suresh',
    password: '123',
    displayName: 'Suresh (Manager)',
    role: 'manager',
    createdAt: '2026-01-03T00:00:00.000Z',
    allowedBranches: ['Store Sales', 'SEENU CARE Co.'],
    canChangeTransactionBranch: false,
  },
  {
    username: 'Fatima',
    password: '123',
    displayName: 'Fatima (Cashier)',
    role: 'cashier',
    createdAt: '2026-01-04T00:00:00.000Z',
    canChangeTransactionBranch: false,
  },
];

const DEFAULT_DEMO_USERS: Record<UserRole, UserProfile> = {
  superadmin: {
    uid: 'usr-superadmin-tarun',
    username: 'Tarun',
    email: 'tarun@apexsaas.com',
    displayName: 'Tarun (Super Master Admin)',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
    activeSection: 'SEENU CARE Co.',
    isSuperMasterAdmin: true,
    canChangeTransactionBranch: true,
  },
  admin: {
    uid: 'usr-admin-1',
    username: 'Prajith',
    email: 'admin@apexsaas.com',
    displayName: 'Prajith (Admin)',
    role: 'admin',
    createdAt: new Date().toISOString(),
    activeSection: 'SEENU CARE Co.',
    canChangeTransactionBranch: true,
  },
  manager: {
    uid: 'usr-manager-1',
    username: 'Suresh',
    email: 'manager@apexsaas.com',
    displayName: 'Suresh (Manager)',
    role: 'manager',
    createdAt: new Date().toISOString(),
    activeSection: 'Store Sales',
  },
  cashier: {
    uid: 'usr-cashier-1',
    username: 'Fatima',
    email: 'cashier@apexsaas.com',
    displayName: 'Fatima (Cashier)',
    role: 'cashier',
    createdAt: new Date().toISOString(),
    activeSection: 'Store Sales',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // System users database
  const [systemUsers, setSystemUsers] = useState<SystemUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem('apex_system_users');
      if (saved) {
        const parsed: SystemUserRecord[] = JSON.parse(saved);
        // Ensure Tarun is superadmin and Suresh has example branch restrictions
        const hasTarun = parsed.some((u) => u.username.toLowerCase() === 'tarun');
        const normalized = parsed.map((u) => {
          if (u.username.toLowerCase() === 'tarun') {
            return { ...u, role: 'superadmin', isSuperMasterAdmin: true, password: u.password || '1234' };
          }
          if (u.username.toLowerCase() === 'suresh' && !u.allowedBranches) {
            return { ...u, allowedBranches: ['Store Sales', 'SEENU CARE Co.'] };
          }
          return u;
        });
        if (hasTarun) {
          return normalized;
        }
        return [INITIAL_SYSTEM_USERS[0], ...normalized];
      }
    } catch {}
    return INITIAL_SYSTEM_USERS;
  });

  // Active authenticated user profile
  // By default, checks if an active session exists in sessionStorage (or localStorage if remembered)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const sessionUser = sessionStorage.getItem('apex_logged_in_user');
      if (sessionUser) {
        return JSON.parse(sessionUser);
      }
      const localUser = localStorage.getItem('apex_logged_in_user');
      if (localUser) {
        return JSON.parse(localUser);
      }
    } catch (e) {}
    // When opening site/webapp, show login panel (user is null)
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [activeSection, setActiveSectionState] = useState<string>(() => {
    return localStorage.getItem('apex_active_section') || 'SEENU CARE Co.';
  });

  // Role / Authority definitions state with localStorage persistence
  const [roles, setRoles] = useState<RoleAuthority[]>(() => {
    try {
      const saved = localStorage.getItem('apex_roles');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_ROLES;
  });

  // Persist roles changes
  useEffect(() => {
    try {
      localStorage.setItem('apex_roles', JSON.stringify(roles));
    } catch {}
  }, [roles]);

  // Persist system users changes
  useEffect(() => {
    try {
      localStorage.setItem('apex_system_users', JSON.stringify(systemUsers));
    } catch {}
  }, [systemUsers]);

  const setActiveSection = (section: string) => {
    // If user is restricted to specific branches, prevent unauthorized switch
    if (user && !isSuperAdmin && user.allowedBranches && user.allowedBranches.length > 0) {
      if (!user.allowedBranches.includes(section)) {
        alert(`Access Denied: You are restricted to [${user.allowedBranches.join(', ')}] and cannot access branch "${section}".`);
        return;
      }
    }

    setActiveSectionState(section);
    localStorage.setItem('apex_active_section', section);
    if (user) {
      const updated = { ...user, activeSection: section };
      setUser(updated);
      try {
        sessionStorage.setItem('apex_logged_in_user', JSON.stringify(updated));
        localStorage.setItem('apex_logged_in_user', JSON.stringify(updated));
      } catch {}
    }

    // When changing branches: refresh the page and redirect to dashboard as requested
    if (typeof window !== 'undefined') {
      const targetUrl = `${window.location.pathname}?view=dashboard`;
      if (window.location.search === '?view=dashboard') {
        window.location.reload();
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser && !user) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUser(data);
            sessionStorage.setItem('apex_logged_in_user', JSON.stringify(data));
          }
        } catch (err) {
          console.warn('Could not fetch user document from Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Username and Password login method (supports branch selection & branch restrictions)
  const loginWithUsername = async (
    usernameInput: string, 
    passwordInput: string,
    selectedBranch?: string
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const trimmedUsername = usernameInput.trim();
    if (!trimmedUsername) {
      return { success: false, error: 'Please enter your username.' };
    }

    // 1. Super Master Admin check (Username: Tarun)
    if (trimmedUsername.toLowerCase() === 'tarun') {
      const tarunRecord = systemUsers.find((u) => u.username.toLowerCase() === 'tarun');
      const expectedPassword = tarunRecord?.password || '1234';

      if (passwordInput === expectedPassword) {
        const branchToUse = selectedBranch || activeSection;
        setActiveSectionState(branchToUse);
        try {
          localStorage.setItem('apex_active_section', branchToUse);
        } catch {}

        const superAdminProfile: UserProfile = {
          uid: 'usr-superadmin-tarun',
          username: 'Tarun',
          email: 'tarun@apexsaas.com',
          displayName: 'Tarun (Super Master Admin)',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
          activeSection: branchToUse,
          isSuperMasterAdmin: true,
          allowedBranches: undefined, // Unrestricted access to all branches
          canChangeTransactionBranch: true,
        };
        setUser(superAdminProfile);
        try {
          sessionStorage.setItem('apex_logged_in_user', JSON.stringify(superAdminProfile));
          localStorage.setItem('apex_logged_in_user', JSON.stringify(superAdminProfile));
        } catch {}
        return { success: true, user: superAdminProfile };
      } else {
        return { success: false, error: `Incorrect password for Super Master Admin Tarun. (Hint: ${expectedPassword})` };
      }
    }

    // 2. Check registered system users
    const matchedUser = systemUsers.find(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (matchedUser) {
      // Check password if set (any password, no restrictions)
      if (matchedUser.password && matchedUser.password !== passwordInput) {
        return { success: false, error: 'Incorrect password entered.' };
      }

      // Check branch permissions if user is restricted
      if (matchedUser.allowedBranches && matchedUser.allowedBranches.length > 0) {
        if (selectedBranch && !matchedUser.allowedBranches.includes(selectedBranch)) {
          return {
            success: false,
            error: `Access Denied: Operator "${matchedUser.displayName || matchedUser.username}" is restricted to [${matchedUser.allowedBranches.join(', ')}] and cannot access branch "${selectedBranch}".`,
          };
        }
      }

      // Determine branch to use: chosen branch, or user's first allowed branch if current is forbidden, or current activeSection
      let branchToUse = selectedBranch;
      if (!branchToUse) {
        if (matchedUser.allowedBranches && matchedUser.allowedBranches.length > 0) {
          if (!matchedUser.allowedBranches.includes(activeSection)) {
            branchToUse = matchedUser.allowedBranches[0];
          } else {
            branchToUse = activeSection;
          }
        } else {
          branchToUse = activeSection;
        }
      }

      setActiveSectionState(branchToUse);
      try {
        localStorage.setItem('apex_active_section', branchToUse);
      } catch {}

      const profile: UserProfile = {
        uid: `usr-${matchedUser.username.toLowerCase()}`,
        username: matchedUser.username,
        email: `${matchedUser.username.toLowerCase()}@apexsaas.com`,
        displayName: matchedUser.displayName || matchedUser.username,
        role: matchedUser.role,
        createdAt: matchedUser.createdAt,
        activeSection: branchToUse,
        isSuperMasterAdmin: matchedUser.isSuperMasterAdmin || matchedUser.role === 'superadmin',
        allowedBranches: matchedUser.allowedBranches,
        canChangeTransactionBranch: matchedUser.canChangeTransactionBranch || matchedUser.isSuperMasterAdmin || matchedUser.role === 'superadmin',
      };

      setUser(profile);
      try {
        sessionStorage.setItem('apex_logged_in_user', JSON.stringify(profile));
        localStorage.setItem('apex_logged_in_user', JSON.stringify(profile));
      } catch {}
      return { success: true, user: profile };
    }

    return { 
      success: false, 
      error: `User "${trimmedUsername}" not found. Please check your username.` 
    };
  };

  // Register new user with any username and any password without limits
  const registerWithUsername = async (
    usernameInput: string,
    passwordInput: string,
    displayNameInput: string,
    roleInput: UserRole
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const trimmedUsername = usernameInput.trim();
    if (!trimmedUsername) {
      return { success: false, error: 'Username is required.' };
    }

    // Check if username already exists
    const exists = systemUsers.some(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );
    if (exists) {
      return { success: false, error: `Username "${trimmedUsername}" is already taken. Please choose another or sign in.` };
    }

    const isSuper = roleInput === 'superadmin' || trimmedUsername.toLowerCase() === 'tarun';
    const newRecord: SystemUserRecord = {
      username: trimmedUsername,
      password: passwordInput, // Any password without restrictions
      displayName: displayNameInput.trim() || trimmedUsername,
      role: isSuper ? 'superadmin' : roleInput,
      createdAt: new Date().toISOString(),
      isSuperMasterAdmin: isSuper,
    };

    const updatedList = [...systemUsers, newRecord];
    setSystemUsers(updatedList);
    try {
      localStorage.setItem('apex_system_users', JSON.stringify(updatedList));
    } catch {}

    const newProfile: UserProfile = {
      uid: `usr-${trimmedUsername.toLowerCase()}`,
      username: trimmedUsername,
      email: `${trimmedUsername.toLowerCase()}@apexsaas.com`,
      displayName: newRecord.displayName,
      role: newRecord.role,
      createdAt: newRecord.createdAt,
      activeSection,
      isSuperMasterAdmin: isSuper,
    };

    setUser(newProfile);
    sessionStorage.setItem('apex_logged_in_user', JSON.stringify(newProfile));
    localStorage.setItem('apex_logged_in_user', JSON.stringify(newProfile));

    // Also sync to Firestore users collection in background
    try {
      await setDoc(doc(db, 'users', newProfile.uid), newProfile);
    } catch {}

    return { success: true, user: newProfile };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setUser(data);
        sessionStorage.setItem('apex_logged_in_user', JSON.stringify(data));
        localStorage.setItem('apex_logged_in_user', JSON.stringify(data));
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const username = email.split('@')[0];
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        username,
        email,
        displayName: name,
        role,
        createdAt: new Date().toISOString(),
        activeSection,
        isSuperMasterAdmin: role === 'superadmin' || username.toLowerCase() === 'tarun',
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setUser(newProfile);
      sessionStorage.setItem('apex_logged_in_user', JSON.stringify(newProfile));
      localStorage.setItem('apex_logged_in_user', JSON.stringify(newProfile));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {}
    setUser(null);
    try {
      sessionStorage.removeItem('apex_logged_in_user');
      localStorage.removeItem('apex_logged_in_user');
      sessionStorage.removeItem('apex_last_view');
      localStorage.removeItem('apex_last_view');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {}
  };

  const switchDemoRole = (role: UserRole) => {
    const demoUser = { ...DEFAULT_DEMO_USERS[role], activeSection };
    setUser(demoUser);
    try {
      sessionStorage.setItem('apex_logged_in_user', JSON.stringify(demoUser));
      localStorage.setItem('apex_logged_in_user', JSON.stringify(demoUser));
    } catch {}
  };

  const addUser = (record: SystemUserRecord) => {
    setSystemUsers((prev) => {
      const filtered = prev.filter((u) => u.username.toLowerCase() !== record.username.toLowerCase());
      return [...filtered, record];
    });
  };

  const updateUser = (username: string, updates: Partial<SystemUserRecord>) => {
    setSystemUsers((prev) =>
      prev.map((u) => {
        if (u.username.toLowerCase() === username.toLowerCase()) {
          // If editing Tarun, keep superadmin role
          if (u.username.toLowerCase() === 'tarun') {
            return {
              ...u,
              ...updates,
              username: 'Tarun',
              role: 'superadmin',
              isSuperMasterAdmin: true,
            };
          }
          return { ...u, ...updates };
        }
        return u;
      })
    );
  };

  const deleteUser = (username: string) => {
    if (username.toLowerCase() === 'tarun') {
      alert('Cannot delete Super Master Admin (Tarun).');
      return;
    }
    setSystemUsers((prev) => prev.filter((u) => u.username.toLowerCase() !== username.toLowerCase()));
  };

  const updateUserRole = (username: string, newRole: UserRole | string) => {
    if (username.toLowerCase() === 'tarun') {
      alert('Super Master Admin (Tarun) role cannot be changed.');
      return;
    }
    setSystemUsers((prev) =>
      prev.map((u) => (u.username.toLowerCase() === username.toLowerCase() ? { ...u, role: newRole } : u))
    );
  };

  // Role / Authority Management
  const addRole = (newRole: RoleAuthority) => {
    setRoles((prev) => {
      const filtered = prev.filter((r) => r.id.toLowerCase() !== newRole.id.toLowerCase());
      return [...filtered, newRole];
    });
  };

  const updateRole = (id: string, updates: Partial<RoleAuthority>) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRole = (id: string) => {
    if (id === 'superadmin') {
      alert('Super Master Admin role cannot be deleted.');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const changeUserPassword = async (username: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || !newPassword.trim()) {
      return { success: false, error: 'Password cannot be blank.' };
    }
    const cleanPassword = newPassword.trim();
    setSystemUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.username.toLowerCase() === username.toLowerCase()) {
          return { ...u, password: cleanPassword };
        }
        return u;
      });
      try {
        localStorage.setItem('apex_system_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (user && user.username.toLowerCase() === username.toLowerCase()) {
      const updatedUser = { ...user };
      setUser(updatedUser);
      try {
        sessionStorage.setItem('apex_logged_in_user', JSON.stringify(updatedUser));
        localStorage.setItem('apex_logged_in_user', JSON.stringify(updatedUser));
      } catch {}
    }

    return { success: true };
  };

  // Super Master Admin is in control of EVERY module and sub module and every adjustment in the web-app
  const isSuperAdmin = user?.role === 'superadmin' || user?.isSuperMasterAdmin === true || user?.username?.toLowerCase() === 'tarun';
  const isAdmin = isSuperAdmin || user?.role === 'admin';
  const isManager = isSuperAdmin || isAdmin || user?.role === 'manager';
  const isCashier = true; // All authenticated users have cashier/billing access

  const userRoleObj = roles.find((r) => r.id === user?.role);
  const canChangeBranch = 
    isSuperAdmin ||
    user?.role === 'superadmin' ||
    user?.canChangeTransactionBranch === true ||
    userRoleObj?.modules?.change_branch === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        activeSection,
        setActiveSection,
        signIn,
        signUp,
        loginWithUsername,
        changeUserPassword,
        registerWithUsername,
        signOut,
        switchDemoRole,
        isSuperAdmin,
        isAdmin,
        isManager,
        isCashier,
        canChangeBranch,
        systemUsers,
        addUser,
        updateUser,
        deleteUser,
        updateUserRole,
        roles,
        addRole,
        updateRole,
        deleteRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

