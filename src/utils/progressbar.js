module.exports = {
  progressbar: function (player) {
    let size = 15;
    let line = '▬';
    let slider = ':radio_button:';

    if (!player.current) return `${slider}${line.repeat(size - 1)}`;

    // Get current position and total length from Kazagumo player
    let current = player.position || 0;
    let total = player.current.length || 1; // Default to 1 to avoid division by zero

    // Safety check to ensure current doesn't exceed total
    if (current > total) current = total;

    let bar =
      current > total
        ? [line.repeat((size / 2) * 2), 100]
        : [
            line.repeat(Math.round((size / 2) * (current / total))).replace(/.$/, slider) +
              line.repeat(size - Math.round(size * (current / total)) + 1),
            current / total,
          ];

    if (!String(bar).includes(slider)) return `${slider}${line.repeat(size - 1)}`;
    return `${bar[0]}`;
  },
};
