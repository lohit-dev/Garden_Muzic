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
        const result = await player.search(defaultPlaylist.PlaylistUrl, {
          name: client.user.username,
        });
        if (result.tracks.length) {
          for (const track of result.tracks) {
            player.queue.add(track);
          }
          player.play();

          client.channels.cache
            .get(player.text)
            ?.send({
              embeds: [
                new MessageEmbed()
                  .setColor(client.embedColor)
                  .setDescription(
                    `Queue ended. Playing default playlist with ${result.tracks.length} tracks.`
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
    } catch (e) {}

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
    const TwoFourSeven = await db2.findOne({ Guild: player.guild });

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
