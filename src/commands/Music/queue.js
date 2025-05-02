const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const { convertTime } = require('../../utils/convert.js');
const load = require('lodash');

module.exports = {
  name: 'queue',
  category: 'Music',
  aliases: ['q'],
  description: 'Show the music queue and now playing.',
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
      // Log queue command execution for debugging
      client.logger.log(
        `[Queue Command] Executed in guild: ${message.guild.name} (${message.guild.id})`,
        'log'
      );

      // Get the player instance for this guild
      const player = client.manager.players.get(message.guild.id);

      // Check if player exists
      if (!player) {
        return message.channel.send({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription('There is no active music player in this server.'),
          ],
        });
      }

      // Log player state for debugging
      client.logger.log(
        `[Queue Command] Player state - Playing: ${player.playing}, Queue length: ${
          player.queue ? player.queue.length : 'undefined'
        }`,
        'log'
      );

      // Check if player has current track
      if (!player.current) {
        // If we have queue items but no current track, try to start playback
        if (player.queue && player.queue.length > 0) {
          client.logger.log(
            `[Queue Command] Found ${player.queue.length} tracks in queue but no current track. Attempting to start playback.`,
            'log'
          );
          try {
            await player.play();
            // Wait a moment for player to update
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            client.logger.log(`[Queue Command] Error starting playback: ${error.message}`, 'error');
            return message.channel.send({
              embeds: [
                new MessageEmbed()
                  .setColor('RED')
                  .setDescription(`Error starting playback: ${error.message}`),
              ],
            });
          }
        } else {
          return message.channel.send({
            embeds: [
              new MessageEmbed()
                .setColor(client.embedColor)
                .setDescription('Nothing is playing right now and the queue is empty.'),
            ],
          });
        }
      }

      // Check if queue is empty, just show current song
      if (!player.queue || player.queue.length === 0) {
        client.logger.log('[Queue Command] Displaying only current track (no queue)', 'log');

        // Check if player.current exists before trying to access its properties
        if (!player.current) {
          return message.channel.send({
            embeds: [
              new MessageEmbed()
                .setColor(client.embedColor)
                .setDescription('Nothing is playing right now and the queue is empty.'),
            ],
          });
        }

        const embed = new MessageEmbed()
          .setColor(client.embedColor)
          .setTitle(`Now Playing - ${message.guild.name}`)
          .setDescription(
            `**Now playing** [${player.current.title}](${player.current.uri}) • \`[ ${
              player.current.isStream ? '[**◉ LIVE**]' : convertTime(player.current.length)
            } ]\` • [${player.current.requester}]`
          )
          .setThumbnail(
            `${
              player.current.thumbnail
                ? player.current.thumbnail
                : `https://img.youtube.com/vi/${player.current.identifier}/hqdefault.jpg`
            }`
          );

        return message.channel.send({ embeds: [embed] });
      } else {
        const queuedSongs = player.queue.map(
          (t, i) =>
            `\`[ ${++i} ]\` • [${t.title}](${t.uri}) • \`[ ${
              t.isStream ? '[**◉ LIVE**]' : convertTime(t.length)
            } ]\` • [${t.requester}]`
        );

        // Split into pages of 10 songs each
        const mapping = load.chunk(queuedSongs, 10);
        const pages = mapping.map(s => s.join('\n'));
        let page = 0;

        client.logger.log(
          `[Queue Command] Displaying queue with ${player.queue.length} tracks (${pages.length} pages)`,
          'log'
        );

        // Check if player.current exists before trying to access its properties
        if (!player.current) {
          client.logger.log(
            `[Queue Command] Player current track is undefined but queue has ${player.queue.length} tracks`,
            'log'
          );

          const embed = new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(`\n**Queued Songs**\n${pages[page]}`)
            .setFooter({
              text: `Page ${page + 1}/${pages.length} • ${player.queue.length} total songs`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${message.guild.name} Queue`);

          return message.channel.send({ embeds: [embed] });
        }

        if (player.queue.length < 11) {
          // For small queues, just show a single embed
          const embed = new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(
              `**Now playing**\n[${player.current.title}](${player.current.uri}) • \`[ ${
                player.current.isStream ? '[**◉ LIVE**]' : convertTime(player.current.length)
              } ]\` • [${player.current.requester}]\n\n**Queued Songs**\n${pages[page]}`
            )
            .setFooter({
              text: `Page ${page + 1}/${pages.length} • ${player.queue.length} total songs`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setThumbnail(
              `${
                player.current.thumbnail
                  ? player.current.thumbnail
                  : `https://img.youtube.com/vi/${player.current.identifier}/hqdefault.jpg`
              }`
            )
            .setTitle(`${message.guild.name} Queue`);

          return message.channel.send({ embeds: [embed] });
        } else {
          // For larger queues, add pagination buttons
          const embed2 = new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(
              `**Now playing**\n[${player.current.title}](${player.current.uri}) • \`[ ${
                player.current.isStream ? '[**◉ LIVE**]' : convertTime(player.current.length)
              } ]\` • [${player.current.requester}]\n\n**Queued Songs**\n${pages[page]}`
            )
            .setFooter({
              text: `Page ${page + 1}/${pages.length} • ${player.queue.length} total songs`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setThumbnail(
              `${
                player.current.thumbnail
                  ? player.current.thumbnail
                  : `https://img.youtube.com/vi/${player.current.identifier}/hqdefault.jpg`
              }`
            )
            .setTitle(`${message.guild.name} Queue`);

          const but1 = new MessageButton()
            .setCustomId('queue_cmd_but_1')
            .setEmoji('⏭️')
            .setStyle('PRIMARY');

          const but2 = new MessageButton()
            .setCustomId('queue_cmd_but_2')
            .setEmoji('⏮️')
            .setStyle('PRIMARY');

          const but3 = new MessageButton()
            .setCustomId('queue_cmd_but_3')
            .setEmoji('⏹️')
            .setStyle('DANGER');

          const row1 = new MessageActionRow().addComponents([but2, but3, but1]);

          const msg = await message.channel.send({
            embeds: [embed2],
            components: [row1],
          });

          const collector = message.channel.createMessageComponentCollector({
            filter: b => {
              if (b.user.id === message.author.id) return true;
              else {
                b.reply({
                  ephemeral: true,
                  content: `Only **${message.author.tag}** can use this button, if you want then you've to run the command again.`,
                });
                return false;
              }
            },
            time: 60000 * 5,
            idle: 30e3,
          });

          collector.on('collect', async button => {
            try {
              if (button.customId === 'queue_cmd_but_1') {
                await button.deferUpdate().catch(() => {});
                page = page + 1 < pages.length ? ++page : 0;

                const embed3 = new MessageEmbed()
                  .setColor(client.embedColor)
                  .setDescription(
                    `**Now playing**\n[${player.current.title}](${player.current.uri}) • \`[ ${
                      player.current.isStream ? '[**◉ LIVE**]' : convertTime(player.current.length)
                    } ]\` • [${player.current.requester}]\n\n**Queued Songs**\n${pages[page]}`
                  )
                  .setFooter({
                    text: `Page ${page + 1}/${pages.length} • ${player.queue.length} total songs`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true }),
                  })
                  .setThumbnail(
                    `${
                      player.current.thumbnail
                        ? player.current.thumbnail
                        : `https://img.youtube.com/vi/${player.current.identifier}/hqdefault.jpg`
                    }`
                  )
                  .setTitle(`${message.guild.name} Queue`);

                await msg.edit({
                  embeds: [embed3],
                  components: [row1],
                });
              } else if (button.customId === 'queue_cmd_but_2') {
                await button.deferUpdate().catch(() => {});
                page = page > 0 ? --page : pages.length - 1;

                const embed4 = new MessageEmbed()
                  .setColor(client.embedColor)
                  .setDescription(
                    `**Now playing**\n[${player.current.title}](${player.current.uri}) • \`[ ${
                      player.current.isStream ? '[**◉ LIVE**]' : convertTime(player.current.length)
                    } ]\` • [${player.current.requester}]\n\n**Queued Songs**\n${pages[page]}`
                  )
                  .setFooter({
                    text: `Page ${page + 1}/${pages.length} • ${player.queue.length} total songs`,
                    iconURL: message.author.displayAvatarURL({ dynamic: true }),
                  })
                  .setThumbnail(
                    `${
                      player.current.thumbnail
                        ? player.current.thumbnail
                        : `https://img.youtube.com/vi/${player.current.identifier}/hqdefault.jpg`
                    }`
                  )
                  .setTitle(`${message.guild.name} Queue`);

                await msg.edit({
                  embeds: [embed4],
                  components: [row1],
                });
              } else if (button.customId === 'queue_cmd_but_3') {
                await button.deferUpdate().catch(() => {});
                collector.stop();
              }
            } catch (error) {
              client.logger.log(
                `[Queue Command] Button interaction error: ${error.message}`,
                'error'
              );
            }
          });

          collector.on('end', async () => {
            try {
              await msg.edit({
                components: [],
              });
            } catch (error) {
              client.logger.log(
                `[Queue Command] Error removing buttons: ${error.message}`,
                'error'
              );
            }
          });
        }
      }
    } catch (error) {
      client.logger.log(`[Queue Command Error] ${error.stack || error.message}`, 'error');
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
