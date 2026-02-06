// app.js - Основное приложение
console.log('🚀 Money in Sight загружается...');

// Функция для ожидания, пока модуль будет доступным
function waitForModule(moduleName, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            const module = window[moduleName];
            if (module) {
                clearInterval(checkInterval);
                resolve(module);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                reject(new Error(`Module ${moduleName} не загружен за ${timeout}мс`));
            }
        }, 50);
    });
}

// Инициализация приложения
async function initializeApp() {
    try {
        console.log('🔧 Инициализация приложения...');
        
        // Ожидаем загрузки всех необходимых модулей
        console.log('⏳ Ожидание загрузки модулей...');
        await Promise.all([
            waitForModule('firebaseApp', 8000),
            waitForModule('Auth', 8000),
            waitForModule('UI', 8000),
            waitForModule('Data', 8000),
            waitForModule('Payments', 8000)
        ]);
        console.log('✅ Все модули загружены');
        
        // Инициализируем Firebase
        await window.firebaseApp.initializeFirebase();
        
        // Инициализируем UI (делаем это до аутентификации, чтобы обновления профиля
        // могли безопасно работать с DOM-элементами сразу при входе)
        window.UI.initializeUI();

        // Инициализируем аутентификацию
        await window.Auth.initializeAuth();

        // Инициализируем платежную систему
        await window.Payments.initializePayments();
        
        // Регистрируем Service Worker для PWA (только на desktop)
        if ('serviceWorker' in navigator && window.innerWidth > 768) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('✅ Service Worker зарегистрирован:', registration);
            } catch (error) {
                console.warn('⚠️ Ошибка регистрации Service Worker:', error);
                // На мобильных браузерах игнорируем ошибку Service Worker
            }
        }
        
        // Настраиваем глобальные обработчики
        setupGlobalHandlers();
        
        // Настраиваем обработчики для регистрации и входа
        setupAuthHandlers();
        
        console.log('✅ Приложение успешно загружено');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки приложения:', error);
        showCriticalError(`Не удалось загрузить приложение: ${error.message}\n\nПожалуйста, обновите страницу.`);
    }
}

// Настройка обработчиков для аутентификации
// Настройка обработчиков для аутентификации
function setupAuthHandlers() {
    console.log('🔐 Настройка обработчиков аутентификации...');
    
    // 1. Кнопки "Начать бесплатно" на главной странице
    const registerButtons = [
        document.getElementById('registerBtn'),
        document.getElementById('welcomeRegisterBtn')
    ];
    
    registerButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                window.UI.openModal('registerModal');
            });
        }
    });
    
    // 2. Кнопки "Войти" на главной странице
    const loginButtons = [
        document.getElementById('loginBtn'),
        document.getElementById('welcomeLoginBtn')
    ];
    
    loginButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                window.UI.openModal('loginModal');
            });
        }
    });
    
    // 3. Форма регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleRegistration();
        });
    }
    
    // 4. Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }
    
    // 5. Кнопка выхода в хедере
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await handleLogout();
        });
    }
    
    // 6. Ссылки "Войти" и "Зарегистрироваться" в модалках
    const loginLink = document.querySelector('a[href="#"][onclick*="loginModal"]');
    if (loginLink) {
        loginLink.onclick = function(e) {
            e.preventDefault();
            window.UI.closeModal('registerModal');
            window.UI.openModal('loginModal');
        };
    }
    
    const registerLink = document.querySelector('a[href="#"][onclick*="registerModal"]');
    if (registerLink) {
        registerLink.onclick = function(e) {
            e.preventDefault();
            window.UI.closeModal('loginModal');
            window.UI.openModal('registerModal');
        };
    }
    
    console.log('✅ Обработчики аутентификации настроены');
}

