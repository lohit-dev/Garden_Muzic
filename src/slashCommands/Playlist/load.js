const {
  MessageEmbed,
  CommandInteraction,
  Client,
  MessageActionRow,
  MessageButton,
} = require('discord.js');
const db = require('../../schema/playlist');

module.exports = {
  name: 'load',
  description: 'Play the saved Playlist.',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  player: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  options: [
    {
      name: 'name',
      description: 'play the saved playlist',
      required: true,
      type: 'STRING',
    },
  ],
  /**
   *
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */

  run: async (client, interaction) => {
    await interaction.deferReply({});
    const Name = interaction.options.getString('name');
    const data = await db.findOne({ UserId: interaction.member.user.id, PlaylistName: Name });
    const player = await client.manager.createPlayer({
      guildId: interaction.guildId,
      voiceId: interaction.member.voice.channelId,
      textId: interaction.channelId,
      deaf: true,
    });

    if (!data) {
      return interaction.editReply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(
              `Playlist not found. Please enter the correct playlist name\n\nDo ${prefix}list To see your Playlist`
            ),
        ],
      });
    }
    if (!player) return;

    let count = 0;
    const m = await interaction.editReply({
      embeds: [
        new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(`Adding ${length} track(s) from your playlist **${Name}** to the queue.`),
      ],
    });
    for (const track of data.Playlist) {
      // Use client.manager.search instead of player.search for better compatibility
      let s = await client.manager.search(track.uri ? track.uri : track.title, {
        requester: interaction.user,
      });
      if (s.tracks && s.tracks.length > 0) {
        // Add the first track from search results
        player.queue.add(s.tracks[0]);
        if (!player.playing && !player.paused) player.play();
        ++count;
      }
    }
    if (player && !player.current) client.manager.destroyPlayer(interaction.guild.id);
    if (count <= 0 && m)
      return await m.editReply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(`Couldn't add any tracks from your playlist **${name}** to the queue.`),
        ],
      });
    if (m)
      return await m.editReply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(`Added ${count} track(s) from your playlist **${name}** to the queue.`),
        ],
      });
  },
};
