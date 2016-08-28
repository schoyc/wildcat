var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var unirest = require("unirest");

var app = express();
var PORT = process.env.PORT || 8080;

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.listen(PORT);


var uriString = process.env.MONGODB_URI ||
				process.env.MONGOHQ_URL ||
				'mongodb://localhost/wildcat';

var MASHAPE_KEY = "5f0umGZ1s9mshbQfNRJp8UzfKSxfp1AAu5Ijsnc2tkb30FjfdT";

mongoose.connect(uriString, function(err, res) {
	if (err) {
		console.log('ERROR connecting to: ' + uriString + '. ' + err);
	} else {
		console.log('Succeeded connecting to: ' + uriString);
	}
});

console.log("App is running.");

var articleSchema = new mongoose.Schema({
	title : String,
	date : {type: Date, default: Date.now},
	link : String,
	content : String
});

var Article = mongoose.model('Article', articleSchema);

function handleError(res, reason, message, code) {
	console.log("ERROR: " + reason);
	res.status(code || 500).json({"error": message});
}

function getFullTextArticle(articleUrl, articleOptions) {
	var fullTextUrl = "https://full-text-rss.p.mashape.com/extract.php";
	var fullTextHeaders = {
		"X-Mashape-Key": MASHAPE_KEY,
		"Content-Type": "application/x-www-form-urlencoded",
		"Accept": "application/json"
	};

	var fullTextBody = {
		"content": "1",
  		"links": "remove",
  		"parser": "html5php",
  		"url": articleUrl
	}

	unirest.post(fullTextUrl)
			.headers(fullTextHeaders)
			.send(fullTextBody)
			.end(function (res) {
				if (res.error) {
					console.log(res.error);
				} else {
					storeArticle(res.body, articleOptions);
				}
	});
}

function storeArticle(body, articleOptions) {
	articleOptions.content = body.content;
	var article = new Article(articleOptions);
	console.log(articleOptions);

	article.save(function (err) {
			if (err) {
				console.log('Error on saving article: ' + err);

			}
		});
}

app.post("/notifications", function(req, res) {
	var entries = req.body.items;
	var length = 0;
	if (entries) {
		length = entries.length;
	}
	console.log(req.body);
	for (var i = 0; i < length; i += 1) {
		var entry = entries[i];
		console.log(entry);

		var url = entry.permalinkUrl;
		var articleTitle = entry.title;
		var articleDate = new Date(entry.published * 1000);
		var articleOptions = {
			title: articleTitle,
			date: articleDate,
			link: url,
		};

		getFullTextArticle(url, articleOptions);
	}

	res.status(200).json({"message" : "SUCCESS!"});

});

app.get("/notifications", function(req, res) {
	var query = req.query;
	var challenge = query["hub.challenge"];
	if (challenge) {
		console.log("SUCCESSFULLY VERIFIED INTENT");
		res.status(200).send(challenge);
	} else {
		console.log("Verification of intent error: " + query);
	}

});
