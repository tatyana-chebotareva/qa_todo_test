import {
  Builder,
  By,
  Capabilities,
  until,
  WebDriver,
} from "selenium-webdriver";

const chromedriver = require("chromedriver");

const driver: WebDriver = new Builder()
  .withCapabilities(Capabilities.chrome())
  .build();

/*
With our boilerplate out of the way, we can get to the test.

You'll need to find the following 5 locators; the test will pass once they are added in.
*/

// this is for the "What needs to be done?" input
const todoInput: By = By.className("new-todo");
// this locator will find ALL the todos
const todos: By = By.className("view");
// this locator will find the text of a todo FROM the todo
const todoLabel: By = By.css("label");
// this locator will find the checkbox for the todo FROM the todo
const todoComplete: By = By.className("toggle");
// this locator is for the "Clear complete" button in the corner
const clearCompletedButton: By = By.className("clear-completed");

test("the todo app can add, complete, and clear a todo", async () => {
  // 1. Load the page
  await driver.get("https://devmountain.github.io/qa_todos/");
  await driver.wait(until.elementLocated(todoInput));
  // 2. Add a todo
  await driver.findElement(todoInput).sendKeys("Test To-Do\n");
  // 3. Find all the todos
  let myTodos = await driver.findElements(todos);
  // 4. Filter them to get any that match our test todo
  let myTodo = await myTodos.filter(async (todo) => {
    (await (await todo.findElement(todoLabel)).getText()) == "Test To-Do";
  });
  // 5. We should only have the one
  expect(myTodo.length).toEqual(1);
  // 6. Mark it complete
  await (await myTodo[0].findElement(todoComplete)).click();
  // 7. Clear complete todos
  await (await driver.findElement(clearCompletedButton)).click();
  // 8. Get the todos and filter again
  myTodos = await driver.findElements(todos);
  myTodo = await myTodos.filter(async (todo) => {
    (await (await todo.findElement(todoLabel)).getText()) == "Test To-Do";
  });
  // 9. We should have no matching todos
  expect(myTodo.length).toEqual(0);
});

afterAll(async () => {
  await driver.quit();
});
