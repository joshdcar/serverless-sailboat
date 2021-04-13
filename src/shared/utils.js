

module.exports = {

    cleanUp : (text) => {
        text = text.trim();
        text = text.replace(' ','');
        text = text.replace('ft','');
        text = text.replace('lb','');
        text = text.replace(',','');
    
        return text;
    },

    queryPage : async (page, query) => {

        //NOTE: We could use a single page.evaluate but code in page.evaluate runs
        //      in the browser and so is difficult to debug and no break points
        //      so although verbose this is better
        var text = await page.evaluate((query) => { 

            var elementValue = "";
            var element = document.querySelector(query);

            if(element == null){
                return elementValue;
            }

            return document.querySelector(query).innerText;
            
        }, query);

        text = module.exports.cleanUp(text);

        return text;

    },

    queryPageElement : async (page, query) => {

        //NOTE: We could use a single page.evaluate but code in page.evaluate runs
        //      in the browser and so is difficult to debug and no break points
        //      so although verbose this is better
        var text = await page.evaluate((query) => { 

            var element = document.querySelector(query);

            return element;

            
        }, query);

        text = module.exports.cleanUp(text);

        return text;

    }
    
}



