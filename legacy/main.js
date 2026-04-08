import { 
  auth, db, storage, googleProvider, 
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, 
  collection, addDoc, query, where, getDocs, orderBy, 
  ref, uploadBytes, getDownloadURL 
} from './firebase.js';

// ==========================================
// EcoTrip Intelligence - Live Data Engine
// ==========================================

lucide.createIcons();

// --- Firebase Auth Logic ---
let currentUser = null;
const authUnlogged = document.getElementById('auth-unlogged');
const authLogged = document.getElementById('auth-logged');
const authModal = document.getElementById('auth-modal');
const authError = document.getElementById('auth-error');
const userDisplayName = document.getElementById('user-display-name');

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        if(authUnlogged) authUnlogged.classList.add('hidden');
        if(authLogged) authLogged.classList.remove('hidden');
        if(userDisplayName) userDisplayName.textContent = user.displayName || user.email.split('@')[0];
        if(authModal) authModal.classList.add('hidden');
    } else {
        if(authUnlogged) authUnlogged.classList.remove('hidden');
        if(authLogged) authLogged.classList.add('hidden');
    }
});

document.getElementById('nav-btn-login')?.addEventListener('click', () => { authModal.classList.remove('hidden'); });
document.getElementById('close-auth-modal')?.addEventListener('click', () => { authModal.classList.add('hidden'); });
document.getElementById('nav-btn-logout')?.addEventListener('click', () => { signOut(auth); });

// Privacy Modal
const privacyModal = document.getElementById('privacy-modal');
document.getElementById('footer-privacy-link')?.addEventListener('click', (e) => { e.preventDefault(); privacyModal.classList.remove('hidden'); });
document.getElementById('auth-privacy-link-inline')?.addEventListener('click', (e) => { e.preventDefault(); privacyModal.classList.remove('hidden'); });
document.getElementById('close-privacy-modal')?.addEventListener('click', () => { privacyModal.classList.add('hidden'); });

// Login UI Switch
let authMode = 'login';
const btnEmailAuth = document.getElementById('btn-email-auth');
const authToggleMode = document.getElementById('auth-toggle-mode');
const authTitle = document.getElementById('auth-modal-title');

authToggleMode?.addEventListener('click', (e) => {
    e.preventDefault();
    if(authMode === 'login') {
        authMode = 'signup';
        authTitle.textContent = 'Create Account';
        btnEmailAuth.textContent = 'Sign Up';
        authToggleMode.textContent = 'Already have an account? Sign In';
    } else {
        authMode = 'login';
        authTitle.textContent = 'Sign In';
        btnEmailAuth.textContent = 'Sign In';
        authToggleMode.textContent = 'Need an account? Sign Up';
    }
    if(authError) authError.classList.add('hidden');
});

// Auth Handlers
document.getElementById('btn-google-login')?.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        if(authError) { authError.textContent = err.message; authError.classList.remove('hidden'); }
    }
});

btnEmailAuth?.addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const pwd = document.getElementById('auth-password').value;
    if(!email || !pwd) return;
    try {
        if(authMode === 'login') {
            await signInWithEmailAndPassword(auth, email, pwd);
        } else {
            await createUserWithEmailAndPassword(auth, email, pwd);
        }
    } catch (err) {
        if(authError) { authError.textContent = err.message; authError.classList.remove('hidden'); }
    }
});

// --- 1. Map Initialization (OSM Default + NASA GIBS) ---
const map = L.map('preview-map', { scrollWheelZoom: false }).setView([48.8, 12.0], 4);

const osmBase = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© OpenStreetMap contributors'
}).addTo(map);

let currentDate = 'current';

const satelliteBase = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', {
    maxZoom: 9, time: currentDate, attribution: 'Imagery by NASA GIBS'
});

const darkBase = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 18, attribution: 'CartoDB'
});

const fireOverlay = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Thermal_Anomalies_All/default/{time}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png', {
    maxZoom: 8, time: currentDate, opacity: 0.8
});

const ndviOverlay = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png', {
    maxZoom: 9, time: currentDate, opacity: 0.75, attribution: 'NASA GIBS/Copernicus Proxy'
});

const carbonOverlay = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_DayNightBand_ENCC/default/{time}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png', {
    maxZoom: 8, time: currentDate, opacity: 0.85, attribution: 'NASA GIBS/Emissions Proxy'
});

