module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "import/no-anonymous-default-export": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_"
      }
    ]
  }
};
