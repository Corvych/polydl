import os
import asyncio
import aiohttp
from telebot.async_telebot import AsyncTeleBot
from telebot import types
from telebot import asyncio_helper
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta

import keyboards
import kafka_client

current_dir = os.path.dirname(os.path.abspath(__file__))
evn_path = os.path.join(current_dir, '.env')
if os.path.exists(evn_path):
    load_dotenv(dotenv_path=evn_path)

BOT_TOKEN = os.getenv('BOT_TOKEN')
APP_BACKEND_URL = os.getenv('APP_BACKEND_URL', 'http://app:3000')

def format_pretty_date(iso_str):
    try:
        clean_str = iso_str.replace('Z', '+00:00')
        dt = datetime.fromisoformat(clean_str)
        dt_adjusted = dt + timedelta(hours=3)
        return dt_adjusted.strftime("%d.%m.%Y %H:%M")
    except Exception as e:
        logging.error(f"Error parsing date {iso_str}: {e}")
        return iso_str
PROXY_URL = os.getenv('PROXY_URL')

if PROXY_URL:
    logging.info(f"Loaded PROXY_URL: {PROXY_URL}")
    asyncio_helper.proxy = PROXY_URL

bot = AsyncTeleBot(BOT_TOKEN)

pending_auths = {}

async def is_user_authorized(user_id):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{APP_BACKEND_URL}/bot/deadlines?telegram_id={user_id}") as response:
                return response.status == 200
    except Exception as e:
        logging.error(f"Error checking user authorization: {e}")
        return False

def get_link_button_title(url):
    url_lower = url.lower()
    if 'physics' in url_lower or 'polyphys' in url_lower:
        return '🌌 Polyphis'
    elif 'vsp' in url_lower or 'polyvsp' in url_lower:
        return '🖥️ PolyVSP'
    else:
        return '🎓 СДО'

async def on_notification_callback(user_id, text):
    handled = False
    if user_id in pending_auths:
        msg_id = pending_auths[user_id]
        del pending_auths[user_id]
        
        try:
            await bot.edit_message_text(
                chat_id=user_id,
                message_id=msg_id,
                text=text,
                parse_mode='Markdown'
            )
            handled = True
        except Exception as edit_err:
            logging.error(f"Failed to edit auth message: {edit_err}")
            await bot.send_message(user_id, text, parse_mode='Markdown')
            handled = True
            
    if "успешно привязан" in text.lower():
        if not handled:
            await bot.send_message(user_id, f"🔔 **Уведомление PolyDL:**\n\n{text}", parse_mode='Markdown')
            handled = True
            
        await bot.send_message(
            chat_id=user_id,
            text="👋 **Добро пожаловать в PolyDL!**\n\nИспользуйте кнопки меню ниже для работы с дедлайнами.",
            parse_mode='Markdown',
            reply_markup=keyboards.get_reply_keyboard()
        )
        await bot.send_message(
            chat_id=user_id,
            text="Доступные действия:",
            reply_markup=keyboards.get_authorized_keyboard()
        )
        return True
        
    return handled

