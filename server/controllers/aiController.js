import Recommendation from "../models/Recommendation.js";
import User from "../models/User.js";
import Watchlist from "../models/Watchlist.js";
import { getRecommendations } from "../services/geminiService.js";

// POST /api/recommend - generate recommendations based on the user's request and their stored preferences
export const recommend = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "A request message is required" });
    }

    // Fetch the user's preferences and any titles they've marked as "Dropped" to avoid recommending them again
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User account not found" });
    }
    const droppedItems = await Watchlist.find({
      userId: req.user.id,
      status: "Dropped",
    });

    const results = await getRecommendations({
      favoriteGenres: user.favoriteGenres,
      favoriteMediaTypes: user.favoriteMediaTypes,
      droppedTitles: droppedItems.map((item) => item.title),
      userRequest: message,
    });

    // Save the recommendation to the user's history for future reference. This is done asynchronously and doesn't block the response to the client, so even if saving fails, the user still receives their recommendations.
    try {
      await saveRecommendation(req.user.id, message, results);
    } catch (saveErr) {
      console.error("Failed to save recommendation history:", saveErr.message);
    }

    res.status(200).json(results);
  } catch (err) {
    console.error("Recommendation error:", err);

    // If the Gemini service returns a 429 (Too Many Requests), we want to inform the user that the AI Discovery feature has hit its request limit, rather than a generic server error. This helps manage user expectations and reduces frustration.
    if (err.response?.status === 429) {
      return res.status(429).json({
        message: "AI Discovery has hit its request limit for now - please try again later.",
      });
    }

    res.status(502).json({ message: "Failed to generate recommendations" });
  }
};

// Save a completed AI interaction to history.
// This is called after the AI service has successfully returned recommendations, so we don't want to block the response to the client on this operation. If saving fails, we log the error but still return the recommendations to the user.
export const saveRecommendation = async (userId, prompt, results) => {
  return Recommendation.create({ userId, prompt, results });
};

// GET /api/recommend/history - fetch the logged-in user's past AI interactions
export const getRecommendationHistory = async (req, res) => {
  try {
    const history = await Recommendation.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ history });
  } catch (err) {
    console.error("Get recommendation history error:", err);
    res.status(500).json({ message: "Server error fetching history" });
  }
};