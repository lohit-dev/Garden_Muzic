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
    const player = client.manager.players.get(message.guild.id);
    if (!player || !player.current) {
      let thing = new MessageEmbed().setColor('RED').setDescription('There is no music playing.');
      return message.channel.send({ embeds: [thing] });
    }

    const song = player.current;
    const emojimusic = client.emoji.music;
    var total = song.length || 0;
    var current = player.position || 0;

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
    return message.channel.send({ embeds: [embed] });
  },
};
