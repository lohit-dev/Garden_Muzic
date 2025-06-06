const { MessageEmbed } = require('discord.js');
const moment = require('moment');

module.exports = {
  name: 'guildCreate',
  run: async (client, guild) => {
    const channel = client.channels.cache.get(client.config.logs);
    let own = await guild?.fetchOwner();
    let text;
    guild.channels.cache.forEach(c => {
      if (c.type === 'GUILD_TEXT' && !text) text = c;
    });
    const invite = await text.createInvite({
      reason: `For ${client.user.tag} Developer(s)`,
      maxAge: 0,
    });
    const embed = new MessageEmbed()
      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
      .setTitle('📥 Joined a Guild !!')
      .addFields('Name', `\`${guild.name}\``)
      .addFields('ID', `\`${guild.id}\``)
      .addFields(
        'Owner',
        `\`${guild.members.cache.get(own.id) ? guild.members.cache.get(own.id).user.tag : 'Unknown user'}\` ${own.id}\``
      )
      .addFields('Member Count', `\`${guild.memberCount}\` Members`)
      .addFields('Creation Date', `\`${moment.utc(guild.createdAt).format('DD/MMM/YYYY')}\``)
      .addFields(
        'Guild Invite',
        `[Here is ${guild.name} invite ](https://discord.gg/${invite.code})`
      )
      .setColor(client.embedColor)
      .addFields(`${client.user.username}'s Server Count`, `\`${client.guilds.cache.size}\` Severs`)
      .setTimestamp();
    channel.send({ embeds: [embed] });
  },
};
