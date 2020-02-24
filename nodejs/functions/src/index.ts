import * as functions from 'firebase-functions';
const admin = require('firebase-admin');
import * as https from 'https';
import * as http from 'http';
import * as http_request from 'request';
import * as figlet from 'figlet';
import * as episodes from '../metadata/episodes-info.json';
import * as apps from '../metadata/apps-metadata.json';
import * as cachebusters from '../metadata/cachebuster-metadata.json';
import * as languages_info from '../metadata/languages-info.json';
admin.initializeApp();

export const talTest = functions.https.onRequest(async(request, response) => {
    response.send("Hello");
});
export const episodeInfo = functions.https.onRequest(async (request, response) => {
    let text: string = request.body.text;
    //let payload: any = request.body.payload;
    let specificEpisodeInfo = {};
    let found:boolean = false;

    for (let episode of episodes["infoList"]) {
        if (text.toLowerCase() == episode["name"].toLowerCase()) {
            specificEpisodeInfo = episode;
            found = true;
            break;
        }

    }
    if (!found){
        response.send("No info for episode "+text+"."+" Please provide the episode dev name!")
        return;
    }

    let variantsText = "";
    for (let variant of specificEpisodeInfo["parameterPaths"]){
        variantsText = variantsText+variant.replace("Parameters/", "")+"\n";
    }

    let infoResponse:any = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "========== Episode: "+specificEpisodeInfo["name"]+"=========="
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Infra Version:*\n"+specificEpisodeInfo["apiVersion"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*title:*\n"+specificEpisodeInfo["title"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*status:*\n"+specificEpisodeInfo["status"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*storyboardUrl:*\n<"+specificEpisodeInfo["storyboardUrl"]+"|Story Board>"
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*ownerName:*\n"+specificEpisodeInfo["ownerName"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*variants:*\n"+variantsText
                    }
                ]
            }
        ]
    };

    response.send(infoResponse);
});

export const sayHi = functions.https.onRequest(async (request, response) => {
    let fonts: string[] = ["Standard", "Train"];
    let randomIndex: number = Math.floor(Math.random() * (fonts.length));
// wrap a request in an promise
    let name: string = request.body.text;

    figlet.text('Hi ' + name + '!', {
        font: fonts[randomIndex]
        //horizontalLayout: 'full',
        //verticalLayout: 'full'
    }, function (err, data) {
        if (err) {
            response.send({
                "response_type": "in_channel",
                "text": "Hi " + name + "!"
            });
        }
        response.send({
            "response_type": "in_channel",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "```" + data.toString() + "```"
                    }
                }
            ]
        });
    });

});

export const runEpisode = functions.https.onRequest(async (request, response) => {
    let text:string = request.body.text;
    let payload:any = request.body.payload;
    let episodeInfos = {};
    let found:boolean = false;
    let desiredEpisode = "";
    let languageCode = "en-us";
    if (text) {
        let textParts = text.split(" ");
        if (textParts.length > 0) {
            desiredEpisode = textParts[0];
        }
        if (textParts.length > 1) {
            let foundLanguage: boolean = false;
            let languageOrCode = textParts[1];
            for (let languageInfo of languages_info["languages"]){
                if (languageInfo["name"].toLowerCase() == languageOrCode.toLowerCase()){
                    languageCode = languageInfo["code"];
                    foundLanguage = true;
                    break;
                }
            }
            if (!foundLanguage){
                for (let languageInfo of languages_info["languages"]){
                    if (languageInfo["code"].toLowerCase() == languageOrCode.toLowerCase()){
                        languageCode = languageInfo["code"];
                    }
                }
            }
        }
    }
    for (let episode of episodes["infoList"]){
        if (desiredEpisode.toLowerCase() == episode["name"].toLowerCase()){
            episodeInfos = episode;
            found = true;
            break;
        }
    }
    if (!found){
        response.send("Couldn't find the episode "+desiredEpisode+"."+" Please provide the episode dev name!")
        return;
    }

    let episodeName = episodeInfos["name"];
    let episodeUnderscore = episodeName.replace(/(?:^|\.?)([A-Z])/g, function (x,y) {
        return "_" + y.toLowerCase()
    }).replace(/^_/, "");
    let cachebuster = cachebusters[episodeName];
    let episodeUrl = "http://static1.matific.com/content/episodes/" + episodeUnderscore +
        "/index$" + cachebuster + ".html?review=true&chooseRandomSeed=true&language=" + languageCode;

    let variantsText = "";
    for (let variant of episodeInfos["parameterPaths"]){
        let tempVariants = variantsText +
            "<"+episodeUrl + "&" + variant + "|" +
            variant.replace("Parameters/", "")+">\n";
        if (tempVariants.length > 2000) {
            break;
        }
        variantsText = tempVariants
    }

    let episodeResponse: any = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "========== Episode: " + episodeName + "=========="
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": variantsText
                }
            }
        ]
    };
    response.send(episodeResponse);
});


export const lmnbify = functions.https.onRequest((request, response) => {
    let text: string = request.body.text;
    response.send("http://internaldata-slatemathweb.s3.amazonaws.com/wiki_resources/lmkbify/lmkbify.html?text=" + text.replace(new RegExp(" ", 'g'), "%20"));
});

