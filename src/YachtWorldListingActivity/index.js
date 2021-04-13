
const scraper = require('../shared/scraper.js');

module.exports = async function (context) {

    context.log(`Executing Listing Scrape: ${context.bindingData.data.searchUrl}`);

    var boatUrls = await scraper.getYachtWorldListing(context.bindingData.data.searchUrl, context);

    context.log("Boats Returned: " + boatUrls.length);

    return boatUrls;

};