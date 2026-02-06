// ==================== UI УТИЛИТЫ И АНИМАЦИИ ====================

console.log('🎨 Загрузка UI утилит...');

/**
 * Показать элемент с анимацией
 */
function showWithAnimation(element, animation = 'fadeInUp') {
    if (!element) return;
    element.classList.add(`animate-${animation}`);
    element.style.display = 'block';
}

/**
 * Скрыть элемент с анимацией
 */
function hideWithAnimation(element, animation = 'slideOut', callback = null) {
    if (!element) return;
    element.classList.add(`animate-${animation}`);
    setTimeout(() => {
        element.style.display = 'none';
        element.classList.remove(`animate-${animation}`);
        if (callback) callback();
    }, 300);
}

/**
 * Пульсирующее воздействие при нажатии
 */
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    const ripples = button.querySelectorAll('.ripple');
    ripples.forEach(r => r.remove());
    
    button.appendChild(ripple);
}

/**
 * Добавить стиль ripple эффекта
 */
function initRippleEffect() {
    const style = document.createElement('style');
    style.textContent = `
        .btn {
            position: relative;
            overflow: hidden;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Добавить слушателей на все кнопки
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', createRipple);
    });
}

/**
 * Плавный скролл к элементу
 */
function smoothScrollTo(selector, offset = 0) {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
    });
}

/**
 * Анимация появления элементов при скролле
 */
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });
}

/**
 * Переключение темы (светлая/темная)
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    return newTheme;
}

/**
 * Инициализировать сохраненную тему
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * Показать уведомление с анимацией
 */
function showNotification(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        ${message}
        <button class="close-notification" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Автоматическое скрытие
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

/**
 * Подтверждение действия
 */
function confirmAction(message = 'Вы уверены?') {
    return confirm(message);
}

/**
 * Показать модальное окно с вопросом
 */
function showDialog(title, message, onConfirm = null, onCancel = null) {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-backdrop active';
    dialog.innerHTML = `
        <div class="dialog">
            <div class="dialog-header">
                <h2 class="dialog-title">${title}</h2>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-body">${message}</div>
            <div class="dialog-footer">
                <button class="btn btn-outline" id="dialog-cancel">Отмена</button>
                <button class="btn btn-primary" id="dialog-confirm">ОК</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    const closeBtn = dialog.querySelector('.dialog-close');
    const confirmBtn = dialog.querySelector('#dialog-confirm');
    const cancelBtn = dialog.querySelector('#dialog-cancel');
    
    const close = () => {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 300);
    };
    
    closeBtn.addEventListener('click', () => {
        close();
        if (onCancel) onCancel();
    });
    
    confirmBtn.addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
        close();
        if (onCancel) onCancel();
    });
}

/**
 * Форматировать число как валюта
 */
function formatCurrency(amount, currency = '₽') {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
    }).format(amount);
}

/**
 * Форматировать дату
 */
function formatDate(date, format = 'dd.MM.yyyy') {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    if (format === 'dd.MM.yyyy') return `${day}.${month}.${year}`;
    if (format === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
    return d.toLocaleDateString('ru-RU');
}

/**
 * Копировать текст в буфер обмена
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Скопировано в буфер обмена', 'success', 2000);
        return true;
    } catch (err) {
        showNotification('Ошибка при копировании', 'error');
        return false;
    }
}

/**
 * Скрыть элемент с скроллингом
 */
function hideOnScroll(element) {
    let ticking = false;
    let lastScrollY = 0;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > lastScrollY) {
                    element.style.opacity = '0';
                    element.style.pointerEvents = 'none';
                } else {
                    element.style.opacity = '1';
                    element.style.pointerEvents = 'auto';
                }
                lastScrollY = window.scrollY;
                ticking = false;
            });
            ticking = true;
        }
    });
}

/**
 * Анимировать счетчик
 */
function animateCounter(element, target, duration = 1000) {
    const start = parseInt(element.textContent) || 0;
    const range = target - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Анимировать прогресс-бар
 */
function animateProgress(element, targetPercent, duration = 1000) {
    const fill = element.querySelector('.progress-fill');
    if (!fill) return;
    
    const start = parseInt(fill.style.width) || 0;
    const range = targetPercent - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        
        if ((increment > 0 && current >= targetPercent) || (increment < 0 && current <= targetPercent)) {
            fill.style.width = targetPercent + '%';
            clearInterval(timer);
        } else {
            fill.style.width = Math.floor(current) + '%';
        }
    }, 16);
}

/**
 * Валидация email
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Валидация телефона
 */
function isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
}

/**
 * Получить параметры URL
 */
function getUrlParam(paramName) {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
}

/**
 * Установить параметры URL
 */
function setUrlParam(paramName, paramValue) {
    const url = new URL(window.location);
    url.searchParams.set(paramName, paramValue);
    window.history.pushState({}, '', url);
}

/**
 * Проверить поддержку функции
 */
function isSupported(feature) {
    const features = {
        'localStorage': typeof localStorage !== 'undefined',
        'sessionStorage': typeof sessionStorage !== 'undefined',
        'serviceWorker': 'serviceWorker' in navigator,
        'notificationAPI': 'Notification' in window,
        'geolocation': 'geolocation' in navigator,
        'clipboard': navigator.clipboard !== undefined,
        'vibration': 'vibrate' in navigator
    };
    
    return features[feature] || false;
}

/**
 * Инициализировать все UI эффекты
 */
function initUI() {
    console.log('✨ Инициализация UI эффектов...');
    
    // Инициализируем тему
    initTheme();
    
    // Инициализируем ripple эффект
    initRippleEffect();
    
    // Наблюдаем за элементами для анимации
    observeElements();
    
    console.log('✅ UI утилиты инициализированы');
}

// Экспортируем функции
window.UI = window.UI || {};
Object.assign(window.UI, {
    showWithAnimation,
    hideWithAnimation,
    showNotification,
    confirmAction,
    showDialog,
    formatCurrency,
    formatDate,
    copyToClipboard,
    smoothScrollTo,
    animateCounter,
    animateProgress,
    toggleTheme,
    initTheme,
    isValidEmail,
    isValidPhone,
    getUrlParam,
    setUrlParam,
    isSupported,
    initUI
});

// Инициализируем при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}
