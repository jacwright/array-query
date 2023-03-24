export default {
  transform: {},
  testEnvironment: "jest-environment-node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/dist/$1",
  },
};
