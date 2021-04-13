const df = require("durable-functions");

module.exports = async function (context, myTimer) {

    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue)
    {
        context.log('JavaScript is running late!');
    }

    const client = df.getClient(context);
    const instanceId = await client.startNew("BoatSellersScraperOrchestrator", undefined, undefined);

    context.log(`Started Boat Sales orchestration with ID = '${instanceId}'.`);


};