export const talPleaseEnjoyTelAviv = functions.https.onRequest((request, response) => {
    let placesForTal: any = {
        "results": {
            "next": "https://places.cit.api.here.com/places/v1/discover/explore;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZvZmZzZXQ9NTAmc2l6ZT01MCZ0Zj1wbGFpbg?in=32.0873%2C34.7852%3Br%3D2500.0&app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
            "items": [{
                "position": [32.08831, 34.78218],
                "distance": 306,
                "title": "Lehamim Bakery- Ibn Gvirol",
                "averageRating": 0.0,
                "category": {
                    "id": "restaurant",
                    "title": "Restaurant",
                    "href": "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type": "urn:nlp-types:category",
                    "system": "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "125 אבן גבירול\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 62037",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-debed36b87864b0099353bbaf4f6d8b5;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTA?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "international",
                    "title" : "International",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "mediterranean",
                    "title" : "Mediterranean",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-debed36b87864b0099353bbaf4f6d8b5",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 07:00 - 20:00\nFri: 07:00 - 14:30",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T070000",
                        "duration" : "PT13H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T070000",
                        "duration" : "PT07H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    } ]
                }
            }, {
                "position" : [ 32.08602, 34.78835 ],
                "distance" : 329,
                "title" : "Nagisa -Sushi Bar Kikar Hamedina",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "תש\"ח\nהצפון החדש-כיכר המדינה, תל אביב-יפו, 62093",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-8bd5a0f084cf4c85a13598bf08e2d120;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTE?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "asian",
                    "title" : "Asian",
                    "group" : "cuisine"
                }, {
                    "id" : "japanese",
                    "title" : "Japanese",
                    "group" : "cuisine"
                }, {
                    "id" : "sushi",
                    "title" : "Japanese - Sushi",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-8bd5a0f084cf4c85a13598bf08e2d120",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 11:00 - 23:00\nFri: 11:00 - 15:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T110000",
                        "duration" : "PT12H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T110000",
                        "duration" : "PT04H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    } ]
                }
            }, {
                "position" : [ 32.085285, 34.781771 ],
                "distance" : 393,
                "title" : "Coffee al",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "ארלוזורוב\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-0518df3cd0ef4002bf3bee4e21cc1608;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTI?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376sv8wx-0518df3cd0ef4002bf3bee4e21cc1608"
            }, {
                "position" : [ 32.09062, 34.78261 ],
                "distance" : 443,
                "title" : "Valentino Chocliater",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "אבן גבירול\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 62037",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-6eaffc81b665409fb22c092687d46be9;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTM?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "belgian",
                    "title" : "Belgian",
                    "group" : "cuisine"
                }, {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-6eaffc81b665409fb22c092687d46be9"
            }, {
                "position" : [ 32.09062, 34.78261 ],
                "distance" : 443,
                "title" : "Hamezeg",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "151 אבן גבירול\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 62037",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-ecd2dc4628480a021de20b31edd41c2e;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQ?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "mediterranean",
                    "title" : "Mediterranean",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-ecd2dc4628480a021de20b31edd41c2e"
            }, {
                "position" : [ 32.089941, 34.780112 ],
                "distance" : 562,
                "title" : "Ze Sushi",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Ashtori Haparhi\nTel Aviv-Yafo, Tel Aviv, 62743",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-42520f1abc600938dc9be64e812cf6fd;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTU?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "asian",
                    "title" : "Asian",
                    "group" : "cuisine"
                }, {
                    "id" : "japanese",
                    "title" : "Japanese",
                    "group" : "cuisine"
                }, {
                    "id" : "natural-healthy",
                    "title" : "Natural/Healthy",
                    "group" : "cuisine"
                }, {
                    "id" : "sushi",
                    "title" : "Japanese - Sushi",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-42520f1abc600938dc9be64e812cf6fd",
                "openingHours" : {
                    "text" : "Mon-Wed, Sun: 00:00 - 12:00\nThu: 00:00 - 00:30\nFri, Sat: 11:00 - 12:30",
                    "label" : "Opening hours",
                    "isOpen" : false,
                    "structured" : [ {
                        "start" : "T000000",
                        "duration" : "PT12H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,SU"
                    }, {
                        "start" : "T000000",
                        "duration" : "PT00H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:TH"
                    }, {
                        "start" : "T110000",
                        "duration" : "PT01H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR,SA"
                    } ]
                }
            }, {
                "position" : [ 32.08992, 34.79071 ],
                "distance" : 595,
                "title" : "Roladin Bakery and Cafe",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "ויצמן\nהצפון החדש-כיכר המדינה, תל אביב-יפו, 62155",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-4dca30334eb243178d71313925349738;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTY?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376sv8wx-4dca30334eb243178d71313925349738"
            }, {
                "position" : [ 32.08581, 34.77895 ],
                "distance" : 612,
                "title" : "Eazy Cafe",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "76 ארלוזורוב\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-69a82171474e40879efe8068dad93cfa;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTc?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "fusion",
                    "title" : "Fusion",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-69a82171474e40879efe8068dad93cfa",
                "openingHours" : {
                    "text" : "Mon-Thu: 06:30 - 23:45\nFri: 06:30 - 17:30\nSat: 07:00 - 23:45\nSun: 09:00 - 23:45",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T063000",
                        "duration" : "PT17H15M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH"
                    }, {
                        "start" : "T063000",
                        "duration" : "PT11H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    }, {
                        "start" : "T070000",
                        "duration" : "PT16H45M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SA"
                    }, {
                        "start" : "T090000",
                        "duration" : "PT14H45M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SU"
                    } ]
                }
            }, {
                "position" : [ 32.08242, 34.78102 ],
                "distance" : 670,
                "title" : "Kanta - Drink N Dine Rooftop TLV",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "71 Ibn Gabirol\nTel Aviv-Yafo, Tel Aviv, 64162",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-bee92d940ee00e0728d4570a28f4f330;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTg?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "international",
                    "title" : "International",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-bee92d940ee00e0728d4570a28f4f330"
            }, {
                "position" : [ 32.09361, 34.78513 ],
                "distance" : 702,
                "title" : "Juno",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "יעקב דה האז\nהצפון החדש-האזור הצפוני, תל אביב-יפו, 62666",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376httek-5e047023ef910b007dc405e7f39601c1;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTk?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "italian",
                    "title" : "Italian",
                    "group" : "cuisine"
                } ],
                "id" : "376httek-5e047023ef910b007dc405e7f39601c1",
                "openingHours" : {
                    "text" : "Mon-Sun: 08:00 - 01:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T080000",
                        "duration" : "PT17H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.08109, 34.78148 ],
                "distance" : 774,
                "title" : "Ticker",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "bar-pub",
                    "title" : "Bar/Pub",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/bar-pub?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/22.icon",
                "vicinity" : "אבן גבירול\nהצפון החדש-האזור הדרומי, תל אביב-יפו, 64162",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-ac3450d96ddb09e92a188ba44a15796f;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTEw?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376aabd1-ac3450d96ddb09e92a188ba44a15796f"
            }, {
                "position" : [ 32.0806, 34.78147 ],
                "distance" : 824,
                "title" : "Landwer Cafe - Ibn Gabirol",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "70 Ibn Gabirol\nTel Aviv-Yafo, Tel Aviv, 64952",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-e35eab1c9aea42b58849024f483723b9;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTEx?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "international",
                    "title" : "International",
                    "group" : "cuisine"
                }, {
                    "id" : "italian",
                    "title" : "Italian",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-e35eab1c9aea42b58849024f483723b9",
                "chainIds" : [ "30835" ]
            }, {
                "position" : [ 32.0806, 34.78147 ],
                "distance" : 824,
                "title" : "Brasserie M&R",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "70 אבן גבירול\nהצפון החדש-האזור הדרומי, תל אביב-יפו, 64952",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-810941492aa944f498e03b55d63838f9;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTEy?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                }, {
                    "id" : "french",
                    "title" : "French",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-810941492aa944f498e03b55d63838f9",
                "openingHours" : {
                    "text" : "Mon: 07:30 - 13:00\nTue: 07:30 - 23:59\nWed-Sun: 00:00 - 23:59",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T073000",
                        "duration" : "PT05H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO"
                    }, {
                        "start" : "T073000",
                        "duration" : "PT16H29M",
                        "recurrence" : "FREQ:DAILY;BYDAY:TU"
                    }, {
                        "start" : "T000000",
                        "duration" : "PT23H59M",
                        "recurrence" : "FREQ:DAILY;BYDAY:WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.07959, 34.78158 ],
                "distance" : 923,
                "title" : "Tznovar",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "צייטלין\nהצפון החדש-האזור הדרומי, תל אביב-יפו, 64956",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-00adf72a74e50acf0c118edcbe555aef;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTEz?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "international",
                    "title" : "International",
                    "group" : "cuisine"
                }, {
                    "id" : "natural-healthy",
                    "title" : "Natural/Healthy",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-00adf72a74e50acf0c118edcbe555aef"
            }, {
                "position" : [ 32.08925, 34.77547 ],
                "distance" : 942,
                "title" : "Cafe Michal",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Meir Dizengoff\nTel Aviv-Yafo, Tel Aviv, 63115",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-840d0ecd407d07cc30678d06cfb32d65;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTE0?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "sandwich",
                    "title" : "Sandwiches",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-840d0ecd407d07cc30678d06cfb32d65",
                "openingHours" : {
                    "text" : "Mon-Wed, Sun: 07:30 - 01:00\nThu: 07:30 - 00:00\nFri: 08:30 - 20:00\nSat: 09:00 - 01:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T073000",
                        "duration" : "PT17H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,SU"
                    }, {
                        "start" : "T073000",
                        "duration" : "PT16H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:TH"
                    }, {
                        "start" : "T083000",
                        "duration" : "PT11H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    }, {
                        "start" : "T090000",
                        "duration" : "PT16H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SA"
                    } ]
                }
            }, {
                "position" : [ 32.08763, 34.77495 ],
                "distance" : 966,
                "title" : "Origem Fresh Coffee",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "203 מאיר דיזנגוף\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-3cd8dcfc81fc47d6bb9c0ab64d916f08;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTE1?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376sv8wx-3cd8dcfc81fc47d6bb9c0ab64d916f08",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 07:00 - 20:00\nFri, Sat: 08:00 - 16:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T070000",
                        "duration" : "PT13H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T080000",
                        "duration" : "PT08H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR,SA"
                    } ]
                }
            }, {
                "position" : [ 32.08607, 34.77497 ],
                "distance" : 973,
                "title" : "Fasada",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "196 מאיר דיזנגוף\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63462",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-f31e2ad11219066020d8539fadfd887a;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTE2?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376aabd1-f31e2ad11219066020d8539fadfd887a",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 18:30 - 02:00\nFri: 21:00 - 02:00\nSat: 17:00 - 02:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T183000",
                        "duration" : "PT07H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T210000",
                        "duration" : "PT05H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    }, {
                        "start" : "T170000",
                        "duration" : "PT09H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SA"
                    } ]
                }
            }, {
                "position" : [ 32.07984, 34.77972 ],
                "distance" : 977,
                "title" : "Ca Phe Hanoi",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "3 Malkhe Israel\nTel Aviv-Yafo, Tel Aviv, 64163",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wr-a603c73dca08412fb0175f62b6dfa5c4;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTE3?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "asian",
                    "title" : "Asian",
                    "group" : "cuisine"
                }, {
                    "id" : "vietnamese",
                    "title" : "Vietnamese",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wr-a603c73dca08412fb0175f62b6dfa5c4",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 18:00 - 00:00\nSat: 19:00 - 00:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T180000",
                        "duration" : "PT06H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T190000",
                        "duration" : "PT05H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SA"
                    } ]
                }
            }, {
                "position" : [ 32.08568, 34.77483 ],
                "distance" : 993,
                "title" : "Dizengoff Inn",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "hotel",
                    "title" : "Hotel",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/hotel?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/01.icon",
                "vicinity" : "190 מאיר דיזנגוף\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63462",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-3e32b3f7f0280732cd37490b773197d1;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTE4?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376aabd1-3e32b3f7f0280732cd37490b773197d1"
            }, {
                "position" : [ 32.07944, 34.77985 ],
                "distance" : 1009,
                "title" : "Gusto",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Sderot Hen\nTel Aviv-Yafo, Tel Aviv, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-b1de6daeab08080cfca724c9ae2d2b49;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTE5?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                }, {
                    "id" : "italian",
                    "title" : "Italian",
                    "group" : "cuisine"
                }, {
                    "id" : "pizza",
                    "title" : "Pizza",
                    "group" : "cuisine"
                }, {
                    "id" : "sea-food",
                    "title" : "Seafood",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-b1de6daeab08080cfca724c9ae2d2b49",
                "openingHours" : {
                    "text" : "Mon-Sun: 12:00 - 00:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T120000",
                        "duration" : "PT12H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.07932, 34.77952 ],
                "distance" : 1036,
                "title" : "Hummus Yanas",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "88 פרישמן\nהצפון הישן-האזור הדרומי, תל אביב-יפו, 64165",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wr-e6e5885bc3e74ffcae77597128908c35;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTIw?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "mediterranean",
                    "title" : "Mediterranean",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wr-e6e5885bc3e74ffcae77597128908c35",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 10:00 - 20:00\nFri: 10:00 - 16:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T100000",
                        "duration" : "PT10H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T100000",
                        "duration" : "PT06H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    } ]
                }
            }, {
                "position" : [ 32.09332, 34.77667 ],
                "distance" : 1046,
                "title" : "Simcha & Simli Aycd",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "bar-pub",
                    "title" : "Bar/Pub",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/bar-pub?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/22.icon",
                "vicinity" : "מאיר דיזנגוף\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63117",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-b68776d2551802b810393ec96ef63b76;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTIx?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376aabd1-b68776d2551802b810393ec96ef63b76"
            }, {
                "position" : [ 32.0783, 34.78885 ],
                "distance" : 1058,
                "title" : "Liliyot",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "דפנה\nהצפון החדש-האזור הדרומי, תל אביב-יפו, 64928",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-16d6972bfbf50931221a3b85e5859e53;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTIy?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-16d6972bfbf50931221a3b85e5859e53",
                "alternativeNames" : [ {
                    "name" : "ליליות",
                    "language" : "he"
                } ]
            }, {
                "position" : [ 32.07906, 34.77919 ],
                "distance" : 1077,
                "title" : "Shem Tov",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "14 שדרות מסריק\nהצפון הישן-האזור הדרומי, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376httek-4e2e6ebd541e0c318fb37333a7c6b8e2;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTIz?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376httek-4e2e6ebd541e0c318fb37333a7c6b8e2",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 18:00 - 02:00\nFri: 21:00 - 03:00\nSat: 20:00 - 02:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T180000",
                        "duration" : "PT08H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T210000",
                        "duration" : "PT06H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    }, {
                        "start" : "T200000",
                        "duration" : "PT06H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SA"
                    } ]
                }
            }, {
                "position" : [ 32.0897, 34.77405 ],
                "distance" : 1084,
                "title" : "JAVA",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "196 Ben Yehuda\nTel Aviv-Yafo, Tel Aviv, 63472",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-bf539aa2317303e4ca7ae3a4ab63c495;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTI0?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "breakfast",
                    "title" : "Breakfast",
                    "group" : "cuisine"
                }, {
                    "id" : "fusion",
                    "title" : "Fusion",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "middle-eastern",
                    "title" : "Middle Eastern",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-bf539aa2317303e4ca7ae3a4ab63c495",
                "openingHours" : {
                    "text" : "Mon-Sun: 07:00 - 02:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T070000",
                        "duration" : "PT19H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.09022, 34.77421 ],
                "distance" : 1085,
                "title" : "Under the Tree",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "202 בן יהודה\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63472",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376d408k-7c8fd8552d87014050dbef9f02e099f8;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTI1?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376d408k-7c8fd8552d87014050dbef9f02e099f8",
                "openingHours" : {
                    "text" : "Mon-Thu, Sat, Sun: 00:00 - 23:59\nFri: 00:00 - 17:30",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T000000",
                        "duration" : "PT23H59M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SA,SU"
                    }, {
                        "start" : "T000000",
                        "duration" : "PT17H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    } ]
                }
            }, {
                "position" : [ 32.07795, 34.7815 ],
                "distance" : 1097,
                "title" : "רסטו",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "54 אבן גבירול\nהצפון החדש-האזור הדרומי, תל אביב-יפו, 64364",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wr-8cb8d0766c32410aa45a5de8b2485eab;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTI2?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "french",
                    "title" : "French",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wr-8cb8d0766c32410aa45a5de8b2485eab",
                "openingHours" : {
                    "text" : "Mon-Thu: 12:00 - 23:00\nFri: 12:00 - 15:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T120000",
                        "duration" : "PT11H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH"
                    }, {
                        "start" : "T120000",
                        "duration" : "PT03H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    } ]
                }
            }, {
                "position" : [ 32.09515, 34.77815 ],
                "distance" : 1097,
                "title" : "VIVI Trina",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "47 ירמיהו\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-9dedfa19caee4105adbf08011199cf31;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTI3?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "american",
                    "title" : "American",
                    "group" : "cuisine"
                }, {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                }, {
                    "id" : "spanish",
                    "title" : "Spanish",
                    "group" : "cuisine"
                }, {
                    "id" : "tapas",
                    "title" : "Tapas",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-9dedfa19caee4105adbf08011199cf31"
            }, {
                "position" : [ 32.08417, 34.7741 ],
                "distance" : 1102,
                "title" : "Mila",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "מאיר דיזנגוף\nהצפון הישן-האזור הדרומי, תל אביב-יפו, 63461",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-1a9e076c7c5900dba9732b1e20aa343c;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTI4?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376aabd1-1a9e076c7c5900dba9732b1e20aa343c",
                "openingHours" : {
                    "text" : "Mon-Thu, Sat, Sun: 03:00 - 17:00",
                    "label" : "Opening hours",
                    "isOpen" : false,
                    "structured" : [ {
                        "start" : "T030000",
                        "duration" : "PT14H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.08472, 34.77377 ],
                "distance" : 1114,
                "title" : "Allora Bg",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "שדרות בן גוריון\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63467",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-e2d1e838abab021b7d1895c30276d28d;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTI5?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                }, {
                    "id" : "italian",
                    "title" : "Italian",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-e2d1e838abab021b7d1895c30276d28d",
                "openingHours" : {
                    "text" : "Mon-Sun: 12:00 - 00:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T120000",
                        "duration" : "PT12H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.07736, 34.78675 ],
                "distance" : 1115,
                "title" : "Pastel",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "27 שדרות שאול המלך\nהצפון החדש-האזור הדרומי, תל אביב-יפו, 64239",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-735d4dd089500590457b7b9aa18aaf3b;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTMw?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "mediterranean",
                    "title" : "Mediterranean",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-735d4dd089500590457b7b9aa18aaf3b",
                "openingHours" : {
                    "text" : "Mon-Sun: 12:00 - 00:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T120000",
                        "duration" : "PT12H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.08969, 34.77368 ],
                "distance" : 1117,
                "title" : "Benedict",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Ben Yehuda\nTel Aviv-Yafo, Tel Aviv, 63472",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-55ae50369e2f0ae77d2aede92e282a13;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTMx?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "american",
                    "title" : "American",
                    "group" : "cuisine"
                }, {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-55ae50369e2f0ae77d2aede92e282a13",
                "openingHours" : {
                    "text" : "Mon-Wed, Sat, Sun: 08:00 - 23:45\nThu, Fri: 00:00 - 23:59",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T080000",
                        "duration" : "PT15H45M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,SA,SU"
                    }, {
                        "start" : "T000000",
                        "duration" : "PT23H59M",
                        "recurrence" : "FREQ:DAILY;BYDAY:TH,FR"
                    } ]
                }
            }, {
                "position" : [ 32.08714, 34.77329 ],
                "distance" : 1122,
                "title" : "Halevantini",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "170 בן יהודה\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63403",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-a0de27614ff246ef87f14ee02f140cc8;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTMy?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "grill",
                    "title" : "Grill",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "mediterranean",
                    "title" : "Mediterranean",
                    "group" : "cuisine"
                }, {
                    "id" : "middle-eastern",
                    "title" : "Middle Eastern",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-a0de27614ff246ef87f14ee02f140cc8",
                "openingHours" : {
                    "text" : "Mon-Sun: 11:00 - 00:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T110000",
                        "duration" : "PT13H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.09452, 34.77678 ],
                "distance" : 1129,
                "title" : "Piazza",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "מאיר דיזנגוף\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-2851eef7ccd84da196c8dd58cf968836;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTMz?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "italian",
                    "title" : "Italian",
                    "group" : "cuisine"
                }, {
                    "id" : "pizza",
                    "title" : "Pizza",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-2851eef7ccd84da196c8dd58cf968836",
                "openingHours" : {
                    "text" : "Mon-Sun: 12:00 - 00:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T120000",
                        "duration" : "PT12H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.08797, 34.79722 ],
                "distance" : 1135,
                "title" : "Hummus Habikta",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "אלוני ניסים\nצמרות איילון, תל אביב-יפו, 62919",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-23b8c974f14f453eb526d369a63da60d;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTM0?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "mediterranean",
                    "title" : "Mediterranean",
                    "group" : "cuisine"
                }, {
                    "id" : "middle-eastern",
                    "title" : "Middle Eastern",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-23b8c974f14f453eb526d369a63da60d"
            }, {
                "position" : [ 32.08764, 34.77313 ],
                "distance" : 1138,
                "title" : "Nonno Angelo",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "147 אליעזר בן יהודה\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63403",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-bb64e0a27deb07f3764bde9107c741fb;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTM1?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "italian",
                    "title" : "Italian",
                    "group" : "cuisine"
                }, {
                    "id" : "pizza",
                    "title" : "Pizza",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-bb64e0a27deb07f3764bde9107c741fb",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 00:00 - 23:59\nSat: 12:00 - 19:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T000000",
                        "duration" : "PT23H59M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T120000",
                        "duration" : "PT07H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SA"
                    } ]
                }
            }, {
                "position" : [ 32.09471, 34.77668 ],
                "distance" : 1150,
                "title" : "Jeremiah Cafe",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Meir Dizengoff\nTel Aviv-Yafo, Tel Aviv, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-fb89705da61b0e223d1521ccd26e4c8b;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTM2?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "grill",
                    "title" : "Grill",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-fb89705da61b0e223d1521ccd26e4c8b",
                "openingHours" : {
                    "text" : "Mon-Sun: 07:30 - 01:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T073000",
                        "duration" : "PT17H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.0775, 34.78915 ],
                "distance" : 1152,
                "title" : "Meatos",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Sderot Sha'ul HaMelekh\nTel Aviv-Yafo, Tel Aviv, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-f28fcba3d04401c69bccf9f59ec7f6cb;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTM3?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "american",
                    "title" : "American",
                    "group" : "cuisine"
                }, {
                    "id" : "grill",
                    "title" : "Grill",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "steak",
                    "title" : "Steak",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-f28fcba3d04401c69bccf9f59ec7f6cb",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 09:00 - 17:00",
                    "label" : "Opening hours",
                    "isOpen" : false,
                    "structured" : [ {
                        "start" : "T090000",
                        "duration" : "PT08H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    } ]
                }
            }, {
                "position" : [ 32.08584, 34.77303 ],
                "distance" : 1158,
                "title" : "Vatrushka",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "146 בן יהודה\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63402",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-88d3e2f964650806802977f3b4986e60;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTM4?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "european",
                    "title" : "European",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-88d3e2f964650806802977f3b4986e60",
                "openingHours" : {
                    "text" : "Mon, Wed, Thu: 18:00 - 23:30\nTue: 14:00 - 23:30\nFri, Sat: 12:00 - 23:30\nSun: 18:00 - 22:30",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T180000",
                        "duration" : "PT05H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,WE,TH"
                    }, {
                        "start" : "T140000",
                        "duration" : "PT09H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:TU"
                    }, {
                        "start" : "T120000",
                        "duration" : "PT11H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR,SA"
                    }, {
                        "start" : "T180000",
                        "duration" : "PT04H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SU"
                    } ]
                }
            }, {
                "position" : [ 32.09487, 34.77674 ],
                "distance" : 1159,
                "title" : "FU Sushi",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Yirmiyahu\nTel Aviv-Yafo, Tel Aviv, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-d9b9999fa3ce0cef8440f31f8e7633c2;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTM5?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "asian",
                    "title" : "Asian",
                    "group" : "cuisine"
                }, {
                    "id" : "japanese",
                    "title" : "Japanese",
                    "group" : "cuisine"
                }, {
                    "id" : "sushi",
                    "title" : "Japanese - Sushi",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-d9b9999fa3ce0cef8440f31f8e7633c2",
                "openingHours" : {
                    "text" : "Mon-Sun: 12:00 - 00:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T120000",
                        "duration" : "PT12H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.0794, 34.77714 ],
                "distance" : 1161,
                "title" : "Foster",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "going-out",
                    "title" : "Going Out",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/going-out?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/05.icon",
                "vicinity" : "Shlomo HaMelekh\nTel Aviv-Yafo, Tel Aviv, 64378",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-b7aeaed7e9f6052374064773fa6eff6e;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQw?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-b7aeaed7e9f6052374064773fa6eff6e"
            }, {
                "position" : [ 32.09474, 34.77647 ],
                "distance" : 1167,
                "title" : "Rosa Parks Bar",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "going-out",
                    "title" : "Going Out",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/going-out?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/05.icon",
                "vicinity" : "Meir Dizengoff\nTel Aviv-Yafo, Tel Aviv, 63117",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-5b7a60cc295d0d8b3f0c882a82f8531e;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQx?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376jx7ps-5b7a60cc295d0d8b3f0c882a82f8531e",
                "openingHours" : {
                    "text" : "Mon-Sun: 18:00 - 03:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T180000",
                        "duration" : "PT09H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.09489, 34.77577 ],
                "distance" : 1225,
                "title" : "Mexicana Yermiyaho",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "ירמיהו\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wx-87a1ed74a4734e2eb22e4a74b95ddbc3;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQy?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "mexican",
                    "title" : "Mexican",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wx-87a1ed74a4734e2eb22e4a74b95ddbc3"
            }, {
                "position" : [ 32.08072, 34.77469 ],
                "distance" : 1231,
                "title" : "Regev",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "ישראליס\nהצפון הישן-האזור הדרומי, תל אביב-יפו, 64382",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-76937715f11d001266f8a1bf97eb9408;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQz?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "international",
                    "title" : "International",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-76937715f11d001266f8a1bf97eb9408"
            }, {
                "position" : [ 32.09514, 34.77567 ],
                "distance" : 1251,
                "title" : "Shtsupak",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "256 בן יהודה\nהצפון הישן-האזור הצפוני, תל אביב-יפו, 63501",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-02a4af2a72cb0b78dde0c2e87a85549c;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQ0?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "mediterranean",
                    "title" : "Mediterranean",
                    "group" : "cuisine"
                }, {
                    "id" : "middle-eastern",
                    "title" : "Middle Eastern",
                    "group" : "cuisine"
                }, {
                    "id" : "sea-food",
                    "title" : "Seafood",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-02a4af2a72cb0b78dde0c2e87a85549c",
                "openingHours" : {
                    "text" : "Mon-Sun: 12:00 - 23:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T120000",
                        "duration" : "PT11H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,FR,SA,SU"
                    } ]
                }
            }, {
                "position" : [ 32.08134, 34.77361 ],
                "distance" : 1277,
                "title" : "Meat-Pack",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "125 מאיר דיזנגוף\nהצפון הישן-האזור הדרומי, תל אביב-יפו, 64397",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-4ff599f57b2507df59dbe6c00833ea95;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQ1?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "american",
                    "title" : "American",
                    "group" : "cuisine"
                }, {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-4ff599f57b2507df59dbe6c00833ea95"
            }, {
                "position" : [ 32.07961, 34.77504 ],
                "distance" : 1284,
                "title" : "Anastasia Cafe",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "Reines\nTel Aviv-Yafo, Tel Aviv, 64381",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376jx7ps-99af5a4db3280713cb92cb6740a0af29;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQ2?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                }, {
                    "id" : "natural-healthy",
                    "title" : "Natural/Healthy",
                    "group" : "cuisine"
                }, {
                    "id" : "vegan",
                    "title" : "Vegan",
                    "group" : "cuisine"
                } ],
                "id" : "376jx7ps-99af5a4db3280713cb92cb6740a0af29",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 08:00 - 23:30\nFri: 08:00 - 17:00\nSat: 09:00 - 23:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T080000",
                        "duration" : "PT15H30M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T080000",
                        "duration" : "PT09H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    }, {
                        "start" : "T090000",
                        "duration" : "PT14H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:SA"
                    } ]
                }
            }, {
                "position" : [ 32.08067, 34.77395 ],
                "distance" : 1291,
                "title" : "Cookeez",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "116 Meir Dizengoff\nTel Aviv-Yafo, Tel Aviv, 64397",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-4ec3602480ff0a1e4773bc0739b00e64;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQ3?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "ice-cream",
                    "title" : "Ice cream",
                    "group" : "cuisine"
                } ],
                "id" : "376aabd1-4ec3602480ff0a1e4773bc0739b00e64",
                "openingHours" : {
                    "text" : "Mon-Wed, Sun: 11:00 - 02:00\nThu: 11:00 - 03:00\nFri, Sat: 10:00 - 03:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T110000",
                        "duration" : "PT15H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,SU"
                    }, {
                        "start" : "T110000",
                        "duration" : "PT16H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:TH"
                    }, {
                        "start" : "T100000",
                        "duration" : "PT17H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR,SA"
                    } ]
                }
            }, {
                "position" : [ 32.08105, 34.77362 ],
                "distance" : 1294,
                "title" : "Dizzy Frishdon",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "bar-pub",
                    "title" : "Bar/Pub",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/bar-pub?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/22.icon",
                "vicinity" : "121 Meir Dizengoff\nTel Aviv-Yafo, Tel Aviv, 64397",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376aabd1-c2df27390ee40cf2eb87e6d00c8b5acf;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQ4?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "id" : "376aabd1-c2df27390ee40cf2eb87e6d00c8b5acf"
            }, {
                "position" : [ 32.07586, 34.78141 ],
                "distance" : 1321,
                "title" : "Zoti and Julia",
                "averageRating" : 0.0,
                "category" : {
                    "id" : "restaurant",
                    "title" : "Restaurant",
                    "href" : "https://places.cit.api.here.com/places/v1/categories/places/restaurant?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                    "type" : "urn:nlp-types:category",
                    "system" : "places"
                },
                "icon" : "https://download.vcdn.cit.data.here.com/p/d/places2_stg/icons/categories/03.icon",
                "vicinity" : "37 אבן גבירול\nהצפון הישן-האזור הדרומי, תל אביב-יפו, 60000",
                "having" : [ ],
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/376sv8wr-473e3c953d194d4a9cdfcad032ee4fa2;context=Zmxvdy1pZD0yM2Y3Y2Y3Mi0zZWFiLTU5MGItYjM4Zi0yNTlkYTM4NGQ5ZmFfMTU3NTU2ODM0ODE3OF8wXzc1NSZyYW5rPTQ5?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg",
                "tags" : [ {
                    "id" : "jewish-kosher",
                    "title" : "Jewish/Kosher",
                    "group" : "cuisine"
                } ],
                "id" : "376sv8wr-473e3c953d194d4a9cdfcad032ee4fa2",
                "openingHours" : {
                    "text" : "Mon-Thu, Sun: 07:00 - 22:00\nFri: 07:00 - 16:00",
                    "label" : "Opening hours",
                    "isOpen" : true,
                    "structured" : [ {
                        "start" : "T070000",
                        "duration" : "PT15H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SU"
                    }, {
                        "start" : "T070000",
                        "duration" : "PT09H00M",
                        "recurrence" : "FREQ:DAILY;BYDAY:FR"
                    } ]
                }
            } ]
        },
        "search" : {
            "context" : {
                "location" : {
                    "position" : [ 32.0873, 34.7852 ],
                    "address" : {
                        "text" : "106 Jabotinsky\nThe New North-Hamedina Square Area, Tel Aviv-Yafo, 62191\nIsrael",
                        "house" : "106",
                        "street" : "Jabotinsky",
                        "postalCode" : "62191",
                        "district" : "The New North-Hamedina Square Area",
                        "city" : "Tel Aviv-Yafo",
                        "county" : "Tel-Aviv",
                        "stateCode" : "Tel Aviv",
                        "country" : "Israel",
                        "countryCode" : "ISR"
                    }
                },
                "type" : "urn:nlp-types:place",
                "href" : "https://places.cit.api.here.com/places/v1/places/loc-dmVyc2lvbj0xO3RpdGxlPTEwNitKYWJvdGluc2t5O2xhdD0zMi4wODczO2xvbj0zNC43ODUyO3N0cmVldD1KYWJvdGluc2t5O2hvdXNlPTEwNjtjaXR5PVRlbCtBdml2LVlhZm87cG9zdGFsQ29kZT02MjE5MTtjb3VudHJ5PUlTUjtkaXN0cmljdD1UaGUrTmV3K05vcnRoLUhhbWVkaW5hK1NxdWFyZStBcmVhO3N0YXRlQ29kZT1UZWwrQXZpdjtjb3VudHk9VGVsLUF2aXY7Y2F0ZWdvcnlJZD1idWlsZGluZztzb3VyY2VTeXN0ZW09aW50ZXJuYWw;context=c2VhcmNoQ29udGV4dD0x?app_id=dLTl8rm64f8Shyip9Yxd&app_code=BL52JEBvt3ky7ZbZvYIxDg"
            }
        }
    }
    let randomIndex: number = Math.floor(Math.random() * (50));
    let randomItem: any = placesForTal.results.items[randomIndex];
    response.send("Tal! You must enjoy Tel Aviv more... Here's a great place I can recommend:\n\n " +
        "Name: " + randomItem.title + "\n" +
        "Where: " + randomItem.vicinity + "\n" +
        "Distance±: " + randomItem.distance + "\n" +
        "What: " + randomItem.category.id + "\n"
    );
});

