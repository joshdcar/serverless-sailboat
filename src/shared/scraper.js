const playwright = require("playwright-chromium");
const utils = require("./utils.js");
const axios = require("axios");

async function getYachtWorldListing(listingUrl, context){

    const headless = (process.env["runHeadless"] == 'true');

    const browser = await playwright.chromium.launch({ headless: headless });

    const browserContext = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
    });

    const page = await browserContext.newPage();

    var searchUrl = listingUrl;

    await page.goto(listingUrl,{ waitUntil: 'domcontentloaded' });

    var boats = [];
    var currentPage = 1;
    var pageCount = 1;

    // Get The Number of Paged Results
    const pageElements = await page.evaluate(selector => {

        var pages = [];
        const pageElements = document.querySelectorAll(selector);

        pageElements.forEach(function (page) {
            pages.push(page.innerHTML);
        });

        return pages;

    }, '.flex > .search-right-col > .pagination-and-results-container > .search-page-nav > a');

    pageCount = Number(pageElements[pageElements.length - 2]);

    context.log(`Total Result Pages: ${pageCount}`);
    
    while (currentPage <= pageCount) {

        const pageBoats = await page.evaluate(() => {

            const boatUrls = [];

            const boatRows = document.querySelectorAll('.listings-container > a');

            console.log("Boat Rows: " + boatRows.length)

            for (const boat of boatRows) {

                const name = boat.querySelector('div > .listing-card-information > .listing-card-title').textContent;
                var location = boat.querySelector('div > .listing-card-information > .listing-card-location').textContent;
                var seller = boat.querySelector('div > .listing-card-information > .listing-card-broker').textContent;

                var price = boat.querySelector('div > .listing-card-information > .price > span').textContent;
                var cleanPrice = price.replace('US$','');
                cleanPrice = cleanPrice.replace(',','');
                cleanPrice = cleanPrice.replace('*','');
                boatPrice = parseInt(cleanPrice);

                var lengthYear = boat.querySelector('div > .listing-card-information > .listing-card-length-year').textContent;
                var lengthYearValues = lengthYear.split('/');
                var lengthValue = lengthYearValues[0].replace('ft|/g','').trim();
                var length = parseInt(lengthValue);
                var year = parseInt(lengthYearValues[1]);
                
                const url = boat.getAttribute('href');

                var boatDetails = {
                    id: url,
                    source: "yachtworld",
                    saleUrl: url,
                    model: name,
                    location: location,
                    seller: seller,
                    price: boatPrice,
                    url: url,
                    length: length,
                    year: year
                };

                boatUrls.push( boatDetails);

            }

            return boatUrls;

        })

        boats = boats.concat(pageBoats);

        //Move on to next page
        currentPage++;

        //Navigate to the next page
        if (currentPage <= pageCount) {

            const nextPageLink = await page.waitForSelector('.flex > .search-right-col > .pagination-and-results-container > .search-page-nav > .icon-chevron-right');

            if (nextPageLink) {
                //Simulate some random user variations / waits
                var randomWait = randomBetween(1500, 4000)
                await page.waitForTimeout(randomWait);
                await page.click('.flex > .search-right-col > .pagination-and-results-container > .search-page-nav > .icon-chevron-right');
            }

        }


    }

    context.log("Boats Scraped:" + boats.length);
    
    await browser.close();

    return boats;

}

async function getYachtWorldPage(pageUrl, context){

    const browser = await playwright.chromium.launch({ headless: true });

    const browserContext = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
      });

    const page = await browserContext.newPage();

    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });


    const fullSpecs = await utils.queryPage(page, "#frame > .boatDetailsWrapper > .content_main > .fullspecs > div");

    var photoUrl = '';

    try{

        var imageElement = await page.waitForSelector('.galleria-container > .galleria-stage > .galleria-images > .galleria-image:nth-child(2) > img', { timeout: 2000});
        const defaultPhotoUrl = await imageElement.getAttribute('src');
        photoUrl = defaultPhotoUrl.split('?')[0];

    }
    catch(err){
        //Cover some nuances we see with some images being delay loaded while others are not present at all so waitforselector never 
        //happens and page times out probably more elegent way of doing this w/o timeout exception
    }
    
    var boat = {
        specs: fullSpecs,
        defaultPhotoUrl: photoUrl
    }

    await browser.close();

    return boat;

}

function randomBetween(min, max) {  
    return Math.floor(
      Math.random() * (max - min + 1) + min
    )
  }


module.exports = {
    getYachtWorldListing,
    getYachtWorldPage,
    randomBetween
}