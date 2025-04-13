/**
 * Kata definitions
 */
module.exports = {
  // FizzBuzz kata
  fizzbuzz: {
    name: 'FizzBuzz',
    description: 'Write a program that prints the numbers from 1 to 100. But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".',
    initialProductionCode: 'function fizzBuzz(number) {\n  // Implement FizzBuzz here\n}\n\nmodule.exports = { fizzBuzz };',
    initialTestCode: 'const { fizzBuzz } = require("./fizzbuzz");\n\ndescribe("FizzBuzz", () => {\n  // Write your tests here\n});',
    testCases: [
      {
        id: 1,
        description: 'Should return the number for non-multiples of 3 or 5',
        status: 'TODO'
      },
      {
        id: 2,
        description: 'Should return "Fizz" for multiples of 3',
        status: 'TODO'
      },
      {
        id: 3,
        description: 'Should return "Buzz" for multiples of 5',
        status: 'TODO'
      },
      {
        id: 4,
        description: 'Should return "FizzBuzz" for multiples of both 3 and 5',
        status: 'TODO'
      }
    ]
  }
};