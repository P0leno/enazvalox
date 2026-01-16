#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram бот для миниприложения "Итоги школьного года"
"""

import os
import logging
from datetime import datetime
from typing import Dict, List
import json

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Токен бота (можно задать через переменную окружения BOT_TOKEN)
BOT_TOKEN = os.getenv('BOT_TOKEN', '7962013308:AAFbwbd8B99dVU13Za8967ON2S52B9j40Lg')

# ID администраторов (добавьте свои ID через запятую)
ADMIN_IDS = [int(id.strip()) for id in os.getenv('ADMIN_IDS', '').split(',') if id.strip()]

# URL миниприложения (будет установлен через команду /setwebapp)
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://P0leno.github.io/enazvalox/')

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# Состояния для FSM
class AdminStates(StatesGroup):
    waiting_for_webapp_url = State()
    waiting_for_broadcast_message = State()

# Хранилище данных (в продакшене лучше использовать БД)
users_data: Dict[int, dict] = {}
stats = {
    'total_users': 0,
    'active_users': 0,
    'messages_sent': 0,
    'start_date': datetime.now().isoformat()
}


def load_stats():
    """Загрузка статистики из файла"""
    global stats
    try:
        if os.path.exists('stats.json'):
            with open('stats.json', 'r', encoding='utf-8') as f:
                stats = json.load(f)
    except Exception as e:
        logger.error(f"Ошибка загрузки статистики: {e}")


def save_stats():
    """Сохранение статистики в файл"""
    try:
        with open('stats.json', 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Ошибка сохранения статистики: {e}")


def is_admin(user_id: int) -> bool:
    """Проверка, является ли пользователь администратором"""
    # Строгая проверка - только если ID в списке админов и список не пустой
    return len(ADMIN_IDS) > 0 and user_id in ADMIN_IDS


def get_main_keyboard(webapp_url: str, show_admin: bool = False) -> InlineKeyboardMarkup:
    """Создание основной клавиатуры с кнопкой миниприложения"""
    keyboard_buttons = [
        [
            InlineKeyboardButton(
                text="📊 Открыть приложение",
                web_app=WebAppInfo(url=webapp_url)
            )
        ],
        [
            InlineKeyboardButton(text="ℹ️ Помощь", callback_data="help"),
            InlineKeyboardButton(text="📈 Статистика", callback_data="stats")
        ]
    ]
    
    # Добавляем кнопку админ-панели только для админов
    if show_admin:
        keyboard_buttons.append([
            InlineKeyboardButton(text="⚙️ Админ-панель", callback_data="admin_panel")
        ])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=keyboard_buttons)
    return keyboard


def get_admin_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура администратора"""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📊 Статистика бота", callback_data="admin_stats"),
            InlineKeyboardButton(text="👥 Пользователи", callback_data="admin_users")
        ],
        [
            InlineKeyboardButton(text="📢 Рассылка", callback_data="admin_broadcast"),
            InlineKeyboardButton(text="🔗 Установить URL приложения", callback_data="admin_seturl")
        ],
        [
            InlineKeyboardButton(text="⚙️ Настройки", callback_data="admin_settings")
        ],
        [
            InlineKeyboardButton(text="🏠 Домой", callback_data="home")
        ]
    ])
    return keyboard


# Обработчик команды /start
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    """Обработка команды /start с приветственным сообщением"""
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.first_name
    
    # Обновление статистики
    if user_id not in users_data:
        stats['total_users'] += 1
        users_data[user_id] = {
            'joined_at': datetime.now().isoformat(),
            'username': username,
            'first_name': message.from_user.first_name,
            'messages_count': 0
        }
    users_data[user_id]['messages_count'] += 1
    stats['messages_sent'] += 1
    save_stats()
    
    # Приветственное сообщение
    welcome_text = f"""
🎓 <b>Добро пожаловать, {username}!</b>

Привет! Я бот для миниприложения <b>"Итоги школьного года"</b>.

📚 С моей помощью вы можете:
• Отслеживать свои оценки по предметам
• Просматривать статистику успеваемости
• Получать достижения за успехи в учебе
• Анализировать свой прогресс

🚀 <b>Нажмите на кнопку ниже, чтобы открыть приложение!</b>

💡 Используйте /help для получения помощи
"""
    
    keyboard = get_main_keyboard(WEBAPP_URL, show_admin=is_admin(user_id))
    await message.answer(welcome_text, reply_markup=keyboard, parse_mode='HTML')


