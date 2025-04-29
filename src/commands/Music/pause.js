const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'pause',
  category: 'Music',
  description: 'Pause the currently playing music',
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

    if (!player.current) {
      let thing = new MessageEmbed().setColor('RED').setDescription('There is no music playing.');
      return message.reply({ embeds: [thing] });
    }

    const emojipause = client.emoji.pause;

    if (player.paused) {
      let thing = new MessageEmbed()
        .setColor('RED')
        .setDescription(`${emojipause} The player is already paused.`);
      return message.reply({ embeds: [thing] });
    }

    // Use pause method from Kazagumo instead of setPaused
    await player.pause(true);

    const song = player.current;

    let thing = new MessageEmbed()
      .setColor(client.embedColor)
      .setDescription(`${emojipause} **Paused**\n[${song.title}](${song.uri})`);
    return message.reply({ embeds: [thing] });
  },
};
