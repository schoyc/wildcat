var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var unirest = require("unirest");
var google = require("googleapis");
var fs = require("fs");

var app = express();
var PORT = process.env.PORT || 8080;

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.listen(PORT);


var uriString = process.env.MONGODB_URI ||
				process.env.MONGOHQ_URL ||
				'mongodb://localhost/wildcat';

var MASHAPE_KEY = "5f0umGZ1s9mshbQfNRJp8UzfKSxfp1AAu5Ijsnc2tkb30FjfdT";
var GOOGLE_KEY = "AIzaSyDz3FoNH12v0vueo9t5Y1pfqK3ZrVFpTRI";

mongoose.connect(uriString, function(err, res) {
	if (err) {
		console.log('ERROR connecting to: ' + uriString + '. ' + err);
	} else {
		console.log('Succeeded connecting to: ' + uriString);
	}
});

//var drive = google.drive({ version: 'v3', auth:  });

console.log("App is running.");
testGoogleDriveUpload();

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

function testGoogleDriveUpload() {
	var header = 
	"<head> \
		<meta charset=\"utf-8\"/> \
	</head>";

	var body_start_tag = "<body>";
	var body_end_tag = "</body>";

	var test_content = "<p>Clinton's highly touted address on the \"alternative right\" sparked debates in every corner of American politics. For some commentators on the left, such as the historian Rick Perlstein, Clinton's decision to cleave \"mainstream\" conservatism from the alts was an unforced blunder.<\/p>\n<p>\"Republican congressional candidates have to be <em>tied<\/em> to a Trumpism that is understood as the apotheosis of the recent history of the Republican Party,\" Perlstein wrote. \"Because if they are not, it would be oh so easy for the survivors to say, on November 9: It ain\u2019t me, babe. I\u2019m a <em>Ryan<\/em> conservative, not a Trumpite. We Ryanites are normal, respectable folk. After all, even Hillary Clinton says so.\"<\/p>\n<p>For the alt-right and its allies \u2014 a group that temporarily included Republicans who accused Clinton of a strange diversion \u2014 the speech helped elevate a fringe. Jared Taylor, the editor of American Renaissance, told The Washington Post before the speech that his colleagues were taking bets on whether they'd be name-checked. After the speech, he was simply bemused.<\/p>\n<p>\"She seems to be running against Nigel Farage and Alex Jones for president,\" Taylor said. \"And maybe Steve Bannon.\"<\/p>\n<p>Jones, the Texas-based radio host who has hitched his wagon to Donald Trump, derided Clinton as attacking free speech and trying to control what media was and wasn't worth listening to. In videos, Jones and his colleagues at InfoWars portrayed her as a sickly, doddering figure of desperation.<\/p>\n<p>\"So, Trump is the conspiracy theorist for listening to Alex Jones,\" InfoWars contributor Paul Joseph Watson said in one of the site's many takedowns. \"Yet, you just asserted that a former KGB officer under the Communist government of the Soviet Union is now the leader of conservatives in America.\"<\/p>\n<div class=\"inline-content inline-html\">[embedded content]<\/div>\n<p>Watson and Jones were being strategic. The idea that Clinton and Trump were both trafficking in conspiracy theories was advanced by the Associated Press; in a preview of the speech, the AP suggested that \"insinuating that her Republican opponent may be a puppet of Russian President Vladimir Putin\" was Clinton's answer to Trump's fulminations about President Obama's citizenship and her health.<\/p>\n<p>Other people cited in the speech argued that Clinton was engaged in misdirection and that the mainstream media was enabling her. One article cited by Clinton, \u201cWould You Rather Your Child Had Feminism or Cancer,\" largely consisted of a video inspired by Breitbart's Milo Yiannopoulos, in which college students at the University of Michigan were offered that choice. Yiannopoulos, who has tried to make \"feminism is cancer\" a catchphrase, does not identify as a member of the alt-right but has explained and credited the movement in several articles. In a fan video from one of his college talks, Yiannopoulos professes his fandom for Pepe, the cartoon frog adopted as an all-purpose meme for the alt-right.<\/p>\n<div class=\"inline-content inline-html\">[embedded content]<\/div>\n<p>Pepe made a return appearance in Yiannopoulos's take on the Clinton speech, alongside an illustration of a blank-eyed Clinton wearing a Ghostbusters outfit and the glasses from her post-concussion testimony on Benghazi. \"Muslims do not flee religious persecution in the Middle East,\" Yiannopoulos wrote. \"They move to the west to bring religious persecution to our societies. The alt-right and the Trump coalition in general looks at Europe and says 'We will not let it happen here.' Hillary Clinton looks at Europe and says 'The future is now.'\"<\/p>\n<p>VDare, which had asked readers to donate to the site in advance of the speech, found another reason to declare it a failure.<\/p>\n<p>\"What Clinton single-handedly did is give the movement the greatest publicity and legitimacy it\u2019s had in years,\" wrote VDare's James Kirkpatrick. \"She also specifically designated George W. Bush and John McCain as the kind of good loser conservatives she wants Republicans to act like. In other words, she praised them for being the collaborators they are.\"<\/p>\n<p>Richard Spencer, president of the National Policy Institute, had the same take.<\/p>\n<p>\"The Alt Right as a monicker of resistance is here to stay,\" Spencer said. \"Hillary just ensured that; there will be more and more people, with various perspectives, adopting it. At this point in history, the 'Alt' is just as important as the 'Right.' Hillary aligned herself with George W. Bush and John McCain. The Alt Right is the real opposition. We\u2019ve made it, I never thought this would happen so quickly.\"<\/p>\n";

	var html_content = header + body_start_tag + test_content + body_end_tag;
	fs.writeFile("test_write_file_2.html", html_content, function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("Success!");
		}
	});

	var GOOGLE_KEY = "AIzaSyDz3FoNH12v0vueo9t5Y1pfqK3ZrVFpTRI";
	var scopes = ['https://www.googleapis.com/auth/drive.file'];
	var key;
	fs.readFile('service_key.json', function(err, service_key){
		if (err) {
			console.log(err);
		} else {
			console.log("Successfully parsed key!");
			key = JSON.parse(service_key);
			test(key);
		}
	});

	function test(key) {
		var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, scopes, "dvhsnx@gmail.com");
		jwtClient.authorize(function(err, tokens) {
			if (err) {
				console.log(err);
			} else {
				console.log("Authorization successful!");
				console.log(tokens);
			}
		});
		

		var drive = google.drive({ version: 'v3', auth: jwtClient});
		/*
		drive.files.list({
		    auth: jwtClient,
		    pageSize: 10,
		    fields: "nextPageToken, files(id, name)"
		  }, function(err, response) {
		    if (err) {
		      console.log('The API returned an error: ' + err);
		      return;
		    }
		    var files = response.files;
		    if (files.length == 0) {
		      console.log('No files found.');
		    } else {
		      console.log('Files:');
		      for (var i = 0; i < files.length; i++) {
		        var file = files[i];
		        console.log('%s (%s)', file.name, file.id);
		      }
		    }
		  });
*/

		
		drive.files.create({
		  resource: {
		    name: 'Clinton attacks the Alt-Right',
		    mimeType: 'text/html'
		  },
		  media: {
		    mimeType: 'text/html',
		    body: fs.createReadStream('test_write_file_2.html')
		  },
		}, function(err, file) {
			if (err) {
				console.log(err);
			} else {
				console.log("File upload successful!");
				console.log("File ID: " + file.id);
				console.log(file);
			}
		}); 
	}
}

