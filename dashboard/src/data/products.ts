import type { Category, PackShape, ProductRecord, SectionId } from "../types";

/**
 * Mock shelf snapshot for DGI Retail Store — 95 tracked products across 4 camera zones.
 *
 * Only raw observations live here (what a camera counts + what the POS reports).
 * Status, priority, velocity labels, alerts and KPIs are all *derived* in lib/logic.ts,
 * so the numbers on every screen stay consistent with each other.
 *
 * Columns: id, name, category, shelf, capacity, estimatedStock, normalRate (units/hr),
 *          velocity (× normal), lastDetected (min ago), lastRefill (min ago), colour, shape
 */
type Row = [string, string, Category, string, number, number, number, number, number, number, string, PackShape];

const SECTION_OF: Record<string, SectionId> = { B: "beverages", A: "snacks", C: "dairy", P: "personal" };
const CAMERA_OF: Record<SectionId, string> = { beverages: "cam-01", snacks: "cam-02", dairy: "cam-03", personal: "cam-04" };

const rows: Row[] = [
  // ── Beverage Aisle · Camera 01 ────────────────────────────────────────────
  ["bev-bisleri-1l", "Bisleri 1L", "Beverages", "B1", 36, 0, 3.0, 1.2, 3, 412, "#8fc6e8", "bottle"],
  ["bev-kinley-1l", "Kinley 1L", "Beverages", "B1", 30, 22, 2.0, 1.0, 3, 290, "#7fb3d9", "bottle"],
  ["bev-aquafina-1l", "Aquafina 1L", "Beverages", "B1", 30, 18, 1.6, 0.9, 3, 300, "#5d9fd6", "bottle"],
  ["bev-bisleri-2l", "Bisleri 2L", "Beverages", "B1", 18, 12, 1.2, 1.1, 3, 410, "#9ccde9", "jug"],
  ["bev-bisleri-500", "Bisleri 500ml", "Beverages", "B1", 48, 34, 4.0, 1.2, 3, 150, "#a7d4ee", "bottle"],
  ["bev-tropicana-1l", "Tropicana Orange 1L", "Beverages", "B2", 16, 4, 0.8, 0.9, 4, 520, "#f2a33a", "carton"],
  ["bev-real-1l", "Real Mixed Fruit 1L", "Beverages", "B2", 16, 10, 0.6, 1.0, 4, 600, "#d9534f", "carton"],
  ["bev-paperboat-250", "Paper Boat Aamras 250ml", "Beverages", "B2", 24, 15, 1.0, 1.3, 4, 240, "#f5c542", "pack"],
  ["bev-frooti-600", "Frooti 600ml", "Beverages", "B2", 30, 2, 2.5, 1.3, 4, 480, "#7cc243", "bottle"],
  ["bev-maaza-600", "Maaza 600ml", "Beverages", "B2", 30, 20, 2.2, 1.1, 4, 260, "#f0b323", "bottle"],
  ["bev-dew-500", "Mountain Dew 500ml", "Beverages", "B2", 36, 24, 2.4, 1.0, 4, 200, "#9bc53d", "bottle"],
  ["bev-7up-500", "7Up 500ml", "Beverages", "B2", 30, 19, 1.5, 0.9, 4, 330, "#4caf50", "bottle"],
  ["bev-coke-500", "Coca-Cola 500ml", "Beverages", "B3", 48, 0, 3.0, 2.8, 2, 220, "#d32f2f", "bottle"],
  ["bev-pepsi-500", "Pepsi 500ml", "Beverages", "B3", 48, 3, 4.0, 1.2, 2, 380, "#1e4fa8", "bottle"],
  ["bev-sprite-500", "Sprite 500ml", "Beverages", "B3", 40, 26, 2.5, 1.5, 2, 95, "#3fa34d", "bottle"],
  ["bev-thumsup-750", "Thums Up 750ml", "Beverages", "B3", 36, 25, 2.6, 1.3, 2, 140, "#2b2d42", "bottle"],
  ["bev-fanta-500", "Fanta Orange 500ml", "Beverages", "B3", 36, 22, 1.8, 1.0, 2, 260, "#f57c00", "bottle"],
  ["bev-limca-500", "Limca 500ml", "Beverages", "B3", 30, 17, 1.2, 0.8, 2, 410, "#c5e1a5", "bottle"],
  ["bev-coke-125", "Coca-Cola 1.25L", "Beverages", "B4", 24, 15, 1.4, 1.2, 5, 260, "#c62828", "jug"],
  ["bev-pepsi-225", "Pepsi 2.25L", "Beverages", "B4", 12, 8, 0.6, 0.9, 5, 600, "#1a3f8c", "jug"],
  ["bev-dietcoke-300", "Diet Coke 300ml Can", "Beverages", "B4", 36, 28, 1.1, 1.0, 5, 330, "#cfd2d6", "can"],
  ["bev-redbull-250", "Red Bull 250ml", "Beverages", "B4", 24, 5, 1.5, 1.6, 5, 470, "#3d5a98", "can"],
  ["bev-monster-350", "Monster Energy 350ml", "Beverages", "B4", 24, 16, 0.9, 1.2, 5, 390, "#2e3b2c", "can"],
  ["bev-sting-250", "Sting Energy 250ml", "Beverages", "B4", 30, 21, 1.4, 1.3, 5, 180, "#e53935", "can"],
  ["bev-nescafe-180", "Nescafé Cold Coffee 180ml", "Beverages", "B4", 24, 15, 0.8, 1.1, 5, 300, "#6d4c41", "can"],

  // ── Snacks, Biscuits & Instant Food · Camera 02 ───────────────────────────
  ["snk-kurkure-masala", "Kurkure Masala Munch 90g", "Snacks", "A1", 40, 0, 2.2, 1.75, 1, 350, "#f57f17", "pack"],
  ["snk-kurkure-chutney", "Kurkure Green Chutney 90g", "Snacks", "A1", 30, 18, 1.0, 1.1, 1, 350, "#43a047", "pack"],
  ["snk-bingo-mad", "Bingo Mad Angles 72g", "Snacks", "A1", 36, 8, 1.6, 1.1, 1, 520, "#e64a19", "pack"],
  ["snk-uncle-55", "Uncle Chips 55g", "Snacks", "A1", 30, 20, 0.9, 0.9, 1, 410, "#fbc02d", "pack"],
  ["snk-doritos-60", "Doritos Nacho Cheese 60g", "Snacks", "A1", 24, 15, 0.7, 1.2, 1, 400, "#c62828", "pack"],
  ["snk-pringles-107", "Pringles Original 107g", "Snacks", "A1", 18, 0, 0.4, 0.9, 1, 900, "#b71c1c", "tube"],
  ["snk-bhujia-200", "Haldiram's Aloo Bhujia 200g", "Snacks", "A1", 30, 0, 1.4, 1.8, 1, 330, "#f9a825", "pack"],
  ["snk-moongdal-200", "Haldiram's Moong Dal 200g", "Snacks", "A1", 24, 16, 0.8, 1.0, 1, 330, "#fdd835", "pack"],
  ["snk-lays-classic", "Lay's Classic Salted 52g", "Snacks", "A2", 96, 6, 5.0, 2.4, 1, 260, "#fbc02d", "pack"],
  ["snk-lays-magic", "Lay's Magic Masala 52g", "Snacks", "A2", 96, 20, 4.0, 1.2, 1, 260, "#1565c0", "pack"],
  ["snk-lays-cream", "Lay's Cream & Onion 52g", "Snacks", "A2", 72, 40, 2.6, 1.1, 1, 260, "#2e7d32", "pack"],
  ["snk-act2-70", "Act II Butter Popcorn 70g", "Snacks", "A2", 24, 14, 0.6, 0.9, 1, 600, "#ffb300", "box"],
  ["snk-tooyumm-54", "Too Yumm Multigrain 54g", "Snacks", "A2", 24, 16, 0.5, 0.8, 1, 700, "#8e24aa", "pack"],
  ["snk-kitkat-37", "KitKat 4 Finger 37g", "Snacks", "A2", 48, 30, 2.0, 1.2, 1, 210, "#c62828", "bar"],
  ["snk-dairymilk-50", "Cadbury Dairy Milk 50g", "Snacks", "A2", 48, 32, 2.4, 1.1, 1, 210, "#5e35b1", "bar"],
  ["snk-5star-40", "5 Star 40g", "Snacks", "A2", 40, 27, 1.5, 1.0, 1, 210, "#f9a825", "bar"],
  ["bis-parleg-250", "Parle-G 250g", "Biscuits", "A3", 60, 4, 3.5, 1.2, 2, 480, "#fdd835", "box"],
  ["bis-goodday-200", "Britannia Good Day 200g", "Biscuits", "A3", 40, 3, 2.0, 1.3, 2, 480, "#ef6c00", "box"],
  ["bis-marie-250", "Britannia Marie Gold 250g", "Biscuits", "A3", 36, 22, 1.2, 0.9, 2, 480, "#ffca28", "box"],
  ["bis-oreo-120", "Oreo Vanilla 120g", "Biscuits", "A3", 36, 0, 1.3, 1.1, 2, 700, "#1e3a8a", "box"],
  ["bis-darkfantasy-75", "Sunfeast Dark Fantasy 75g", "Biscuits", "A3", 30, 0, 0.9, 1.3, 2, 760, "#3e2723", "box"],
  ["bis-hideseek-120", "Hide & Seek 120g", "Biscuits", "A3", 30, 19, 0.8, 1.0, 2, 480, "#4e342e", "box"],
  ["bis-bourbon-150", "Britannia Bourbon 150g", "Biscuits", "A4", 30, 18, 0.9, 1.0, 2, 540, "#5d4037", "box"],
  ["bis-momsmagic-200", "Sunfeast Mom's Magic 200g", "Biscuits", "A4", 30, 20, 0.8, 0.9, 2, 540, "#d84315", "box"],
  ["bis-monaco-120", "Monaco Classic 120g", "Biscuits", "A4", 30, 7, 1.0, 0.9, 2, 610, "#c62828", "box"],
  ["bis-krackjack-200", "Parle Krackjack 200g", "Biscuits", "A4", 30, 21, 0.7, 0.8, 2, 540, "#f57c00", "box"],
  ["bis-nutrichoice-200", "Britannia NutriChoice 200g", "Biscuits", "A4", 24, 15, 0.5, 1.0, 2, 540, "#689f38", "box"],
  ["bis-jimjam-150", "Britannia Jim Jam 150g", "Biscuits", "A4", 24, 16, 0.6, 1.1, 2, 540, "#ad1457", "box"],
  ["ins-maggi-70", "Maggi 2-Minute Noodles 70g", "Instant Food", "A5", 120, 64, 6.0, 1.9, 1, 160, "#fbc02d", "pack"],
  ["ins-maggi-280", "Maggi 4-Pack 280g", "Instant Food", "A5", 36, 6, 1.2, 1.2, 1, 520, "#f9a825", "pack"],
  ["ins-yippee-70", "Sunfeast Yippee 70g", "Instant Food", "A5", 60, 12, 1.8, 1.0, 1, 520, "#ef6c00", "pack"],
  ["ins-topramen-70", "Top Ramen Curry 70g", "Instant Food", "A5", 48, 0, 1.0, 1.1, 1, 820, "#d32f2f", "pack"],
  ["ins-knorr-soup", "Knorr Hot & Sour Soup 41g", "Instant Food", "A5", 30, 0, 0.5, 1.0, 1, 900, "#2e7d32", "pack"],
  ["ins-cupnoodles", "Nissin Cup Noodles Masala 70g", "Instant Food", "A5", 36, 22, 1.0, 1.2, 1, 380, "#e53935", "tub"],
  ["ins-chings-240", "Ching's Schezwan Noodles 240g", "Instant Food", "A5", 24, 15, 0.5, 1.0, 1, 600, "#b71c1c", "pack"],
  ["ins-mtr-upma", "MTR Rava Upma 160g", "Instant Food", "A5", 20, 13, 0.3, 0.8, 1, 900, "#00897b", "box"],
  ["ins-saffola-oats", "Saffola Masala Oats 39g", "Instant Food", "A5", 36, 24, 0.9, 1.1, 1, 420, "#f4511e", "pack"],

  // ── Dairy chiller · Camera 03 ─────────────────────────────────────────────
  ["dai-taaza-1l", "Amul Taaza 1L", "Dairy", "C1", 24, 6, 2.0, 1.0, 2, 300, "#1e88e5", "carton"],
  ["dai-taaza-500", "Amul Taaza 500ml", "Dairy", "C1", 30, 18, 2.4, 1.0, 2, 300, "#42a5f5", "carton"],
  ["dai-gold-500", "Amul Gold 500ml", "Dairy", "C1", 30, 0, 2.5, 1.7, 2, 390, "#f9a825", "carton"],
  ["dai-md-fc-500", "Mother Dairy Full Cream 500ml", "Dairy", "C1", 30, 17, 2.0, 1.1, 2, 300, "#e53935", "carton"],
  ["dai-md-toned-1l", "Mother Dairy Toned 1L", "Dairy", "C1", 20, 12, 1.2, 0.9, 2, 300, "#43a047", "carton"],
  ["dai-masti-dahi", "Amul Masti Dahi 400g", "Dairy", "C2", 20, 13, 0.9, 1.1, 3, 340, "#90caf9", "tub"],
  ["dai-md-dahi", "Mother Dairy Dahi 400g", "Dairy", "C2", 20, 4, 0.7, 0.9, 3, 600, "#e57373", "tub"],
  ["dai-buttermilk", "Amul Masti Buttermilk 200ml", "Dairy", "C2", 30, 2, 3.0, 2.2, 3, 250, "#64b5f6", "pack"],
  ["dai-kool-kesar", "Amul Kool Kesar 180ml", "Dairy", "C2", 24, 15, 1.0, 1.2, 3, 340, "#ffb74d", "bottle"],
  ["dai-epigamia", "Epigamia Greek Yogurt 90g", "Dairy", "C2", 18, 11, 0.4, 1.0, 3, 500, "#ec407a", "tub"],
  ["dai-nestle-dahi", "Nestlé a+ Dahi 400g", "Dairy", "C2", 16, 10, 0.4, 0.8, 3, 500, "#0d47a1", "tub"],
  ["dai-md-lassi", "Mother Dairy Sweet Lassi 200ml", "Dairy", "C2", 24, 15, 1.1, 1.3, 3, 340, "#ef5350", "pack"],
  ["dai-butter-100", "Amul Butter 100g", "Dairy", "C3", 30, 19, 1.2, 1.0, 2, 420, "#fdd835", "box"],
  ["dai-cheese-slices", "Amul Cheese Slices 200g", "Dairy", "C3", 18, 11, 0.4, 1.0, 2, 420, "#ffca28", "box"],
  ["dai-cheese-cubes", "Britannia Cheese Cubes 200g", "Dairy", "C3", 16, 0, 0.4, 0.8, 2, 1000, "#e53935", "box"],
  ["dai-paneer-200", "Amul Fresh Paneer 200g", "Dairy", "C3", 20, 12, 0.8, 1.2, 2, 420, "#26a69a", "box"],
  ["dai-cream-250", "Amul Fresh Cream 250ml", "Dairy", "C3", 16, 10, 0.3, 0.9, 2, 420, "#81d4fa", "carton"],

  // ── Personal Care · Camera 04 ─────────────────────────────────────────────
  ["pc-dove-soap", "Dove Cream Beauty Bar 100g", "Personal Care", "P1", 36, 8, 0.8, 1.0, 6, 900, "#e3f2fd", "bar"],
  ["pc-lux-soap", "Lux Soft Glow 150g", "Personal Care", "P1", 36, 24, 0.7, 0.9, 6, 900, "#f48fb1", "bar"],
  ["pc-dettol-soap", "Dettol Original Soap 125g", "Personal Care", "P1", 36, 22, 0.9, 1.1, 6, 900, "#2e7d32", "bar"],
  ["pc-pears-soap", "Pears Pure & Gentle 125g", "Personal Care", "P1", 24, 16, 0.4, 0.9, 6, 900, "#ff8f00", "bar"],
  ["pc-vim-bar", "Vim Dishwash Bar 300g", "Personal Care", "P1", 30, 19, 0.6, 1.0, 6, 900, "#7cb342", "bar"],
  ["pc-colgate-200", "Colgate Strong Teeth 200g", "Personal Care", "P2", 30, 2, 1.2, 1.2, 6, 700, "#d32f2f", "box"],
  ["pc-colgate-mf", "Colgate MaxFresh 150g", "Personal Care", "P2", 24, 15, 0.6, 1.0, 6, 700, "#1976d2", "box"],
  ["pc-pepsodent", "Pepsodent Germicheck 150g", "Personal Care", "P2", 24, 16, 0.4, 0.8, 6, 700, "#e53935", "box"],
  ["pc-sensodyne", "Sensodyne Fresh Mint 75g", "Personal Care", "P2", 18, 11, 0.3, 1.1, 6, 700, "#00897b", "box"],
  ["pc-clinic-plus", "Clinic Plus Shampoo 340ml", "Personal Care", "P3", 18, 4, 0.3, 0.9, 6, 1100, "#ec407a", "bottle"],
  ["pc-hns-180", "Head & Shoulders 180ml", "Personal Care", "P3", 18, 0, 0.3, 1.0, 6, 1300, "#1565c0", "bottle"],
  ["pc-dove-shampoo", "Dove Intense Repair 180ml", "Personal Care", "P3", 18, 11, 0.2, 1.0, 6, 1100, "#90a4ae", "bottle"],
  ["pc-nivea-lotion", "Nivea Body Lotion 200ml", "Personal Care", "P3", 18, 12, 0.2, 0.8, 6, 1100, "#0d47a1", "bottle"],
  ["pc-gillette-guard", "Gillette Guard Razor", "Personal Care", "P3", 30, 20, 0.4, 1.0, 6, 1100, "#1e88e5", "box"],
  ["pc-surf-1kg", "Surf Excel Easy Wash 1kg", "Personal Care", "P3", 20, 13, 0.5, 1.1, 6, 1100, "#1e40af", "pack"],
  ["pc-harpic-500", "Harpic Power Plus 500ml", "Personal Care", "P3", 20, 12, 0.3, 0.9, 6, 1100, "#1565c0", "jug"],
];

export const productRecords: ProductRecord[] = rows.map(
  ([id, name, category, shelf, shelfCapacity, estimatedStock, normalSalesRate, salesVelocity, lastDetectedMin, lastRefillMin, color, shape]) => {
    const section = SECTION_OF[shelf[0]];
    return {
      id, name, category, section, shelf, camera: CAMERA_OF[section],
      shelfCapacity, estimatedStock, normalSalesRate, salesVelocity,
      lastDetectedMin, lastRefillMin, color, shape,
    };
  },
);
