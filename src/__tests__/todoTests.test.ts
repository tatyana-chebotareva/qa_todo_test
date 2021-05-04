import {
  Builder,
  By,
  Capabilities,
  until,
  WebDriver,
  WebElement,
} from "selenium-webdriver";
import { elementIsVisible } from "selenium-webdriver/lib/until";
import { isAccessor, toEditorSettings } from "typescript";
const chromedriver = require("chromedriver");

const driver: WebDriver = new Builder()
  .withCapabilities(Capabilities.chrome())
  .build();

class TodoPage {
  driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  todoInput: By = By.className("new-todo"); // "What needs to be done?" input
  todos: By = By.className("view");// ALL the todos
  todoLabel: By = By.css("label"); // text of a todo FROM the todo
  todoComplete: By = By.className("toggle"); // checkbox for the todo FROM the todo
  clearCompletedButton: By = By.className("clear-completed"); // "Clear complete" button in the corner

  /**
   * 
   * @param todos Array of todos(strings) that are going to be added to the list
   */
  async addNewTodos(todos: Array<string>) {
    //wait for the input to be visible
    await driver.wait(until.elementIsVisible(await driver.findElement(this.todoInput)));
    // for each todo enter its text and add it to the list
    todos.forEach(async newTodo => {
      await (await driver.findElement(this.todoInput)).sendKeys(`${newTodo}\n`);  
    });
    await driver.sleep(100) // really need this or test might run further too fast
  }
  
  /**
   * 
   * @param text Your todo text (string)
   * @param num How many times you expect it to be on a list (number)
   * @returns Returns true/false
   */
  async checkTodoShown(text:string, num:number){  
    // console.log(`Checking that todo "${text}" is shown on a list ${num} times`);
    var todoArr=await driver.findElements(this.todoLabel);
    // console.log(`Total number of todos: ${todoArr.length}`);
    // getting all the todo elements, waiting for all promises, mapping todo text:
    var todosWithText=await Promise.all(todoArr.map(async (webElm)=> {
      return await webElm.getText();
    })).then((results) => todoArr.filter((element, index) => results[index]==text)); 
    // ^ filtering all elements: getting ones which mapped text matches our todo
    console.log(`Todo "${text}" is shown on a list ${todosWithText.length} times`);
    return todosWithText.length==num;
  }
}

beforeEach(async () => {
  await driver.get("https://devmountain.github.io/qa_todos/");
});

afterAll(async () => {
  await driver.quit();
});

describe("the todo app", () => {
  const myPage = new TodoPage(driver);

  it("can add a todo", async () => {
    var todoToAdd: Array<string> = ["Clear your desk"];
    await myPage.addNewTodos(todoToAdd); // adding todo
    expect(await myPage.checkTodoShown(todoToAdd[0],1)).toBeTruthy; // checking it's on a list
  });
  
  it("can remove a todo", async () => {
    // adding two todos
    var todoToAdd: Array<string> = ["buy milk", "homework"];
    await myPage.addNewTodos(todoToAdd);
    // checking both have been added and are on a list now
    expect(await myPage.checkTodoShown(todoToAdd[1],1)).toBeTruthy;
    expect(await myPage.checkTodoShown(todoToAdd[0],1)).toBeTruthy;
    // completing last added todo (i.e."homework")
    await (await driver.findElement(myPage.todoComplete)).click();
    // deleting all the completed todos (i.e."homework"))
    await (await driver.findElement(myPage.clearCompletedButton)).click();
    // checking that deleted todo is not on a list and that the other one still is
    expect(await myPage.checkTodoShown(todoToAdd[1],0)).toBeTruthy;
    expect(await myPage.checkTodoShown(todoToAdd[0],1)).toBeTruthy;
  });

  it("can mark a todo with a star", async () => {
    var todoToAdd: Array<string> = ["update your driver's license","dishes","THE MOST URGENT TASK : FILE TAXES BY MAY 15TH!"];
    await myPage.addNewTodos(todoToAdd); // adding todos
    expect(await myPage.checkTodoShown(todoToAdd[0],1)).toBeTruthy; // checking it's on a list
    expect(await myPage.checkTodoShown(todoToAdd[1],1)).toBeTruthy; // checking it's on a list
    expect(await myPage.checkTodoShown(todoToAdd[2],1)).toBeTruthy; // checking it's on a list
    let starredCount = (await driver.findElements(By.className("starred"))).length // Number of starred todo on a list ==0    
    let toStar = (await driver.findElements(By.className("star"))); // Number of unstarred todo on a list ==3
    var allTodos:Array<WebElement> = await driver.findElements(By.className("star")); // Getting all the todos we can star
    var todoToStar = allTodos[1]; // we're going to star todo "dishes"
    var totalStarred = 1;
    await (todoToStar).click(); // starring "dishes"
    await todoToStar.getAttribute("class").then(className => {expect(className).toBe("starred")}) // checking that class has changed from "star" to "starred"
    let toStarUpd = (await driver.findElements(By.className("star"))); // Number of unstarred todo on a list ==2
    let starredCountUpd = (await driver.findElements(By.className("starred"))).length // Number of starred todo on a list ==1    
    expect(starredCountUpd).toBe(starredCount+totalStarred); // we now have 1 starred: 0 was starred at the beginning and we've starred just 1
    expect(toStarUpd.length).toBe(toStar.length-totalStarred); // we now have 2 unstarred: 3 was unstarred at the beginning and we've starred just 1
  });

  it("has the right number of todos listed", async () => {
    var todoList_: Array<string> = ["call Jack", "gym"]; 
    await myPage.addNewTodos(todoList_); // adding some todos just in case
    await (await driver.findElement(myPage.clearCompletedButton)).click(); // clear any completed todos (might have some from other tests)
    await driver.findElements(myPage.todoComplete).then(elements =>{ // for any active todo - complete it
      elements.forEach(async element => {
        await element.click();
      })
    })
    await (await driver.findElement(myPage.clearCompletedButton)).click(); // clear any completed todos - we should get zero active todos ather that
    var todoList: Array<string> = ["pay bill", "water flowers"];
    var addedTodoCounter: number = todoList.length; // we know exactly how many todos we're going to add
    await myPage.addNewTodos(todoList); // adding two todos
    expect(await myPage.checkTodoShown(todoList[0],1)).toBeTruthy; // checking it's on a list
    expect(await myPage.checkTodoShown(todoList[1],1)).toBeTruthy; // checking it's on a list
    var todoArr=await driver.findElements(myPage.todoLabel);
    await Promise.all(todoArr).then(() => expect((todoArr.length)).toEqual(addedTodoCounter)); // checking total number of todos shown on a list is the same as number of todos we've just added after emptying the list earlier
  });  
});