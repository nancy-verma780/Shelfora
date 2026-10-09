# Shelfora — See the shelf. Know what to refill.

Retail shelf-intelligence prototype: existing CCTV → product detection → stock & sales-velocity analysis → refill priority → manager action.

## Run
npm install
npm run dev      # local dev server
npm run build    # type-check + single-file build in dist/index.html

## Structure
src/data        mock store snapshot (95 products, cameras, history)
src/lib/logic   status, priority score, alerts, KPIs (all derived — nothing hardcoded)
src/lib/api     data layer; swap bodies for FastAPI calls (GET /products, POST /products/:id/refill …)
src/state       app state (refills, assignments, resolved alerts, settings, undo)
src/components  Sidebar, Header, KPICard, ProductDrawer, CameraFeed, RefillQueue, …
src/pages       Overview, LiveMonitor, Inventory, RefillQueue, FastMovers, ShelfHealth, Analytics, Alerts, Settings

Priority = 50% stock level + 30% selling speed + 20% time to empty.
Camera footage and detections are simulated from the mock data; the frontend does not run computer vision.

## Connect a real store
Run the Shelfora Vision server (../shelfora-vision), then either open Settings → Connect your store
and enter its address, or start the dashboard with `VITE_API_URL=http://<server>:8000 npm run dev`.
Stock, camera frames and events then come from the server every 3 seconds.
The hosted preview link can't call other servers, so connect from a copy you run yourself.
