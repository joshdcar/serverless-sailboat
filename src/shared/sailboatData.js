const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env["CosmosUrl"];
const key = process.env["CosmosKey"];
const client = new CosmosClient({ endpoint, key });
const { BlobServiceClient} = require("@azure/storage-blob");
const imageStorageConnection = process.env["ImageStorage"];
const axios = require("axios");


async function saveImageBlob(imageData, imageFileName, context){

     //Boat Image
     const blobServiceClient = BlobServiceClient.fromConnectionString(imageStorageConnection);

     //Create Storage Container
     const containerName = "sailboats";
     const containerClient = blobServiceClient.getContainerClient(containerName);
     const createResponse = await containerClient.createIfNotExists();

     //Upload Photo
     const blobClient = containerClient.getBlockBlobClient(imageFileName);
     const blobOptions = { blobHTTPHeaders: { blobContentType: 'image/jpeg' } };
     const uploadResponse = await blobClient.upload(imageData.data, imageData.data.length, blobOptions);

     return blobClient.url;

}


async function addBoatSale(boatSale, context){

  const container = client.database("SailboatDb").container("BoatSales");

  const { record: newRecord } = await container.items.create(boatSale);

  return newRecord;


}

async function getBoatSaleById(id, model, context){

  const container = client.database("SailboatDb").container("BoatSales");

  const { resource: item } = await container.item(id,model).read();

  return item;


}
 
async function updateBoatSale(record, context){

  const container = client.database("SailboatDb").container("BoatSales");

  const { resource: replaced} = await container.item(record.id,record.model).replace(record);

  return replaced;


}


async function saveSailboatSpecs(sailboatSpecs, context) {

  try {


    const container = client.database("SailboatDb").container("Sailboats");

    var result = await container.items.upsert(sailboatSpecs);

    context.log("Boat Saved: " + sailboatSpecs.boatName);

    return sailboatSpecs;

  } catch (error) {
      context.log("Error Saving to Database: " + error.stack);
  }

}

async function uploadBoatImage(photoUrl,context){

     //Download Sailboat image
  const imageData = await axios.get(photoUrl, {
      responseType: 'arraybuffer'
  });

  const imageFileName = photoUrl.split('/').pop().split('#')[0].split('?')[0];
  const blobUrl = await saveImageBlob(imageData, imageFileName, context);

  return blobUrl;

}

module.exports = {
  getBoatSaleById,
  updateBoatSale,
  addBoatSale,
  saveImageBlob,
  uploadBoatImage
}