import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {rules: {"no-unused-vars": "off"}},
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
];