# Обработчик команды /help
@dp.message(Command('help'))
async def cmd_help(message: types.Message):
    """Справка по использованию бота"""
    help_text = """
ℹ️ <b>Помощь по использованию бота</b>

<b>Основные команды:</b>
/start - Запустить бота и открыть приложение
/help - Показать эту справку

<b>Как пользоваться:</b>
1. Нажмите кнопку "📊 Открыть приложение"
2. Добавляйте предметы с оценками
3. Следите за своим прогрессом
4. Получайте достижения!

Если у вас возникли вопросы, напишите администратору.
"""
    keyboard = get_main_keyboard(WEBAPP_URL, show_admin=is_admin(message.from_user.id))
    await message.answer(help_text, reply_markup=keyboard, parse_mode='HTML')


# Обработчик команды /admin
@dp.message(Command('admin'))
async def cmd_admin(message: types.Message):
    """Открытие админ-панели"""
    user_id = message.from_user.id
    
    if not is_admin(user_id):
        await message.answer("❌ У вас нет прав администратора.")
        return
    
    admin_text = """
⚙️ <b>Админ-панель</b>

Выберите действие:
"""
    await message.answer(admin_text, reply_markup=get_admin_keyboard(), parse_mode='HTML')


# Обработчик кнопки "Домой"
@dp.callback_query(F.data == "home")
async def callback_home(callback: types.CallbackQuery):
    """Возврат в главное меню"""
    user_id = callback.from_user.id
    username = callback.from_user.username or callback.from_user.first_name
    
    welcome_text = f"""
🎓 <b>Добро пожаловать, {username}!</b>

Привет! Я бот для миниприложения <b>"Итоги школьного года"</b>.

📚 С моей помощью вы можете:
• Отслеживать свои оценки по предметам
• Просматривать статистику успеваемости
• Получать достижения за успехи в учебе
• Анализировать свой прогресс

🚀 <b>Нажмите на кнопку ниже, чтобы открыть приложение!</b>

💡 Используйте /help для получения помощи
"""
    
    keyboard = get_main_keyboard(WEBAPP_URL, show_admin=is_admin(user_id))
    await callback.answer()
    await callback.message.edit_text(welcome_text, reply_markup=keyboard, parse_mode='HTML')


# Обработчик кнопки "Админ-панель" из главного меню
@dp.callback_query(F.data == "admin_panel")
async def callback_admin_panel(callback: types.CallbackQuery):
    """Открытие админ-панели через кнопку"""
    user_id = callback.from_user.id
    
    if not is_admin(user_id):
        await callback.answer("❌ У вас нет прав администратора.", show_alert=True)
        return
    
    admin_text = """
⚙️ <b>Админ-панель</b>

Выберите действие:
"""
    await callback.answer()
    await callback.message.edit_text(admin_text, reply_markup=get_admin_keyboard(), parse_mode='HTML')


# Обработчик статистики
@dp.callback_query(F.data == "stats")
async def callback_stats(callback: types.CallbackQuery):
    """Показать личную статистику пользователя"""
    user_id = callback.from_user.id
    
    if user_id in users_data:
        user_data = users_data[user_id]
        stats_text = f"""
📈 <b>Ваша статистика:</b>

👤 Имя: {user_data.get('first_name', 'Неизвестно')}
📅 Присоединился: {user_data.get('joined_at', 'Неизвестно')[:10]}
💬 Сообщений отправлено: {user_data.get('messages_count', 0)}
"""
    else:
        stats_text = "📈 Статистика недоступна."
    
    # Добавляем кнопку "Домой"
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🏠 Домой", callback_data="home")]
    ])
    
    await callback.answer()
    await callback.message.edit_text(stats_text, reply_markup=keyboard, parse_mode='HTML')


