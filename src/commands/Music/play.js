const { MessageEmbed, Permissions } = require('discord.js');
const { convertTime } = require('../../utils/convert.js');

module.exports = {
  name: 'play',
  category: 'Music',
  aliases: ['p'],
  description: 'Plays audio from YouTube or Soundcloud',
  args: true,
  usage: '<YouTube URL | Video Name | Spotify URL>',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  owner: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (message, args, client, prefix) => {
    if (
      !message.guild.members.me.permissions.has([
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.SPEAK,
      ])
    )
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(
              "I don't have enough permissions to execute this command! please give me permission `CONNECT` or `SPEAK`."
            ),
        ],
      });
    const emojiaddsong = message.client.emoji.addsong;
    const emojiplaylist = message.client.emoji.playlist;

    const { channel } = message.member.voice;

    if (
      !message.guild.members.me
        .permissionsIn(channel)
        .has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])
    )
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(
              "I don't have enough permissions connect your vc please give me permission `CONNECT` or `SPEAK`."
            ),
        ],
      });
    const query = args.join(' ');

    try {
      // Log the play command for debugging
      client.logger.log(
        `[Play Command] Guild: ${message.guild.name} (${message.guild.id}), Query: ${query}`,
        'log'
      );

      // Create or get existing player
      let player = client.manager.players.get(message.guild.id);

      if (!player) {
        client.logger.log(
          `[Play Command] Creating new player for guild: ${message.guild.id}`,
          'log'
        );
        player = await client.manager.createPlayer({
          guildId: message.guild.id,
          voiceId: message.member.voice.channel.id,
          textId: message.channel.id,
          deaf: true,
          volume: 80,
        });

        // Verify player was created successfully
        if (!player) {
          client.logger.log(
            `[Play Command] Failed to create player for guild: ${message.guild.id}`,
            'error'
          );
          return message.channel.send({
            embeds: [
              new MessageEmbed()
                .setColor('RED')
                .setDescription('Failed to create music player. Please try again.'),
            ],
          });
        }
      }

      // Search for tracks
      const result = await client.manager.search(query, {
        requester: message.author,
      });

      if (!result || !result.tracks || !result.tracks.length) {
        return message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription(`No results found for: ${query}`),
          ],
        });
      }

      // Handle different result types
      if (result.type === 'PLAYLIST') {
        // Add all tracks from playlist to queue
        player.queue.add(result.tracks);

        // Send confirmation message
        await message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription(
                `${emojiplaylist} **Queued** ${result.tracks.length} tracks from **${result.playlistName}**`
              ),
          ],
        });

        client.logger.log(
          `[Play Command] Added playlist with ${result.tracks.length} tracks to queue in guild: ${message.guild.id}`,
          'log'
        );
      } else {
        // Add single track to queue
        player.queue.add(result.tracks[0]);

        // Send confirmation message
        await message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription(
                `${emojiaddsong} **Queued** [${result.tracks[0].title}](${result.tracks[0].uri})`
              ),
          ],
        });

        client.logger.log(
          `[Play Command] Added track "${result.tracks[0].title}" to queue in guild: ${message.guild.id}`,
          'log'
        );
      }

      // Start playback if not already playing
      if (!player.playing) {
        client.logger.log(`[Play Command] Starting playback in guild: ${message.guild.id}`, 'log');
        await player.play();
      }
    } catch (error) {
      client.logger.log(`[Play Command Error] ${error.stack || error.message}`, 'error');
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
