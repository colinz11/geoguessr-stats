# 📚 GeoGuessr Stats API Documentation

## 🚀 Quick Access

| **Documentation Type** | **URL** | **Best For** |
|------------------------|---------|--------------|
| **🌐 Interactive Documentation** | [`/api/docs/interactive`](http://localhost:3000/api/docs/interactive) | **Frontend developers, testing** |
| **⚡ Quick Reference** | [`/api/docs/quick`](http://localhost:3000/api/docs/quick) | **Fast lookup, integration** |
| **📄 Complete Documentation** | [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) | **Detailed reference** |
| **🔧 JSON API Docs** | [`/api/docs`](http://localhost:3000/api/docs) | **Programmatic access** |

---

## 🎯 **START HERE: Interactive Documentation**

### **👨‍💻 For Frontend Developers**

**🌐 Visit: [`http://localhost:3000/api/docs/interactive`](http://localhost:3000/api/docs/interactive)**

This beautiful, interactive documentation includes:
- **✅ Live "Try it!" buttons** - Test endpoints directly
- **🗺️ Map visualization examples** - Perfect for interactive maps
- **📊 Data model explanations** - Understand the response structure
- **🎨 Color-coded endpoints** - Easy visual navigation
- **📱 Mobile-responsive design** - Works on all devices

---

## 📋 **Key API Endpoints for Map Development**

### **🗺️ Interactive Map Data**
```bash
GET /api/map/rounds?userId=USER_ID&limit=100
```
**Perfect for:**
- Plotting actual game locations on world maps
- Showing user guess markers with accuracy indicators  
- Drawing connection lines between actual and guess points
- Color-coding based on scores (green = high, red = low)

### **🌍 Country Performance**
```bash
GET /api/map/countries?userId=USER_ID&sortBy=accuracy
```
**Perfect for:**
- Creating country choropleth maps
- Showing accuracy percentages by country
- Displaying total rounds played per region
- Building performance heatmaps

---

## 🛠️ **Frontend Integration Examples**

### **🗺️ Leaflet.js Integration**
```javascript
// Fetch map data
const response = await fetch('/api/map/rounds?userId=USER_ID&limit=500');
const data = await response.json();

// Plot on Leaflet map
data.data.rounds.forEach(round => {
  // Actual location (green marker)
  L.marker([round.actual_lat, round.actual_lng], {
    icon: greenIcon
  }).addTo(map);
  
  // Guess location (red marker) 
  L.marker([round.guess_lat, round.guess_lng], {
    icon: redIcon
  }).addTo(map);
  
  // Connection line (color by score)
  L.polyline([
    [round.actual_lat, round.actual_lng],
    [round.guess_lat, round.guess_lng]
  ], {
    color: round.score > 4000 ? 'green' : 'red',
    weight: 2
  }).addTo(map);
});
```

### **🌍 Country Choropleth**
```javascript
// Fetch country performance
const response = await fetch('/api/map/countries?userId=USER_ID');
const countries = await response.json();

// Color countries by accuracy
countries.data.forEach(country => {
  const color = getColorByAccuracy(country.accuracy);
  colorCountryOnMap(country.country_code, color);
});
```

---

## 📊 **Available Documentation Formats**

### **1. 🌐 Interactive HTML Documentation**
- **URL:** `/api/docs/interactive`
- **Features:** Live testing, examples, visual design
- **Best for:** Frontend developers, API exploration

### **2. ⚡ Quick Reference JSON**
- **URL:** `/api/docs/quick`  
- **Features:** Common use cases, cURL examples
- **Best for:** Fast integration, quick lookup

### **3. 📄 Complete Markdown Documentation**
- **File:** `docs/API_DOCUMENTATION.md`
- **Features:** Comprehensive reference, examples
- **Best for:** Detailed study, documentation

### **4. 🔧 Structured JSON Documentation**
- **URL:** `/api/docs`
- **Features:** Complete API specification
- **Best for:** Programmatic access, tooling

---

## 🎯 **Common Use Cases & Examples**

### **🗺️ Building Interactive Maps**

**1. Get Map Visualization Data:**
```bash
curl "http://localhost:3000/api/map/rounds?userId=USER_ID&limit=500"
```

**2. Filter High-Scoring Rounds:**
```bash
curl "http://localhost:3000/api/map/rounds?userId=USER_ID&minScore=4000"
```

**3. Focus on Specific Countries:**
```bash
curl "http://localhost:3000/api/map/rounds?userId=USER_ID&countries=us,gb,de"
```

### **📊 Performance Analysis**

**4. Get Country Statistics:**
```bash
curl "http://localhost:3000/api/map/countries?userId=USER_ID&sortBy=accuracy"
```

**5. Time-Based Analysis:**
```bash
curl "http://localhost:3000/api/map/rounds?userId=USER_ID&startDate=2024-01-01&endDate=2024-01-31"
```

---

## 🔍 **Data Models Quick Reference**

### **🎯 Round Data (for Interactive Maps)**
```typescript
{
  round_number: number;        // 1-5
  actual_lat: number;         // Actual location (-90 to 90)
  actual_lng: number;         // Actual location (-180 to 180)
  guess_lat: number;          // User guess (-90 to 90)  
  guess_lng: number;          // User guess (-180 to 180)
  score: number;              // Round score (0-5000)
  distance_km: number;        // Distance between actual and guess
  actual_country_code: string; // ISO country code
  is_correct_country: boolean; // Whether country guess was correct
  game: {
    map_name: string;         // Map name
    game_mode: string;        // Game mode
    played_at: string;        // Game timestamp
  }
}
```

### **🌍 Country Performance (for Choropleth)**
```typescript
{
  country_code: string;       // ISO country code
  totalRounds: number;        // Total rounds in this country
  accuracy: number;           // Accuracy percentage (0-100)
  avgScore: number;           // Average score
  perfectScores: number;      // Number of 5000-point rounds
  avgDistance: number;        // Average distance in km
}
```

---

## 🚦 **Quick Start Guide**

### **1. Check API Status**
```bash
curl http://localhost:3000/health
```

### **2. View API Overview** 
```bash
curl http://localhost:3000/api
```

### **3. Open Interactive Documentation**
```bash
# In your browser:
http://localhost:3000/api/docs/interactive
```

### **4. Test Map Data Endpoint**
```bash
curl "http://localhost:3000/api/map/rounds?limit=5"
```

---

## 🔒 **Rate Limiting & Security**

- **Rate Limit:** 100 requests per 15 minutes per IP
- **Security:** CORS, Helmet headers, input validation
- **Error Handling:** Consistent JSON error responses
- **Status Codes:** 200 (success), 400 (bad request), 404 (not found), 500 (error)

---

## 🎨 **Map Visualization Libraries**

The API data works perfectly with:

- **🗺️ Leaflet.js** - Open-source interactive maps
- **🌍 Mapbox** - Advanced mapping platform  
- **📊 D3.js** - Custom data visualizations
- **⚛️ React Map Libraries** - react-leaflet, react-mapbox-gl
- **🎯 Google Maps** - Popular mapping service

---

## 🆘 **Support & Testing**

### **📋 Test Suite**
```bash
npm test              # Run all 43 tests
npm run test:api      # Test API endpoints only
npm run test:unit     # Test data models only
```

### **🛠️ Development**
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run lint          # Check code quality
```

### **📞 Getting Help**

1. **🌐 Interactive Docs:** [`/api/docs/interactive`](http://localhost:3000/api/docs/interactive) - Comprehensive visual guide
2. **⚡ Quick Reference:** [`/api/docs/quick`](http://localhost:3000/api/docs/quick) - Fast lookup
3. **📄 Full Documentation:** [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) - Complete reference
4. **🧪 Tests:** Run `npm test` to verify functionality

---

## 🎉 **Ready for Frontend Development!**

The API is **fully documented** and **ready for interactive map development**. Start with the [**Interactive Documentation**](http://localhost:3000/api/docs/interactive) for the best developer experience!

---

*Last Updated: January 15, 2024 | Version: 1.0.0*
