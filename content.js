function collectVideoCandidatesFromVideoElement(videoElement) {
  const candidates = [];
  if (videoElement.src) {
    candidates.push(videoElement.src);
  }
  const sourceElements = videoElement.querySelectorAll("source[src]");
  sourceElements.forEach(function (source) {
    candidates.push(source.getAttribute("src"));
  });
  return candidates;
}

function extractVideoUrls() {
  const urls = [];
  const videos = document.querySelectorAll("video");
  videos.forEach(function (video) {
    collectVideoCandidatesFromVideoElement(video).forEach(function (u) {
      urls.push(u);
    });
  });

  // Some sites load video into iframes or custom containers; also scan common attributes
  const selectors = [
    'source[type="video/mp4"][src]',
    'a[href$=".mp4"]',
    'a[href*=".mp4?"]'
  ];
  document.querySelectorAll(selectors.join(",")).forEach(function (el) {
    const href = el.getAttribute("src") || el.getAttribute("href");
    if (href) urls.push(href);
  });

  // Normalize absolute URLs
  const absoluteUrls = urls
    .map(function (u) {
      try {
        return new URL(u, location.href).toString();
      } catch (e) {
        return null;
      }
    })
    .filter(function (u) { return !!u; });

  // Dedupe while preserving order
  const seen = new Set();
  const unique = [];
  absoluteUrls.forEach(function (u) {
    if (!seen.has(u)) {
      seen.add(u);
      unique.push(u);
    }
  });

  return unique;
}

function filenameFromUrl(urlString) {
  try {
    const url = new URL(urlString);
    const pathname = url.pathname.split("/").filter(Boolean);
    const last = pathname[pathname.length - 1] || "video.mp4";
    return last.includes(".") ? last : last + ".mp4";
  } catch (e) {
    return "video.mp4";
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "extractVideoUrls") {
    const videoUrls = extractVideoUrls();
    const items = videoUrls.map(function (url) {
      return { url: url, filename: filenameFromUrl(url) };
    });
    sendResponse({ videoUrls: items });
  }
});
