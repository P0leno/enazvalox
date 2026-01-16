// Инициализация Telegram Mini App
let tg = window.Telegram?.WebApp;

// Определение страны пользователя
let userCountry = 'ru'; // По умолчанию Россия
let isBelarus = false;

// Инициализация приложения при загрузке
if (tg) {
    tg.ready();
    tg.expand();
    console.log('Telegram Web App инициализирован');
    
    // Определение страны по языку пользователя
    const userLanguage = tg.initDataUnsafe?.user?.language_code || 'ru';
    if (userLanguage === 'be' || userLanguage === 'be-BY') {
        userCountry = 'by';
        isBelarus = true;
    }
    
    // Настройка цветовой схемы Telegram
    tg.setHeaderColor('#667eea');
    tg.setBackgroundColor('#667eea');
    
    // Адаптация под тему Telegram
    const colorScheme = tg.colorScheme || 'light';
    if (colorScheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
    
    // Слушаем изменения темы
    tg.onEvent('themeChanged', () => {
        const newScheme = tg.colorScheme || 'light';
        document.body.setAttribute('data-theme', newScheme);
    });
}

// Список всех предметов
const subjects = [
    'Математика', 'Русский язык', 'Английский язык', 'Физика', 'Химия',
    'Биология', 'История', 'Обществознание', 'География', 'Литература',
    'Информатика', 'Физкультура', 'ОБЖ', 'Музыка', 'ИЗО'
];

// Данные пользователя (генерируются один раз и сохраняются)
let userStats = null;
let currentSlide = 0;

// Функция для генерации уникального ID пользователя
function getUserId() {
    if (tg && tg.initDataUnsafe?.user?.id) {
        return `user_${tg.initDataUnsafe.user.id}`;
    }
    return `user_${Date.now()}`;
}

// Функция для генерации реферальной ссылки
function getReferralLink() {
    const userId = getUserId();
    const botUsername = tg?.initDataUnsafe?.user?.username || 'bot';
    // Используем start параметр для реферальной системы
    return `https://t.me/${botUsername}?start=ref_${userId.split('_')[1]}`;
}

// Функция для генерации случайного числа в диапазоне
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Функция для генерации данных об учебном годе (один раз для каждого пользователя)
function generateUserStats() {
    const userId = getUserId();
    const storageKey = `yearStats_${userId}`;
    
    // Проверяем, есть ли уже сохраненные данные
    let savedStats = null;
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            savedStats = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Ошибка загрузки данных:', e);
    }
    
    if (savedStats) {
        return savedStats;
    }
    
    // Генерируем новые данные
    const baseRestDays = 92;
    const restDays = baseRestDays + random(-5, 5);
    
    const stats = {
        // Пропуски (без учета каникул) - кто-то много болел
        skippedLessons: random(45, 120),
        
        // Прогулянные уроки
        skippedWithoutReason: random(8, 35),
        
        // Дни отдыха (каникулы)
        restDays: restDays,
        
        // Невыполненные домашние задания (больше)
        missedHomework: random(35, 95),
        
        // Опоздания (много)
        lateArrivals: random(15, 45),
        
        // Средний балл (для России) или оценки (для Беларуси)
        averageGrade: isBelarus ? random(6, 10) : (Math.random() * 1.3 + 3.5).toFixed(2),
        
        // Количество хороших отметок (4-5 для России, 7-10 для Беларуси)
        goodGrades: random(25, 65),
        
        // Количество плохих отметок (2-3 для России, 1-5 для Беларуси)
        badGrades: random(3, 15),
        
        // Замечания от учителей (много)
        teacherRemarks: random(12, 28),
        
        // Время на переменах (в минутах за год)
        breakTimeMinutes: random(1800, 2800),
        
        // Предметы с наибольшим количеством невыполненного ДЗ
        homeworkSubjects: getRandomSubjects(random(4, 7)),
        
        // Предметы, которые чаще всего пропускали
        skippedSubjects: getRandomSubjects(random(3, 6)),
    };
    
    // Сохраняем данные
    try {
        localStorage.setItem(storageKey, JSON.stringify(stats));
        if (tg && tg.CloudStorage) {
            tg.CloudStorage.setItem(storageKey, JSON.stringify(stats));
        }
    } catch (e) {
        console.error('Ошибка сохранения данных:', e);
    }
    
    return stats;
}

