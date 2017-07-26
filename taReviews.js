var express = require('express');
var request = require('request');
var app = express();
var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until;
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/', function(req, res) {
  var driver = new webdriver.Builder()
    .forBrowser('phantomjs')
    .build();
  var start = new Date().getTime();
  var toReturn = {};
  toReturn.reviews = []
  if (req.query.risid == undefined) {
    driver.get("https://www.google.it/search?q=" + req.query.ris.replace(/ /g, "+") + "+" + req.query.citta.replace(/ /g, "+") + "+tripadvisor")
    driver.wait(until.elementsLocated(By.css('#rso > div > div > div:nth-child(1) > div > div > h3 > a')), 4000);
    driver.findElement(By.css("#rso > div > div > div:nth-child(1) > div > div > h3 > a")).click()
    driver.wait(until.elementLocated(By.id('HEADING')), 10000);
    driver.wait(until.elementLocated(By.id('span.taLnk.ulBlueLinks')), 1000)
      .then(driver.findElement(By.css("span.taLnk.ulBlueLinks")).click()
        .then(_ => {
          getData()
          findReviews()
        }, _ => {
          getData()
          findReviews()
        }), _ => {
          getData()
          findReviews()
        })
  } else {
    driver.get('https://www.tripadvisor.it/Restaurant_Review-' + req.query.placeid +
      '-' + req.query.risid + '-Reviews-or' + req.query.page + '0')
    driver.wait(until.elementLocated(By.id('HEADING')), 10000)
      .then(driver.findElement(By.css("span.taLnk.ulBlueLinks")).click()
        .then(_ => {
          getData()
          findReviews()
        }, _ => {
          getData()
          findReviews()
        }))
  }

  function getData() {
    var p1 = driver.getCurrentUrl()
    var p2 = driver.findElement(By.css("#taplc_location_reviews_list_0 > div.prw_rup.prw_common_north_star_pagination > div > span.nav.next"))
      .then(elem => elem.getAttribute("class"))
    var p3 = driver.findElement(By.css("#taplc_location_detail_overview_restaurant_0 > div.block_wrap > div.overviewContent > div.ui_columns.is-multiline.is-mobile.reviewsAndDetails > div.ui_column.is-6.reviews > div.rating > span"))
      .then(elem => elem.getText())
    var p4 = driver.findElement(By.css("#taplc_location_detail_overview_restaurant_0 > div.block_wrap > div.overviewContent > div.ui_columns.is-multiline.is-mobile.reviewsAndDetails > div.ui_column.is-6.reviews > div.rating > a"))
      .then(elem => elem.getText())
    Promise.all([p1, p2, p3, p4])
      .then(values => {
        var urlData = values[0].split("-");
        toReturn.placeId = urlData[1];
        toReturn.risId = urlData[2];
        toReturn.hasNext = values[1].indexOf("disabled") == -1;
        toReturn.avgRating = values[2].replace(",", ".");
        toReturn.numReviews = values[3].split(" ")[0];
      })
  }

  function findReviews() {
    driver.findElements(By.css("#taplc_location_reviews_list_0 > div.review-container"))
      .then(elems => {
        for (var i in elems)
          scrapeData(elems[i]);
      })
      .then(_ => {
        res.json(toReturn)
        var end = new Date().getTime();
        var time = end - start;
        console.log('Execution time: ' + time);
        driver.quit();
      })
  }

  function scrapeData(div) {
    var pUtente = div.findElement(By.css("div.ui_column.is-2 span.expand_inline.scrname"))
      .then(span => span.getText())
    var pImg = div.findElement(By.css("img.centeredImg"))
      .then(img => img.getAttribute("src"))
    var pRating = div.findElement(By.css("span.ui_bubble_rating"))
      .then(span => span.getAttribute("class"))
    var pData = div.findElement(By.css("span.ratingDate"))
      .then(span => span.getAttribute("title"))
    var pTitle = div.findElement(By.css("span.noQuotes"))
      .then(span => span.getText())
    var pText = pText = div.findElement(By.css("p.partial_entry"))
      .then(p => p.getText())
    Promise.all([pUtente, pImg, pRating, pData, pTitle, pText])
      .then(values => {
        var r8 = values[2].split(" ")[1].split("_")[1].split("0")[0];
        toReturn.reviews.push({
          author_name: values[0],
          profile_photo_url: values[1],
          rating: r8,
          relative_time_description: values[3],
          title: values[4],
          text: values[5],
        })
      })
  }
})

app.listen(8083, function() {
  console.log('Example app listening on port 8083!');
});