const { Schema, model } = require('mongoose');

let DefaultPlaylist = new Schema({
  Guild: {
    type: String,
    required: true,
    unique: true,
  },
  PlaylistUrl: {
    type: String,
    required: true,
  },
  Enabled: {
    type: Boolean,
    default: false,
  },
});

module.exports = model('DefaultPlaylist', DefaultPlaylist);
