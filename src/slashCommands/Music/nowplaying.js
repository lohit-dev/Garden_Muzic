const { MessageEmbed, CommandInteraction, Client } = require('discord.js');
const { convertTime } = require('../../utils/convert.js');
const { progressbar } = require('../../utils/progressbar.js');

module.exports = {
  name: 'nowplaying',
  description: 'Show now playing song',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  player: true,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */

  run: async (client, interaction) => {
    await interaction.deferReply({
      ephemeral: false,
    });
    const player = client.manager.players.get(interaction.guild.id);
    
    // Improved check for player state with Kazagumo 3.2.2
    if (!player || !player.current) {
      let thing = new MessageEmbed().setColor('RED').setDescription('There is no music playing.');
      return interaction.editReply({ embeds: [thing] });
    }
    
    // Double check that we have a valid player state
    if (!player.playing && !player.paused) {
      let thing = new MessageEmbed().setColor('RED').setDescription('Player is in an invalid state. Try using the play command again.');
      return interaction.editReply({ embeds: [thing] });
    }

    const song = player.current;
    const emojimusic = client.emoji.music;
    var total = song.length || 0;
    // Get the current position from Kazagumo player
    var current = player.position || 0;
    
    // Safety checks for edge cases
    if (current > total) current = total;
    if (current < 0) current = 0;

    let embed = new MessageEmbed()
      .addField(`${emojimusic} **Now Playing**`, `[${song.title}](${song.uri})`)
      .addFields([
        {
          name: 'Duration',
          value: `\`[ ${convertTime(total)} ]\``,
          inline: true,
        },
        {
          name: 'Author',
          value: `${player.current.author}`,
          inline: true,
        },
        {
          name: 'Requested by',
          value: `[ ${song.requester} ]`,
          inline: true,
        },
        {
          name: '**Progress Bar**',
          value: `**[ ${progressbar(player)}** ] \n\`${convertTime(
            current
          )}  ${convertTime(total)}\``,
          inline: true,
        },
      ])

      .setThumbnail(
        `${
          player.current.thumbnail
            ? player.current.thumbnail
            : `https://img.youtube.com/vi/${player.current.identifier}/hqdefault.jpg`
        }`
      )
      .setColor(client.embedColor);
    return interaction.editReply({ embeds: [embed] });
  },
};
