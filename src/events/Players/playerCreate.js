const { MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../schema/setup');

module.exports = {
  name: 'playerCreate',
  run: async (client, player) => {
    // Improved logging with better error handling
    if (!player || !player.guild) {
      client.logger.log('Player Create failed - Invalid player object', 'error');
      return;
    }

    client.logger.log(`Player Create in guild ID: ${player.guild}`, 'log');

    let guild = client.guilds.cache.get(player.guild);
    if (!guild) {
      client.logger.log(`Player Create - Guild not found for ID: ${player.guild}`, 'warn');
      return;
    }

    client.logger.log(
      `Player successfully created in guild: ${guild.name} (${player.guild})`,
      'log'
    );

    const data = await db.findOne({ Guild: guild.id });
    if (!data) return;

    let channel = guild.channels.cache.get(data.Channel);
    if (!channel) {
      client.logger.log(`Player Create - Setup channel not found in guild: ${guild.name}`, 'warn');
      return;
    }

    let message;
    try {
      message = await channel.messages.fetch(data.Message, { cache: true });
    } catch (e) {
      client.logger.log(`Player Create - Error fetching setup message: ${e.message}`, 'error');
      return;
    }

    if (!message) return;

    // Create control buttons
    const but1 = new MessageButton()
      .setCustomId(`${message.guildId}pause`)
      .setEmoji('⏸️')
      .setStyle('SECONDARY')
      .setDisabled(false);
    const but2 = new MessageButton()
      .setCustomId(`${message.guildId}previous`)
      .setEmoji('⏮️')
      .setStyle('SECONDARY')
      .setDisabled(false);
    const but3 = new MessageButton()
      .setCustomId(`${message.guildId}skip`)
      .setEmoji('⏭️')
      .setStyle('SECONDARY')
      .setDisabled(false);
    const but4 = new MessageButton()
      .setCustomId(`${message.guildId}voldown`)
      .setEmoji('🔉')
      .setStyle('SECONDARY')
      .setDisabled(false);
    const but5 = new MessageButton()
      .setCustomId(`${message.guildId}volup`)
      .setEmoji('🔊')
      .setStyle('SECONDARY')
      .setDisabled(false);

    const row = new MessageActionRow().addComponents(but4, but2, but1, but3, but5);

    try {
      await message.edit({
        content: '__**Join a voice channel and queue songs by name/url.**__\n\n',
        components: [row],
      });
      client.logger.log('Player Create - Setup message updated successfully', 'log');
    } catch (error) {
      client.logger.log(`Player Create - Error updating setup message: ${error.message}`, 'error');
    }
  },
};
