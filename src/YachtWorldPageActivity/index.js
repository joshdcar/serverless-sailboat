const data = require('../shared/sailboatData.js');
const scraper = require('../shared/scraper.js');

module.exports = async function (context) {

    var boatSale = context.bindingData.data;

    try {

        context.log(`Executing Page Activity: ${boatSale.id}`);

        const urlSegments = boatSale.saleUrl.split('/');
        const id = urlSegments[urlSegments.length - 2];
        boatSale.id = `yachtworld-${id}`;

        var boatPage = await scraper.getYachtWorldPage(boatSale.saleUrl, context);

        var existingRecord = await data.getBoatSaleById(boatSale.id, boatSale.model);

        context.log(`Boat Page Successfuly Scraped`);

        if (existingRecord == undefined) {

            context.log(`New Boat Record Identified`);

            var bloburl = '';

            if (boatPage.defaultPhotoUrl != '') {
                bloburl = await data.uploadBoatImage(boatPage.defaultPhotoUrl, context);
                context.log(`Boat Image Uploaded`);
            }

            //Save Details to Cosmos
            boatSale.priceHistory = [{ price: boatSale.price, priceDate: new Date(Date.now()) }];
            boatSale.specs = boatPage.specs;
            boatSale.defaultPhotoUrl = boatPage.defaultPhotoUrl;
            boatSale.boatImageUrl = bloburl;
            boatSale.createdDate = new Date(Date.now());
            boatSale.updatedDate = new Date(Date.now());
            boatSale.lastQueried = new Date(Date.now());

            await data.addBoatSale(boatSale, context);

            context.log(`Boat Saved Successfully: ${boatSale.model}`);

        }
        else {

            context.log(`Existing Boat Record Identified`);

            if (boatPage.defaultPhotoUrl != '' && existingRecord.boatImageUrl == '') {
                existingRecord.boatImageUrl = await data.uploadBoatImage(boatPage.defaultPhotoUrl, context);
                context.log(`Boat Image Uploaded`);
            }

            if (boatSale.price != existingRecord.priceHistory[existingRecord.priceHistory.length - 1].price) {

                existingRecord.price = boatSale.price;
                existingRecord.updatedDate = Date.now();
                boatSale.priceHistory.push({ price: boatSale.price, priceDate: new Date(Date.now()) });

                context.log(`Price Change Detected. Old Price ${existingRecord.price} . New Price ${boatSale.price}`);
            }

            existingRecord.lastQueried = new Date(Date.now());
            await data.updateBoatSale(existingRecord);

            context.log(`Boat Saved Successfully: ${boatSale.model}`);

        }

        context.log("Boat processed: " + boatSale.model);

    } catch (err) {
        context.log.error(`Unable to process Page Activity boat: ${JSON.stringify(boatSale)} with error ${err}`);
    }


};