// Функция для получения случайных предметов
function getRandomSubjects(count) {
    const shuffled = [...subjects].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Слайды с данными
const slides = [
    {
        type: 'welcome',
        title: '🎓 Итоги школьного года',
        subtitle: 'Нажмите в любое место, чтобы начать',
        colorClass: 'slide-default'
    },
    {
        type: 'skipped',
        icon: '😷',
        title: 'Пропущенные уроки',
        value: (stats) => stats.skippedLessons,
        unit: 'уроков',
        colorClass: 'slide-default',
        description: (stats) => {
            const hours = Math.floor(stats.skippedLessons * 0.75);
            if (stats.skippedLessons > 80) {
                return `Это примерно ${hours} часов, проведенных дома вместо парты. Здоровье важнее учебы — правильный выбор.`;
            } else if (stats.skippedLessons > 50) {
                return `Зимние простуды берут свое. Отдых и выздоровление — часть учебного процесса.`;
            } else {
                return `Хорошая посещаемость говорит о сильном иммунитете или упорстве. И то, и другое — ваша заслуга.`;
            }
        }
    },
    {
        type: 'skipped_reason',
        icon: '🏃',
        title: 'Прогулянные уроки',
        value: (stats) => stats.skippedWithoutReason,
        unit: 'уроков',
        colorClass: 'slide-default',
        description: (stats) => {
            if (stats.skippedWithoutReason > 25) {
                return `Каждое решение имеет последствия. Возможно, те моменты свободы стоили больше, чем пропущенные уроки.`;
            } else if (stats.skippedWithoutReason > 10) {
                return `Отдых от рутины — это нормально. Главное, чтобы выбор был осознанным, а не импульсивным.`;
            } else {
                return `Дисциплина — это когда вы делаете правильный выбор, даже когда не хочется. Уважаем.`;
            }
        }
    },
    {
        type: 'homework',
        icon: '📝',
        title: 'Невыполненные ДЗ',
        value: (stats) => stats.missedHomework,
        unit: 'заданий',
        colorClass: 'slide-default',
        description: (stats) => {
            const weeks = Math.floor(stats.missedHomework / 5);
            const topSubjects = stats.homeworkSubjects.slice(0, 3).join(', ');
            if (stats.missedHomework > 70) {
                return `Это ${weeks} недель работы, которая осталась на бумаге. По ${topSubjects} приоритеты были другими. Ваш выбор — ваша ответственность.`;
            } else if (stats.missedHomework > 40) {
                return `${topSubjects} — не ваша сильная сторона. Или просто не приоритет. Жизнь вне школы важна не меньше учебы.`;
            } else {
                return `Баланс между учебой и отдыхом найден. По ${topSubjects} можно было бы больше, но усталость — тоже реальность.`;
            }
        }
    },
    {
        type: 'breaks',
        icon: '⏱️',
        title: 'Время на переменах',
        value: (stats) => Math.floor(stats.breakTimeMinutes / 60),
        unit: 'часов',
        colorClass: 'slide-default',
        description: (stats) => {
            const hours = Math.floor(stats.breakTimeMinutes / 60);
            const fullDays = Math.floor(stats.breakTimeMinutes / (60 * 6.5));
            if (stats.breakTimeMinutes > 2500) {
                return `${fullDays} дней жизни в коридорах. ${stats.breakTimeMinutes} минут общения, дружбы и настоящих моментов. Иногда перемены важнее уроков.`;
            } else if (stats.breakTimeMinutes > 2200) {
                return `${hours} часов настоящей школьной жизни. Разговоры, смех, дружба — это то, что запомнится больше всего.`;
            } else {
                return `Организованность и пунктуальность — ваши сильные стороны. Хотя иногда полезно задержаться и просто поговорить.`;
            }
        }
    },
    {
        type: 'good_grades',
        icon: '✅',
        title: isBelarus ? 'Хорошие отметки' : 'Хорошие оценки',
        value: (stats) => stats.goodGrades,
        unit: 'штук',
        colorClass: 'slide-default',
        description: (stats) => {
            if (stats.goodGrades > 50) {
                return `Результат упорного труда и ответственного подхода. Это не случайность — это ваши усилия.`;
            } else if (stats.goodGrades > 30) {
                return `Стабильность важнее рекордов. Вы нашли свой темп и держите планку. Это дорогого стоит.`;
            } else {
                return `Каждый результат — это опыт. Главное — не останавливаться и продолжать движение вперед.`;
            }
        }
    },
    {
        type: 'bad_grades',
        icon: '❌',
        title: isBelarus ? 'Плохие отметки' : 'Плохие оценки',
        value: (stats) => stats.badGrades,
        unit: 'штук',
        colorClass: 'slide-default',
        description: (stats) => {
            if (stats.badGrades > 10) {
                return `Ошибки — часть пути. Они показывают, где нужно приложить усилия. Важно не повторять их, а извлекать уроки.`;
            } else if (stats.badGrades > 5) {
                return `Не все получается сразу. Главное — понимать причины и работать над улучшением. Прогресс важнее совершенства.`;
            } else {
                return `Минимум ошибок говорит о внимательности и ответственности. Это качества, которые останутся с вами навсегда.`;
            }
        }
    },
    {
        type: 'late',
        icon: '⏰',
        title: 'Опоздания',
        value: (stats) => stats.lateArrivals,
        unit: 'раз',
        colorClass: 'slide-default',
        description: (stats) => {
            if (stats.lateArrivals > 30) {
                return `Утро — не ваше время. Это не недостаток, а особенность. Важно находить способы адаптироваться к требованиям системы.`;
            } else if (stats.lateArrivals > 15) {
                return `Трудно просыпаться рано, особенно зимой. Но вы находили силы приходить — это дисциплина, даже если не всегда успешная.`;
            } else {
                return `Пунктуальность — признак организованности и уважения к времени других. Ценное качество в любом возрасте.`;
            }
        }
    },
    {
        type: 'remarks',
        icon: '⚠️',
        title: 'Замечания',
        value: (stats) => stats.teacherRemarks,
        unit: 'раз',
        colorClass: 'slide-default',
        description: (stats) => {
            if (stats.teacherRemarks > 20) {
                return `Энергия и независимость — ваши сильные стороны. Важно направлять их конструктивно, а не против системы.`;
            } else if (stats.teacherRemarks > 10) {
                return `Отстаивание позиции — признак характера. Баланс между принципами и компромиссами — искусство, которое приходит с опытом.`;
            } else {
                return `Умение следовать правилам и контролировать себя — навык, который пригодится во взрослой жизни. Цените это качество.`;
            }
        }
    },
    {
        type: 'rest',
        icon: '🏖️',
        title: 'Дни отдыха',
        value: (stats) => stats.restDays,
        unit: 'дней',
        colorClass: 'slide-default',
        description: (stats) => {
            const months = Math.floor(stats.restDays / 30);
            if (stats.restDays > 95) {
                return `${months} месяцев без школы — время для восстановления и новых впечатлений. Отдых — неотъемлемая часть эффективной учебы.`;
            } else if (stats.restDays > 90) {
                return `Каникулы — это не просто отсутствие уроков. Это время для роста вне школьных стен. Надеемся, вы использовали его с умом.`;
            } else {
                return `Каждая минута отдыха важна. Баланс между учебой и восстановлением — ключ к долгосрочному успеху.`;
            }
        }
    },
    {
        type: 'final',
        title: '🎉 Итоги подведены!',
        subtitle: 'Поделитесь с друзьями',
        colorClass: 'slide-default'
    }
];

// Инициализация приложения
function initApp() {
    // Генерируем/загружаем данные пользователя
    userStats = generateUserStats();
    
    // Показываем первый слайд (приветствие)
    currentSlide = 0;
    showSlide(0);
    
    // Добавляем обработчик клика для переключения слайдов
    document.addEventListener('click', handleSlideClick);
}

// Обработчик клика для переключения слайдов
function handleSlideClick(event) {
    // Игнорируем клики по кнопкам
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
        return;
    }
    
    // Не переключаем на финальном слайде
    const currentSlideData = slides[currentSlide];
    if (currentSlideData && currentSlideData.type === 'final') {
        return;
    }
    
    // Переходим к следующему слайду
    nextSlide();
}

