export const normalizeYoutubeTrailerUrl = (input) => {
  if (!input) return input;
  if (input.includes("youtube.com/embed/")) return input;
  if (!input.startsWith("http")) {
    return `https://www.youtube.com/embed/${input.trim()}`;
  }
  try {
    const url = new URL(input);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    const v = url.searchParams.get("v");
    if (v) {
      return `https://www.youtube.com/embed/${v}`;
    }
    if (url.pathname.includes("/embed/")) {
      return input;
    }
  } catch {
    return `https://www.youtube.com/embed/${input}`;
  }

  return input;
};
