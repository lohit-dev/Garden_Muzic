const { MessageEmbed } = require('discord.js');
const { convertTime } = require('../../utils/convert.js');
const { progressbar } = require('../../utils/progressbar.js');

module.exports = {
  name: 'nowplaying',
  aliases: ['np'],
  category: 'Music',
  description: 'Show now playing song',
  args: false,
  usage: '',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  owner: false,
  player: true,
  inVoiceChannel: false,
  sameVoiceChannel: false,
  execute: async (message, args, client, prefix) => {
    try {
      // Log command execution for debugging
      client.logger.log(
        `[NowPlaying Command] Executed in guild: ${message.guild.name} (${message.guild.id})`,
        'log'
      );

      // Get player instance for this guild
      const player = client.manager.players.get(message.guild.id);

      // Check if player exists
      if (!player) {
        return message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setDescription('There is no active music player in this server.'),
          ],
        });
      }

      // Log player state for debugging
      client.logger.log(
        `[NowPlaying Command] Player state - Playing: ${player.playing}, Queue: ${player.queue ? player.queue.length : 'undefined'}, Current: ${player.current ? 'exists' : 'null'}`,
        'log'
      );

      // Force update player state if needed
      if (!player.current && player.queue && player.queue.length > 0) {
        client.logger.log(
          '[NowPlaying Command] No current track but queue has items. Attempting to start playback.',
          'log'
        );
        try {
          await player.play();
          // Wait a moment for player to update
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          client.logger.log(
            `[NowPlaying Command] Error starting playback: ${error.message}`,
            'error'
          );
        }
      }

      // Recheck player state after potential update
      if (!player.current) {
        return message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor('RED')
              .setDescription('There is no music playing currently.'),
          ],
        });
      }

      // Get current song and player position
      const song = player.current;
      const emojimusic = client.emoji.music;

      // Get total duration and current position
      var total = song.length || 0;
      var current = player.position || 0;

      // Safety checks for edge cases
      if (current > total) current = total;
      if (current < 0) current = 0;

      // Log the current track details for debugging
      client.logger.log(
        `[NowPlaying Command] Current track: "${song.title}", Position: ${current}/${total}`,
        'log'
      );

      // Create embed with track information
      let embed = new MessageEmbed()
        .setColor(client.embedColor)
        .addField(`${emojimusic} **Now Playing**`, `[${song.title}](${song.uri})`)
        .addFields([
          {
            name: 'Duration',
            value: `\`[ ${convertTime(total)} ]\``,
            inline: true,
          },
          {
            name: 'Author',
            value: `${song.author || 'Unknown'}`,
            inline: true,
          },
          {
            name: 'Requested by',
            value: `[ ${song.requester ? song.requester : 'Unknown'} ]`,
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
            song.thumbnail
              ? song.thumbnail
              : `https://img.youtube.com/vi/${song.identifier}/hqdefault.jpg`
          }`
        );

      return message.channel.send({ embeds: [embed] });
    } catch (error) {
      client.logger.log(`[NowPlaying Command Error] ${error.stack || error.message}`, 'error');
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setColor('RED')
            .setDescription(`Error: ${error.message || 'Unknown error occurred'}`),
        ],
      });
    }
  },
};