// var fs = require('fs');
// var readline = require('readline');
// var google = require('googleapis');
// var googleAuth = require('google-auth-library');

// // If modifying these scopes, delete your previously saved credentials
// // at ~/.credentials/drive-nodejs-quickstart.json
// var SCOPES = ['https://www.googleapis.com/auth/drive.file'];
// var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
//     process.env.USERPROFILE) + '/.credentials/';
// var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';

// // Load client secrets from a local file.
// fs.readFile('client_secret.json', function processClientSecrets(err, content) {
//   if (err) {
//     console.log('Error loading client secret file: ' + err);
//     return;
//   }
//   // Authorize a client with the loaded credentials, then call the
//   // Drive API.
//   authorize(JSON.parse(content), listFiles);
// });

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  *
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials, callback) {
//   var clientSecret = credentials.installed.client_secret;
//   var clientId = credentials.installed.client_id;
//   var redirectUrl = credentials.installed.redirect_uris[0];
//   var auth = new googleAuth();
//   var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

//   // Check if we have previously stored a token.
//   fs.readFile(TOKEN_PATH, function(err, token) {
//     if (err) {
//       getNewToken(oauth2Client, callback);
//     } else {
//       oauth2Client.credentials = JSON.parse(token);
//       callback(oauth2Client);
//     }
//   });
// }

// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  *
//  * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback to call with the authorized
//  *     client.
//  */
// function getNewToken(oauth2Client, callback) {
//   var authUrl = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES
//   });
//   console.log('Authorize this app by visiting this url: ', authUrl);
//   var rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });
//   rl.question('Enter the code from that page here: ', function(code) {
//     rl.close();
//     oauth2Client.getToken(code, function(err, token) {
//       if (err) {
//         console.log('Error while trying to retrieve access token', err);
//         return;
//       }
//       oauth2Client.credentials = token;
//       storeToken(token);
//       callback(oauth2Client);
//     });
//   });
// }

// /**
//  * Store token to disk be used in later program executions.
//  *
//  * @param {Object} token The token to store to disk.
//  */
// function storeToken(token) {
//   try {
//     fs.mkdirSync(TOKEN_DIR);
//   } catch (err) {
//     if (err.code != 'EEXIST') {
//       throw err;
//     }
//   }
//   fs.writeFile(TOKEN_PATH, JSON.stringify(token));
//   console.log('Token stored to ' + TOKEN_PATH);
// }

// /**
//  * Lists the names and IDs of up to 10 files.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function listFiles(auth) {
//   var drive = google.drive('v3');
  
// 	drive.files.create({
// 	  resource: {
// 	    name: 'Hillary Clinton attacks the Alt-Right',
// 	    mimeType: 'text/plain'
// 	  },
// 	  media: {
// 	    mimeType: 'text/plain',
// 	    body: 'Testing Hillary Clinton'
// 	  },
// 	  auth: auth
// 	}, function(err, file) {
// 		if (err) {
// 			console.log(err);
// 		} else {
// 			console.log("File upload successful!");
// 			console.log("File ID: " + file.id);
// 			console.log(file);
// 		}
// 	}); 
//   // service.files.list({
//   //   auth: auth,
//   //   pageSize: 10,
//   //   fields: "nextPageToken, files(id, name)"
//   // }, function(err, response) {
//   //   if (err) {
//   //     console.log('The API returned an error: ' + err);
//   //     return;
//   //   }
//   //   var files = response.files;
//   //   if (files.length == 0) {
//   //     console.log('No files found.');
//   //   } else {
//   //     console.log('Files:');
//   //     for (var i = 0; i < files.length; i++) {
//   //       var file = files[i];
//   //       console.log('%s (%s)', file.name, file.id);
//   //     }
//   //   }
//   // });
// }