const baseMaps = {
    "Street Map (OSM)": osmBase,
    "Satellite Base": satelliteBase,
    "Dark Mode Base": darkBase
};

const overlayMaps = {
    "NDVI Vegetation Greenness": ndviOverlay,
    "Carbon/Emissions Proxy": carbonOverlay,
    "Active Fires (Thermal)": fireOverlay
};

L.control.layers(baseMaps, overlayMaps, {position: 'topleft'}).addTo(map);

const legendNDVI = document.getElementById('legend-ndvi');
const legendCarbon = document.getElementById('legend-carbon');

map.on('overlayadd', function(e) {
    if (e.name === "NDVI Vegetation Greenness") legendNDVI.classList.remove('hidden');
    if (e.name === "Carbon/Emissions Proxy") legendCarbon.classList.remove('hidden');
});
map.on('overlayremove', function(e) {
    if (e.name === "NDVI Vegetation Greenness") legendNDVI.classList.add('hidden');
    if (e.name === "Carbon/Emissions Proxy") legendCarbon.classList.add('hidden');
});

// Date Selector
document.getElementById('sat-date').addEventListener('change', (e) => {
    currentDate = e.target.value || 'current';
    satelliteBase.options.time = currentDate; satelliteBase.redraw();
    fireOverlay.options.time = currentDate; fireOverlay.redraw();
    ndviOverlay.options.time = currentDate; ndviOverlay.redraw();
    carbonOverlay.options.time = currentDate; carbonOverlay.redraw();
});

let currentMarker = null;

// --- 2. Live Geocoding & Weather Engine ---
const searchInput = document.getElementById('euro-search');
const searchError = document.getElementById('search-error');
let currentDestinationName = null;
let currentDestinationLat = 0;
let currentDestinationLng = 0;

const assistantEmpty = document.getElementById('assistant-empty');
const assistantFilled = document.getElementById('assistant-filled');

searchInput.addEventListener('keypress', async function(e) {
    if (e.key === 'Enter') {
        const query = this.value.trim();
        if(!query) return;
        
        searchError.classList.add('hidden');
        document.getElementById('autocomplete-list').classList.add('hidden');
        
        try {
            // Fetch live coordinates bounded roughly to Europe
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=-25,35,45,71&bounded=1&limit=1`;
            const geoRes = await fetch(geocodeUrl);
            const geoData = await geoRes.json();
            
            if(geoData.length === 0) {
                searchError.textContent = "Location not found in Europe. Please try another place.";
                searchError.classList.remove('hidden');
                return;
            }

            const lat = parseFloat(geoData[0].lat);
            const lng = parseFloat(geoData[0].lon);
            const placeName = geoData[0].name || query;

            // Fetch live Copernicus/ECMWF Weather Data
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,cloud_cover_mean&timezone=auto`;
            const weatherRes = await fetch(weatherUrl);
            const weatherData = await weatherRes.json();

            triggerAssistantUpdate(placeName, lat, lng, weatherData, geoData[0].type);

        } catch(err) {
            console.error(err);
            searchError.textContent = "Network error fetching data. Please try again later.";
            searchError.classList.remove('hidden');
        }
    }
});

