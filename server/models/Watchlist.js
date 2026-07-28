import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaId: {
      type: String, // TMDB/Jikan IDs are numbers but we store as string for flexibility across both APIs
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "anime", "tv"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String, // poster URL
    },
    status: {
      type: String,
      enum: ["Want To Watch", "Currently Watching", "Completed", "Dropped"],
      default: "Want To Watch",
    },
  },
  {
    timestamps: true, // adds addedAt equivalent via createdAt
  }
);

// Prevent the same user from adding the same title twice
watchlistSchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: true });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

export default Watchlist;