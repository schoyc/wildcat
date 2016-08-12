var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var unirest = require("unirest");

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

var uriString = process.env.MONGODB_URI ||
				process.env.MONGOHQ_URL ||
				'mongodb://localhost/wildcat';

var PORT = process.env.PORT || 5000;

var MASHAPE_KEY = "";

mongoose.connect(uriString, function(err, res) {
	if (err) {
		console.log('ERROR connecting to: ' + uriString + '. ' + err);
	} else {
		console.log('Succeeded connecting to: ' + uriString);
	}
});

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

function getFullTextArticle(articleUrl, articleTitle) {
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
			.end(function (response) {
				if (res.error) {
					console.log(res.error);
				} else {
					storeArticle(response, articleUrl, articleTitle);
				}
	});
}

function storeArticle(response, articleUrl, articleTitle) {
	var article = new Article({
		title: articleTitle,
		date: response.date,
		source: "",
		link: articleUrl,
		text: response.content
	});
}

app.post("/notifications", function(req, res) {
	var entries = req.body.items;
	console.log(req.body);
	for (var i = 0; i < entries.length; i += 1) {
		var entry = entries[i];
		console.log(entry);

		var url = entry.permalinkUrl;
		var articleTitle = entry.title;
		var articleDate = new Date(entry.published * 1000);
		var articleContent = entry.content;

		var article = new Article({
			title: articleTitle,
			date: articleDate,
			source: url,
			content: articleContent
		});

		article.save(function (err) {
			if (err) {
				console.log('Error on saving article: ' + err);

			}
		});
	}

});

app.get("/notifications", function(req, res) {
	var query = req.query;
	var challenge = query["hub.challenge"];
	if (challenge) {
		res.status(200).send(challenge);
	} else {
		console.log("Verification of intent error: " + query);
	}

});
