const { MessageEmbed, Client, MessageButton, MessageActionRow } = require('discord.js');
const { convertTime } = require('../../utils/convert.js');
const { trackStartEventHandler } = require('../../utils/functions');
const db = require('../../schema/setup');

module.exports = {
  name: 'playerStart',
  /**
   *
   * @param {Client} client
   * @param {*} player
   * @param {*} track
   */
  run: async (client, player, track) => {
    try {
      // Enhanced logging for debugging
      client.logger.log(`[PlayerStart] Track started in guild: ${player.guild}`, 'log');
      client.logger.log(`[PlayerStart] Track info: "${track.title}" by ${track.author}`, 'log');

      // Make sure we have a valid guild
      let guild = client.guilds.cache.get(player.guild);
      if (!guild) {
        client.logger.log(`[PlayerStart] Guild not found for ID: ${player.guild}`, 'error');
        return;
      }

      // Make sure we have a valid text channel
      let channel = guild.channels.cache.get(player.text);
      if (!channel) {
        client.logger.log(`[PlayerStart] Text channel not found in guild: ${guild.name}`, 'error');
        return;
      }

      // Critical: Ensure track is properly set as current in player
      // This is the most important part for fixing the queue and now playing display
      if (!player.current || player.current.uri !== track.uri) {
        client.logger.log(`[PlayerStart] Updating player.current with the new track`, 'log');
        player.current = track;

        // Force synchronize the player state
        player.playing = true;
        player.paused = false;

        // Log the current queue state for debugging
        client.logger.log(
          `[PlayerStart] Current queue length: ${player.queue ? player.queue.length : 'undefined'}`,
          'log'
        );

        // Store track info in player data for better state management
        player.data.set('currentTrack', {
          title: track.title,
          uri: track.uri,
          length: track.length,
          identifier: track.identifier,
          author: track.author,
          requester: track.requester,
          thumbnail: track.thumbnail,
          isStream: track.isStream,
        });
      }

      // Handle setup channel if it exists
      let data = await db.findOne({ Guild: guild.id });
      if (data && data.Channel) {
        let textChannel = guild.channels.cache.get(data.Channel);
        const id = data.Message;
        if (textChannel && textChannel.id) {
          try {
            await trackStartEventHandler(id, textChannel, player, track, client);
            client.logger.log(
              `[PlayerStart] Updated setup channel for guild: ${guild.name}`,
              'log'
            );
          } catch (error) {
            client.logger.log(
              `[PlayerStart] Error updating setup channel: ${error.message}`,
              'error'
            );
          }
        }
      }

      // Always send the now playing embed to the player's text channel
      const emojiplay = client.emoji.play;

      const main = new MessageEmbed()
        .setAuthor({
          name: track.requester ? track.requester.tag || 'Unknown requester' : 'Unknown requester',
          iconURL: track.requester
            ? track.requester.displayAvatarURL
              ? track.requester.displayAvatarURL()
              : guild.iconURL()
            : guild.iconURL(),
        })
        .setDescription(
          `${emojiplay} Now Playing - [${track.title}](${track.uri}) - \`[ ${track.isStream ? '[**◉ LIVE**]' : convertTime(track.length)} ]\``
        )
        .setColor(client.embedColor)
        .setTimestamp()
        .setThumbnail(
          `${track.thumbnail ? track.thumbnail : `https://img.youtube.com/vi/${track.identifier}/hqdefault.jpg`}`
        );

      // Send the embed to the player's text channel and store the message
      try {
        const message = await channel.send({ embeds: [main] });
        player.data.set('message', message);
        client.logger.log(
          `[PlayerStart] Sent now playing message to channel: ${channel.name}`,
          'log'
        );
      } catch (error) {
        client.logger.log(
          `[PlayerStart] Error sending player start message: ${error.message}`,
          'error'
        );
      }

      // Set autoplay data
      await player.data.set('autoplaySystem', track.identifier);

      // Verify player state after everything is done
      if (!player.playing) {
        client.logger.log(`[PlayerStart] Player was not marked as playing, updating state`, 'warn');
        player.playing = true;
      }

      // Log final player state for debugging
      client.logger.log(
        `[PlayerStart] Final player state - Playing: ${player.playing}, Current track: ${player.current ? player.current.title : 'null'}, Queue length: ${player.queue ? player.queue.length : 'undefined'}`,
        'log'
      );
    } catch (error) {
      client.logger.log(`[PlayerStart] Unhandled error: ${error.stack || error.message}`, 'error');
    }
  },
};