// Переход к следующему слайду
function nextSlide() {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        showSlide(currentSlide);
    } else {
        // Если последний слайд - возвращаемся к началу
        currentSlide = 0;
        showSlide(0);
    }
}

// Переход к началу (для кнопки "Посмотреть заново")
function restart() {
    currentSlide = 0;
    showSlide(0);
}

// Показ слайда
function showSlide(index) {
    const slide = slides[index];
    const container = document.querySelector('.container');
    const colorClass = slide.colorClass || 'slide-default';
    
    if (slide.type === 'welcome') {
        container.innerHTML = `
            <div class="slide welcome-slide ${colorClass}">
                <div class="slide-icon">🎓</div>
                <h1 class="slide-title">${slide.title}</h1>
                <p class="slide-subtitle">${slide.subtitle}</p>
                <div class="slide-hint">👆 Нажмите в любом месте</div>
            </div>
        `;
    } else if (slide.type === 'final') {
        const referralLink = getReferralLink();
        container.innerHTML = `
            <div class="slide final-slide ${colorClass}">
                <div class="slide-icon">🎉</div>
                <h1 class="slide-title">${slide.title}</h1>
                <p class="slide-subtitle">${slide.subtitle}</p>
                <div class="final-actions">
                    <button class="btn btn-primary btn-large" onclick="shareReferral()">
                        📤 Поделиться с другом
                    </button>
                    <button class="btn btn-secondary" onclick="restart()">
                        🔄 Посмотреть заново
                    </button>
                </div>
                <div class="referral-link" id="referralLink" style="display: none;">
                    <input type="text" id="linkInput" readonly value="${referralLink}">
                    <button class="btn-copy" onclick="copyReferralLink()">📋</button>
                </div>
            </div>
        `;
    } else {
        const value = slide.value(userStats);
        const description = slide.description(userStats);
        
        container.innerHTML = `
            <div class="slide data-slide ${colorClass}" data-type="${slide.type}">
                <div class="slide-icon large">${slide.icon}</div>
                <h2 class="slide-title">${slide.title}</h2>
                <div class="slide-value">
                    <span class="value-number">${value}</span>
                    ${slide.unit ? `<span class="value-unit">${slide.unit}</span>` : ''}
                </div>
                <p class="slide-description">${description}</p>
                <div class="slide-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (currentSlide / (slides.length - 1)) * 100)}%"></div>
                    </div>
                    <span class="progress-text">${currentSlide} / ${slides.length - 1}</span>
                </div>
            </div>
        `;
    }
    
    // Анимация появления
    container.style.opacity = '0';
    setTimeout(() => {
        container.style.opacity = '1';
    }, 50);
}

// Поделиться реферальной ссылкой
function shareReferral() {
    const referralLink = getReferralLink();
    const linkDiv = document.getElementById('referralLink');
    
    if (linkDiv) {
        linkDiv.style.display = 'flex';
        document.getElementById('linkInput').value = referralLink;
    }
    
    // Пробуем использовать Telegram Share API
    if (tg && tg.shareLink) {
        tg.shareLink(referralLink, 'Посмотри свои итоги школьного года! 🎓');
    } else {
        // Копируем в буфер обмена
        copyReferralLink();
    }
}

// Копировать реферальную ссылку
function copyReferralLink() {
    const linkInput = document.getElementById('linkInput');
    if (linkInput) {
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        document.execCommand('copy');
        
        // Показываем уведомление
        if (tg && tg.showAlert) {
            tg.showAlert('Ссылка скопирована!');
        } else {
            alert('Ссылка скопирована в буфер обмена!');
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение инициализировано');
    console.log('Страна пользователя:', isBelarus ? 'Беларусь' : 'Россия');
    
    initApp();
    
    // Показываем кнопку "Назад" если приложение открыто в Telegram
    if (tg) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            tg.close();
        });
    }
});
