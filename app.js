// Инициализация Telegram Mini App
let tg = window.Telegram?.WebApp;

// Инициализация приложения при загрузке
if (tg) {
    tg.ready();
    tg.expand(); // Разворачиваем приложение на весь экран
    console.log('Telegram Web App инициализирован');
    
    // Настройка цветовой схемы Telegram
    tg.setHeaderColor('#667eea');
    tg.setBackgroundColor('#667eea');
}

// Данные результатов (для сохранения между сессиями)
let currentResults = null;

// Список всех предметов
const subjects = [
    'Математика', 'Русский язык', 'Английский язык', 'Физика', 'Химия',
    'Биология', 'История', 'Обществознание', 'География', 'Литература',
    'Информатика', 'Физкультура', 'ОБЖ', 'Музыка', 'ИЗО'
];

// Функция для генерации случайного числа в диапазоне
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Функция для генерации данных об учебном годе
function generateYearStats() {
    // Базовое количество дней отдыха (например, 92 дня каникул)
    const baseRestDays = 92;
    const restDaysVariation = 5; // Разброс ±5 дней
    const restDays = baseRestDays + random(-restDaysVariation, restDaysVariation);
    
    // Пропуски уроков (от 0 до 150)
    const skippedLessons = random(0, 150);
    
    // Прогулянные уроки (от 0 до 50, обычно меньше чем пропуски по болезни)
    const skippedWithoutReason = random(0, 50);
    
    // Невыполненные домашние задания (от 5 до 80)
    const missedHomework = random(5, 80);
    
    // Опоздания (от 0 до 30)
    const lateArrivals = random(0, 30);
    
    // Средний балл (от 3.5 до 5.0)
    const averageGrade = (Math.random() * 1.5 + 3.5).toFixed(2);
    
    // Количество предметов с отличными оценками
    const excellentGrades = random(0, 8);
    
    // Количество замечаний от учителей
    const teacherRemarks = random(0, 15);
    
    // Самые часто пропускаемые предметы
    const skippedSubjects = getRandomSubjects(random(2, 5));
    
    // Предметы с наибольшим количеством невыполненного ДЗ
    const homeworkSubjects = getRandomSubjects(random(3, 6));
    
    return {
        restDays,
        skippedLessons,
        skippedWithoutReason,
        missedHomework,
        lateArrivals,
        averageGrade,
        excellentGrades,
        teacherRemarks,
        skippedSubjects,
        homeworkSubjects
    };
}

