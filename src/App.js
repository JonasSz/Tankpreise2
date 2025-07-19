import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Vorschau from './Vorschau';
import { Search, Star } from 'lucide-react';
import './styles.css';

const App = () => {
  const API_KEY = '3146b9f7-c8ef-7806-c381-ca0a12287eff';
  const [gasstations, setGasstations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [error, setError] = useState('');

  // Favoriten aus localStorage laden
  useEffect(() => {
    const savedFav = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(savedFav);
  }, []);

  // Ortsuche mit Enter
  const handleLocationSearch = async (e) => {
    if (e.key === 'Enter') {
      setError('');
      setGasstations([]);
      setFiltered([]);
      setSearchTerm('');
      setLoading(true);

      try {
        const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: locationInput,
            format: 'json',
            addressdetails: 1,
            limit: 1,
            countrycodes: 'de',
          },
        });

        if (geoRes.data.length === 0) {
          setError('Ort nicht gefunden.');
          setLoading(false);
          return;
        }

        const { lat, lon } = geoRes.data[0];
        setLocationCoords({ lat: parseFloat(lat), lon: parseFloat(lon) });
      } catch {
        setError('Fehler bei der Ortsbestimmung.');
        setLoading(false);
      }
    }
  };

  // Lade Tankstellen bei neuen Koordinaten
  useEffect(() => {
    if (!locationCoords) return;

    const fetchStations = async () => {
      setLoading(true);
      setError('');
      try {
        const radius = 50;
        const url = `https://creativecommons.tankerkoenig.de/json/list.php?lat=${locationCoords.lat}&lng=${locationCoords.lon}&rad=${radius}&sort=dist&type=all&apikey=${API_KEY}`;

        const res = await axios.get(url);
        if (res.data.ok && res.data.stations.length > 0) {
          setGasstations(res.data.stations);
        } else {
          setGasstations([]);
          setError('Keine Tankstellen gefunden.');
        }
      } catch {
        setError('Fehler beim Laden der Tankstellen.');
      }
      setLoading(false);
    };

    fetchStations();
  }, [locationCoords]);

  // Filter bei Eingabe in Suche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFiltered([]);
      return;
    }
    const results = gasstations.filter((s) =>
      s.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.place?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(results);
  }, [searchTerm, gasstations]);

  // Günstigster E5-Preis bei allen Tankstellen
  const getLowestE5Price = () => {
    if (gasstations.length === 0) return 0;
    return gasstations.reduce(
      (min, s) => (s.e5 > 0 && s.e5 < min ? s.e5 : min),
      gasstations[0].e5 || Infinity
    );
  };
  const lowestE5 = getLowestE5Price();
  const allEqual = gasstations.every((s) => s.e5 === lowestE5);

  // Günstigster E5-Preis bei Favoriten
  const getLowestE5PriceInFavorites = () => {
    if (favorites.length === 0) return 0;
    return favorites.reduce(
      (min, s) => (s.e5 > 0 && s.e5 < min ? s.e5 : min),
      favorites[0].e5 || Infinity
    );
  };
  const lowestE5Favorite = getLowestE5PriceInFavorites();
  const allEqualFavorite = favorites.every((s) => s.e5 === lowestE5Favorite);

  const toggleFavorite = (station) => {
    const exists = favorites.find((f) => f.id === station.id);
    let updated;
    if (exists) {
      updated = favorites.filter((f) => f.id !== station.id);
    } else {
      updated = [...favorites, station];
    }
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const renderStation = (station, lowestPrice, allEqualGroup) => (
    <div
      className="station"
      key={station.id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'transform 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Vorschau
        ort={station.place}
        bezeichnung={station.brand}
        preisDiesel={station.diesel}
        preisE10={station.e10}
        preisE5={station.e5}
        isLowest={station.e5 === lowestPrice && !allEqualGroup}
      />
      <button
        className="fav-btn"
        onClick={() => toggleFavorite(station)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginLeft: 10,
        }}
        aria-label={favorites.find((f) => f.id === station.id) ? 'Favorit entfernen' : 'Als Favorit markieren'}
      >
        <Star fill={favorites.find((f) => f.id === station.id) ? '#ffcc00' : 'none'} size={24} />
      </button>
    </div>
  );

  // Modernes Styling für Inputs
  const inputStyle = {
    width: '100%',
    padding: '0.75rem 0.2rem',
    fontSize: '1rem',
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    outline: 'none',
    transition: 'box-shadow 0.3s ease',
  };

  const inputFocusStyle = {
    boxShadow: '0 0 10px 3px rgba(58, 79, 148, 0.7)',
  };

  return (
    <div
      className="app-container"
      style={{
        maxWidth: 600,
        margin: '2rem auto',
        padding: '1rem',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0f0ff 0%, #f7f9fc 100%)',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        color: '#1c1c1e',
      }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 700, fontSize: '2.5rem', textAlign: 'center', letterSpacing: '0.05em', color: '#3a4f94' }}>
          Tanken
        </h1>
      </header>

      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Ort in Baden-Württemberg eingeben (z.B. Stuttgart)"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          onKeyDown={handleLocationSearch}
          style={inputStyle}
          onFocus={e => e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow}
          onBlur={e => e.currentTarget.style.boxShadow = inputStyle.boxShadow}
        />
        <small style={{ display: 'block', marginTop: 6, color: '#555', fontSize: '0.85rem', textAlign: 'center' }}>
          Drücke Enter, um zu suchen
        </small>
      </div>

      {loading && <p style={{ textAlign: 'center' }}>Lade Tankstellen...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Tankstelle suchen (Marke oder Ort)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
          onFocus={e => e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow}
          onBlur={e => e.currentTarget.style.boxShadow = inputStyle.boxShadow}
          disabled={gasstations.length === 0}
        />
        {filtered.length > 0 && (
          <div
            className="suggestions"
            style={{
              position: 'absolute',
              top: '100%',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '0 0 12px 12px',
              maxHeight: 200,
              overflowY: 'auto',
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              zIndex: 20,
            }}
          >
            {filtered.map((station) => (
              <div
                key={station.id}
                className="suggestion-item"
                onClick={() => {
                  toggleFavorite(station);
                  setSearchTerm('');
                  setFiltered([]);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontWeight: '600',
                  color: '#3a4f94',
                }}
              >
                ⭐ {station.brand} – {station.place}
              </div>
            ))}
          </div>
        )}
      </div>

      {favorites.length > 0 ? (
        <>
          <h2 style={{ marginBottom: '1rem', color: '#3a4f94' }}>Favoriten</h2>
          {favorites.map(station => renderStation(station, lowestE5Favorite, allEqualFavorite))}
        </>
      ) : (
        <p style={{ textAlign: 'center', color: '#666' }}>
          Keine Favoriten gespeichert. Suche nach einem Ort und füge Tankstellen zu Favoriten hinzu.
        </p>
      )}
    </div>
  );
};

export default App;
