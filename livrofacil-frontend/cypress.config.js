import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
  },

  component: {
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.js",
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
