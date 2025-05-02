const { MessageEmbed } = require('discord.js');
const db = require('../../schema/setup');

module.exports = {
  name: 'playerEnd',
  run: async (client, player) => {
    try {
      // Enhanced logging for debugging
      client.logger.log(`[PlayerEnd] Track ended in guild: ${player.guild}`, 'log');

      // Clean up previous message if it exists
      if (player.data.get('message') && !player.data.get('message').deleted) {
        try {
          await player.data.get('message').delete();
          client.logger.log('[PlayerEnd] Deleted previous track message', 'log');
        } catch (error) {
          client.logger.log(
            `[PlayerEnd] Error deleting previous message: ${error.message}`,
            'error'
          );
        }
      }

      // Get guild
      let guild = client.guilds.cache.get(player.guild);
      if (!guild) {
        client.logger.log(`[PlayerEnd] Guild not found for ID: ${player.guild}`, 'error');
        return;
      }

      // Check if there are more tracks in queue
      if (player.queue && player.queue.length > 0) {
        client.logger.log(
          `[PlayerEnd] Queue has ${player.queue.length} more tracks. Next track should start automatically.`,
          'log'
        );

        // If player isn't playing but there are tracks in queue, try to start playback
        if (!player.playing && player.queue.length > 0) {
          client.logger.log(
            '[PlayerEnd] Player not playing but queue has tracks. Attempting to play next track.',
            'log'
          );
          try {
            await player.play();
          } catch (error) {
            client.logger.log(`[PlayerEnd] Error starting next track: ${error.message}`, 'error');
          }
        }
      } else {
        client.logger.log('[PlayerEnd] Queue is empty. Updating setup channel if exists.', 'log');
      }

      // Update setup channel if it exists
      const data = await db.findOne({ Guild: guild.id });
      if (!data) return;

      let channel = guild.channels.cache.get(data.Channel);
      if (!channel) {
        client.logger.log(`[PlayerEnd] Setup channel not found in guild: ${guild.name}`, 'warn');
        return;
      }

      let message;
      try {
        message = await channel.messages.fetch(data.Message, { cache: true });
      } catch (error) {
        client.logger.log(`[PlayerEnd] Error fetching setup message: ${error.message}`, 'error');
        return;
      }

      if (!message) {
        client.logger.log('[PlayerEnd] Setup message not found', 'warn');
        return;
      }

      try {
        await message.edit({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setTitle('Nothing playing right now in this server!')
              .setDescription(
                `[Invite](${client.config.links.invite}) - [Support Server](${client.config.links.support})`
              )
              .setImage(client.config.links.bg),
          ],
        });
        client.logger.log('[PlayerEnd] Updated setup message to show nothing playing', 'log');
      } catch (error) {
        client.logger.log(`[PlayerEnd] Error updating setup message: ${error.message}`, 'error');
      }
    } catch (error) {
      client.logger.log(`[PlayerEnd] Unhandled error: ${error.stack || error.message}`, 'error');
    }
  },
};
