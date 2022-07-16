"use strict";

const { spawn } = require('child_process');
const { describe, before, after, it } = require('mocha');
const { Builder, By, Key, until } = require('selenium-webdriver');

describe('rrpc', function () {
  let rProcess;
  let driver;

  before(function () {
    rProcess = spawn('Rscript', ['test/server.R']);
    driver = new Builder().forBrowser('firefox').build();
  });

  after(async function () {
    // this function is async to make Mocha wait until
    // all the tests have resolved before it calls it
    rProcess.kill('SIGTERM');
    driver.quit();
  })

  this.beforeEach(async function() {
    this.timeout(10000);
    await driver.get('http://127.0.0.1:50056/test/test.html');
    const element = await driver.findElement(By.id("controls"));
    await driver.wait(async function() {
      return await element.isDisplayed();
    }, 1000);
  });

  it('calls R functions', async function () {
    this.timeout(10000);
    await setXY(driver, 17, 45);
    await clickButton(driver, "add");
    await awaitResult(driver, "62");
    await clickButton(driver, "broken");
    await setXY(driver, 15, 7);
    await clickButton(driver, "multiply");
    await awaitResult(driver, "105");
  });

  it('is accurate', async function () {
    this.timeout(10000);
    await setXY(driver, 17.00000001, 45.00000014);
    await clickButton(driver, "add");
    await awaitResult(driver, "62.00000015");
  });

  it('is detects R errors', async function () {
    this.timeout(10000);
    await clickButton(driver, "broken");
    await awaitError(driver, "broken function called");
  });

  it('gets progress', async function() {
    this.timeout(10000);
    await clickButton(driver, "slow");
    await awaitProgress(driver, 20);
    await awaitProgress(driver, 40);
    await awaitProgress(driver, 60);
    await awaitProgress(driver, 80);
    await awaitProgress(driver, 100);
  });

  it('gets information text', async function() {
    this.timeout(10000);
    await setXY(driver, 5, 6);
    await clickButton(driver, "text");
    await awaitInfoText(driver, "some information");
    await awaitResult(driver, "30");
  });
});

async function setXY(driver, x, y) {
  await reset(driver);
  await xInput(driver, x);
  await yInput(driver, y);
}

async function clickButton(driver, id) {
  await driver.findElement(By.id(id)).click();
}

async function xInput(driver, value) {
  const id = "x-input";
  await input(driver, id, value);
}

async function yInput(driver, value) {
  const id = "y-input";
  await input(driver, id, value);
}

async function input(driver, id, value) {
  await driver.findElement(By.id(id)).sendKeys("" + value);
}

async function reset(driver) {
  await driver.findElement(By.id("reset")).click();
}

async function awaitValue(driver, elementId, value, valueFromElement) {
  const element = await driver.findElement(By.id(elementId));
  await driver.wait(async function() {
    return value === await valueFromElement(element);
  }, 3000);
}

async function getText(element) {
   const t = await element.getText();
   return t.trim();
}

function getValue(element) {
  return element.getAttribute("value");
}

function awaitResult(driver, value) {
  return awaitValue(driver, "result", value, getValue);
}

function awaitError(driver, value) {
  return awaitValue(driver, "error", value, getValue);
}

function awaitInfoText(driver, value) {
  return awaitValue(driver, "info-text", value, getText);
}

async function awaitProgress(driver, value) {
  const element = await driver.findElement(By.id("progress-bar"));
  await driver.wait(async function() {
    const style = await element.getAttribute("style");
    const statements = style.split(";");
    for (let i in statements) {
      const sides = statements[i].split(":", 2);
      if (sides[0].trim() === "width") {
        return sides[1].trim() === value + "%";
      }
    }
    return false;
  }, 3000);
}
