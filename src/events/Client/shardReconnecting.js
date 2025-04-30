const defaultPlaylistDb = require('../../schema/defaultPlaylist');
const autoReconnectDb = require('../../schema/autoReconnect');

module.exports = {
  name: 'shardReconnecting',
  run: async (client, id) => {
    client.logger.log(`Shard #${id} Reconnecting`, 'log');
    
    // Wait a bit to ensure the shard is fully reconnected
    setTimeout(async () => {
      try {
        // Get all guilds in this shard
        const guildsInShard = client.guilds.cache.filter(guild => guild.shardId === id);
        if (!guildsInShard.size) return;
        
        client.logger.log(`Checking ${guildsInShard.size} guilds in shard #${id} for default playlists`, 'log');
        
        // Check each guild for default playlist
        for (const [guildId, guild] of guildsInShard) {
          try {
            // Check if this guild has a default playlist enabled
            const defaultPlaylist = await defaultPlaylistDb.findOne({ Guild: guildId, Enabled: true });
            if (!defaultPlaylist) continue;
            
            // Check if there's a 24/7 voice channel configured
            const reconnectData = await autoReconnectDb.findOne({ Guild: guildId });
            if (!reconnectData) continue;
            
            // Check if the voice channel exists
            const voiceChannel = guild.channels.cache.get(reconnectData.VoiceId);
            const textChannel = guild.channels.cache.get(reconnectData.TextId);
            if (!voiceChannel || !textChannel) continue;
            
            // Create or get the player
            const player = client.manager.players.get(guildId) || 
              await client.manager.createPlayer({
                guildId: guildId,
                voiceId: voiceChannel.id,
                textId: textChannel.id,
                deaf: true,
              });
            
            // If player is already playing, skip
            if (player.playing || player.paused) continue;
            
            // Search for the playlist
            const result = await client.manager.search(defaultPlaylist.PlaylistUrl, {
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
              
              client.logger.log(`Started default playlist in ${guild.name} after shard reconnect`, 'log');
            }
          } catch (error) {
            client.logger.log(`Error starting default playlist for ${guildId} after shard reconnect: ${error.message}`, 'error');
          }
        }
      } catch (error) {
        client.logger.log(`Error handling shard reconnect for default playlists: ${error.message}`, 'error');
      }
    }, 5000); // Wait 5 seconds to ensure connections are stable
  },
};
