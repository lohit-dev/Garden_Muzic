const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'autoplay',
  aliases: ['ap'],
  category: 'Music',
  description: 'Toggle music autoplay',
  args: false,
  usage: '',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  dj: true,
  owner: false,
  player: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (message, args, client, prefix) => {
    const player = client.manager.players.get(message.guild.id);
    const emojireplay = client.emoji.autoplay;

    // Initialize autoplay data if it doesn't exist
    if (player.data.get('autoplay') === undefined) {
      player.data.set('autoplay', false);
    }

    // Toggle autoplay state
    player.data.set('autoplay', !player.data.get('autoplay'));
    player.data.set('requester', message.author);

    let thing = new MessageEmbed()
      .setColor(client.embedColor)
      .setTimestamp()
      .setDescription(
        `${emojireplay} Autoplay is now ${player.data.get('autoplay') ? '**enabled**' : '**disabled**'}.`
      );

    return message.reply({ embeds: [thing] });
  },
};
