`use strict`;

const https = require("https");
const fs = require("fs");

const getScrap = async (req, res) => {
    try {
      let pageNumber = 1;
      var baseUrl = `https://news.ycombinator.com/`
      var allData = {};
      const expiryTimeInSeconds = 25;

      allData[`0-100`] = [];
      allData[`101-200`] = [];
      allData[`201-300`] = [];
      allData[`301-n`] = [];
      let path = "/temp/scrapedfile.json" 

      fs.open(path,'r',async (err,fd) => {
          if(!err){
                const data = fs.readFileSync(path, 'utf8');
                return res.send(JSON.parse(data))
          }
          else {
            while (true) {
                console.log(`STARTED FETCHING ::PAGE:${pageNumber}`)
                const url = `${baseUrl}?p=${pageNumber}`;
                console.log(url , " :: TO BE FETCHED")
                let rawData = await fetchJson(url);
                if (rawData.length === 0) {
                    console.log("MAXIMUM PAGES LOADED");
                    break;
                }
                rawData.forEach(element => {
                    let count = element.comments;
                    var range = getRangeLabel(count);
                    allData[range].push(element);
                });
                let MoreMatchs = await hasMorePages(url);
                
                console.log("MoreMatches :: ",MoreMatchs)
                if(!MoreMatchs){console.log("MAXIMUM PAGES LOADED 123 ");break;}
                pageNumber++;
            }
            fs.writeFileSync(path, JSON.stringify(allData));
            setInterval(() => {
                if (fs.existsSync(path)) {
                  deleteFile(path);
                }
            }, expiryTimeInSeconds * 1000);
            return res.send(allData);   
          }
      })

    } catch (error) {
        console.error('Error scraping data:', error);
        return res.send([])
    }
}

var hasMorePages = (url) => {
    return new Promise((resolve,reject) => {
        https.get(url, response => {
            let HasMore = false
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            })
            response.on('end', () => {
                let MoreLinkRegex = /<a[^>]*>More<\/a>/gi;
                let matches =  MoreLinkRegex.exec(data);
                const moreLinks = matches ? matches.map(match => match.replace(/<[^>]*>/g, '')) : [];
                if(moreLinks.length) HasMore = true;
                return resolve(HasMore)
            })
            response.on('error' , () => {
                return resolve(false)
            } )
    
        });
    })

}

function getRangeLabel(count) {
    if (count < 100) {
        return '0-100';
    } else if (count < 200) {
        return '101-200';
    } else if (count < 300) {
        return '201-300';
    } else {
        return '301-n';
    }
}

var fetchJson = async (scrapurl) => {
    return new Promise(async (resolve, reject) => {
        const dataArray = [];
        https.get(scrapurl, response => {
            let data = '';
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => {
                const titleRegex = /<td class="title"><span class="titleline"><a.*?>(.*?)<\/a>/g;
                const commentsRegex = /(\d+)\s*&nbsp;comments/g;
                let match;
                while ((match = titleRegex.exec(data)) !== null) {
                    const title = match[1].trim();
                    const commentsMatch = commentsRegex.exec(data);
                    const comments = commentsMatch ? commentsMatch[1].trim() : '0';
                    dataArray.push({ title, comments });
                }

                return resolve(dataArray)
            });
        }).on('error', error => {
            resolve(dataArray);
        });
    })
} 

let deleteFile = (path) => {
    try {
        fs.unlinkSync(path);
        console.log('File deleted successfully.');
      } catch (err) {
        console.error('Error deleting file:', err);
      }
}

module.exports = {
    getScrap
}

