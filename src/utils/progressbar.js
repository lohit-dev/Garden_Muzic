module.exports = {
  progressbar: function (player) {
    let size = 15;
    let line = '▬';
    let slider = ':radio_button:';

    if (!player || !player.current) return `${slider}${line.repeat(size - 1)}`;

    // Get current position and total length from Kazagumo player
    let current = player.position || 0;
    let total = player.current.length || 1; // Default to 1 to avoid division by zero

    // Safety check to ensure current doesn't exceed total and isn't negative
    if (current > total) current = total;
    if (current < 0) current = 0;

    // Ensure total is at least 1 to avoid division by zero
    if (total <= 0) total = 1;

    // Calculate percentage of song played
    const percent = current / total;

    // Calculate how many characters of the bar should be filled
    const filledLength = Math.round(size * percent);

    // Ensure filledLength is within bounds
    const boundedFilledLength = Math.min(Math.max(0, filledLength), size);

    // Create the progress bar
    let progressBar = '';
    if (boundedFilledLength === 0) {
      // If at the very beginning
      progressBar = slider + line.repeat(size - 1);
    } else if (boundedFilledLength === size) {
      // If at the very end
      progressBar = line.repeat(size - 1) + slider;
    } else {
      // Somewhere in the middle
      progressBar =
        line.repeat(boundedFilledLength - 1) + slider + line.repeat(size - boundedFilledLength);
    }

    return progressBar;
  },
};
