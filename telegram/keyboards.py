from telebot import types

def get_main_keyboard():
    """Генерация основного меню кнопок для интерфейса PolyDL"""
    markup = types.InlineKeyboardMarkup()
    
    btn1 = types.InlineKeyboardButton('Перейти На Сайт', url='https://polydl.ru/')
    markup.row(btn1)
    
    btn2 = types.InlineKeyboardButton('Регистрация', url='https://polydl.ru/register')
    btn3 = types.InlineKeyboardButton('Сроки Дедлайнов', url='https://polydl.ru/')
    markup.row(btn2, btn3)
    
    # Кнопка связи с бэкендом
    btn_group = types.InlineKeyboardButton('👥 Моя группа', callback_data='my_group')
    btn_deadlines = types.InlineKeyboardButton('📅 Мои Дедлайны', callback_data='my_deadlines')
    markup.row(btn_group, btn_deadlines)

    # Кнопка Mini App
    btn_webapp = types.InlineKeyboardButton('📱 Открыть Mini App', web_app=types.WebAppInfo(url='https://polydl.ru/miniapp'))
    markup.row(btn_webapp)
    
    return markup