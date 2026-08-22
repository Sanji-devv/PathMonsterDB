/**
 * PATHGM Authentication & User Management Module
 * Supports Username & Password Registration (with Password Confirmation),
 * Login, Session Management, RPG-themed Auth Modal, and Dynamic User Profile Widget.
 */

(function () {
    'use strict';

    const TOKEN_KEY = 'pathgm_auth_token';
    const USER_KEY = 'pathgm_auth_user';

    class AuthManager {
        constructor() {
            this.token = localStorage.getItem(TOKEN_KEY) || '';
            this.user = null;
            try {
                const storedUser = localStorage.getItem(USER_KEY);
                if (storedUser) {
                    this.user = JSON.parse(storedUser);
                }
            } catch (e) {
                this.user = null;
            }

            this.pendingAuthCallback = null;
            this.activeTab = 'login'; // 'login' or 'register'

            this.init();
        }

        init() {
            document.addEventListener('DOMContentLoaded', () => {
                this.injectAuthModal();
                this.renderUserWidgets();
                this.verifySession();
            });
        }

        getToken() {
            return this.token;
        }

        getUser() {
            return this.user;
        }

        isAuthenticated() {
            return !!(this.token && this.user);
        }

        getAuthHeaders() {
            if (this.token) {
                return {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                };
            }
            return {
                'Content-Type': 'application/json'
            };
        }

        async verifySession() {
            if (!this.token) {
                this.renderUserWidgets();
                return;
            }

            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ok' && data.user) {
                        this.user = data.user;
                        localStorage.setItem(USER_KEY, JSON.stringify(this.user));
                        this.renderUserWidgets();
                        this.notifyAuthChange();
                        return;
                    }
                }
                // Token invalid or expired
                this.clearLocalSession();
            } catch (err) {
                console.warn('PathGM Auth verify failed, keeping cached credentials:', err);
                this.renderUserWidgets();
            }
        }

        clearLocalSession() {
            this.token = '';
            this.user = null;
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            this.renderUserWidgets();
            this.notifyAuthChange();
        }

        notifyAuthChange() {
            window.dispatchEvent(new CustomEvent('pathgm:auth', {
                detail: {
                    user: this.user,
                    token: this.token,
                    isAuthenticated: this.isAuthenticated()
                }
            }));
        }

        async register(username, password, passwordConfirm) {
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        password_confirm: passwordConfirm
                    })
                });
                const data = await res.json();
                if (res.ok && data.status === 'ok') {
                    this.token = data.token;
                    this.user = data.user;
                    localStorage.setItem(TOKEN_KEY, this.token);
                    localStorage.setItem(USER_KEY, JSON.stringify(this.user));
                    this.renderUserWidgets();
                    this.notifyAuthChange();
                    return { success: true, message: data.message, user: data.user };
                } else {
                    return { success: false, message: data.message || 'Registration failed.' };
                }
            } catch (err) {
                return { success: false, message: 'Connection error: ' + err.message };
            }
        }

        async login(username, password) {
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, password: password })
                });
                const data = await res.json();
                if (res.ok && data.status === 'ok') {
                    this.token = data.token;
                    this.user = data.user;
                    localStorage.setItem(TOKEN_KEY, this.token);
                    localStorage.setItem(USER_KEY, JSON.stringify(this.user));
                    this.renderUserWidgets();
                    this.notifyAuthChange();
                    return { success: true, message: data.message, user: data.user };
                } else {
                    return { success: false, message: data.message || 'Invalid username or password.' };
                }
            } catch (err) {
                return { success: false, message: 'Connection error: ' + err.message };
            }
        }

        async logout() {
            if (this.token) {
                try {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${this.token}` }
                    });
                } catch (e) {
                    console.warn('Logout API error:', e);
                }
            }
            this.clearLocalSession();
            this.showToast('Logged out successfully.', 'info');
        }

        requireAuth(callback) {
            if (this.isAuthenticated()) {
                if (typeof callback === 'function') callback(this.user);
            } else {
                this.pendingAuthCallback = callback;
                this.openModal('login');
            }
        }

        // ==========================================
        // UI & Modal Presentation
        // ==========================================

        openModal(initialTab = 'login') {
            this.activeTab = initialTab;
            const modal = document.getElementById('pathgm-auth-modal');
            if (!modal) return;

            this.switchTab(initialTab);
            this.clearAlert();
            modal.classList.add('active');

            // Auto-focus first input
            setTimeout(() => {
                const firstInput = modal.querySelector(initialTab === 'login' ? '#auth-login-username' : '#auth-reg-username');
                if (firstInput) firstInput.focus();
            }, 100);
        }

        closeModal() {
            const modal = document.getElementById('pathgm-auth-modal');
            if (modal) {
                modal.classList.remove('active');
            }
            this.pendingAuthCallback = null;
        }

        switchTab(tab) {
            this.activeTab = tab;
            const modal = document.getElementById('pathgm-auth-modal');
            if (!modal) return;

            const tabLogin = modal.querySelector('#auth-tab-btn-login');
            const tabRegister = modal.querySelector('#auth-tab-btn-register');
            const formLogin = modal.querySelector('#auth-form-login');
            const formRegister = modal.querySelector('#auth-form-register');

            this.clearAlert();

            if (tab === 'login') {
                tabLogin.classList.add('active');
                tabRegister.classList.remove('active');
                formLogin.style.display = 'block';
                formRegister.style.display = 'none';
            } else {
                tabRegister.classList.add('active');
                tabLogin.classList.remove('active');
                formRegister.style.display = 'block';
                formLogin.style.display = 'none';
            }
        }

        showAlert(message, type = 'error') {
            const alertBox = document.getElementById('auth-alert-box');
            if (!alertBox) return;
            alertBox.className = `auth-alert auth-alert-${type}`;
            alertBox.innerHTML = `
                <span class="auth-alert-icon">${type === 'error' ? '⚠️' : '✅'}</span>
                <span class="auth-alert-text">${message}</span>
            `;
            alertBox.style.display = 'flex';
        }

        clearAlert() {
            const alertBox = document.getElementById('auth-alert-box');
            if (alertBox) {
                alertBox.style.display = 'none';
                alertBox.innerHTML = '';
            }
        }

        showToast(message, type = 'success') {
            let toast = document.getElementById('pathgm-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'pathgm-toast';
                toast.className = 'pathgm-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = message;
            toast.className = `pathgm-toast show toast-${type}`;
            setTimeout(() => {
                toast.className = 'pathgm-toast';
            }, 3500);
        }

        injectAuthModal() {
            if (document.getElementById('pathgm-auth-modal')) return;

            const modalHtml = `
            <div id="pathgm-auth-modal" class="auth-modal-overlay" aria-hidden="true">
                <div class="auth-modal-card" role="dialog" aria-modal="true">
                    <button class="auth-modal-close" id="auth-modal-close-btn" title="Close">&times;</button>
                    
                    <div class="auth-modal-header">
                        <img src="../assets/logo.png" alt="PathMonsterDB Logo" style="width: 56px; height: 56px; border-radius: 12px; margin: 0 auto 10px auto; border: 1px solid rgba(242, 202, 80, 0.4); box-shadow: 0 0 16px rgba(242, 202, 80, 0.35); display: block;">
                        <h2 class="auth-modal-title">PathMonsterDB Account</h2>
                        <p class="auth-modal-subtitle">Sign in to save and manage your custom monsters and spells securely.</p>
                    </div>

                    <div class="auth-tabs">
                        <button type="button" id="auth-tab-btn-login" class="auth-tab-btn active">Sign In</button>
                        <button type="button" id="auth-tab-btn-register" class="auth-tab-btn">Create Account</button>
                    </div>

                    <div id="auth-alert-box" class="auth-alert" style="display: none;"></div>

                    <!-- LOGIN FORM -->
                    <form id="auth-form-login" class="auth-form" onsubmit="return false;">
                        <div class="auth-field">
                            <label for="auth-login-username">Username</label>
                            <div class="auth-input-wrapper">
                                <svg class="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <input type="text" id="auth-login-username" placeholder="Enter your username" required autocomplete="username">
                            </div>
                        </div>

                        <div class="auth-field">
                            <label for="auth-login-password">Password</label>
                            <div class="auth-input-wrapper">
                                <svg class="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <input type="password" id="auth-login-password" placeholder="••••••••" required autocomplete="current-password">
                                <button type="button" class="auth-btn-pwd-toggle" data-target="auth-login-password" title="Show/Hide Password">👁️</button>
                            </div>
                        </div>

                        <button type="submit" id="auth-btn-login-submit" class="auth-btn-submit">
                            <span class="auth-btn-text">Sign In</span>
                            <span class="auth-btn-spinner" style="display: none;"></span>
                        </button>
                    </form>

                    <!-- REGISTER FORM -->
                    <form id="auth-form-register" class="auth-form" style="display: none;" onsubmit="return false;">
                        <div class="auth-field">
                            <label for="auth-reg-username">Username</label>
                            <div class="auth-input-wrapper">
                                <svg class="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <input type="text" id="auth-reg-username" placeholder="e.g. DungeonMaster99" minlength="3" maxlength="30" required autocomplete="username">
                            </div>
                        </div>

                        <div class="auth-field">
                            <label for="auth-reg-password">Password (Minimum 6 characters)</label>
                            <div class="auth-input-wrapper">
                                <svg class="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <input type="password" id="auth-reg-password" placeholder="At least 6 characters" minlength="6" required autocomplete="new-password">
                                <button type="button" class="auth-btn-pwd-toggle" data-target="auth-reg-password" title="Show/Hide Password">👁️</button>
                            </div>
                        </div>

                        <div class="auth-field">
                            <label for="auth-reg-password-confirm">Confirm Password</label>
                            <div class="auth-input-wrapper">
                                <svg class="auth-field-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <input type="password" id="auth-reg-password-confirm" placeholder="Re-enter your password" minlength="6" required autocomplete="new-password">
                                <button type="button" class="auth-btn-pwd-toggle" data-target="auth-reg-password-confirm" title="Show/Hide Password">👁️</button>
                            </div>
                        </div>

                        <button type="submit" id="auth-btn-reg-submit" class="auth-btn-submit auth-btn-submit-gold">
                            <span class="auth-btn-text">Create Account & Start</span>
                            <span class="auth-btn-spinner" style="display: none;"></span>
                        </button>
                    </form>

                    <div class="auth-modal-footer">
                        <button type="button" id="auth-btn-guest" class="auth-btn-link">Continue as Guest</button>
                    </div>
                </div>
            </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Wire Modal Controls
            const modal = document.getElementById('pathgm-auth-modal');
            const closeBtn = document.getElementById('auth-modal-close-btn');
            const guestBtn = document.getElementById('auth-btn-guest');
            const tabLogin = document.getElementById('auth-tab-btn-login');
            const tabReg = document.getElementById('auth-tab-btn-register');

            closeBtn.addEventListener('click', () => this.closeModal());
            guestBtn.addEventListener('click', () => this.closeModal());

            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeModal();
                }
            });

            tabLogin.addEventListener('click', () => this.switchTab('login'));
            tabReg.addEventListener('click', () => this.switchTab('register'));

            // Toggle Password Visibility
            modal.querySelectorAll('.auth-btn-pwd-toggle').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.getAttribute('data-target');
                    const input = document.getElementById(targetId);
                    if (input) {
                        if (input.type === 'password') {
                            input.type = 'text';
                            btn.textContent = '🙈';
                        } else {
                            input.type = 'password';
                            btn.textContent = '👁️';
                        }
                    }
                });
            });

            // Handle Login Submit
            const formLogin = document.getElementById('auth-form-login');
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('auth-login-username').value.trim();
                const password = document.getElementById('auth-login-password').value;
                const submitBtn = document.getElementById('auth-btn-login-submit');

                if (!username || !password) {
                    this.showAlert('Please enter both username and password.');
                    return;
                }

                this.setButtonLoading(submitBtn, true);
                this.clearAlert();

                const res = await this.login(username, password);
                this.setButtonLoading(submitBtn, false);

                if (res.success) {
                    const displayName = (res.user && (res.user.username || res.user.name)) || username;
                    this.showToast(`Welcome back, ${displayName}! ⚔️`, 'success');
                    this.closeModal();
                    if (this.pendingAuthCallback) {
                        const cb = this.pendingAuthCallback;
                        this.pendingAuthCallback = null;
                        cb(res.user);
                    }
                } else {
                    this.showAlert(res.message, 'error');
                }
            });

            // Handle Register Submit
            const formRegister = document.getElementById('auth-form-register');
            formRegister.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('auth-reg-username').value.trim();
                const password = document.getElementById('auth-reg-password').value;
                const passwordConfirm = document.getElementById('auth-reg-password-confirm').value;
                const submitBtn = document.getElementById('auth-btn-reg-submit');

                if (!username || !password) {
                    this.showAlert('Username and password are required.');
                    return;
                }

                if (username.length < 3) {
                    this.showAlert('Username must be at least 3 characters.');
                    return;
                }

                if (password.length < 6) {
                    this.showAlert('Password must be at least 6 characters.');
                    return;
                }

                if (password !== passwordConfirm) {
                    this.showAlert('Passwords do not match.');
                    return;
                }

                this.setButtonLoading(submitBtn, true);
                this.clearAlert();

                const res = await this.register(username, password, passwordConfirm);
                this.setButtonLoading(submitBtn, false);

                if (res.success) {
                    const displayName = (res.user && (res.user.username || res.user.name)) || username;
                    this.showToast(`Account created successfully, welcome ${displayName}! 🎉`, 'success');
                    this.closeModal();
                    if (this.pendingAuthCallback) {
                        const cb = this.pendingAuthCallback;
                        this.pendingAuthCallback = null;
                        cb(res.user);
                    }
                } else {
                    this.showAlert(res.message, 'error');
                }
            });
        }

        setButtonLoading(button, isLoading) {
            if (!button) return;
            const textSpan = button.querySelector('.auth-btn-text');
            const spinnerSpan = button.querySelector('.auth-btn-spinner');
            if (isLoading) {
                button.disabled = true;
                if (textSpan) textSpan.style.opacity = '0.5';
                if (spinnerSpan) spinnerSpan.style.display = 'inline-block';
            } else {
                button.disabled = false;
                if (textSpan) textSpan.style.opacity = '1';
                if (spinnerSpan) spinnerSpan.style.display = 'none';
            }
        }

        renderUserWidgets() {
            // Find all user profile containers across index.html and database.html
            const containers = document.querySelectorAll('.user-profile-slot, #user-profile-container');
            
            containers.forEach(container => {
                if (this.isAuthenticated()) {
                    const displayName = this.user.username || this.user.name || 'GM';
                    const initials = displayName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();

                    container.innerHTML = `
                        <div class="user-chip-dropdown">
                            <button type="button" class="user-chip-btn" id="user-chip-toggle">
                                <span class="user-avatar-badge">${initials}</span>
                                <span class="user-name-label">${this.escapeHtml(displayName)}</span>
                                <svg class="user-dropdown-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <div class="user-dropdown-menu" id="user-dropdown-menu">
                                <div class="user-dropdown-header">
                                    <div class="user-dropdown-name">${this.escapeHtml(displayName)}</div>
                                    <span class="user-role-tag">👑 Game Master</span>
                                </div>
                                <div class="user-dropdown-divider"></div>
                                <button type="button" class="user-dropdown-item btn-logout-action">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    `;

                    const toggleBtn = container.querySelector('#user-chip-toggle');
                    const menu = container.querySelector('#user-dropdown-menu');
                    const logoutBtn = container.querySelector('.btn-logout-action');

                    if (toggleBtn && menu) {
                        toggleBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            menu.classList.toggle('active');
                        });
                    }

                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', () => {
                            this.logout();
                        });
                    }
                } else {
                    container.innerHTML = `
                        <button type="button" class="btn-auth-trigger" id="btn-open-auth-modal" title="Sign In / Register">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span>Sign In / Register</span>
                        </button>
                    `;

                    const btn = container.querySelector('#btn-open-auth-modal');
                    if (btn) {
                        btn.addEventListener('click', () => this.openModal('login'));
                    }
                }
            });

            // Close any open dropdown on body click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.user-chip-dropdown')) {
                    document.querySelectorAll('.user-dropdown-menu.active').forEach(m => m.classList.remove('active'));
                }
            });
        }

        escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    }

    // Expose global instance
    const authInstance = new AuthManager();
    window.PathMonsterDBAuth = authInstance;
    window.PathGMAuth = authInstance;
})();
