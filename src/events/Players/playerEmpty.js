const { MessageEmbed } = require('discord.js');
const db = require('../../schema/setup');
const db2 = require('../../schema/autoReconnect');
const defaultPlaylistDb = require('../../schema/defaultPlaylist');
const { autoplay } = require('../../utils/functions');

module.exports = {
  name: 'playerEmpty',
  run: async (client, player) => {
    if (player.data.get('autoplay')) {
      player.previous = player.data.get('autoplaySystem');
      return autoplay(player);
    }

    // Check for default playlist
    const defaultPlaylist = await defaultPlaylistDb.findOne({ Guild: player.guild, Enabled: true });
    if (defaultPlaylist) {
      try {
        client.logger.log(`Playing default playlist in guild ${player.guild}`, 'log');
        // Use client.manager.search instead of player.search for better Spotify handling
        const result = await client.manager.search(defaultPlaylist.PlaylistUrl, {
          requester: client.user,
        });

        if (result.tracks.length) {
          // Clear the queue before adding new tracks to prevent duplicates
          player.queue.clear();

          // Add all tracks at once for better performance
          player.queue.add(result.tracks);

          // Set the player to loop the queue automatically
          await player.setLoop('queue');

          // Start playing if not already playing
          if (!player.playing && !player.paused) {
            player.play();
          }

          client.channels.cache
            .get(player.text)
            ?.send({
              embeds: [
                new MessageEmbed()
                  .setColor(client.embedColor)
                  .setDescription(
                    `Queue ended. Playing default playlist with ${result.tracks.length} tracks in loop mode.`
                  )
                  .setTimestamp(),
              ],
            })
            .then(msg => {
              setTimeout(() => {
                msg.delete();
              }, 10000);
            });

          return; // Return early since we're playing the default playlist
        }
      } catch (error) {
        console.error('Error playing default playlist:', error);
      }
    }

    let guild = client.guilds.cache.get(player.guild);
    if (!guild) return;
    const data = await db.findOne({ Guild: guild.id });
    if (!data) return;
    let channel = guild.channels.cache.get(data.Channel);
    if (!channel) return;

    let message;

    try {
      message = await channel.messages.fetch(data.Message, { cache: true });
    } catch (e) {
      console.error(e);
    }

    if (!message) return;
    await message
      .edit({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setTitle('Nothing playing right now in this server!')
            .setDescription(
              `[Invite](${client.config.links.invite}) - [Support Server](${client.config.links.support})`
            )
            .setImage(client.config.links.bg),
        ],
      })
      .catch(() => {});
    if (player.data.get('message') && !player.data.get('message').deleted)
      player.data
        .get('message')
        .delete()
        .catch(() => null);
    // Check for 24/7 mode with proper error handling
    let TwoFourSeven;
    try {
      TwoFourSeven = await db2.findOne({ Guild: player.guild });
    } catch (error) {
      client.logger.log(`Error finding 24/7 settings: ${error.message}`, 'error');
    }

    if (TwoFourSeven) {
      return client.channels.cache
        .get(player.text)
        ?.send({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription('Queue ended. 24/7 is enable i am not Leaving the voice channel.')
              .setTimestamp(),
          ],
        })
        .then(msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
    } else if (!TwoFourSeven)
      client.channels.cache
        .get(player.text)
        ?.send({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription('Queue ended. 24/7 is disable i am Leaving the voice channel.')
              .setTimestamp(),
          ],
        })
        .then(msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
    client.manager.destroyPlayer(player.guild);
  },
};
