const { mockDeep, mockReset } = require("jest-mock-extended");

// Every file in your app does `const { PrismaClient } = require("@prisma/client")`
// and then `new PrismaClient()`. This intercepts that import globally, so no
// matter how many files create their own instance, they all get the SAME
// fake object we control from our tests — no real database needed.
jest.mock(
  "@prisma/client",
  () => ({
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  }),
  { virtual: true },
);

const mockPrisma = mockDeep();

// Reset all mocked return values between tests so one test's setup can't
// leak into another test.
beforeEach(() => {
  mockReset(mockPrisma);
});

module.exports = { prismaMock: mockPrisma };
