# TODO

 - Add the previous version of the code and tests to the LLM input
 - Make sessions persistent to avoid losing them when we change the code
 - Make it possible to return to a previous state
 - Make better use of screen estate


# BUGS
- after reload, it no longer updates the coach feedback
- sometimes the coach feedback is not updated

- resize vertically the editors with the window size
- have special test sessions always available to test the states
- avoid resetting the scrolls after submit
    - submit should update only selected areas
    - saubmit the scroll positions?



# CASES TO WORK ON

RED: a volte non lo accetta, ma in red, dovrebbe andare bene
describe("FizzBuzz", () => {
test("1 for 1", () => {
expect(fizzBuzz(1)).toBe("1");
});

test("2 for 2", () => {
expect(fizzBuzz(2)).toBe("2");
});
});
function fizzBuzz(number) {
  if (number == 2) {
    return "2";
  }
  return "1";
}


REFACTOR
describe("FizzBuzz", () => {
test("1 for 1", () => {
expect(fizzBuzz(1)).toBe("1");
});

test("2 for 2", () => {
expect(fizzBuzz(2)).toBe("2");
});
});

function fizzBuzz(number) {
if (number == 4) {
return "4";
}  
if (number == 2) {
return "2";
}
return "1";
}
17:46:44 web	| Used model: anthropic/claude-3.7-sonnet ; provider: Anthropic
17:46:44 web	| --------
17:46:44 web	| {"comments": "Your code is repetitive. Consider returning the number as a string directly.", "hint": "Notice the pattern - you're just returning the stringified number. Try returning `number.toString()` instead of individual cases.", "proceed": "yes"}
