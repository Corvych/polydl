from telebot import types

def get_unauthorized_keyboard():
    """Клавиатура для неавторизованных пользователей (ссылки на регистрацию и авторизацию)"""
    markup = types.InlineKeyboardMarkup()
    btn_login = types.InlineKeyboardButton('🔑 Войти на сайт', url='https://polydl.ru/login')
    btn_register = types.InlineKeyboardButton('📝 Регистрация', url='https://polydl.ru/register')
    markup.row(btn_login, btn_register)
    return markup

def get_authorized_keyboard():
    """Генерация основного меню кнопок для авторизованных пользователей"""
    markup = types.InlineKeyboardMarkup()
    
    btn_site = types.InlineKeyboardButton('🌐 Перейти на сайт', url='https://polydl.ru/')
    markup.row(btn_site)
    
    btn_webapp = types.InlineKeyboardButton('📱 Открыть Mini App', web_app=types.WebAppInfo(url='https://polydl.ru/miniapp'))
    markup.row(btn_webapp)
    
    return markup

def get_reply_keyboard():
    """Создание постоянной Reply-клавиатуры для быстрого доступа"""
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True, is_persistent=True)
    btn_deadlines = types.KeyboardButton('📅 Мои Дедлайны')
    markup.row(btn_deadlines)
    return markup