export const appVersionInfo = functions.https.onRequest((request, response) => {
    let text:string = request.body.text;
    if (text) {
        let requestedApp:string = text.split(" ")[0].toLowerCase();
        let requestedPlatform:string = text.split(" ")[1].toLowerCase();
        let appData:any = apps["appsInfo"][requestedApp][requestedPlatform];
        let gameName: string = requestedApp=="pop" ? "Planet Of Pixels" : "Matific Monster Collection";
        let responseBlock = {
            "blocks": [{
                "type": "section",
                "text":{
                    "type": "mrkdwn",
                    "text": "========== Game: "+ gameName +"=========="
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Date:*\n"+appData["date"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Version:*\n"+appData["version"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Infra Version:*\n"+appData["infraVersion"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Notes:*\n<"+appData["notes"]
                    }
                ]
            }]
        };
        response.send(responseBlock);
    }
    else {
        let responseBlock = {
            "blocks": [{
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Choose a game!"
                },
                "accessory": {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Game"
                    },
                    "options": [
                        {
                            "text": {"type": "plain_text", "text": "POP"},
                            "value": "pop"
                        },
                        {
                            "text": {"type": "plain_text", "text": "MMC"},
                            "value": "mmc"
                        }]
                }
            },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Choose a platform!"
                    },
                    "accessory": {
                        "type": "static_select",
                        "placeholder": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": "Platform"
                        },
                        "options": [
                            {
                                "text": {"type": "plain_text", "text": "IOS"},
                                "value": "ios"
                            },
                            {
                                "text": {"type": "plain_text", "text": "Android"},
                                "value": "android"
                            },
                            {
                                "text": {"type": "plain_text", "text": "Web"},
                                "value": "web"
                            }
                        ]
                    }
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "Search"
                    }
                }
            ]
        };
        response.send(responseBlock);
    }
});

