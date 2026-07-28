import axios from "axios";

const ANILIST_URL = "https://graphql.anilist.co";

// send a GraphQL request to AniList and return the data portion of the response
const anilistRequest = async (query, variables = {}) => {
  const response = await axios.post(
    ANILIST_URL,
    { query, variables },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    }
  );
  return response.data.data;
};

// Reshapes AniList's raw media object into the same shape formatAnime
const formatAnime = (media) => ({
  id: media.id,
  title: media.title.english || media.title.romaji,
  genre: media.genres || [],
  episodes: media.episodes,
  score: media.averageScore ? media.averageScore / 10 : null, // AniList uses 0-100, normalize to 0-10 like MAL
  synopsis: media.description ? media.description.replace(/<[^>]*>/g, "") : null, // strip HTML tags AniList includes
  poster: media.coverImage?.large || null,
});

const MEDIA_FIELDS = `
  id
  title { romaji english }
  genres
  episodes
  averageScore
  description
  coverImage { large }
`;

export const getPopularAnime = async (page = 1) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistRequest(query, { page });
  return data.Page.media.map(formatAnime);
};

export const searchAnime = async (query, page = 1) => {
  const gqlQuery = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, search: $search) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await anilistRequest(gqlQuery, { search: query, page });
  return data.Page.media.map(formatAnime);
};

// bannerImage and studios only exist on the detail query, not the
// popular/search list queries above, so they get their own field set
const DETAIL_MEDIA_FIELDS = `
  ${MEDIA_FIELDS}
  duration
  status
  startDate { year month day }
  bannerImage
  studios {
    edges {
      isMain
      node { name }
    }
  }
  characters(sort: ROLE, perPage: 10) {
    edges {
      role
      node { name { full } image { medium } }
      voiceActors(language: JAPANESE, sort: RELEVANCE) {
        name { full }
        image { medium }
      }
    }
  }
`;

// Renamed "score" to "rating" (movie/TV detail responses use "rating" too)
// so the frontend never needs an item.rating || item.score fallback
const formatAnimeDetails = (media) => ({
  id: media.id,
  title: media.title.english || media.title.romaji,
  genres: media.genres || [],
  episodes: media.episodes,
  duration: media.duration,
  status: media.status,
  rating: media.averageScore ? media.averageScore / 10 : null,
  description: media.description ? media.description.replace(/<[^>]*>/g, "") : null,
  poster: media.coverImage?.large || null,
  backdrop: media.bannerImage || null,
  studio: media.studios?.edges?.find((e) => e.isMain)?.node?.name ?? null,
  // AniList's characters.edges is already sorted by role, so we can just filter for MAIN and map to the same shape as TMDB's credits.cast for a single renderer on the frontend
  cast: (media.characters?.edges || [])
    .filter((e) => e.role === "MAIN" && e.voiceActors?.[0])
    .map((e) => ({
      name: e.voiceActors[0].name.full,
      role: e.node.name.full,
      photo: e.voiceActors[0].image?.medium || null,
    })),
});

// GET a single anime's full details. AniList returns Media: null (HTTP 200)
// for an unknown id rather than an HTTP error, so the caller must check for null.
export const getAnimeDetails = async (id) => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${DETAIL_MEDIA_FIELDS}
      }
    }
  `;
  const data = await anilistRequest(query, { id: Number(id) });
  return data.Media ? formatAnimeDetails(data.Media) : null;
};