@bot.message_handler(commands=['start'])
async def main(message):
    user_id = message.from_user.id
    
    authorized = await is_user_authorized(user_id)
    
    if message.text:
        command_args = message.text.split()
        if len(command_args) > 1:
            full_token = command_args[1]
            
            if authorized:
                try:
                    with open('PolyDL.jpg', 'rb') as photo:
                        await bot.send_photo(message.chat.id, photo, caption='✅ **Вы уже авторизованы в системе.**\n\nДобро пожаловать в PolyDL!', parse_mode='Markdown', reply_markup=keyboards.get_reply_keyboard())
                except FileNotFoundError:
                    await bot.send_message(message.chat.id, '✅ **Вы уже авторизованы в системе.**\n\nДобро пожаловать в PolyDL!', parse_mode='Markdown', reply_markup=keyboards.get_reply_keyboard())
                
                await bot.send_message(message.chat.id, 'Доступные действия:', reply_markup=keyboards.get_authorized_keyboard())
                return
            
            if full_token.startswith('reg_'):
                clean_token = full_token.replace('reg_', '')
                await kafka_client.send_auth_deeplink(user_id, clean_token, "site_register")
                sent_msg = await bot.send_message(
                    message.chat.id, 
                    "🔐 **Регистрация через Telegram...**\nОжидание подтверждения от сервера...",
                    parse_mode='Markdown'
                )
                pending_auths[user_id] = sent_msg.message_id
                return
            elif full_token.startswith('auth_'):
                clean_token = full_token.replace('auth_', '')
                await kafka_client.send_auth_deeplink(user_id, clean_token, "site_login")
                sent_msg = await bot.send_message(
                    message.chat.id, 
                    "🔐 **Авторизация через Telegram...**\nОжидание подтверждения от сервера...",
                    parse_mode='Markdown'
                )
                pending_auths[user_id] = sent_msg.message_id
                return
            else:
                await kafka_client.send_auth_deeplink(user_id, full_token, "site_login")
                sent_msg = await bot.send_message(
                    message.chat.id, 
                    "🔐 **Токен авторизации передан на сервер.**\nОжидание...",
                    parse_mode='Markdown'
                )
                pending_auths[user_id] = sent_msg.message_id
                return

    if authorized:
        try:
            with open('PolyDL.jpg', 'rb') as photo:
                await bot.send_photo(message.chat.id, photo, caption='Добро пожаловать в PolyDL!', reply_markup=keyboards.get_reply_keyboard())
        except FileNotFoundError:
            await bot.send_message(message.chat.id, 'Добро пожаловать в PolyDL!', reply_markup=keyboards.get_reply_keyboard())
        await bot.send_message(message.chat.id, 'Доступные действия:', reply_markup=keyboards.get_authorized_keyboard())
    else:
        await bot.send_message(
            message.chat.id,
            "❌ **Вы не авторизованы в системе.**\n\nДля доступа к дедлайнам и Mini App, пожалуйста, зарегистрируйтесь или войдите на нашем сайте и привяжите свой Telegram-аккаунт в настройках профиля.",
            parse_mode='Markdown',
            reply_markup=types.ReplyKeyboardRemove()
        )
        await bot.send_message(
            message.chat.id,
            "🔗 **Ссылки для авторизации:**",
            parse_mode='Markdown',
            reply_markup=keyboards.get_unauthorized_keyboard()
        )

@bot.message_handler(commands=['help'])
async def main1(message):
    await bot.send_message(message.chat.id, 'Для получения справки перейдите на сайт [PolyDL](https://polydl.ru/).', parse_mode='Markdown')



async def show_my_deadlines(chat_id, user_id):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{APP_BACKEND_URL}/bot/deadlines?telegram_id={user_id}") as response:
                if response.status == 200:
                    deadlines = await response.json()
                    if not deadlines:
                        await bot.send_message(chat_id, "У вас пока нет активных дедлайнов. Отдыхайте! 🏖")
                        return
                    
                    for d in deadlines:
                        pretty_date = format_pretty_date(d['ts_due'])
                        msg_text = f"🔹 **{d['name']}** ({d['subject']})\nСдать до: _{pretty_date}_\n"
                        
                        markup = types.InlineKeyboardMarkup()
                        btn_done = types.InlineKeyboardButton("✅ Выполнено", callback_data=f"complete_{d['id']}")
                        markup.row(btn_done)
                        
                        if d['sdo_link']:
                            link_title = get_link_button_title(d['sdo_link'])
                            btn_link = types.InlineKeyboardButton(link_title, url=d['sdo_link'])
                            markup.row(btn_link)
                            
                        await bot.send_message(chat_id, msg_text, parse_mode='Markdown', reply_markup=markup, disable_web_page_preview=True)
                elif response.status == 404:
                    await bot.send_message(chat_id, "❌ Ваш аккаунт не привязан к системе или не найден.\nИспользуйте кнопку 'Привязать Telegram' на сайте.", reply_markup=types.ReplyKeyboardRemove())
                else:
                    await bot.send_message(chat_id, f"❌ Ошибка сервера: {response.status}")
    except Exception as e:
        await bot.send_message(chat_id, f"❌ Ошибка соединения с сервером: {e}")

