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
        subtitle: 'Нажмите в любое место, чтобы начать'
    },
    {
        type: 'skipped',
        icon: '😷',
        title: 'Пропущенные уроки',
        value: (stats) => stats.skippedLessons,
        unit: 'уроков',
        description: (stats) => `Кто-то много болел в этом году. Всего пропущено ${stats.skippedLessons} уроков без учета каникул.`
    },
    {
        type: 'skipped_reason',
        icon: '🏃',
        title: 'Прогулянные уроки',
        value: (stats) => stats.skippedWithoutReason,
        unit: 'уроков',
        description: (stats) => `Без уважительной причины пропущено ${stats.skippedWithoutReason} уроков.`
    },
    {
        type: 'homework',
        icon: '📝',
        title: 'Невыполненные ДЗ',
        value: (stats) => stats.missedHomework,
        unit: 'заданий',
        description: (stats) => `За год не выполнено ${stats.missedHomework} домашних заданий. Больше всего пропусков по: ${stats.homeworkSubjects.slice(0, 3).join(', ')}.`
    },
    {
        type: 'breaks',
        icon: '⏱️',
        title: 'Время на переменах',
        value: (stats) => Math.floor(stats.breakTimeMinutes / 60),
        unit: 'часов',
        description: (stats) => `Проведено ${Math.floor(stats.breakTimeMinutes / 60)} часов (${stats.breakTimeMinutes} минут) на переменах.`
    },
    {
        type: 'grades',
        icon: '⭐',
        title: isBelarus ? 'Средняя оценка' : 'Средний балл',
        value: (stats) => stats.averageGrade,
        unit: isBelarus ? 'баллов' : '',
        description: (stats) => isBelarus 
            ? `Ваша средняя оценка: ${stats.averageGrade} баллов.`
            : `Ваш средний балл: ${stats.averageGrade}.`
    },
    {
        type: 'good_grades',
        icon: '✅',
        title: isBelarus ? 'Хорошие отметки' : 'Хорошие оценки',
        value: (stats) => stats.goodGrades,
        unit: 'штук',
        description: (stats) => isBelarus 
            ? `Получено ${stats.goodGrades} хороших отметок (7-10 баллов).`
            : `Получено ${stats.goodGrades} хороших оценок (4-5).`
    },
    {
        type: 'bad_grades',
        icon: '❌',
        title: isBelarus ? 'Плохие отметки' : 'Плохие оценки',
        value: (stats) => stats.badGrades,
        unit: 'штук',
        description: (stats) => isBelarus 
            ? `Получено ${stats.badGrades} плохих отметок (1-5 баллов).`
            : `Получено ${stats.badGrades} плохих оценок (2-3).`
    },
    {
        type: 'late',
        icon: '⏰',
        title: 'Опоздания',
        value: (stats) => stats.lateArrivals,
        unit: 'раз',
        description: (stats) => `За год вы опоздали ${stats.lateArrivals} раз. Может, стоит просыпаться раньше?`
    },
    {
        type: 'remarks',
        icon: '⚠️',
        title: 'Замечания',
        value: (stats) => stats.teacherRemarks,
        unit: 'раз',
        description: (stats) => `Получено ${stats.teacherRemarks} замечаний от учителей.`
    },
    {
        type: 'rest',
        icon: '🏖️',
        title: 'Дни отдыха',
        value: (stats) => stats.restDays,
        unit: 'дней',
        description: (stats) => `Всего отдохнули ${stats.restDays} дней (каникулы).`
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

// Показ слайда
function showSlide(index) {
    const slide = slides[index];
    const container = document.querySelector('.container');
    
    if (slide.type === 'welcome') {
        container.innerHTML = `
            <div class="slide welcome-slide">
                <div class="slide-icon">🎓</div>
                <h1 class="slide-title">${slide.title}</h1>
                <p class="slide-subtitle">${slide.subtitle}</p>
                <div class="slide-hint">👆 Нажмите в любом месте</div>
            </div>
        `;
    } else {
        const value = slide.value(userStats);
        const description = slide.description(userStats);
        
        container.innerHTML = `
            <div class="slide data-slide">
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
