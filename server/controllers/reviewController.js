import Review from "../models/Review.js";

// POST /api/reviews - create or update a review for a title
export const createReview = async (req, res) => {
  try {
    const { mediaId, mediaType, rating, comment } = req.body;

    if (!mediaId || !mediaType || !rating) {
      return res
        .status(400)
        .json({ message: "mediaId, mediaType, and rating are required" });
    }

    // Reject non-string mediaId/mediaType before they reach a Mongoose
    if (typeof mediaId !== "string" || typeof mediaType !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    // If the user already reviewed this title, update it instead of erroring -
    const existing = await Review.findOne({
      userId: req.user.id,
      mediaId,
      mediaType,
    });

    if (existing) {
      existing.rating = rating;
      if (comment !== undefined) existing.comment = comment;
      await existing.save();
      return res.status(200).json({ review: existing });
    }

    const review = await Review.create({
      userId: req.user.id,
      mediaId,
      mediaType,
      rating,
      comment,
    });

    res.status(201).json({ review });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ message: "Server error creating review" });
  }
};

// GET /api/reviews/:mediaId - get all reviews for a specific title (public-facing)
export const getReviewsForMedia = async (req, res) => {
  try {
    const reviews = await Review.find({
      mediaId: req.params.mediaId,
    })
      .populate("userId", "username") // pulls in just the username, not full user doc
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Server error fetching reviews" });
  }
};

// DELETE /api/reviews/:id - delete the logged-in user's own review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // same ownership check pattern as Watchlist
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ message: "Server error deleting review" });
  }
};