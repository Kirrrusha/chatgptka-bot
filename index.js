require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const OpenAI = require('openai');
const {HttpsProxyAgent} = require('https-proxy-agent');

const { Loader } = require('./Loader.js');

const bot = new Telegraf(process.env.BOT_TOKEN, {
  handlerTimeout: Infinity,
})

const httpAgent = new HttpsProxyAgent(process.env.PROXY_URL);

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY_TELEGRAM,
  httpAgent,
})

function checkPermission(userId){
  if(process.env.NODE_ENV === 'development') {
    return true
  }

  const permissionArray = (process.env.PERMISSIONS_ID_LIST || '').split(',').map((id) => Number(id));
  return permissionArray.includes(userId);
}

// const CHATGPT_MODEL = 'code-davinci-edit-001'
// const CHATGPT_MODEL = 'gpt-4'
const CHATGPT_MODEL = 'gpt-4'
// const CHATGPT_MODEL = 'gpt-3.5-turbo'

const ROLES = {
  DEVELOPER: 'developer',
  USER: 'user',
}

const ROLE_MESSAGE_MAP = {
  [ROLES.DEVELOPER]: 'Ты опытный разработчик, который знает всё о web',
  [ROLES.USER]: 'Ты пользователь, которому нужен ответ на вопрос',
}

const ROLE_NAMES = {
  DEVELOPER: 'Разработчик',
  USER: 'Пользователь'
}

let currentRole = ROLES.USER;

async function chatGPT(content = '') {
  const messages = [
    {
      role: 'system',
      content: ROLE_MESSAGE_MAP[currentRole],
    },
    { role: 'user', content },
  ]
  try {
    const completion = await openai.chat.completions.create({
      messages,
      model: CHATGPT_MODEL,
    })

    return completion.choices[0].message;

  } catch (e) {
    console.error('Error while chat completion', e.message)
    return {
      content: e.message
    }
  }
}

const keyboard = Markup.keyboard([
  [ROLE_NAMES.DEVELOPER],
  [ROLE_NAMES.USER]
]).resize();

bot.start((ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  ctx.reply('Привет! Я ChatGPT Plus бот. Выберете роль для начала диалога', keyboard)
});

bot.hears(ROLE_NAMES.DEVELOPER, (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  currentRole = ROLES.DEVELOPER
  ctx.reply('Вы выбрали роль разработчика', Markup.removeKeyboard());
})

bot.hears(ROLE_NAMES.USER, (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  currentRole = ROLES.USER
  ctx.reply('Вы выбрали роль пользователя', Markup.removeKeyboard());
})

bot.command('change_role', (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  ctx.reply('Выберите новую роль', keyboard)
})

bot.telegram.setMyCommands([
  { command: 'change_role', description: 'Изменить роль' },
])

bot.on('text', async (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  const loader = new Loader(ctx)
  loader.show()
  const response = await chatGPT(ctx.message.text)
  loader.hide()
  ctx.reply(response.content)
});

bot.launch();