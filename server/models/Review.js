import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaId: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "anime", "tv"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per title - they can update it, not stack duplicates
reviewSchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;