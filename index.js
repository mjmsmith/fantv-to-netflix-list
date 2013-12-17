"use strict";

var $ = require("jquery");
var http = require("http");
var request = require("request");
var when = require("when");
var unfold = require("when/unfold");
var delay = require("when/delay");

var fantvEmail = "<edit@me>";
var fantvPassword = "<edit me>";
var netflixEmail = "<edit@me>";
var netflixPassword = "<edit me>";

var fanJar = request.jar();
var netflixJar = request.jar();
var netflixMovieIds = {};
var netflixAddUrls = {};

loginToFan()
.then(getFanWatchList)
.then(getNetflixLoginPage)
.then(loginToNetflix)
.then(getNetflixAddUrls)
.then(addMoviesToNetflix)
.done();

function loginToFan() {
  log("Logging into Fan TV.");

  var deferred = when.defer();
  var req = request.defaults({
    form: {
      email: fantvEmail,
      password: fantvPassword
    },
    jar: fanJar
  });
  var url = "https://www.fan.tv/authenticate?xhr_request=1";

  req.post(url, function(err, res, body) {
    checkResponseStatus(url, err, res, 200);
    deferred.resolve(JSON.parse(body).public_id);
  });

  return deferred.promise;
}

function getFanWatchList(id) {
  return unfold(function(page) { return [null, delay(1000, getFanWatchListPage(id, page))]; },
                function(page) { return page === 0; },
                function() {},
                1);
}

function getFanWatchListPage(id, page) {
  log("Getting Fan TV watch list page " + page + ".");

  var deferred = when.defer();
  var req = request.defaults({ jar: fanJar });
  var url = "http://www.fan.tv/user/" + id + "/lists/watch-list/movies";

  if (page > 1) {
    url += "/more?page=" + page;
  }

  req.get(url, function(err, res, body) {
    checkResponseStatus(url, err, res, 200);

    if (page > 1) {
      body = "<!DOCTYPE html>\n<html lang=\"en-US\"><body>" + body + "</body></html>";
    }

    var html = $.parseHTML(body);
    var count = 0;

    $(".list-item.movie", html).each(function(i, el) {
      var title = $("a > .list-item-title > h5", el).text().trim();
      var url = $(".mini > a[data-source='netflix-stream']", el).attr("href");

      if (title && url) {
        var id = url.match(/\/WiMovie\/([0-9]+)/)[1];
        netflixMovieIds[id] = title;
      }

      ++count;
    });

    deferred.resolve(count === 0 ? 0 : (page + 1));
  });

  return deferred.promise;
}

function getNetflixLoginPage() {
  log("Getting NetFlix login page.");

  var deferred = when.defer();
  var req = request.defaults({ jar: netflixJar });
  var url = "https://signup.netflix.com/Login";

  req.get(url, function(err, res, body) {
    checkResponseStatus(url, err, res, 200);

    var html = $.parseHTML(body);
    var auth = $("form#login-form > input[name='authURL']", html).attr("value");

    deferred.resolve(auth);
  });

  return deferred.promise;
}

function loginToNetflix(auth) {
  log("Logging into NetFlix.");

  var deferred = when.defer();
  var req = request.defaults({
    form: {
      email: netflixEmail,
      password: netflixPassword,
      authURL: auth,
      RememberMe: "off"
    },
    jar: netflixJar
  });
  var url = "https://signup.netflix.com/Login";

  req.post(url, function(err, res) {
    checkResponseStatus(url, err, res, 302);
    deferred.resolve();
  });

  return deferred.promise;
}

function getNetflixAddUrls() {
  var deferreds = [];

  for (var id in netflixMovieIds) {
    if (netflixMovieIds.hasOwnProperty(id)) {
      deferreds.push(delay(2000, getNetflixAddUrl(id, netflixMovieIds[id])));
    }
  }

  return when.all(deferreds);
}

function getNetflixAddUrl(id, title) {
  netflixJar.setCookie("profilesNewSession=0", "http://movies.netflix.com", {}, function() {});
  netflixJar.setCookie("profilesNewUser=0", "http://movies.netflix.com", {}, function() {});

  var deferred = when.defer();
  var req = request.defaults({ jar: netflixJar });
  var url = "http://movies.netflix.com/WiMovie/" + id;

  req.get(url, function(err, res, body) {
    checkResponseStatus(url, err, res, 200);

    var html = $.parseHTML(body);
    var addUrl = $("#displaypage-overview-details > .actions a[href*='/AddToQueue']", html).attr("href");
    var removeUrl = $("#displaypage-overview-details > .actions a[href*='/QueueDelete']", html).attr("href");

    if (addUrl) {
      netflixAddUrls[addUrl] = title;
    }
    else if (removeUrl) {
      log(title + " in Netflix queue.");
    }
    else {
      throw "Could not find AddToQueue or QueueDelete URL for " +  title + ".";
    }

    deferred.resolve();
  });

  return deferred.promise;
}

function addMoviesToNetflix() {
  var deferreds = [];

  for (var url in netflixAddUrls) {
    if (netflixAddUrls.hasOwnProperty(url)) {
      deferreds.push(delay(2000, addMovieToNetflix(url, netflixAddUrls[url])));
    }
  }

  return when.all(deferreds);
}

function addMovieToNetflix(url, title) {
  log("Adding " + title + " to Netflix queue.");

   var deferred = when.defer();
   var req = request.defaults({ jar: netflixJar });

  req.get(url, function(err, res) {
    checkResponseStatus(url, err, res, 200);
    deferred.resolve();
  });

  return deferred.promise;
}

function checkResponseStatus(url, err, res, expectedCode) {
  if (err) {
    throw url + "\n" + err;
  }

  if (res.statusCode !== expectedCode) {
    throw url + "\nExpected code " + expectedCode + ", got " + res.statusCode + " (" + http.STATUS_CODES[res.statusCode] + ").";
  }
}

function log(str) {
  console.log(str);
}