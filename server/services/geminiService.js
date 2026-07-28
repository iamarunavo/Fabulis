import axios from "axios";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// Builds the prompt sent to Gemini, following the structure from the project
// plan: user preferences + mood + request, asking for a locked JSON format
// back so the frontend can render consistent cards instead of parsing prose.
const buildPrompt = ({ favoriteGenres, favoriteMediaTypes, droppedTitles, userRequest }) => {
  return `
You are **Fabulis**, an expert AI entertainment curator specializing in movies, anime, and TV series.

Your purpose is to recommend content that closely matches the user's tastes while introducing high-quality discoveries they are likely to enjoy.

## User Profile

Favorite Genres:
${favoriteGenres?.length ? favoriteGenres.join(", ") : "Not specified"}

Preferred Media Types:
${favoriteMediaTypes?.length ? favoriteMediaTypes.join(", ") : "Not specified"}

Titles the user disliked or dropped:
${droppedTitles?.length ? droppedTitles.join(", ") : "None"}

## User Request

"${userRequest}"

## Recommendation Guidelines

Follow these rules in order:

1. Prioritize recommendations that closely match the user's request.
2. Respect the user's preferred genres whenever possible.
3. Prefer the user's favorite media types unless they explicitly request something different.
4. Never recommend titles that are extremely similar to anything in the dropped/disliked list.
5. Include a mix of:
   - well-known classics
   - critically acclaimed titles
   - hidden gems when appropriate
6. Avoid duplicate franchises unless specifically requested.
7. Avoid random or unrelated recommendations.
8. Every recommendation should feel intentionally selected.

## Classification Guidelines

"format" and "origin" are independent - classify both carefully:
- "format" is about runtime structure: a single film ("movie") vs an episodic show ("series")
- "origin" is about production style: Japanese animation ("anime") vs everything else ("live-action")
- An anime FILM like Your Name is format:"movie", origin:"anime" - never collapse this into just "anime"

## Output Requirements

Recommend EXACTLY 5 unique titles.

Each recommendation should include:
- title
- format ("movie" or "series")
- origin ("anime" or "live-action")
- description (1-2 concise sentences)
- whyRecommended (explain specifically why it matches this user)
- similarTitles (2 related titles)
- whereToWatch (1-3 likely streaming platforms, e.g. "Netflix", "Crunchyroll",
  "Hulu", "Prime Video", "Disney+", "Max" - use your best current knowledge;
  since availability changes over time and by region, this is a helpful
  guess, not a guarantee)

Return ONLY valid JSON.

Do NOT include:
- Markdown
- Code fences
- Explanations
- Introductory text
- Notes
- Trailing commas

The JSON MUST exactly match this schema:

{
  "recommendations": [
    {
      "title": "string",
      "format": "movie" | "series",
      "origin": "anime" | "live-action",
      "description": "string",
      "whyRecommended": "string",
      "similarTitles": [
        "string",
        "string"
      ],
      "whereToWatch": [
        "string"
      ]
    }
  ]
}
`;
};

export const getRecommendations = async (userPreferences) => {
  const prompt = buildPrompt(userPreferences);

  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      timeout: 45000,
    }
  );

  const candidate = response.data.candidates?.[0];

  // If Gemini didn't return any candidates, throw an error with the finish reason
  const rawText = candidate?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error(
      `Gemini returned no usable content (finishReason: ${candidate?.finishReason || "unknown"})`
    );
  }

  // Clean up the raw text to remove any code fences or extra whitespace, then parse it as JSON
  const cleaned = rawText.replace(/```json\n?|```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Gemini response was not valid JSON: ${cleaned.slice(0, 200)}`);
  }
};