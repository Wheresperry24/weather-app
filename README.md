# ☀️ Skye — Weather App

A beautiful, modern weather application built with vanilla HTML, CSS, and JavaScript. Features a glassmorphism dark-mode UI with real-time weather data powered by the [Open-Meteo API](https://open-meteo.com/) (free, no API key required).

![Skye Weather App](https://img.shields.io/badge/status-live-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- **City Search** — Search any city worldwide with live autocomplete results via Open-Meteo's geocoding API
- **Geolocation** — One-click access to weather at your current location
- **Current Conditions** — Temperature, feels-like, weather description, and animated weather icons
- **Detail Cards** — Humidity, wind speed, UV index, visibility, and barometric pressure
- **Hourly Forecast** — Scrollable 24-hour forecast with temperature and weather icons
- **7-Day Forecast** — Daily high/low temperatures with visual temperature range bars
- **Responsive Design** — Fully responsive layout that works on desktop, tablet, and mobile
- **Animated UI** — Floating background particles, hover effects, and smooth transitions

## 🛠️ Tech Stack

| Layer     | Technology                                                     |
| --------- | -------------------------------------------------------------- |
| Structure | HTML5 with semantic elements                                   |
| Styling   | Vanilla CSS (glassmorphism, CSS Grid, custom properties)       |
| Logic     | Vanilla JavaScript (ES6+, Fetch API)                           |
| API       | [Open-Meteo](https://open-meteo.com/) — free, no key required  |
| Fonts     | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

## 🚀 Getting Started

### Quick Start

Simply open `index.html` in your browser — no build step or dependencies required.

```bash
# Clone the repo
git clone https://github.com/Wheresperry24/weather-app.git
cd weather-app

# Open directly
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

### Local Development Server (optional)

For a better development experience, serve the files with any static server:

```bash
# Using npx (Node.js required)
npx -y http-server . -p 8080

# Then open http://localhost:8080
```

## 📁 Project Structure

```
weather-app/
├── index.html    # App structure and semantic HTML
├── style.css     # Design system, layout, animations, and responsive styles
├── script.js     # API integration, rendering logic, and event handling
└── README.md     # This file
```

## 🌐 API Reference

This app uses two Open-Meteo endpoints (both free and keyless):

| Endpoint | Purpose |
| -------- | ------- |
| `geocoding-api.open-meteo.com/v1/search` | City name → latitude/longitude |
| `api.open-meteo.com/v1/forecast` | Weather forecast data (current, hourly, daily) |

### Data Points Used

- **Current**: temperature, feels-like, humidity, wind speed, pressure, weather code
- **Hourly**: temperature, weather code, day/night flag, visibility
- **Daily**: high/low temperature, UV index, weather code

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).
