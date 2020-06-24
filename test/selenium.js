"use strict";

const wsDomain = "127.0.0.1"
const wsPort = 50056;
const wsHost = wsDomain + ":" + wsPort;
const jsonrpc = "2.0";

const { spawn } = require('child_process');
const { describe, before, after, it } = require('mocha');
const assert = require("assert");
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

  it('calls R functions', async function () {
    this.timeout(10000);
    await driver.get('http://127.0.0.1:50056/test/test.html');
    await setXY(driver, 17, 45);
    await clickButton(driver, "add");
    await awaitResult(driver, "62");
    await clickButton(driver, "broken");
    await setXY(driver, 15, 7);
    await clickButton(driver, "multiply");
    await awaitResult(driver, "105");
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

async function awaitResult(driver, value) {
  const element = driver.findElement(By.id("result"));
  await driver.wait(async function() {
    const elementValue = await element.getAttribute("value");
    return elementValue === value;
  }, 10000);
}
