export const SHIPPING_COUNTRIES = ["India"] as const;

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export function isValidIndianState(value: string): boolean {
  return (INDIAN_STATES as readonly string[]).includes(value.trim());
}

/** Compose the structured address fields into a single formatted block. */
export function composeAddress(parts: {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}): string {
  const line1 = parts.addressLine1.trim();
  const line2 = parts.addressLine2?.trim() ?? "";
  const cityState = [parts.city.trim(), parts.state.trim()].filter(Boolean).join(", ");
  const cityStatePin = [cityState, parts.pinCode.trim()].filter(Boolean).join(" - ");
  return [line1, line2, cityStatePin, parts.country.trim()].filter(Boolean).join("\n");
}
