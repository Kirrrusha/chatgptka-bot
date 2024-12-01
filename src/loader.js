export class Loader {
  constructor(ctx) {
    this.ctx = ctx;
    this.icons = [
      '🕐',
      '🕑',
      '🕒',
      '🕓',
      '🕔',
      '🕕',
      '🕖',
      '🕗',
      '🕘',
      '🕙',
      '🕚',
      '🕛',
    ];
  }

  async show() {
    let index = 0;
    this.message = await this.ctx.reply(this.icons[index]);
    this.interval = setInterval(() => {
      index = index < this.icons.length - 1 ? index + 1 : 0;
      this.ctx.editMessageText(
        // this.ctx.chat.id,
        // this.message.message_id,
        // null,
        this.icons[index],
      );
    }, 500);
  }

  hide() {
    this.ctx.deleteMessage(this.ctx.chat.id, this.message.message_id);
    clearInterval(this.interval);
  }
}