// Функция для получения случайных предметов
function getRandomSubjects(count) {
    const shuffled = [...subjects].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Функция для генерации интересных фактов
function generateFunFacts(stats) {
    const facts = [];
    
    if (stats.restDays > 95) {
        facts.push({
            icon: '🏖️',
            text: `Вы отдохнули целых ${stats.restDays} дней! Это почти ${Math.round(stats.restDays / 30)} месяцев каникул!`
        });
    }
    
    if (stats.skippedLessons > 100) {
        facts.push({
            icon: '😷',
            text: `Вы пропустили ${stats.skippedLessons} уроков. Возможно, стоило больше заботиться о здоровье?`
        });
    } else if (stats.skippedLessons < 20) {
        facts.push({
            icon: '💪',
            text: `Отличная посещаемость! Вы пропустили всего ${stats.skippedLessons} уроков!`
        });
    }
    
    if (stats.skippedWithoutReason > 30) {
        facts.push({
            icon: '🏃',
            text: `Вы прогуляли ${stats.skippedWithoutReason} уроков без уважительной причины. Интересно, куда вы ходили?`
        });
    }
    
    if (stats.missedHomework > 60) {
        facts.push({
            icon: '📚',
            text: `${stats.missedHomework} невыполненных домашних заданий! Это примерно ${Math.round(stats.missedHomework / 5)} недель работы.`
        });
    } else if (stats.missedHomework < 15) {
        facts.push({
            icon: '⭐',
            text: `Превосходно! Вы выполнили почти все задания (пропущено только ${stats.missedHomework})!`
        });
    }
    
    if (stats.averageGrade >= 4.5) {
        facts.push({
            icon: '🏆',
            text: `Ваш средний балл ${stats.averageGrade} - это отличный результат!`
        });
    } else if (stats.averageGrade < 4.0) {
        facts.push({
            icon: '📈',
            text: `Средний балл ${stats.averageGrade}. Есть куда стремиться в следующем году!`
        });
    }
    
    if (stats.lateArrivals > 20) {
        facts.push({
            icon: '⏰',
            text: `Вы опоздали ${stats.lateArrivals} раз. Может, стоит просыпаться раньше?`
        });
    }
    
    // Всегда добавляем хотя бы один общий факт
    if (facts.length === 0) {
        facts.push({
            icon: '📊',
            text: `Ваш учебный год был достаточно стабильным. Продолжайте в том же духе!`
        });
    }
    
    return facts;
}

// Функция для отображения результатов
function displayResults(stats) {
    // Обновляем основные карточки
    document.getElementById('skippedLessons').textContent = stats.skippedLessons;
    document.getElementById('skippedWithoutReason').textContent = stats.skippedWithoutReason;
    document.getElementById('restDays').textContent = stats.restDays;
    document.getElementById('missedHomework').textContent = stats.missedHomework;
    
    // Детальная статистика
    const detailedStatsContainer = document.getElementById('detailedStats');
    detailedStatsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-item-icon">⏰</div>
            <div class="stat-item-content">
                <div class="stat-item-label">Опоздания</div>
                <div class="stat-item-value">${stats.lateArrivals} раз</div>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-item-icon">⭐</div>
            <div class="stat-item-content">
                <div class="stat-item-label">Средний балл</div>
                <div class="stat-item-value">${stats.averageGrade}</div>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-item-icon">🏆</div>
            <div class="stat-item-content">
                <div class="stat-item-label">Отличных оценок</div>
                <div class="stat-item-value">${stats.excellentGrades} предметов</div>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-item-icon">⚠️</div>
            <div class="stat-item-content">
                <div class="stat-item-label">Замечаний от учителей</div>
                <div class="stat-item-value">${stats.teacherRemarks}</div>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-item-icon">📚</div>
            <div class="stat-item-content">
                <div class="stat-item-label">Чаще всего пропускали</div>
                <div class="stat-item-value">${stats.skippedSubjects.join(', ')}</div>
            </div>
        </div>
        <div class="stat-item">
            <div class="stat-item-icon">📝</div>
            <div class="stat-item-content">
                <div class="stat-item-label">Больше всего невыполненного ДЗ</div>
                <div class="stat-item-value">${stats.homeworkSubjects.join(', ')}</div>
            </div>
        </div>
    `;
    
    // Интересные факты
    const facts = generateFunFacts(stats);
    const factsContainer = document.getElementById('funFacts');
    factsContainer.innerHTML = facts.map(fact => `
        <div class="fact-item">
            <div class="fact-icon">${fact.icon}</div>
            <div class="fact-text">${fact.text}</div>
        </div>
    `).join('');
}

// Функция генерации результатов
function generateResults() {
    const stats = generateYearStats();
    currentResults = stats;
    
    // Переключаем экраны
    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('resultsScreen').classList.add('active');
    
    // Показываем результаты
    displayResults(stats);
    
    // Сохраняем результаты
    saveResults(stats);
}

// Функция регенерации результатов
function regenerateResults() {
    generateResults();
}

// Функция возврата на главный экран
function backToWelcome() {
    document.getElementById('resultsScreen').classList.remove('active');
    document.getElementById('welcomeScreen').classList.add('active');
}

// Функция сохранения результатов
function saveResults(stats) {
    localStorage.setItem('yearResults', JSON.stringify(stats));
    
    if (tg && tg.CloudStorage) {
        tg.CloudStorage.setItem('yearResults', JSON.stringify(stats));
    }
}

// Функция загрузки результатов
function loadResults() {
    try {
        if (tg && tg.CloudStorage) {
            tg.CloudStorage.getItem('yearResults', function(err, value) {
                if (!err && value) {
                    const savedStats = JSON.parse(value);
                    if (savedStats) {
                        currentResults = savedStats;
                        // Можно автоматически показать результаты, если они есть
                    }
                }
            });
        }
    } catch (e) {
        console.error('Ошибка при загрузке результатов:', e);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    loadResults();
    
    console.log('Приложение инициализировано');
    
    // Показываем кнопку "Назад" если приложение открыто в Telegram
    if (tg) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            if (document.getElementById('resultsScreen').classList.contains('active')) {
                backToWelcome();
            } else {
                tg.close();
            }
        });
    }
});
