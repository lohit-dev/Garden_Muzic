// Use environment variable instead of config.js
const prefix = process.env.PREFIX || '!';
const defaultPlaylistDb = require('../../schema/defaultPlaylist');
const autoReconnectDb = require('../../schema/autoReconnect');

module.exports = {
  name: 'ready',
  run: async client => {
    client.logger.log(`${client.user.username} online!`, 'ready');
    client.logger.log(
      `Ready on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users`,
      'ready'
    );

    // Load and play default playlists for servers that have them enabled
    try {
      const servers = await defaultPlaylistDb.find({ Enabled: true });
      client.logger.log(`Found ${servers.length} servers with default playlists enabled`, 'ready');

      for (const server of servers) {
        try {
          // Check if the guild exists
          const guild = client.guilds.cache.get(server.Guild);
          if (!guild) continue;

          // Check if there's a 24/7 voice channel configured
          const reconnectData = await autoReconnectDb.findOne({ Guild: server.Guild });
          if (!reconnectData) continue;

          // Check if the voice channel exists
          const voiceChannel = guild.channels.cache.get(reconnectData.VoiceId);
          const textChannel = guild.channels.cache.get(reconnectData.TextId);
          if (!voiceChannel || !textChannel) continue;

          // Create or get the player
          const player =
            client.manager.players.get(server.Guild) ||
            (await client.manager.createPlayer({
              guildId: server.Guild,
              voiceId: voiceChannel.id,
              textId: textChannel.id,
              deaf: true,
            }));

          // If player is already playing, skip
          if (player.playing || player.paused) continue;

          // Search for the playlist
          const result = await client.manager.search(server.PlaylistUrl, {
            requester: client.user,
          });

          if (result && result.tracks && result.tracks.length) {
            // Clear current queue and add new tracks
            player.queue.clear();
            player.queue.add(result.tracks);

            // Set the player to loop the queue automatically
            await player.setLoop('queue');

            // Start playing
            player.play();

            client.logger.log(`Started default playlist in ${guild.name}`, 'ready');
          }
        } catch (error) {
          client.logger.log(
            `Error starting default playlist for ${server.Guild}: ${error.message}`,
            'error'
          );
        }
      }
    } catch (error) {
      client.logger.log(`Error loading default playlists: ${error.message}`, 'error');
    }

    let statuses = ['/help', `Prefix ${prefix}`];
    setInterval(function () {
      let status = statuses[Math.floor(Math.random() * statuses.length)];
      client.user.setPresence({
        activities: [
          {
            name: status,
            type: 'PLAYING',
          },
        ],
        status: 'idle',
      });
    }, 10000);
  },
};
