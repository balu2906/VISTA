`use strict`;
const axios = require('axios');
const cheerio = require('cheerio');

const getScrap = async (req, res) => {
    try {
      let pageNumber = 1;
      var baseUrl = `https://news.ycombinator.com/`
      var allData = {};

      allData[`0-100`] = [];
      allData[`101-200`] = [];
      allData[`201-300`] = [];
      allData[`301-n`] = [];
  
      while (true) {
        console.log(`STARTED FETCHING ::PAGE:${pageNumber}`)
        const url = `${baseUrl}?p=${pageNumber}`;
        let rawData = await fetchJson(url); 
        if (rawData.length === 0) {
          console.log("MAXIMUM PAGES LOADED");
          break;
        }
        rawData.forEach(element => {
            let count = element.comment;
            var range = getRangeLabel(count);
            allData[range].push(element);
        });
        const response = await axios.get(url).catch(err => { return res.send(allData) })
        const html = response.data;
        const $ = cheerio.load(html);
        if(!$('a.morelink').text().trim()){console.log("MAXIMUM PAGES LOADED");break;}
        pageNumber++;
      }
      return res.send(allData);
    } catch (error) {
      console.error('Error scraping data:', error);
      return res.send([]) // Return empty array in case of error
    }
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
    return new Promise(async (resolve,reject) => {
        const dataArray = [];
        try {
            const response = await axios.get(scrapurl);
            const html = response.data;
            const $ = cheerio.load(html);
            $('td.title').each((index, element) => {
                let obj = {
                    title: '',
                    comment: ''
                }
                obj.title = $(element).find('a').text().trim();
                const subtextTd = $(element).closest('tr').next().find('td.subtext');
                obj.comment = subtextTd.find('a').last().text().trim();
                obj.comment = obj.comment.match(/\d+/)? parseInt(obj.comment.match(/\d+/)[0]) : 0;
                if(obj.title){
                    dataArray.push(obj);
                }
              });
            return resolve(dataArray)
        } catch (error) {
            return resolve(dataArray)
        }
    })
} 
module.exports = {
    getScrap
}

