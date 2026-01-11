import { createApp } from "vue";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import { definePreset } from "@primevue/themes";
import "primeicons/primeicons.css";
import App from "./App.vue";
import "./styles.css";

const CustomPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{blue.50}",
      100: "{blue.100}",
      200: "{blue.200}",
      300: "{blue.300}",
      400: "{blue.400}",
      500: "{blue.500}",
      600: "{blue.600}",
      700: "{blue.700}",
      800: "{blue.800}",
      900: "{blue.900}",
      950: "{blue.950}"
    },
    colorScheme: {
      light: {
        primary: {
          color: "{blue.500}",
          inverseColor: "#ffffff",
          hoverColor: "{blue.600}",
          activeColor: "{blue.700}"
        },
        highlight: {
          background: "{blue.50}",
          focusBackground: "{blue.100}",
          color: "{blue.700}",
          focusColor: "{blue.800}"
        },
        surface: {
          0: "#ffffff",
          50: "{slate.50}",
          100: "{slate.100}",
          200: "{slate.200}",
          300: "{slate.300}",
          400: "{slate.400}",
          500: "{slate.500}",
          600: "{slate.600}",
          700: "{slate.700}",
          800: "{slate.800}",
          900: "{slate.900}",
          950: "{slate.950}"
        }
      }
    }
  }
});

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: CustomPreset,
    options: {
      darkModeSelector: ".dark-mode"
    }
  }
});

app.mount("#app");
