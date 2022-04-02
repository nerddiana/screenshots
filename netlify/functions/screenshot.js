/* eslint-disable no-undef */
const puppeteer = require("puppeteer-core");
const chromium = require("chrome-aws-lambda");

const DEFAULT_CONFIG = {
  width: 360,
  height: 640,
  deviceScaleFactor: 1,
};

const takeScreenshot = async (
  url = "http://example.com",
  fullPage = true,
  config
) => {
  const executablePath = process.env.EXECUTABLE_PATH || await chromium.executablePath;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });

  const page = await browser.newPage();

  await page.setViewport(config);
  await page.goto(url, {
    waitUntil: ["networkidle2"],
  });

  const img = await page.screenshot({ fullPage });

  await page.close();
  await browser.close();

  return img;
};

const buildIsParam = (params) => (param) => {
  try {
    return Object.keys(params).includes(param);
  } catch (e) {
    return false;
  }
};

exports.handler = async function (event) {
  const url = event?.queryStringParameters?.site;
  const params = event?.queryStringParameters;

  const isParam = buildIsParam(params);
  const isFullPage = isParam("full");

  let config = { ...DEFAULT_CONFIG };

  if (isParam("width")) {
    config.width = Number(params.width);
  }
  if (isParam("height")) {
    config.height = Number(params.height);
  }
  if (isParam("scale")) {
    config.deviceScaleFactor = Number(params.scale);
  }

  const img = await takeScreenshot(url, isFullPage, config);

  return {
    statusCode: 200,
    headers: {
      /* Required for CORS support to work */
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "image/png",
    },
    body: img.toString("base64"),
    isBase64Encoded: true,
  };
};
