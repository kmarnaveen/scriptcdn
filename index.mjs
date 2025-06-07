console.log("🔄 Advanced Analytics script initiated");

let startTime = Date.now();
let activeTime = 0;
let lastActive = Date.now();
let idleThreshold = 30000; // 30s
let idleTimer;
let clickCount = 0;
let visibilityChanges = [];
let exitIntent = false;
let ipData = {};
let geoData = {};

function resetIdleTimer() {
  clearTimeout(idleTimer);
  lastActive = Date.now();
  idleTimer = setTimeout(() => {
    activeTime += Date.now() - lastActive;
  }, idleThreshold);
}

// Track user activity
["mousemove", "keydown", "scroll", "click"].forEach(evt =>
  document.addEventListener(evt, resetIdleTimer)
);

// Click count
document.addEventListener("click", () => clickCount++);

// Page visibility
document.addEventListener("visibilitychange", () => {
  visibilityChanges.push({ time: Date.now(), state: document.visibilityState });
});

// Exit intent (desktop)
document.addEventListener("mouseout", e => {
  if (e.clientY < 0) exitIntent = true;
});

// Session ID
function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

// Token
function getUserToken() {
  return localStorage.getItem("user_token") || getCookie("user_token");
}

// Cookie fetch
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// First visit timestamp
function getFirstVisit() {
  let firstVisit = localStorage.getItem("first_visit");
  if (!firstVisit) {
    firstVisit = new Date().toISOString();
    localStorage.setItem("first_visit", firstVisit);
  }
  return firstVisit;
}

// Visit count
function getVisitCount() {
  const visits = parseInt(localStorage.getItem("visit_count") || "0", 10) + 1;
  localStorage.setItem("visit_count", visits);
  return visits;
}

// Scroll % depth
function getScrollDepth() {
  const scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  return (scrollHeight > 0) ? (scrollTop / scrollHeight).toFixed(2) : 0;
}

// Device/OS info
function getDeviceDetails() {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const vendor = navigator.vendor;
  return {
    userAgent: ua,
    platform,
    vendor,
    deviceMemory: navigator.deviceMemory || "unknown",
    hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
    maxTouchPoints: navigator.maxTouchPoints || "unknown",
  };
}

// Display info
function getDisplayDetails() {
  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    orientation: screen.orientation?.type || "unknown",
  };
}

// GeoLocation from browser
function tryBrowserGeoLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve({})
    );
  });
}

// Fetch IP + location via IP API
async function fetchIPAndGeo() {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    ipData = await ipRes.json();

    const geoRes = await fetch("https://ipapi.co/json/");
    geoData = await geoRes.json();
  } catch (err) {
    console.warn("⚠️ Failed to fetch IP/Geo:", err);
  }
}

// Build final payload
function buildAnalyticsData() {
  const now = Date.now();
  const timeSpent = (now - startTime) / 1000;

  if (Date.now() - lastActive < idleThreshold) {
    activeTime += now - lastActive;
  }

  return {
    session_id: getOrCreateSessionId(),
    token: getUserToken(),
    isLoggedIn: !!getUserToken(),
    url: window.location.href,
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
    queryParams: Object.fromEntries(new URLSearchParams(location.search)),
    firstVisit: getFirstVisit(),
    visitCount: getVisitCount(),
    timeSpent: Number(timeSpent.toFixed(2)),
    activeTime: Number((activeTime / 1000).toFixed(2)),
    scrollDepth: getScrollDepth(),
    clickCount,
    exitIntent,
    visibilityChanges,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    connection: navigator.connection?.effectiveType || "unknown",
    ...getDeviceDetails(),
    ...getDisplayDetails(),
    ip: ipData.ip || "unknown",
    geo: geoData.city
      ? {
          ipCountry: geoData.country_name,
          ipRegion: geoData.region,
          ipCity: geoData.city,
          ipLat: geoData.latitude,
          ipLon: geoData.longitude,
        }
      : geoData,
  };
}

// Final logger
async function logAnalyticsData() {
  await fetchIPAndGeo();
  const geo = await tryBrowserGeoLocation();
  if (geo.lat) {
    geoData.browserLocation = geo;
  }

  const data = buildAnalyticsData();
  console.log("📦 Final Analytics Data:", data);
}

// Log on unload or pagehide
window.addEventListener("beforeunload", logAnalyticsData);
window.addEventListener("pagehide", logAnalyticsData);
