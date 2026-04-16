// ============================================
// Skye Weather App — script.js
// Uses Open-Meteo API (free, no key required)
// ============================================

// ---- DOM Refs ----
const $ = (id) => document.getElementById(id);
const searchInput = $('search-input');
const searchResults = $('search-results');
const locationBtn = $('location-btn');
const welcomeLocationBtn = $('welcome-location-btn');
const welcomeScreen = $('welcome-screen');
const loadingScreen = $('loading-screen');
const errorScreen = $('error-screen');
const errorText = $('error-text');
const retryBtn = $('retry-btn');
const weatherContent = $('weather-content');

// ---- State ----
let searchTimeout = null;
let lastCoords = null;
let lastCityName = '';

// ---- Weather Code Mapping ----
const weatherDescriptions = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm',
};

function getWeatherEmoji(code, isDay = true) {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code === 1) return isDay ? '🌤️' : '🌙';
  if (code === 2) return isDay ? '⛅' : '☁️';
  if (code === 3) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 80, 81].includes(code)) return '🌧️';
  if ([65, 66, 67, 82].includes(code)) return '🌧️';
  if ([71, 73, 77, 85].includes(code)) return '🌨️';
  if ([75, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌈';
}

// ---- Particles ----
function initParticles() {
  const container = $('bg-particles');
  const count = 20;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 3 + 1;
    const colors = [
      'rgba(91,156,246,0.3)',
      'rgba(167,139,250,0.25)',
      'rgba(246,160,91,0.2)',
      'rgba(244,114,182,0.2)',
    ];
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = Math.random() * 15 + 15 + 's';
    p.style.animationDelay = Math.random() * 15 + 's';
    container.appendChild(p);
  }
}

// ---- UI State Management ----
function showScreen(screen) {
  welcomeScreen.classList.add('hidden');
  loadingScreen.classList.remove('active');
  errorScreen.classList.add('hidden');
  weatherContent.classList.add('hidden');

  if (screen === 'welcome') welcomeScreen.classList.remove('hidden');
  if (screen === 'loading') loadingScreen.classList.add('active');
  if (screen === 'error') errorScreen.classList.remove('hidden');
  if (screen === 'weather') weatherContent.classList.remove('hidden');
}

function showError(msg) {
  errorText.textContent = msg;
  showScreen('error');
}

// ---- Geocoding (search) ----
async function searchCities(query) {
  if (!query || query.length < 2) {
    searchResults.classList.remove('active');
    searchResults.innerHTML = '';
    return;
  }
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      searchResults.innerHTML =
        '<div class="search-result-item"><span class="result-city" style="color:var(--text-secondary)">No results found</span></div>';
      searchResults.classList.add('active');
      return;
    }
    searchResults.innerHTML = data.results
      .map(
        (r) => `
        <div class="search-result-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}${r.admin1 ? ', ' + r.admin1 : ''}">
          <span class="result-city">${r.name}${r.admin1 ? ', ' + r.admin1 : ''}</span>
          <span class="result-country">${r.country || ''}</span>
        </div>`
      )
      .join('');
    searchResults.classList.add('active');

    // Attach click events
    searchResults.querySelectorAll('.search-result-item[data-lat]').forEach((item) => {
      item.addEventListener('click', () => {
        const lat = parseFloat(item.dataset.lat);
        const lon = parseFloat(item.dataset.lon);
        const name = item.dataset.name;
        searchInput.value = name;
        searchResults.classList.remove('active');
        fetchWeather(lat, lon, name);
      });
    });
  } catch {
    // Silently fail search
  }
}

