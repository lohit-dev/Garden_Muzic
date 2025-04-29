const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
  name: 'about',
  category: 'Information',
  aliases: ['botinfo'],
  description: 'See description about this project',
  args: false,
  usage: '',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  owner: false,
  execute: async (message, args, client, prefix) => {
    const row = new MessageActionRow().addComponents(
      new MessageButton().setLabel('Invite').setStyle('LINK').setURL(client.config.links.invite),
      new MessageButton()
        .setLabel('GitHub')
        .setStyle('LINK')
        .setURL('https://github.com/lohit-dev/MusicBot'),
      new MessageButton().setLabel('Support').setStyle('LINK').setURL(client.config.links.support)
    );
    const mainPage = new MessageEmbed()
      .setAuthor({
        name: 'Garden Music Bot',
        iconURL: client.config.links.bg,
      })
      .setThumbnail(client.config.links.bg)
      .setColor(client.embedColor)
      .addField('About', '**Garden Music Bot** - Less time bridging, more time listening...', false)
      .addField('Organization', 'Garden Community', true)
      .addField('Purpose', 'Community Music Bot', true)
      .addField('Features', 'Default Playlist, 24/7 Playback', true)
      .addField(
        '\u200b',
        'The Garden Music Bot is designed to enhance your community experience with seamless music playback. With features like default playlist and 24/7 playback, you can enjoy continuous music without interruptions. Perfect for community gatherings and events!'
      );
    return message.reply({ embeds: [mainPage], components: [row] });
  },
};
