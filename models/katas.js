/**
 * Kata definitions
 */
module.exports = {
  // FizzBuzz kata
  fizzbuzz: {
    name: 'FizzBuzz',
    description: 'Write a program that prints the numbers from 1 to 100. But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".',
    initialProductionCode: `function fizzBuzz(number) {
  // Implement FizzBuzz here
}`,
    initialTestCode: `describe("FizzBuzz", () => {
  test("sample test -- replace with your own", () => {
    expect(1).toBe(1);
  });
});`,
    testCases: [
      {
        id: 1,
        description: 'ordinary number: 1 should return "1"',
        status: 'TODO'
      },
      {
        id: 2,
        description: 'ordinary number: 2 should return "2"',
        status: 'TODO'
      },
      {
        id: 3,
        description: 'multiple of 3: 3 should return "Fizz',
        status: 'TODO'
      },
      {
        id: 4,
        description: 'ordinary number: 4 should return "4"',
        status: 'TODO'
      },
      {
        id: 5,
        description: 'multiple of 5: 5 should return "Buzz"',
        status: 'TODO'
      },
      {
        id: 6,
        description: 'multiple of 3: 6 should return "Fizz"',
        status: 'TODO'
      },
      {
        id: 7,
        description: 'multiple of 5: 10 should return "Buzz"',
        status: 'TODO'
      },
      {
        id: 8,
        description: 'multiple of both 3 and 5: 15 should return "FizzBuzz"',
        status: 'TODO'
      },
      {
        id: 9,
        description: 'multiple of both 3 and 5: 30 should return "FizzBuzz"',
        status: 'TODO'
      }
    ]
  }
};
