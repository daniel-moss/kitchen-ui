// Demo data for the New-location form.

// The label pool — the Figma "Labels" select list demo values (doc file
// XBFKW2ThcuVxPbQQHw1XY2, "Empty / Desktop").
export const LABEL_POOL = [
  "Active",
  "New",
  "Pending onboarding",
  "Premium",
  "Third-party billing",
  "Contracted",
  "Inactive",
  "Suspended",
  "Standard",
  "Trial",
  "Walk-in / One-time",
  "Warranty-covered",
];

// Mock Google-Places suggestions — the real Places API is NOT wired in the
// prototype; typing filters this fixed pool ("Fill-in Address" doc behavior).
export interface AddressSuggestion {
  street: string;
  city: string;
  state: string;
  postal: string;
}

export const ADDRESS_SUGGESTIONS: AddressSuggestion[] = [
  { street: "123 Main Street", city: "San Francisco", state: "CA", postal: "94105" },
  { street: "800 Market Street", city: "San Francisco", state: "CA", postal: "94102" },
  { street: "2411 Mission Street", city: "San Francisco", state: "CA", postal: "94110" },
  { street: "901 Broadway", city: "Oakland", state: "CA", postal: "94607" },
  { street: "2180 Shattuck Avenue", city: "Berkeley", state: "CA", postal: "94704" },
];

export const suggestionLabel = (s: AddressSuggestion) => `${s.street}, ${s.city}, ${s.state} ${s.postal}`;
