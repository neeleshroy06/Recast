/**
 * Universal map deep links — no API keys. Opens the user’s installed Maps app on mobile when possible.
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */

/** Directions in Google Maps; user chooses start (current location, etc.). */
export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

/** Search for pharmacies near a U.S. ZIP — Google’s own POI layer; good overview before picking one place. */
export function googleMapsPharmaciesNearZip(zip: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pharmacies near ${zip}`)}`;
}

/** Apple Maps — opens Maps on iOS/macOS; handy second option alongside Google. */
export function appleMapsUrl(lat: number, lng: number, label: string): string {
  return `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`;
}