# Обработчик помощи
@dp.callback_query(F.data == "help")
async def callback_help(callback: types.CallbackQuery):
    """Показать помощь"""
    user_id = callback.from_user.id
    help_text = """
ℹ️ <b>Помощь</b>

Нажмите на кнопку "📊 Открыть приложение" для работы с приложением.

<b>Основные функции:</b>
• Добавление предметов и оценок
• Просмотр статистики
• Получение достижений
"""
    keyboard = get_main_keyboard(WEBAPP_URL, show_admin=is_admin(user_id))
    await callback.answer()
    await callback.message.edit_text(help_text, reply_markup=keyboard, parse_mode='HTML')


# === АДМИН ПАНЕЛЬ ===

@dp.callback_query(F.data == "admin_stats")
async def callback_admin_stats(callback: types.CallbackQuery):
    """Статистика бота для администратора"""
    if not is_admin(callback.from_user.id):
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    
    active_users_count = len([u for u in users_data.values() if u.get('messages_count', 0) > 0])
    
    stats_text = f"""
📊 <b>Статистика бота:</b>

👥 Всего пользователей: {stats.get('total_users', 0)}
🟢 Активных пользователей: {active_users_count}
💬 Всего сообщений: {stats.get('messages_sent', 0)}
📅 Бот запущен: {stats.get('start_date', 'Неизвестно')[:10]}
🔗 URL приложения: {WEBAPP_URL}
"""
    
    await callback.answer()
    await callback.message.edit_text(stats_text, reply_markup=get_admin_keyboard(), parse_mode='HTML')


@dp.callback_query(F.data == "admin_users")
async def callback_admin_users(callback: types.CallbackQuery):
    """Список пользователей"""
    if not is_admin(callback.from_user.id):
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    
    users_text = f"👥 <b>Пользователи бота:</b>\n\n"
    
    # Показываем последних 10 пользователей
    sorted_users = sorted(users_data.items(), 
                         key=lambda x: x[1].get('joined_at', ''), 
                         reverse=True)[:10]
    
    for user_id, user_data in sorted_users:
        username = user_data.get('username', 'Без username')
        first_name = user_data.get('first_name', 'Неизвестно')
        messages = user_data.get('messages_count', 0)
        users_text += f"• {first_name} (@{username}) - {messages} сообщений\n"
    
    if len(users_data) > 10:
        users_text += f"\n... и ещё {len(users_data) - 10} пользователей"
    
    await callback.answer()
    await callback.message.edit_text(users_text, reply_markup=get_admin_keyboard(), parse_mode='HTML')


@dp.callback_query(F.data == "admin_seturl")
async def callback_admin_seturl(callback: types.CallbackQuery, state: FSMContext):
    """Установка URL миниприложения"""
    if not is_admin(callback.from_user.id):
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    
    await callback.answer()
    await callback.message.edit_text(
        "🔗 <b>Установка URL приложения</b>\n\n"
        "Отправьте новый URL миниприложения (должен начинаться с https://)",
        parse_mode='HTML'
    )
    await state.set_state(AdminStates.waiting_for_webapp_url)


