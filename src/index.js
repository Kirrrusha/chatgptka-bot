import { config } from 'dotenv';
import { Bot, InlineKeyboard } from 'grammy';

import { Loader } from './loader.js';
import { chatGPT } from './openai.js';
import { ROLES, ROLE_NAMES } from './constants.js';

config();

const bot = new Bot(process.env.BOT_TOKEN);

function checkPermission(userId) {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const permissionArray = (process.env.PERMISSIONS_ID_LIST || '')
    .split(',')
    .map((id) => Number(id));
  return permissionArray.includes(userId);
}

let currentRole = ROLES.USER;

const keyboard = new InlineKeyboard()
  .text(ROLE_NAMES.DEVELOPER, ROLE_NAMES.DEVELOPER)
  .text(ROLE_NAMES.USER, ROLE_NAMES.USER);

bot.start((ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  ctx.reply('Привет! Я ChatGPT Plus бот. Выберете роль для начала диалога', {
    reply_markup: keyboard,
  });
});

bot.hears(ROLE_NAMES.DEVELOPER, (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  currentRole = ROLES.DEVELOPER;
  ctx.reply('Вы выбрали роль разработчика', {
    reply_markup: { inline_keyboard: [] },
  });
});

bot.hears(ROLE_NAMES.USER, (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  currentRole = ROLES.USER;
  ctx.reply('Вы выбрали роль пользователя', {
    reply_markup: { inline_keyboard: [] },
  });
});

bot.command('change_role', (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  ctx.reply('Выберите новую роль', { reply_markup: keyboard });
});

// bot.telegram.setMyCommands([
//   { command: 'change_role', description: 'Изменить роль' },
// ]);

bot.on('message', async (ctx) => {
  if (!checkPermission(ctx.from.id)) {
    ctx.reply('У вас нет доступа к боту');
    return;
  }
  const loader = new Loader(ctx);
  loader.show();
  const response = await chatGPT(ctx.message.text, currentRole);
  loader.hide();
  ctx.reply(response.content);
});

export const launchBot = () => {
  bot.start();
};