@bot.callback_query_handler(func=lambda call: call.data == 'my_deadlines')
async def handle_my_deadlines(call):
    user_id = call.from_user.id
    await bot.answer_callback_query(call.id, "Загрузка дедлайнов...")
    await show_my_deadlines(call.message.chat.id, user_id)

@bot.callback_query_handler(func=lambda call: call.data.startswith('complete_'))
async def handle_complete_deadline(call):
    user_id = call.from_user.id
    deadline_id = call.data.split('_')[1]
    await bot.answer_callback_query(call.id, "Отмечаем как выполненное...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{APP_BACKEND_URL}/bot/deadlines/{deadline_id}/complete?telegram_id={user_id}") as response:
                if response.status == 200:
                    original_text = call.message.text
                    lines = original_text.split('\n')
                    if len(lines) > 0:
                        title_line = lines[0]
                        title_line = title_line.replace("🔹", "").strip()
                        parts = title_line.split("(")
                        if len(parts) > 1:
                            name = parts[0].strip()
                            subject = parts[1].replace(")", "").strip()
                            lines[0] = f"✅ ~~{name}~~ ({subject})"
                        else:
                            lines[0] = f"✅ ~~{title_line}~~"
                    
                    updated_text = "\n".join(lines)
                    updated_text += "\n\n🎉 **Дедлайн выполнен!**"
                    
                    markup = types.InlineKeyboardMarkup()
                    if call.message.reply_markup and call.message.reply_markup.inline_keyboard:
                        for row in call.message.reply_markup.inline_keyboard:
                            for btn in row:
                                if btn.url:
                                    markup.row(types.InlineKeyboardButton(btn.text, url=btn.url))
                    
                    try:
                        await bot.edit_message_text(
                            chat_id=call.message.chat.id,
                            message_id=call.message.message_id,
                            text=updated_text,
                            parse_mode='Markdown',
                            reply_markup=markup
                        )
                    except Exception as edit_err:
                        logging.error(f"Error editing message to done: {edit_err}")
                        await bot.send_message(call.message.chat.id, "✅ Дедлайн успешно выполнен!")
                else:
                    await bot.send_message(call.message.chat.id, f"❌ Не удалось отметить дедлайн: {response.status}")
    except Exception as e:
        await bot.send_message(call.message.chat.id, f"❌ Ошибка соединения: {e}")

@bot.message_handler(content_types=['voice', 'audio', 'video_note'])
async def handle_voice(message):
    await bot.reply_to(message, "К сожалению, распознавание голоса временно отключено. Пожалуйста, отправьте текстовое сообщение. 🚫")

@bot.message_handler(content_types=['text'])
async def info(message):
    user_id = message.from_user.id
    text = message.text.strip()
    normalized_text = text.lower() 

    if normalized_text == 'айди диктуй':
        await bot.send_message(message.chat.id, 'ДАНИЛ КОЛБАСЕНКО 😈')
    elif normalized_text in ['старт', 'start', 'меню', 'menu']:
        await main(message)
    elif normalized_text in ['помощь', 'help']:
        await main1(message)
    elif normalized_text == '📅 мои дедлайны' or 'мои дедлайны' in normalized_text:
        await show_my_deadlines(message.chat.id, user_id)
    else:
        # Отправляем в Kafka для T5 модели
        await kafka_client.send_deadline_request(user_id, text)
        await bot.send_message(
            message.chat.id, 
            f"✅ **Запрос передан в модель:**\n\n_{text}_\nОжидайте создания дедлайна.", 
            parse_mode='Markdown'
        )

async def main_loop():
    logging.info("[*] Бот PolyDL успешно запущен в асинхронном режиме...")
    
    # Запускаем консьюмер уведомлений в фоне с коллбеком для авторизации
    asyncio.create_task(kafka_client.consume_notifications_loop(bot, on_notification_callback))
    
    # Запускаем поллинг бота
    await bot.infinity_polling(skip_pending=True)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main_loop())