@dp.message(AdminStates.waiting_for_webapp_url)
async def process_webapp_url(message: types.Message, state: FSMContext):
    """Обработка нового URL"""
    global WEBAPP_URL
    
    new_url = message.text.strip()
    
    if not new_url.startswith('https://'):
        await message.answer("❌ URL должен начинаться с https://")
        return
    
    WEBAPP_URL = new_url
    
    # Сохраняем в файл
    try:
        with open('config.json', 'w', encoding='utf-8') as f:
            json.dump({'webapp_url': WEBAPP_URL}, f, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Ошибка сохранения конфига: {e}")
    
    await message.answer(
        f"✅ URL успешно установлен!\n\n"
        f"Новый URL: {WEBAPP_URL}\n\n"
        f"Используйте /admin для возврата в админ-панель."
    )
    await state.clear()


@dp.callback_query(F.data == "admin_broadcast")
async def callback_admin_broadcast(callback: types.CallbackQuery, state: FSMContext):
    """Начать рассылку сообщений"""
    if not is_admin(callback.from_user.id):
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    
    await callback.answer()
    await callback.message.edit_text(
        "📢 <b>Рассылка сообщений</b>\n\n"
        "Отправьте сообщение, которое нужно разослать всем пользователям:",
        parse_mode='HTML'
    )
    await state.set_state(AdminStates.waiting_for_broadcast_message)


@dp.message(AdminStates.waiting_for_broadcast_message)
async def process_broadcast(message: types.Message, state: FSMContext):
    """Обработка рассылки"""
    broadcast_text = message.text or message.caption or "📢 Сообщение от администратора"
    
    await message.answer("📤 Начинаю рассылку...")
    
    success_count = 0
    error_count = 0
    
    for user_id in users_data.keys():
        try:
            await bot.send_message(user_id, broadcast_text)
            success_count += 1
        except Exception as e:
            logger.error(f"Ошибка отправки сообщения пользователю {user_id}: {e}")
            error_count += 1
    
    await message.answer(
        f"✅ Рассылка завершена!\n\n"
        f"✅ Успешно: {success_count}\n"
        f"❌ Ошибок: {error_count}"
    )
    await state.clear()


@dp.callback_query(F.data == "admin_settings")
async def callback_admin_settings(callback: types.CallbackQuery):
    """Настройки администратора"""
    if not is_admin(callback.from_user.id):
        await callback.answer("❌ Нет доступа", show_alert=True)
        return
    
    settings_text = f"""
⚙️ <b>Настройки бота</b>

🔗 URL приложения: {WEBAPP_URL}
👤 Администраторы: {len(ADMIN_IDS)} пользователей
📊 Всего пользователей: {stats.get('total_users', 0)}

<b>Команды:</b>
/admin - Админ-панель
/setwebapp <url> - Установить URL приложения (быстрая команда)
"""
    
    await callback.answer()
    await callback.message.edit_text(settings_text, reply_markup=get_admin_keyboard(), parse_mode='HTML')


# Обработчик команды /setwebapp
@dp.message(Command('setwebapp'))
async def cmd_setwebapp(message: types.Message):
    """Быстрая установка URL приложения"""
    if not is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав администратора.")
        return
    
    parts = message.text.split(' ', 1)
    if len(parts) < 2:
        await message.answer("❌ Использование: /setwebapp <url>")
        return
    
    global WEBAPP_URL
    new_url = parts[1].strip()
    
    if not new_url.startswith('https://'):
        await message.answer("❌ URL должен начинаться с https://")
        return
    
    WEBAPP_URL = new_url
    
    # Сохраняем в файл
    try:
        with open('config.json', 'w', encoding='utf-8') as f:
            json.dump({'webapp_url': WEBAPP_URL}, f, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Ошибка сохранения конфига: {e}")
    
    await message.answer(f"✅ URL успешно установлен: {WEBAPP_URL}")


# Обработка всех остальных сообщений
@dp.message()
async def echo_message(message: types.Message):
    """Обработка обычных сообщений"""
    user_id = message.from_user.id
    
    if user_id in users_data:
        users_data[user_id]['messages_count'] += 1
    stats['messages_sent'] += 1
    save_stats()
    
    keyboard = get_main_keyboard(WEBAPP_URL, show_admin=is_admin(user_id))
    await message.answer(
        "👋 Привет! Используйте /start для начала работы или нажмите кнопку ниже:",
        reply_markup=keyboard
    )


# Загрузка конфигурации при запуске
def load_config():
    """Загрузка конфигурации из файла"""
    global WEBAPP_URL
    try:
        if os.path.exists('config.json'):
            with open('config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
                WEBAPP_URL = config.get('webapp_url', WEBAPP_URL)
    except Exception as e:
        logger.error(f"Ошибка загрузки конфига: {e}")


async def main():
    """Главная функция запуска бота"""
    # Загружаем конфигурацию
    load_config()
    load_stats()
    
    logger.info("Бот запущен!")
    logger.info(f"URL приложения: {WEBAPP_URL}")
    logger.info(f"Администраторы: {ADMIN_IDS}")
    
    # Запускаем polling
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())

