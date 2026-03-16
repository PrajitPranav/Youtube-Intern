import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  downloads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video"
    }
  ],

  downloadCount: {
    type: Number,
    default: 0
  },

  lastDownloadDate: {
    type: String
  },

  isPremium: {
    type: Boolean,
    default: false
  }

});

export default mongoose.model("User", userSchema);