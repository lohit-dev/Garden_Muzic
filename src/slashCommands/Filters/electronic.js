const { MessageEmbed, CommandInteraction, Client } = require('discord.js');

module.exports = {
  name: 'electronic',
  description: 'Sets Electronic Filter.',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  player: true,
  dj: true,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  options: [
    {
      name: 'input',
      description: 'The Filters input (on or off).',
      type: 'STRING',
      required: true,
      choices: [
        {
          name: 'on',
          value: 'on',
        },
        {
          name: 'off',
          value: 'off',
        },
      ],
    },
  ],

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */

  run: async (client, interaction, prefix) => {
    await interaction.deferReply({
      ephemeral: false,
    });
    const input = interaction.options.getString('input');
    const player = client.manager.players.get(interaction.guild.id);
    if (!player.current) {
      let thing = new MessageEmbed().setColor('RED').setDescription('There is no music playing.');
      return interaction.editReply({ embeds: [thing] });
    }
    const emojiequalizer = interaction.client.emoji.filter;

    if (input === 'off') {
      await player.shoukaku.clearFilters();
      return await interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(`${emojiequalizer} Electronic Mode Is \`OFF\``),
        ],
      });
    } else if (input === 'on') {
      await player.shoukaku.setFilters({
        op: 'filters',
        guildId: interaction.guild.id,
        equalizer: [
          { band: 0, gain: 0.375 },
          { band: 1, gain: 0.35 },
          { band: 2, gain: 0.125 },
          { band: 3, gain: 0 },
          { band: 4, gain: 0 },
          { band: 5, gain: -0.125 },
          { band: 6, gain: -0.125 },
          { band: 7, gain: 0 },
          { band: 8, gain: 0.25 },
          { band: 9, gain: 0.125 },
          { band: 10, gain: 0.15 },
          { band: 11, gain: 0.2 },
          { band: 12, gain: 0.25 },
          { band: 13, gain: 0.35 },
          { band: 14, gain: 0.4 },
        ],
      });
      return await interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(`${emojiequalizer} Electronic Mode Is \`ON\``),
        ],
      });
    }
  },
};
