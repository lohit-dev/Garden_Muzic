module.exports = {
  name: 'disconnect',
  run: async (client, name, players, moved) => {
    if (moved) return;

    // Get all players on this node and destroy them
    const playersOnNode = [...client.manager.shoukaku.players.values()].filter(
      p => p.node.name === name
    );

    playersOnNode.forEach(player => {
      // Destroy the Kazagumo player first
      client.manager.destroyPlayer(player.guildId);
      // Then destroy the Shoukaku player if needed
      player.destroy();
    });

    client.logger.log(`Lavalink ${name}: Disconnected`, 'warn');
  },
};
