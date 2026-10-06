# Servnix frontend

React and Vite client for the Servnix customer marketplace, provider workspace, and admin dashboard.

From this directory, run `npm install` and `npm run dev`. The development server is at `http://localhost:5173` and proxies `/v1` to the backend at `http://localhost:3000`. Start the backend and run its migrations first. If its port changes, update `vite.config.js`.

Run `npm run lint` and `npm run build` to verify the client. Project setup and booking flow are described in the [root README](../README.md).
