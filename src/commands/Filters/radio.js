const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
  name: 'radio',
  category: 'Filters',
  aliases: ['radio'],
  description: 'Set Radio Filter',
  args: false,
  usage: '',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  owner: false,
  player: true,
  dj: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (message, args, client, prefix) => {
    const player = client.manager.players.get(message.guild.id);
    if (!player.current) {
      let thing = new MessageEmbed().setColor('RED').setDescription('There is no music playing.');
      return message.reply({ embeds: [thing] });
    }
    const emojiequalizer = message.client.emoji.filter;
    const embed = new MessageEmbed()
      .setColor(client.embedColor)
      .setDescription('Chose The Buttons');

    const but = new MessageButton().setCustomId('clear_but').setLabel('OFF').setStyle('DANGER');
    const but2 = new MessageButton().setCustomId('radio_but').setLabel('ON').setStyle('PRIMARY');

    const but_ = new MessageButton()
      .setCustomId('clear_but_')
      .setLabel('OFF')
      .setStyle('DANGER')
      .setDisabled(true);
    const but_2 = new MessageButton()
      .setCustomId('radio_but_')
      .setLabel('ON')
      .setStyle('PRIMARY')
      .setDisabled(true);

    const row1 = new MessageActionRow().addComponents(but, but_2);
    const row2 = new MessageActionRow().addComponents(but2, but_);
    const row3 = new MessageActionRow().addComponents(but2, but_);

    const m = await message.reply({ embeds: [embed], components: [row3] });

    const embed1 = new MessageEmbed().setColor(client.embedColor);
    const collector = m.createMessageComponentCollector({
      filter: f =>
        f.user.id === message.author.id ? true : false && f.deferUpdate().catch(() => {}),
      time: 60000,
      idle: 60000 / 2,
    });
    collector.on('end', async () => {
      if (!m) return;
      await m.edit({
        embeds: [embed1.setDescription(`Time is Out type again ${prefix}radio`)],
        components: [
          new MessageActionRow().addComponents(but2.setDisabled(true), but.setDisabled(true)),
        ],
      });
    });
    collector.on('collect', async b => {
      if (!b.replied) await b.deferUpdate({ ephemeral: true });
      if (b.customId === 'clear_but') {
        await player.shoukaku.clearFilters();
        return await b.editReply({
          embeds: [embed1.setDescription(`${emojiequalizer} Radio Mode Is \`OFF\``)],
          components: [row2],
        });
      } else if (b.customId === 'radio_but') {
        await player.shoukaku.setFilters({
          op: 'filters',
          guildId: message.guild.id,
          equalizer: [
            { band: 0, gain: -0.25 },
            { band: 1, gain: 0.48 },
            { band: 2, gain: 0.59 },
            { band: 3, gain: 0.72 },
            { band: 4, gain: 0.56 },
            { band: 5, gain: 0.15 },
            { band: 6, gain: -0.24 },
            { band: 7, gain: -0.24 },
            { band: 8, gain: -0.16 },
            { band: 9, gain: -0.16 },
            { band: 10, gain: 0 },
            { band: 11, gain: 0 },
            { band: 12, gain: 0 },
            { band: 13, gain: 0 },
            { band: 14, gain: 0 },
          ],
        });
        return await b.editReply({
          embeds: [embed1.setDescription(`${emojiequalizer} Radio Mode Is \`ON\``)],
          components: [row1],
        });
      }
    });
  },
};