// Обработчик регистрации
async function handleRegistration() {
    const name = document.getElementById('registerName')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const agreeTerms = document.getElementById('agreeTerms')?.checked;
    
    // Валидация
    if (!name || !email || !password) {
        window.UI.showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (!agreeTerms) {
        window.UI.showNotification('Примите условия использования', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        window.UI.showNotification('Неверный формат email', 'error');
        return;
    }
    
    if (password.length < 6) {
        window.UI.showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#registerForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Показываем индикатор загрузки
        submitBtn.innerHTML = '<div class="spinner"></div> Регистрация...';
        submitBtn.disabled = true;
        
        console.log('📝 Регистрация пользователя:', email);
        
        // Используем функцию из auth.js
        const result = await window.Auth.registerUser(name, email, password);
        
        if (result.success && result.requiresVerification) {
            // Помечаем состояние регистрации; не сохраняем пароль в памяти
            if (!window._registrationState) window._registrationState = {};
            window._registrationState.inProgress = true;
            
            // Закрываем окно регистрации
            window.UI.closeModal('registerModal');
            
            // Показываем уведомление
            window.UI.showNotification('Код подтверждения отправлен на ваш email', 'success');
            
            // Открываем окно верификации
            setTimeout(() => {
                if (typeof openEmailVerificationModal === 'function') {
                    openEmailVerificationModal(email);
                }
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        window.UI.showNotification(error.message, 'error');
        
        // Очищаем поле пароля при ошибке
        const passwordField = document.getElementById('registerPassword');
        if (passwordField) passwordField.value = '';
        
    } finally {
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Обработчик входа
async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    
    // Валидация
    if (!email || !password) {
        window.UI.showNotification('Заполните все поля', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Показываем индикатор загрузки
        submitBtn.innerHTML = '<div class="spinner"></div> Вход...';
        submitBtn.disabled = true;
        
        console.log('🔐 Попытка входа:', email);
        
        // Используем функцию из auth.js
        await window.Auth.loginUser(email, password);
        
        // Закрываем модальное окно
        window.UI.closeModal('loginModal');
        
        // Показываем уведомление
        window.UI.showNotification('Вход выполнен успешно!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        window.UI.showNotification(error.message, 'error');
        
        // Очищаем поле пароля при ошибке
        const passwordField = document.getElementById('loginPassword');
        if (passwordField) passwordField.value = '';
        
    } finally {
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Обработчик выхода
async function handleLogout() {
    try {
        await window.Auth.logoutUser();
        window.UI.showNotification('Вы успешно вышли из системы', 'success');
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        window.UI.showNotification('Ошибка при выходе', 'error');
    }
}

// Настройка глобальных обработчиков
function setupGlobalHandlers() {
    // Обработчики для модальных окон документов
    document.querySelectorAll('a[onclick*="showTermsModal"]').forEach(link => {
        link.onclick = () => window.UI.openModal('termsModal');
    });
    
    document.querySelectorAll('a[onclick*="showPrivacyModal"]').forEach(link => {
        link.onclick = () => window.UI.openModal('privacyModal');
    });
    
    document.querySelectorAll('a[onclick*="showOfferModal"]').forEach(link => {
        link.onclick = () => window.UI.openModal('offerModal');
    });
    
    document.querySelectorAll('a[onclick*="showRefundModal"]').forEach(link => {
        link.onclick = () => window.UI.openModal('refundModal');
    });
    
    // Обработчик для выбора метода оплаты
    document.querySelectorAll('.payment-method').forEach(method => {
        const onclick = method.getAttribute('onclick');
        if (onclick && onclick.includes('selectPaymentMethod')) {
            const methodName = onclick.match(/'([^']+)'/)[1];
            method.onclick = () => window.Payments.selectPaymentMethod(methodName);
        }
    });
    
    // Обработчик для кнопки оплаты в подписке
    const payButton = document.querySelector('.btn-primary[onclick*="openPaymentModal"]');
    if (payButton) {
        payButton.onclick = window.Payments.openPaymentModal;
    }
}

// Показ критической ошибки
function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        text-align: center;
    `;
    
    errorDiv.innerHTML = `
        <h2 style="color: #f56565; margin-bottom: 20px;">❌ Ошибка загрузки</h2>
        <p style="margin-bottom: 30px; font-size: 18px;">${message}</p>
        <button onclick="location.reload()" 
                style="padding: 12px 24px; 
                       background: #667eea; 
                       color: white; 
                       border: none; 
                       border-radius: 8px; 
                       cursor: pointer; 
                       font-size: 16px;">
            Обновить страницу
        </button>
    `;
    
    document.body.appendChild(errorDiv);
}

// Запуск приложения при загрузке страницы
let appInitialized = false;

async function safeInitializeApp() {
    if (appInitialized) return;
    appInitialized = true;
    
    console.log('🖥️ Устройство:', navigator.userAgent.substring(0, 50));
    console.log('📱 Ширина экрана:', window.innerWidth);
    console.log('🌐 Язык браузера:', navigator.language);
    
    try {
        await initializeApp();
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
    }
}

document.addEventListener('DOMContentLoaded', safeInitializeApp);
window.addEventListener('load', safeInitializeApp); // Резервный вызов

// Таймаут на случай, если события не сработают
setTimeout(safeInitializeApp, 5000);

// Экспорт функций для глобального использования
window.handleLogout = handleLogout;
window.handleLogin = handleLogin;
window.handleRegistration = handleRegistration;

console.log('📦 app.js загружен');