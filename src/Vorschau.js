import React from 'react';
import './Vorschau.css';

function Vorschau({ ort, bezeichnung, preisE5, preisE10, preisDiesel, isLowest }) {
  return (
    <div className="vorschau">
      <div className="vorschau-details">
        <h1>{ort}</h1>
        <h2>{bezeichnung}</h2>
      </div>
      <div className="vorschau-preise">
        <div className="vorschau-e5">
          <h2>E5</h2>
          <h1 style={{ color: isLowest ? '#3a4f94' : 'inherit' }}>{preisE5 ?? '-'}</h1>
        </div>
        <div className="vorschau-e10">
          <h2>E10</h2>
          <h1>{preisE10 ?? '-'}</h1>
        </div>
        <div className="vorschau-diesel">
          <h2>Diesel</h2>
          <h1>{preisDiesel ?? '-'}</h1>
        </div>
      </div>
    </div>
  );
}

export default Vorschau;