// --- 3. Dashboard Data Binding ---
function triggerAssistantUpdate(name, lat, lng, weather, placeType) {
    currentDestinationName = name;
    currentDestinationLat = lat;
    currentDestinationLng = lng;
    assistantEmpty.classList.add('hidden');
    assistantFilled.classList.remove('hidden');
    
    // Zoom map (City vs Region)
    const zoomLevel = (placeType === 'city' || placeType === 'town') ? 11 : 8;
    map.flyTo([lat, lng], zoomLevel, { duration: 2 });
    if(currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
        
    document.getElementById('card-dest-name').textContent = name;
    document.getElementById('upload-dest-name').textContent = name;

    // Build ECMWF Weather Dashboard
    const daily = weather.daily;
    const weatherGrid = document.getElementById('weather-forecast-grid');
    weatherGrid.innerHTML = '';
    
    for(let i=0; i<3; i++) {
        const dayDate = new Date(daily.time[i]);
        const dayLabel = i === 0 ? "Today" : dayDate.toLocaleDateString('en-US', {weekday:'short'});
        const maxT = Math.round(daily.temperature_2m_max[i]);
        const precip = daily.precipitation_probability_max[i];
        
        let icon = "sun";
        if(daily.cloud_cover_mean[i] > 40) icon = "cloud";
        if(precip > 50) icon = "cloud-rain";

        weatherGrid.innerHTML += `
            <div class="weather-card">
                <h5>${dayLabel}</h5>
                <i data-lucide="${icon}"></i>
                <div class="temp">${maxT}°C</div>
                <div class="precip"><i data-lucide="droplet" style="width:12px; height:12px;"></i> ${precip}%</div>
            </div>
        `;
    }

    // AI Weather Hint Logic
    const tCover = daily.cloud_cover_mean[0];
    const tRain = daily.precipitation_probability_max[0];
    const tTemp = daily.temperature_2m_max[0];
    const tMin = daily.temperature_2m_min[0];
    const wSpeed = daily.wind_speed_10m_max[0];
    let hint = "Mild conditions – great for general tourism and city exploration.";
    
    if(tRain > 50) hint = "High chance of rain – bring waterproof gear and plan indoor activities.";
    else if(tCover < 30 && tTemp > 25) hint = "Clear skies and high heat – great for beaches, stay hydrated.";
    else if(tCover < 40 && tTemp <= 25) hint = "Good visibility and mild temps – ideal conditions for hiking and photos.";
    else if(tCover > 70) hint = "High cloud cover – expect overcast skies and mixed lighting.";
    
    document.getElementById('weather-hint-text').textContent = hint;

    // Simulate Overall Score
    let overallScore = 85;
    if(tRain > 50) overallScore -= 20;
    if(tTemp > 35 || tTemp < 0) overallScore -= 10;
    
    document.getElementById('card-score').textContent = overallScore;
    let scoreHex = "#10b981"; 
    if(overallScore < 70) scoreHex = "#f59e0b"; 
    if(overallScore < 50) scoreHex = "#ef4444"; 
    document.querySelector('.score-circle').style.borderColor = scoreHex;
    document.querySelector('.score-circle').style.color = scoreHex;
    
    // Simulate generic properties for NDVI/Visibility
    document.getElementById('card-visibility').textContent = tCover > 50 ? "Poor - Overcast mapping" : "Clear - Great optical visibility";
    
    document.getElementById('card-ndvi').textContent = (lat < 45) ? "Moderate Greenness" : "High Greenness (Dense Coverage)";
    document.getElementById('card-ndvi').style.color = (lat < 45) ? "#f59e0b" : "var(--emerald-dark)";
    
    document.getElementById('card-carbon').textContent = placeType === 'city' ? "Medium/High carbon-intensity (Urban area)" : "Low carbon-intensity (Eco-friendly)";
    document.getElementById('card-carbon').style.color = placeType === 'city' ? "#f59e0b" : "var(--emerald-dark)";
    
    // --- Safety Alerts Engine ---
    const safetyBanner = document.getElementById('safety-alert-banner');
    const safetyText = document.getElementById('safety-alert-text');
    const safetyList = document.getElementById('card-safety');
    
    let alerts = [];
    if(tTemp > 35) alerts.push("Extreme Heat Warning (Thermal Anomaly/Fire Risk)");
    if(tMin <= 0) alerts.push("Freezing Conditions / ICE Warning");
    if(tRain > 80) alerts.push("Heavy Precipitation (Flash Flood Risk)");
    if(wSpeed > 45) alerts.push("High Wind Warning");

    if(alerts.length > 0) {
        if(safetyBanner) safetyBanner.classList.remove('hidden');
        if(safetyText) safetyText.textContent = alerts[0] + (alerts.length > 1 ? ` (+ ${alerts.length - 1} more alert${alerts.length - 1 > 1 ? 's' : ''})` : "");
        
        // Populate the bullet list
        if(safetyList) safetyList.innerHTML = alerts.map(a => `<li style="font-size:0.85rem; color:#ef4444; margin-bottom:4px;"><i data-lucide="alert-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${a}</li>`).join('');
    } else {
        if(safetyBanner) safetyBanner.classList.add('hidden');
        if(safetyList) safetyList.innerHTML = `<li style="font-size:0.85rem; color:var(--emerald-dark);"><i data-lucide="check-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Optimal conditions. No live threats detected.</li>`;
    }

    // Randomize Unsplash Placeholders
    const imgs = document.getElementById('imagery-grid').querySelectorAll('img');
    const randomSeed = Math.floor(Math.random() * 100);
    imgs.forEach((img, idx) => { 
        img.src = `https://images.unsplash.com/photo-1502691866326-d621b14ce63f?w=600&q=80&sig=${randomSeed+idx}`; // Temporary placeholder logic for dynamically generated locations
    });

    renderCommunityGallery(name);
    lucide.createIcons();
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
}

// --- 4. Tab Logic ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');

        if(btn.dataset.tab === 'map-view') {
            setTimeout(() => map.invalidateSize(), 50);
        }
    });
});

