/**
 * Leap Year kata definition
 */
module.exports = {
  name: 'Leap Year',
  description: 'Write a program that tells if a year is a leap year',
  initialProductionCode: `function isLeap(year) {
  // Implement logic here
}`,
  initialTestCode: `describe("Leap Year", () => {
  test("sample test -- replace with your own", () => {
    expect(1).toBe(1);
  });
});`,
  testCases: [
    {
      id: 1,
      description: 'ordinary year: 2023 is not leap',
      status: 'TODO'
    },
    {
      id: 2,
      description: 'ordinary year: 2026 is not leap',
      status: 'TODO'
    },
    {
      id: 3,
      description: 'divisible by 4, but not 100: 2024 is leap',
      status: 'TODO'
    },
    {
      id: 4,
      description: 'divisible by 100, but not 400: 1900 is not leap',
      status: 'TODO'
    },
    {
      id: 5,
      description: 'divisible by 400: 2000 is leap',
      status: 'TODO'
    }
  ]
};