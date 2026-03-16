import express from "express";
import Video from "../Modals/video.js";
import User from "../Modals/Auth.js";

const router = express.Router();

// POST /download/:videoId/:userId — Record download and return file path
router.post("/:videoId/:userId", async (req, res) => {
  try {
    const { videoId, userId } = req.params;

    const user = await User.findById(userId);
    const video = await Video.findById(videoId);

    if (!user || !video) return res.status(404).json("Not found");

    const today = new Date().toDateString();

    // Free user limit: 1 download per day
    if (!user.isPremium) {
      if (user.lastDownloadDate === today && user.downloadCount >= 1) {
        return res
          .status(403)
          .json(
            "Free users can download only one video per day. Upgrade to Premium."
          );
      }
      user.downloadCount += 1;
      user.lastDownloadDate = today;
    }

    // Record the download (avoid duplicates optional — allow re-download)
    user.downloads.push(videoId);
    await user.save();

    res.json(video.filepath);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// GET /download/:userId — Fetch all downloaded videos for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: "downloads",
      model: "videofiles",
    });

    if (!user) return res.status(404).json("User not found");

    // Return unique downloads (deduplicate by _id)
    const seen = new Set();
    const uniqueDownloads = (user.downloads || []).filter((v) => {
      if (!v || seen.has(String(v._id))) return false;
      seen.add(String(v._id));
      return true;
    });

    res.json(uniqueDownloads);
  } catch (error) {
    console.error("Get downloads error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;