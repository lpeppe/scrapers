var express = require('express');
var cheerio = require('cheerio');
const NodeCache = require("node-cache");
var request = require('request');
var app = express();
var json =[]
const myCache = new NodeCache();

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/wiki', function (req, res) {

   var url = 'https://www.google.it/search?q='+  replaceAll(req.query.attr,' ','+') +'+'+req.query.loc + "+wikipedia";

   var attr = req.query.attr
   url=replaceAll(url,"’",'%27')

  request(url,function(error,response, body){
    json = []

      if(!error && response.statusCode == 200){
        $ = cheerio.load(body);
        var href = ""
        var trovato = false
        //inizio

        var risul = $('html').find($('h3.r'))
          risul.each(function(i,elem){
              var primo = $(this)
              href=  primo.html()

              if(primo.next().text().includes(" pagina di disambiguazione"))
                return
              href = href.split('&amp')[0];
              href = href.split('/url?q=')[1]

              if(href == undefined)
                  return
              href =replaceAll(href,'%2527','%27')

              href = replaceAll(href,'%25C3%25B2','ò')
              href = replaceAll(href,'%25C3%25A0','à')

              if(href.includes("it.wikipedia.org" ) && !href.includes(".jpg")){
                var attr = href.split("/wiki/")[1]
                var attr2 = req.query.attr

                attr2 = attr2.replace(/ *\([^)]*\) */g, " ")
                attr2 =replaceAll(attr2," ","_")
                attr2 =replaceAll(attr2,"'","%27")

                          var name = req.query.loc
                          name =replaceAll(name," ","_")
                          name =replaceAll(name,"'","%27")
                          var array = attr2.split("-")
                           //name = name[0].toUpperCase() + name.substring(1)
                           // .match(/\(([^)]+)\)/)[1]
                  for(i = 0 ; i < array.length; i++){
                    var elem = array[i]
                  if(similarity(attr2.toLowerCase().split("_("+name+")")[0],attr.toLowerCase().split("_("+name+")")[0]) >= 0.55 || attr.toLowerCase() == name || attr.toLowerCase().includes(name) || similarity(elem.toLowerCase().split("_("+name+")")[0],attr.toLowerCase().split("_("+name+")")[0]) >= 0.55){
                    if(attr.toLowerCase().includes("_("+name+")")){
                        if(similarity(elem.toLowerCase().split('_('+name+')')[0],attr.toLowerCase().split("_("+name+")")[0]) < 0.55)
                            continue
                    }
                    trovato = true
                    return false
                  }

                  else if(similarity(attr,attr2) > 0.4){

                      $('body').find('h2').remove()
                      var trovato2 = true
                      attr = attr.split("(")[0]
                      var parole = attr.toLowerCase().split("_")
                      for(i =0 ; i< parole.length; i++){
                        if(!attr2.toLowerCase().includes(parole[i])){
                          trovato2 = false;
                          break;
                        }
                      }
                      if(trovato2){
                        trovato = true
                        return false;}
                      else{
                        return
                      }
                  }
                  //fine

                }
                if(!trovato) {
                  return
                }
                  //inizio

              }
          })

        if(!trovato){
          json.push({
            attr : "<span class =\"assente\">descrizione non disponibile</span>"
          })
          res.send(json)
        }
        request(href,function(error,response, body){

        if(!error && response.statusCode == 200 && json.length < 1){
          var name = req.query.loc
          name =replaceAll(name," ","_")
          name =replaceAll(name,"'","%27")
           var $ = cheerio.load(body);
           var localita = $('html').text().toLowerCase().includes(req.query.loc)
          if(similarity(href.toLowerCase(),'https://it.wikipedia.org/wiki/'+name) > 0.87){

              $('html').text().includes(req.query.loc)
              var parag = ""
              $('sup').remove();
              $('span.mw-editsection').remove()
              var titles = $('body').find('span.mw-headline')
                // confronto per similaritá
              titles.each(function(i,elem){

                  attrazione = replaceAll(req.query.attr,"_"," ")
                  attrazione = replaceAll(attrazione,"%27","'")
                  title = $(this).text().replace(/ *\([^)]*\) */g, " ")
                  title = title.replace(/ *\"[^)]*\" */g, " ")
                 if(similarity(attrazione,title) > 0.8){
                            $('body').find('h2').remove()
                          title = $(this);
                          return false;
                          }
                else if(similarity(attrazione,title) > 0.55){
                    $('body').find('h2').remove()
                    var trovato = true
                    var parole = attrazione.split(" ")
                    for(i =0 ; i< parole.length; i++){
                      if(!title.includes(parole[i])){
                        trovato = false;
                        break;
                      }
                    }
                    if(trovato){
                      title = $(this)
                      return false;}
                    else {
                      title = null
                    }

                }
                    else {
                        title = null
                    }

                })
                    if(title != null){
                    while(title.parent().next().find('span.mw-headline').length < 1){
                        var test = title.parent().next().text()
                        title.parent().next().remove()
                          parag = parag + "<p>"+test+"</p>"
                    }
            }



              if(parag == "")
                  parag = "<span class =\"assente\">descrizione non disponibile</span>"


              json.push({
                attr : parag
              })

          }

        else if (localita){
          var localita = $('html').text().includes(req.query.loc)

          $('a').each(function(i,elem){
            if($(this).hasClass('image')){
            $(this).removeAttr('href');
            }
            else{
            var test = $(this).text()
            $(this).replaceWith(test)}
          })

          while($('span#Voci_correlate').parent().next().html() !== null){
                $('span#Voci_correlate').parent().next().remove()
          }
          $('span#Voci_correlate').remove()
          while($('span#Bibliografia').parent().next().html() !== null){
                $('span#Bibliografia').parent().next().remove()
          }
          while($('span#Collegamenti_esterni_bibliografia').parent().next().html() !== null){
                $('span#Collegamenti_esterni_bibliografia').parent().next().remove()
          }
          while($('div.mw-references-wrap').next().html() !== null){
                $('div.mw-references-wrap').next().remove()
          }
          while($('span#Altri_progetti').parent().next().html() !== null){
                $('span#Altri_progetti').parent().next().remove()
          }
          $('span#Bibliografia').remove()
          $('table.metadata.h2.plainlinks.avviso.avviso-struttura').remove()
          $('#coordinates').remove()
          $('span#Altri_progetti').remove()
          $('#Onorificenze').remove()

          $('span#Collegamenti_esterni').remove()
          $('td.sinottico_piede2.noprint.metadata').remove()
          $('body').find('table.metadata.noprint.plainlinks.avviso.avviso-informazioni').prev().remove()
          $('body').find('table.metadata.noprint.plainlinks.avviso.avviso-informazioni').remove()
          $('body').find('ul.gallery.mw-gallery-traditional').remove()
          $('body').find('span#Altre_immagini').remove()
          $('.noprint').remove()

          $('body').find('.plainlinks.avviso.avviso-contenuto').remove()
          $('table.sinottico').remove()
          $('table').remove()
          $('#toc').remove()
          $('body').find('img').remove()
          $('body').find('div.thumbinner').remove()
          $('body').find("span").removeAttr("style")
          $('table.sinottico').find('img').attr('src')

          $('div.mw-references-wrap').remove()
          $('sup').remove();
          $('span.mw-editsection').remove()
          $('#Note').remove()

          var wiki = $('html').find('#mw-content-text').html()

          json.push({
            attr : $('html').find('#mw-content-text').html()
          })

          }
         else{
            json.push({
              attr : "<span class =\"assente\">descrizione non disponibile</span>"
            })
          }

          res.send(json)
          json = [];
        }

        })

      }

})

})


app.listen(5000, function () {
  console.log('Example app listening on port 5000!')
})


//Here's an answer based on Levenshtein distance https://en.wikipedia.org/wiki/Levenshtein_distance

function similarity(s1, s2) {
var longer = s1;
var shorter = s2;
if (s1.length < s2.length) {
  longer = s2;
  shorter = s1;
}
var longerLength = longer.length;
if (longerLength == 0) {
  return 1.0;
}
return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}


function Compare(strA,strB){
    for(var result = 0, i = strA.length; i--;){
        if(typeof strB[i] == 'undefined' || strA[i] == strB[i]);
        else if(strA[i].toLowerCase() == strB[i].toLowerCase())
            result++;
        else
            result += 4;
    }
    return 1 - (result + 4*Math.abs(strA.length - strB.length))/(2*(strA.length+strB.length));
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function removeParentesi(str) {

    return str.replace(/ *\([^)]*\) */g, " ");
}
