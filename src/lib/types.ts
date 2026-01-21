export interface Location {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
  };
}
