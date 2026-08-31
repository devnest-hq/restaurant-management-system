const { mockDeep, mockReset } = require("jest-mock-extended");

const prismaMock = mockDeep();

beforeEach(() => {
  mockReset(prismaMock);
});

module.exports = prismaMock;