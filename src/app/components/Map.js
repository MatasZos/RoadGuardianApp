"use client";

import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = { lat: 40.73061, lng: -73.935242 }; 

export default function Map({ lat = defaultCenter.lat, lng = defaultCenter.lng }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={{ lat, lng }} zoom={12}>
      <Marker position={{ lat, lng }} />
    </GoogleMap>
  );
}