// ---- Geolocation ----
function getUserLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }
  showScreen('loading');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      // Reverse geocode to get city name
      let cityName = 'Your Location';
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
        );
        const data = await res.json();
        if (data.results && data.results[0]) {
          cityName = data.results[0].name;
          if (data.results[0].admin1) cityName += ', ' + data.results[0].admin1;
        }
      } catch {
        // Use coordinates-based reverse geocode fallback
        try {
          const res2 = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data2 = await res2.json();
          if (data2.city) {
            cityName = data2.city;
            if (data2.principalSubdivision) cityName += ', ' + data2.principalSubdivision;
          }
        } catch {
          // Fallback name
        }
      }
      fetchWeather(latitude, longitude, cityName);
    },
    (err) => {
      if (err.code === 1) {
        showError('Location access denied. Please search for a city instead.');
      } else {
        showError('Unable to get your location. Please search for a city.');
      }
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

// ---- Fetch Weather ----
async function fetchWeather(lat, lon, cityName) {
  lastCoords = { lat, lon };
  lastCityName = cityName;
  showScreen('loading');

  try {
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      `current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure`,
      `hourly=temperature_2m,weather_code,is_day,visibility`,
      `daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max`,
      `temperature_unit=fahrenheit`,
      `wind_speed_unit=mph`,
      `timezone=auto`,
      `forecast_days=7`,
    ];
    const url = `https://api.open-meteo.com/v1/forecast?${params.join('&')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    renderWeather(data, cityName);
    showScreen('weather');
  } catch (err) {
    console.error(err);
    showError('Failed to fetch weather data. Please try again.');
  }
}

// ---- Render Weather ----
function renderWeather(data, cityName) {
  const c = data.current;
  const d = data.daily;
  const h = data.hourly;

  // Current
  $('city-name').textContent = cityName;
  $('current-date').textContent = formatDate(new Date());
  $('current-temp').textContent = Math.round(c.temperature_2m);
  $('current-desc').textContent = weatherDescriptions[c.weather_code] || 'Unknown';
  $('weather-icon-large').textContent = getWeatherEmoji(c.weather_code, c.is_day === 1);

  // High / Low
  $('temp-high').textContent = Math.round(d.temperature_2m_max[0]) + '°';
  $('temp-low').textContent = Math.round(d.temperature_2m_min[0]) + '°';

  // Details
  $('feels-like').textContent = Math.round(c.apparent_temperature) + '°F';
  $('humidity').textContent = c.relative_humidity_2m + '%';
  $('wind').textContent = Math.round(c.wind_speed_10m) + ' mph';
  $('uv-index').textContent = d.uv_index_max?.[0]?.toFixed(1) ?? '--';
  
  // Visibility — get current hour's value from hourly data, convert meters to miles
  const now = new Date();
  const currentHourIdx = h.time.findIndex((t) => new Date(t) >= now);
  const visMeters = currentHourIdx >= 0 ? h.visibility?.[currentHourIdx] : null;
  if (visMeters != null) {
    const visMiles = (visMeters / 1609.34).toFixed(1);
    $('visibility').textContent = visMiles + ' mi';
  } else {
    $('visibility').textContent = '-- mi';
  }

  $('pressure').textContent = Math.round(c.surface_pressure) + ' hPa';

  // Hourly (next 24 hours)
  renderHourly(h);

  // Daily
  renderDaily(d);
}

function renderHourly(h) {
  const container = $('hourly-scroll');
  const now = new Date();
  const currentHourIndex = h.time.findIndex((t) => new Date(t) >= now);
  const startIdx = Math.max(0, currentHourIndex);

  let html = '';
  for (let i = startIdx; i < startIdx + 24 && i < h.time.length; i++) {
    const dt = new Date(h.time[i]);
    const isNow = i === startIdx;
    const isDay = h.is_day?.[i] === 1;
    html += `
      <div class="hourly-item${isNow ? ' now' : ''}">
        <span class="hourly-time">${isNow ? 'Now' : formatHour(dt)}</span>
        <span class="hourly-icon">${getWeatherEmoji(h.weather_code[i], isDay)}</span>
        <span class="hourly-temp">${Math.round(h.temperature_2m[i])}°</span>
      </div>`;
  }
  container.innerHTML = html;
}

function renderDaily(d) {
  const container = $('daily-list');
  const allMin = Math.min(...d.temperature_2m_min);
  const allMax = Math.max(...d.temperature_2m_max);
  const range = allMax - allMin || 1;

  let html = '';
  for (let i = 0; i < d.time.length; i++) {
    const dt = new Date(d.time[i] + 'T00:00:00');
    const isToday = i === 0;
    const dayName = isToday ? 'Today' : formatDay(dt);
    const lo = Math.round(d.temperature_2m_min[i]);
    const hi = Math.round(d.temperature_2m_max[i]);

    // Bar position
    const left = ((d.temperature_2m_min[i] - allMin) / range) * 100;
    const width = ((d.temperature_2m_max[i] - d.temperature_2m_min[i]) / range) * 100;

    html += `
      <div class="daily-item${isToday ? ' today' : ''}">
        <span class="daily-day">${dayName}</span>
        <span class="daily-icon">${getWeatherEmoji(d.weather_code[i], true)}</span>
        <div class="daily-temp-bar">
          <div class="bar-track">
            <div class="bar-fill" style="left:${left}%;width:${Math.max(width, 8)}%"></div>
          </div>
        </div>
        <div class="daily-temps">
          <span class="daily-temp-low">${lo}°</span>
          <span class="daily-temp-high">${hi}°</span>
        </div>
      </div>`;
  }
  container.innerHTML = html;
}

// ---- Date/Time Helpers ----
function formatDate(dt) {
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatHour(dt) {
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function formatDay(dt) {
  return dt.toLocaleDateString('en-US', { weekday: 'short' });
}

// ---- Event Listeners ----
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const val = e.target.value.trim();
  searchTimeout = setTimeout(() => searchCities(val), 300);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchResults.classList.remove('active');
  }
});

// Close search results on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchResults.classList.remove('active');
  }
});

locationBtn.addEventListener('click', getUserLocation);
welcomeLocationBtn.addEventListener('click', getUserLocation);

retryBtn.addEventListener('click', () => {
  if (lastCoords) {
    fetchWeather(lastCoords.lat, lastCoords.lon, lastCityName);
  } else {
    showScreen('welcome');
  }
});

// ---- Init ----
initParticles();
showScreen('welcome');