export const knowledgebase = functions.https.onRequest(async(request, response) => {
    let search:string = request.body.text;
    response.send("https://sites.google.com/search/slatescience.com/knowledgebase?query="+search);
});

export const localizationInfo = functions.https.onRequest(async(request, response) => {
    let language:string = request.body.text;
    let specificLanguageInfo = {};
    let found = false;
    for (let languageInfo of languages_info["languages"]){
        if (languageInfo["name"].toLowerCase() == language.toLowerCase()){
            found = true;
            specificLanguageInfo = languageInfo;
        }
    }
    if (!found){
        for (let languageInfo of languages_info["languages"]){
            if (languageInfo["code"].toLowerCase() == language.toLowerCase()){
                found = true;
                specificLanguageInfo = languageInfo;
            }
        }
    }
    if (!found) {
        response.send("Could not find language/code: "+language);
    }

    let infoResponse:any = {
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "========== Language: "+specificLanguageInfo["name"]+" =========="
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*code:*\n"+specificLanguageInfo["code"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Transifex Code:*\n"+specificLanguageInfo["transifexCode"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Geographic Locale:*\n"+specificLanguageInfo["geographicLocale"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Voiceover Enabled?:*\n"+specificLanguageInfo["enableVoiceOver"]
                    },
                    {
                        "type": "mrkdwn",
                        "text": "*Machine Voiceover Enabled?:*\n"+specificLanguageInfo["enableMachineVoiceover"]
                    }
                ]
            }
        ]
    };
    response.send(infoResponse);
});

