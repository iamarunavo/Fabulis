import Watchlist from "../models/Watchlist.js";

// POST /api/watchlist - add a new item
export const addToWatchlist = async (req, res) => {
  try {
    const { mediaId, mediaType, title, image, status } = req.body;

    if (!mediaId || !mediaType || !title) {
      return res
        .status(400)
        .json({ message: "mediaId, mediaType, and title are required" });
    }

    if (typeof mediaId !== "string" || typeof mediaType !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const item = await Watchlist.create({
      userId: req.user.id,
      mediaId,
      mediaType,
      title,
      image,
      status, // optional - schema defaults to "Want To Watch" if omitted
    });

    res.status(201).json({ item });
  } catch (err) {
    // Duplicate key error - this exact title is already on their watchlist
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "This title is already on your watchlist" });
    }
    console.error("Add to watchlist error:", err);
    res.status(500).json({ message: "Server error adding to watchlist" });
  }
};

// GET /api/watchlist - get the logged-in user's full watchlist
export const getWatchlist = async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ items });
  } catch (err) {
    console.error("Get watchlist error:", err);
    res.status(500).json({ message: "Server error fetching watchlist" });
  }
};

// PUT /api/watchlist/:id - update status of an item (e.g. move to "Completed")
export const updateWatchlistItem = async (req, res) => {
  try {
    const { status } = req.body;

    const item = await Watchlist.findOne({
      _id: req.params.id,
      userId: req.user.id, // ensures users can only edit their own items
    });

    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    if (status) item.status = status;
    await item.save();

    res.status(200).json({ item });
  } catch (err) {
    console.error("Update watchlist error:", err);
    res.status(500).json({ message: "Server error updating watchlist item" });
  }
};

// DELETE /api/watchlist/:id - remove an item
export const deleteWatchlistItem = async (req, res) => {
  try {
    const item = await Watchlist.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!item) {
      return res.status(404).json({ message: "Watchlist item not found" });
    }

    res.status(200).json({ message: "Removed from watchlist" });
  } catch (err) {
    console.error("Delete watchlist error:", err);
    res.status(500).json({ message: "Server error deleting watchlist item" });
  }
};