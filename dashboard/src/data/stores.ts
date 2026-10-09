export interface StoreOption { id: string; name: string; detail: string; connected: boolean }

export const stores: StoreOption[] = [
  { id: "dgi-main", name: "DGI Retail Store", detail: "4 cameras connected", connected: true },
  { id: "dgi-express-2", name: "DGI Express, Store 2", detail: "Camera setup pending", connected: false },
  { id: "dgi-express-3", name: "DGI Express, Store 3", detail: "Camera setup pending", connected: false },
];

export const staff = ["Ravi", "Priya", "Arjun", "Meena"];
