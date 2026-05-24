import os
import asyncio
import aiohttp
from telebot.async_telebot import AsyncTeleBot
from telebot import types
from dotenv import load_dotenv
import logging

import keyboards
import kafka_client

current_dir = os.path.dirname(os.path.abspath(__file__))
evn_path = os.path.join(current_dir, '.env')
if os.path.exists(evn_path):
    load_dotenv(dotenv_path=evn_path)

BOT_TOKEN = os.getenv('BOT_TOKEN')
APP_BACKEND_URL = os.getenv('APP_BACKEND_URL', 'http://app:3000')
bot = AsyncTeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
async def main(message):
    user_id = message.from_user.id
    markup = keyboards.get_main_keyboard()
    
    if message.text:
        command_args = message.text.split()
        if len(command_args) > 1:
            full_token = command_args[1]
            
            if full_token.startswith('reg_'):
                clean_token = full_token.replace('reg_', '')
                await kafka_client.send_auth_deeplink(user_id, clean_token, "site_register")
                await bot.send_message(
                    message.chat.id, 
                    f"🎉 **Запрос на регистрацию принят!**\nВаш Telegram ID ({user_id}) отправлен на сайт PolyDL для подтверждения и создания профиля. Ожидайте уведомления."
                )
            elif full_token.startswith('auth_'):
                clean_token = full_token.replace('auth_', '')
                await kafka_client.send_auth_deeplink(user_id, clean_token, "site_login")
                await bot.send_message(
                    message.chat.id, 
                    "🔐 **Запрос на вход выполнен!**\nОжидание подтверждения от сервера..."
                )
            else:
                await kafka_client.send_auth_deeplink(user_id, full_token, "site_login")
                await bot.send_message(message.chat.id, "🔐 Токен авторизации передан на сервер.")
                return

    try:
        with open('PolyDL.jpg', 'rb') as photo:
            await bot.send_photo(message.chat.id, photo, caption='Добро пожаловать в PolyDL!', reply_markup=markup)
    except FileNotFoundError:
        await bot.send_message(message.chat.id, 'Добро пожаловать в PolyDL!', reply_markup=markup)

@bot.message_handler(commands=['help'])
async def main1(message):
    await bot.send_message(message.chat.id, 'Для получения справки перейдите на сайт [PolyDL](https://polydl.ru/).', parse_mode='Markdown')

@bot.callback_query_handler(func=lambda call: call.data == 'my_group')
async def handle_my_group(call):
    user_id = call.from_user.id
    await bot.answer_callback_query(call.id, "Запрос отправлен...")
    
    group_response = (
        f"📋 **Интерфейс PolyDL:**\n\n"
        f"Запрос по вашей рабочей группе отправлен на бэкенд. Идентификатор сессии пользователя: `{user_id}`."
    )
    await bot.send_message(call.message.chat.id, group_response, parse_mode='Markdown')

@bot.callback_query_handler(func=lambda call: call.data == 'my_deadlines')
async def handle_my_deadlines(call):
    user_id = call.from_user.id
    await bot.answer_callback_query(call.id, "Загрузка дедлайнов...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{APP_BACKEND_URL}/bot/deadlines?telegram_id={user_id}") as response:
                if response.status == 200:
                    deadlines = await response.json()
                    if not deadlines:
                        await bot.send_message(call.message.chat.id, "У вас пока нет активных дедлайнов. Отдыхайте! 🏖")
                        return
                    
                    msg_text = "📅 **Ваши предстоящие дедлайны:**\n\n"
                    for d in deadlines:
                        msg_text += f"🔹 **{d['name']}** ({d['subject']})\nСдать до: _{d['ts_due']}_\n"
                        if d['sdo_link']:
                            msg_text += f"[Ссылка на СДО]({d['sdo_link']})\n"
                        msg_text += "\n"
                        
                    await bot.send_message(call.message.chat.id, msg_text, parse_mode='Markdown', disable_web_page_preview=True)
                elif response.status == 404:
                    await bot.send_message(call.message.chat.id, "❌ Ваш аккаунт не привязан к системе или не найден.\nИспользуйте кнопку 'Привязать Telegram' на сайте.")
                else:
                    await bot.send_message(call.message.chat.id, f"❌ Ошибка сервера: {response.status}")
    except Exception as e:
        await bot.send_message(call.message.chat.id, f"❌ Ошибка соединения с сервером: {e}")

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
    
    # Запускаем консьюмер уведомлений в фоне
    asyncio.create_task(kafka_client.consume_notifications_loop(bot))
    
    # Запускаем поллинг бота
    await bot.infinity_polling(skip_pending=True)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main_loop())