/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an HTTP starter function.
 * 
 * Before running this sample, please:
 * - create a Durable activity function (default name is "Hello")
 * - create a Durable HTTP starter function
 * - run 'npm install durable-functions' from the wwwroot folder of your 
 *    function app in Kudu
 */

const df = require("durable-functions");

const moment = require("moment");
const scraper = require('../shared/scraper.js');

module.exports = df.orchestrator(function* (context) {

    const firstRetryIntervalInMilliseconds = 5000;
    const maxNumberOfAttempts = 3;

    const retryOptions = 
        new df.RetryOptions(firstRetryIntervalInMilliseconds, maxNumberOfAttempts);

    const searchUrl = process.env["YachtWorldSearchUrl"];

    const orchestrationParams = {
        searchUrl: searchUrl
    }

    if (!context.df.isReplaying){
        context.log(`Executing Boat Seller Scraper Orchestrator: ${orchestrationParams.searchUrl}`);
    }

    var boats = yield context.df.callActivity("YachtWorldListingActivity",orchestrationParams);

    const tasks = [];

    for(const boat of boats){

        if (!context.df.isReplaying){
            context.log(`Executing Boat Page Activity: ${boat.id}`);
        }

        const boatPage = yield context.df.callActivityWithRetry("YachtWorldPageActivity", retryOptions,  boat)

        //Introduce artificial pause to avoid getting blocked
        //var randomWait = scraper.randomBetween(2, 5);
        const pause = moment.utc(context.df.currentUtcDateTime).add(2, 's');
        yield context.df.createTimer(pause.toDate());

    }

    context.log(`Boat Seller Scraper Orchestration Complete`);
   
    return boats;

    
});