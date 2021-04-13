const df = require("durable-functions");

module.exports = async function (context, req) {
    const client = df.getClient(context);
    const instanceId = await client.startNew("BoatSellersScraperOrchestrator", undefined, undefined);

    context.log(`Started orchestration with ID = '${instanceId}'.`);

    return client.createCheckStatusResponse("BoatSellersScraperOrchestrator", instanceId);
};