const { MessageEmbed } = require('discord.js');
const db = require('../../schema/defaultPlaylist');
const db247 = require('../../schema/autoReconnect');

module.exports = {
  name: 'defaultplaylist',
  category: 'Music',
  aliases: ['dp', 'default'],
  description: 'Set a default Spotify playlist to play 24/7',
  args: true,
  usage: '<Spotify Playlist URL>',
  userPrams: [],
  botPrams: ['EMBED_LINKS'],
  owner: false,
  inVoiceChannel: true,
  sameVoiceChannel: true,
  execute: async (message, args, client, prefix) => {
    // Check if the argument is a valid Spotify playlist URL
    const playlistUrl = args[0];
    if (!playlistUrl.includes('spotify.com/playlist/')) {
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription('Please provide a valid Spotify playlist URL'),
        ],
      });
    }

    // Get or create player
    const player =
      client.manager.players.get(message.guild.id) ||
      (await client.manager.createPlayer({
        guildId: message.guild.id,
        voiceId: message.member.voice.channel.id,
        textId: message.channel.id,
        deaf: true,
      }));

    // Check if default playlist exists for this guild
    let data = await db.findOne({ Guild: message.guild.id });

    if (args[0].toLowerCase() === 'disable') {
      if (!data) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription('No default playlist is set for this server'),
          ],
        });
      }

      data.Enabled = false;
      await data.save();

      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription('Default playlist has been disabled'),
        ],
      });
    }

    if (args[0].toLowerCase() === 'enable') {
      if (!data) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription('No default playlist is set for this server. Please set one first.'),
          ],
        });
      }

      data.Enabled = true;
      await data.save();

      // Enable 24/7 mode if not already enabled with proper error handling
      try {
        let data247 = await db247.findOne({ Guild: message.guild.id });
        if (!data247) {
          // Make sure all required fields are present
          if (!player.guild || !player.text || !player.voice) {
            console.error('Missing required fields for 24/7 mode');
            console.log('Guild:', player.guild, 'TextId:', player.text, 'VoiceId:', player.voice);
          } else {
            data247 = new db247({
              Guild: player.guild,
              TextId: player.text,
              VoiceId: player.voice,
            });
            await data247.save();
          }
        }
      } catch (error) {
        console.error('Error saving 24/7 settings:', error.message);
      }

      // Start playing the default playlist if queue is empty
      if (!player.playing && !player.paused) {
        try {
          // Use client.manager.search instead of player.search
          const result = await client.manager.search(data.PlaylistUrl, {
            requester: message.author,
          });
          if (result.tracks.length) {
            // Add all tracks at once for better performance
            player.queue.add(result.tracks);
            player.play();
          }
        } catch (error) {
          console.error(error);
        }
      }

      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription('Default playlist has been enabled and 24/7 mode is now active'),
        ],
      });
    }

    // Set or update the default playlist
    if (data) {
      data.PlaylistUrl = playlistUrl;
      data.Enabled = true;
      await data.save();
    } else {
      data = new db({
        Guild: message.guild.id,
        PlaylistUrl: playlistUrl,
        Enabled: true,
      });
      await data.save();
    }

    // Enable 24/7 mode with proper error handling
    try {
      let data247 = await db247.findOne({ Guild: message.guild.id });
      if (!data247) {
        // Make sure all required fields are present
        if (!player.guild || !player.text || !player.voice) {
          console.error('Missing required fields for 24/7 mode');
          console.log('Guild:', player.guild, 'TextId:', player.text, 'VoiceId:', player.voice);
        } else {
          data247 = new db247({
            Guild: player.guild,
            TextId: player.text,
            VoiceId: player.voice,
          });
          await data247.save();
        }
      }
    } catch (error) {
      console.error('Error saving 24/7 settings:', error.message);
    }

    // Start playing the playlist immediately
    try {
      // Verify that the Spotify credentials are properly configured
      if (!client.config.SpotifyID || !client.config.SpotifySecret) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription(
                'Spotify credentials are not properly configured. Please check your .env file.'
              ),
          ],
        });
      }

      // Use client.manager.search instead of player.search for Spotify playlists
      const result = await client.manager.search(playlistUrl, { requester: message.author });

      // Handle empty results
      if (!result || !result.tracks || !result.tracks.length) {
        return message.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.embedColor)
              .setDescription(
                'No tracks found in this playlist or there was an error accessing Spotify API'
              ),
          ],
        });
      }

      // Clear current queue and add new tracks
      player.queue.clear();
      // Add all tracks at once for better performance
      player.queue.add(result.tracks);

      // Set the player to loop the queue automatically
      await player.setLoop('queue');

      if (!player.playing) {
        player.play();
      } else {
        player.skip(); // Skip current track to start playing the new playlist
      }

      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(
              `Default playlist set and 24/7 mode enabled. Added ${result.tracks.length} tracks to the queue in loop mode.`
            ),
        ],
      });
    } catch (error) {
      console.error(error);
      return message.reply({
        embeds: [
          new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription('An error occurred while trying to play the playlist'),
        ],
      });
    }
  },
};
