// performance-monitor.js - Мониторинг производительности для анализа проблем

console.log('📊 Инициализация мониторинга производительности...');

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.isDev = this.isLocalhost || window.location.pathname.includes('dev');
    }

    /**
     * Отслеживание метрик производительности
     */
    startMonitoring() {
        // Отслеживаем основные метрики
        this.monitorNavigationTiming();
        this.monitorWebVitals();
        this.monitorResourceTiming();
    }

    /**
     * Скачивание Navigation Timing (когда началась/закончилась загрузка)
     */
    monitorNavigationTiming() {
        window.addEventListener('load', () => {
            // Даём браузеру время завершить все вычисления
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;
                const renderTime = perfData.domComplete - perfData.domLoading;
                const domInteractiveTime = perfData.domInteractive - perfData.navigationStart;

                this.metrics.navigationTiming = {
                    pageLoadTime,
                    connectTime,
                    renderTime,
                    domInteractiveTime,
                    timeToFirstByte: perfData.responseStart - perfData.fetchStart,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                    firstPaint: this.getFirstPaint()
                };

                if (this.isDev) {
                    console.log('⏱️ Navigation Timing:', {
                        'Общая загрузка (мс)': pageLoadTime,
                        'Соединение (мс)': connectTime,
                        'Отрисовка DOM (мс)': renderTime,
                        'DOM Interactive (мс)': domInteractiveTime,
                        'Time to First Byte (мс)': this.metrics.navigationTiming.timeToFirstByte,
                        'DOM Content Loaded (мс)': this.metrics.navigationTiming.domContentLoaded
                    });
                }

                this.sendMetrics();
            }, 0);
        });
    }

    /**
     * Отслеживание Web Vitals (LCP, FID, CLS)
     */
    monitorWebVitals() {
        // Largest Contentful Paint (LCP)
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = {
                    value: lastEntry.renderTime || lastEntry.loadTime,
                    element: lastEntry.element?.outerHTML.substring(0, 50) || 'unknown'
                };
                if (this.isDev) console.log('📐 LCP:', this.metrics.lcp.value, 'мс');
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            console.warn('⚠️ LCP Observer не поддерживается');
        }

        // Cumulative Layout Shift (CLS)
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.cls = clsValue;
                if (this.isDev) console.log('📊 CLS:', clsValue.toFixed(3));
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
            console.warn('⚠️ CLS Observer не поддерживается');
        }

        // First Input Delay (FID) - через Event Timing
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (entries.length > 0) {
                    const firstEntry = entries[0];
                    this.metrics.fid = {
                        value: firstEntry.processingDuration,
                        name: firstEntry.name
                    };
                    if (this.isDev) console.log('⌨️ FID:', this.metrics.fid.value, 'мс');
                }
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.warn('⚠️ FID Observer не поддерживается');
        }
    }

    /**
     * Отслеживание Resource Timing (какие ресурсы грузятся долго)
     */
    monitorResourceTiming() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const resources = window.performance.getEntriesByType('resource');
                
                // Группируем по типам ресурсов
                const resourceStats = {
                    script: [],
                    stylesheet: [],
                    img: [],
                    fetch: [],
                    xmlhttprequest: [],
                    other: []
                };

                resources.forEach(resource => {
                    const entry = {
                        name: resource.name.split('/').pop() || resource.name,
                        duration: resource.duration.toFixed(2),
                        size: ((resource.transferSize || 0) / 1024).toFixed(2) + ' KB',
                        initiatorType: resource.initiatorType,
                        startTime: resource.startTime.toFixed(2)
                    };

                    if (resource.initiatorType === 'script') {
                        resourceStats.script.push(entry);
                    } else if (resource.initiatorType === 'link') {
                        resourceStats.stylesheet.push(entry);
                    } else if (resource.initiatorType === 'img') {
                        resourceStats.img.push(entry);
                    } else if (resource.initiatorType === 'fetch') {
                        resourceStats.fetch.push(entry);
                    } else if (resource.initiatorType === 'xmlhttprequest') {
                        resourceStats.xmlhttprequest.push(entry);
                    } else {
                        resourceStats.other.push(entry);
                    }
                });

                // Сортируем по времени загрузки (самые медленные первые)
                Object.keys(resourceStats).forEach(key => {
                    resourceStats[key].sort((a, b) => 
                        parseFloat(b.duration) - parseFloat(a.duration)
                    );
                });

                this.metrics.resources = resourceStats;

                if (this.isDev) {
                    console.log('📦 Self Resources:', {
                        'Scripts': resourceStats.script.slice(0, 3),
                        'Stylesheets': resourceStats.stylesheet.slice(0, 3),
                        'Fetch/XHR': resourceStats.fetch.slice(0, 3)
                    });
                }
            }, 100);
        });
    }

    /**
     * Получение First Paint
     */
    getFirstPaint() {
        try {
            const paintEntries = window.performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Отправка метрик на сервер (опционально)
     */
    sendMetrics() {
        // Отправляем только если не localhost
        if (this.isLocalhost) {
            console.log('📊 Полные метрики производительности:', this.metrics);
            return;
        }

        // На production можно отправить на аналитику
        try {
            const data = {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                metrics: {
                    navigationTiming: this.metrics.navigationTiming,
                    lcp: this.metrics.lcp,
                    fid: this.metrics.fid,
                    cls: this.metrics.cls
                }
            };

            // Используем sendBeacon для отправки данных аналитики
            // (гарантирует отправку даже при закрытии страницы)
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/metrics', JSON.stringify(data));
            }
        } catch (error) {
            console.error('❌ Ошибка отправки метрик:', error);
        }
    }

    /**
     * Получить сводку производительности
     */
    getSummary() {
        return {
            status: this.isHealthy() ? '✅ Хорошо' : '⚠️ Медленно',
            metrics: this.metrics,
            recommendations: this.getRecommendations()
        };
    }

    /**
     * Проверка, хорошая ли производительность
     */
    isHealthy() {
        const lcp = this.metrics.lcp?.value || 0;
        const cls = this.metrics.cls || 0;
        const navTiming = this.metrics.navigationTiming;

        // Core Web Vitals стандарты
        return (
            lcp < 2500 &&  // LCP должен быть < 2.5s
            cls < 0.1 &&   // CLS должен быть < 0.1
            (!navTiming || navTiming.pageLoadTime < 3000)  // Общая загрузка < 3s
        );
    }

    /**
     * Рекомендации по оптимизации
     */
    getRecommendations() {
        const recommendations = [];
        const navTiming = this.metrics.navigationTiming;
        const lcp = this.metrics.lcp?.value || 0;
        const resources = this.metrics.resources || {};

        if (lcp > 2500) {
            recommendations.push('⚠️ LCP медленный - оптимизруйте изображения и CSS');
        }

        if (navTiming?.pageLoadTime > 3000) {
            recommendations.push('⚠️ Общая загрузка > 3с - уменьшите размер JS/CSS');
        }

        if (resources.script?.some(r => parseFloat(r.duration) > 1000)) {
            recommendations.push('⚠️ Медленный скрипт - используйте lazy loading');
        }

        if (!recommendations.length) {
            recommendations.push('✅ Производительность в норме!');
        }

        return recommendations;
    }
}

// Инициализируем мониторинг
const perfMonitor = new PerformanceMonitor();
perfMonitor.startMonitoring();

// Используем Web Vitals API если доступен
if ('web-vital' in window) {
    console.log('📊 Web Vitals API используется');
}

// Делаем доступным глобально
window.PerformanceMonitor = perfMonitor;
