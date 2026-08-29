import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import pluginJest from "eslint-plugin-jest";

export default defineConfig([
  // App Code Configuration
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^req|^res|^next|_" }],
    }
  },

  // Test Files Configuration
  {
    files: ["tests/**/*.{js,mjs,cjs}", "**/*.test.{js,mjs,cjs}", "**/*.spec.{js,mjs,cjs}"],
    plugins: {
      jest: pluginJest,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
    },
  },
]);
