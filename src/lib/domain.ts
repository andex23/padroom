import { z } from "zod";
export const categories = [
  "Consoles",
  "Controllers",
  "Games",
  "Accessories",
] as const;
export const conditions = ["New", "Used", "Open-box", "For-parts"] as const;
export const cities = [
  "Lagos",
  "Abuja",
  "Ibadan",
  "Port Harcourt",
  "Benin City",
  "Enugu",
  "Kano",
  "Kaduna",
  "Abeokuta",
  "Ilorin",
  "Jos",
  "Uyo",
  "Owerri",
  "Warri",
  "Calabar",
] as const;
export function toKobo(value: string) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value))
    throw new Error("Enter a price with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (result < 100 || result > 5_000_000_000)
    throw new Error("Price must be between ₦1 and ₦50,000,000.");
  return result;
}
export const listingInput = z.object({
  title: z.string().trim().min(5).max(120),
  brand: z.string().trim().max(60),
  model: z.string().trim().max(80),
  category: z.enum(categories),
  condition: z.enum(conditions),
  city: z.enum(cities),
  price: z.string().transform(toKobo),
  description: z.string().trim().min(20).max(5000),
  defects: z.string().trim().min(2).max(1000),
  included_items: z.string().trim().min(2).max(1000),
});
export const profileInput = z.object({
  display_name: z.string().trim().min(2).max(60),
  city: z.enum(cities),
});
export const uuid = z.string().uuid();
export const bodyInput = z.string().trim().min(1).max(2000);
export function money(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: kobo % 100 ? 2 : 0,
  }).format(kobo / 100);
}
export function safeNext(value: string | null) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/";
}
export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  condition: string;
  city: string;
  price_kobo: number;
  description: string;
  defects: string;
  included_items: string;
  status: string;
  review_reason: string | null;
  created_at: string;
  listing_images?: { id: string; storage_path: string; position: number }[];
};
