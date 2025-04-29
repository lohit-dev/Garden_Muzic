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
    let guild = client.guilds.cache.get(player.guild);
    if (!guild) return;
    let channel = guild.channels.cache.get(player.text);
    if (!channel) return;

    // Handle setup channel if it exists
    let data = await db.findOne({ Guild: guild.id });
    if (data && data.Channel) {
      let textChannel = guild.channels.cache.get(data.Channel);
      const id = data.Message;
      if (textChannel && textChannel.id) {
        await trackStartEventHandler(id, textChannel, player, track, client);
      }
    }

    // Always send the now playing embed to the player's text channel
    const emojiplay = client.emoji.play;

    const main = new MessageEmbed()
      .setAuthor({ name: track.requester.tag, iconURL: track.requester.displayAvatarURL() })
      .setDescription(
        `${emojiplay} Now Playing - [${track.title}](${track.uri}) - \`[ ${track.isStream ? '[**◉ LIVE**]' : convertTime(player.current.length)} ]\``
      )
      .setColor(client.embedColor)
      .setTimestamp()
      .setThumbnail(
        `${track.thumbnail ? track.thumbnail : `https://img.youtube.com/vi/${player.current.identifier}/hqdefault.jpg`}`
      );

    // Send the embed to the player's text channel and store the message
    channel
      .send({ embeds: [main] })
      .then(x => player.data.set('message', x))
      .catch(err => console.error('Error sending player start message:', err));

    await player.data.set('autoplaySystem', player.current.identifier);
  },
};
