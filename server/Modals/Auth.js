import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  downloads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
    },
  ],
  downloadCount: { type: Number, default: 0 },
  lastDownloadDate: { type: String },
  isPremium: { type: Boolean, default: false },
});

export default mongoose.model("user", userschema);
