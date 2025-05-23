const { MessageEmbed, Permissions, MessageActionRow, MessageButton } = require('discord.js');
const db = require('../../schema/prefix.js');
const db2 = require('../../schema/setup');
const db3 = require('../../schema/dj');

module.exports = {
  name: 'messageCreate',
  run: async (client, message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    let data = await db2.findOne({ Guild: message.guildId });
    if (data && data.Channel && message.channelId === data.Channel)
      return client.emit('setupSystem', message);
    let prefix = client.prefix;
    const channel = message?.channel;
    const ress = await db.findOne({ Guild: message.guildId });
    if (ress && ress.Prefix) prefix = ress.Prefix;

    const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);
    if (message.content.match(mention)) {
      const row = new MessageActionRow().addComponents(
        new MessageButton().setLabel('Invite').setStyle('LINK').setURL(client.config.links.invite)
      );
      const embed = new MessageEmbed()
        .setColor(client.embedColor)
        .setDescription(
          `Hey **${message.author.username}**, my prefix for this server is \`${prefix}\` Want more info? then do \`${prefix}\`**help**\nStay Safe, Stay Awesome!`
        );
      message.channel.send({ embeds: [embed], components: [row] });
    }
    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!prefixRegex.test(message.content)) return;
    const [matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command =
      client.commands.get(commandName) ||
      client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (!message.guild.members.me.permissions.has(Permissions.FLAGS.SEND_MESSAGES))
      return await message.author.dmChannel
        .send({
          content: `I don't have **\`SEND_MESSAGES\`** permission in <#${message.channelId}> to execute this **\`${command.name}\`** command.`,
        })
        .catch(() => {});

    if (!message.guild.members.me.permissions.has(Permissions.FLAGS.VIEW_CHANNEL)) return;

    if (!message.guild.members.me.permissions.has(Permissions.FLAGS.EMBED_LINKS))
      return await message.channel
        .send({
          content: `I don't have **\`EMBED_LINKS\`** permission to execute this **\`${command.name}\`** command.`,
        })
        .catch(() => {});

    const embed = new MessageEmbed().setColor('RED');

    // args: true,
    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}!`;

      // usage: '',
      if (command.usage) {
        reply += `\nUsage: \`${prefix}${command.name} ${command.usage}\``;
      }

      embed.setDescription(reply);
      return message.channel.send({ embeds: [embed] });
    }

    if (command.userPrams && !message.member.permissions.has(command.userPrams)) {
      embed.setDescription(
        `You need to this \`${command.userPrams.join(', ')}\` permission use this command.`
      );
      return message.channel.send({ embeds: [embed] });
    }
    if (command.botPrams && !message.guild.members.me.permissions.has(command.botPrams)) {
      embed.setDescription(
        `I need this \`${command.userPrams.join(', ')}\` permission use this command.`
      );
      return message.channel.send({ embeds: [embed] });
    }
    if (
      !channel.permissionsFor(message.guild.members.me)?.has(Permissions.FLAGS.EMBED_LINKS) &&
      client.user.id !== userId
    ) {
      return channel.send({ content: 'Error: I need `EMBED_LINKS` permission to work.' });
    }
    if (command.owner) {
      if (client.owner) {
        const devs = client.owner.find(x => x === message.author.id);
        if (!devs)
          return message.channel.send({
            embeds: [embed.setDescription('Only <@959276033683628122> can use this command!')],
          });
      }
    }
    const player = client.manager.players.get(message.guild.id);
    if (command.player && !player) {
      embed.setDescription('There is no player for this guild.');
      return message.channel.send({ embeds: [embed] });
    }
    if (command.inVoiceChannel && !message.member.voice.channelId) {
      embed.setDescription('You must be in a voice channel!');
      return message.channel.send({ embeds: [embed] });
    }
    if (command.sameVoiceChannel) {
      if (message.guild.members.me.voice.channel) {
        if (message.guild.members.me.voice.channelId !== message.member.voice.channelId) {
          embed.setDescription(`You must be in the same channel as ${message.client.user}!`);
          return message.channel.send({ embeds: [embed] });
        }
      }
    }
    if (command.dj) {
      let data = await db3.findOne({ Guild: message.guild.id });
      let perm = Permissions.FLAGS.MANAGE_GUILD;
      if (data) {
        if (data.Mode) {
          let pass = false;
          if (data.Roles.length > 0) {
            message.member.roles.cache.forEach(x => {
              let role = data.Roles.find(r => r === x.id);
              if (role) pass = true;
            });
          }
          if (!pass && !message.member.permissions.has(perm))
            return message.channel.send({
              embeds: [
                embed.setDescription("You don't have permission or dj role to use this command"),
              ],
            });
        }
      }
    }
    try {
      command.execute(message, args, client, prefix);
    } catch (error) {
      console.log(error);
      embed.setDescription(
        'There was an error executing that command.\nI have contacted the owner of the bot to fix it immediately.'
      );
      return message.channel.send({ embeds: [embed] });
    }
  },
};