// --- 5. Community Photo Upload Logic (Firebase Database) ---
const uploadModal = document.getElementById('upload-modal');
const btnOpenUpload = document.getElementById('btn-upload-photo');
const btnCloseUpload = document.getElementById('close-modal');
const btnSubmitUpload = document.getElementById('submit-upload');

btnOpenUpload.addEventListener('click', () => {
    if(!currentUser) {
        authModal.classList.remove('hidden');
        return;
    }
    uploadModal.classList.remove('hidden')
});
btnCloseUpload.addEventListener('click', () => uploadModal.classList.add('hidden'));

btnSubmitUpload.addEventListener('click', async () => {
    if(!currentUser) return;
    
    const fileInput = document.getElementById('photo-file');
    const title = document.getElementById('photo-title').value || "Untitled Photo";
    const desc = document.getElementById('photo-desc').value;

    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please select a photo to upload.");
        return;
    }

    const file = fileInput.files[0];
    const photoId = "photo_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
    const storageRef = ref(storage, `photos/${photoId}.jpg`);

    try {
        btnSubmitUpload.textContent = "Uploading...";
        btnSubmitUpload.disabled = true;

        // 1. Upload to Storage
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        // 2. Save metadata to Firestore
        await addDoc(collection(db, "photos"), {
            destination_name: currentDestinationName,
            lat: currentDestinationLat,
            lng: currentDestinationLng,
            title: title,
            description: desc,
            userId: currentUser.uid,
            uploaderName: currentUser.displayName || "Anonymous",
            uploadTime: new Date().toISOString(),
            url: downloadUrl
        });

        uploadModal.classList.add('hidden');
        fileInput.value = "";
        document.getElementById('photo-title').value = "";
        document.getElementById('photo-desc').value = "";
        btnSubmitUpload.textContent = "Confirm Upload";
        btnSubmitUpload.disabled = false;
        
        // Refresh Gallery
        renderCommunityGallery(currentDestinationName);

    } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload photo. Please try again.");
        btnSubmitUpload.textContent = "Confirm Upload";
        btnSubmitUpload.disabled = false;
    }
});

async function renderCommunityGallery(destName) {
    const galleryContainer = document.getElementById('community-gallery');
    galleryContainer.innerHTML = '<p style="font-size:0.85rem; color:var(--earth-muted); font-style:italic;">Loading community photos...</p>';

    try {
        const q = query(
            collection(db, "photos"),
            where("destination_name", "==", destName)
        );
        const querySnapshot = await getDocs(q);
        
        galleryContainer.innerHTML = '';
        if(querySnapshot.empty) {
            galleryContainer.innerHTML = `<p style="font-size:0.85rem; color:var(--earth-muted); font-style:italic;">No user photos yet. Be the first to share!</p>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const photo = docSnap.data();
            const dateStr = new Date(photo.uploadTime).toLocaleDateString();
            
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = `
                <img src="${photo.url}" class="gallery-img" alt="${photo.title}">
                <div class="gallery-info">
                    <p class="gallery-caption" title="${photo.title}">${photo.title}</p>
                    <p class="gallery-date"><i data-lucide="clock" style="width:10px; height:10px;"></i> ${dateStr} • ${photo.uploaderName}</p>
                </div>
            `;
            galleryContainer.appendChild(card);
        });
        lucide.createIcons();
    } catch(err) {
        console.error("Fetch photos error:", err);
        galleryContainer.innerHTML = `<p style="font-size:0.85rem; color:#ef4444; font-style:italic;">Error loading images.</p>`;
    }
}
