import type { Camera, Section } from "../types";

export const cameras: Camera[] = [
  { id: "cam-01", label: "Camera 01", name: "Beverage Aisle", section: "beverages", racks: ["B1", "B2", "B3", "B4"], resolution: "1080p", fps: 15, status: "connected" },
  { id: "cam-02", label: "Camera 02", name: "Snacks", section: "snacks", racks: ["A1", "A2", "A3", "A4", "A5"], resolution: "1080p", fps: 15, status: "connected" },
  { id: "cam-03", label: "Camera 03", name: "Dairy", section: "dairy", racks: ["C1", "C2", "C3"], resolution: "720p", fps: 12, status: "connected" },
  { id: "cam-04", label: "Camera 04", name: "Personal Care", section: "personal", racks: ["P1", "P2", "P3"], resolution: "1080p", fps: 15, status: "connected" },
];

export const sections: Section[] = [
  { id: "beverages", name: "Beverages", camera: "cam-01" },
  { id: "snacks", name: "Snacks", camera: "cam-02" },
  { id: "dairy", name: "Dairy", camera: "cam-03" },
  { id: "personal", name: "Personal Care", camera: "cam-04" },
];

export const rackNames: Record<string, string> = {
  B1: "Water", B2: "Juices & soft drinks", B3: "Colas & sodas", B4: "Large packs & energy",
  A1: "Chips & namkeen", A2: "Chips & chocolates", A3: "Biscuits", A4: "Biscuits & cookies", A5: "Instant food",
  C1: "Milk", C2: "Curd & drinks", C3: "Butter, cheese & paneer",
  P1: "Soaps", P2: "Oral care", P3: "Hair & home care",
};
