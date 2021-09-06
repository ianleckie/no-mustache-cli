/**
 *
 * NoMustache
 * 
 * A simple tool for processing data stored in a Google spreadsheet through
 * a Mustache-based HTML template. Outputs an HTML file for each row or
 * column of data as specifed by user input.
 * 
 */

const fs       = require('fs');
const path     = require('path');
const mustache = require('mustache');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

const {google}     = require('googleapis');
const SCOPES       = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH   = 'token.json';
const templatePath = path.join('.', 'template', 'template.html');

var template   = getTemplate();
var date       = new Date();
var dateString = date.getTime().toString();

// Authorization flow
fs.readFile('credentials.json', (err, content) => {
	if (err) return console.log('Error loading client secret file:', err);
	authorize(JSON.parse(content), getUserInput);
});

/**
 * reads the file at templatePath into a string
 * 
 * @return {string} the contents of the template file
 */
function getTemplate() {

	template = '';
	
	fs.readFile(templatePath, 'utf8', function(err, templateString) {
		
		if (err) return console.log('Template error: ' + err);
		
		template = templateString;
	
	});

	return template;

}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * 
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	
	const {client_secret, client_id, redirect_uris} = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(
			client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token. Get one if not.
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getNewToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	});

}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * 
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
	
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	
	console.log('Authorize this app by visiting this url:', authUrl);
	
	readline.question('Enter the code from that page here: ', (code) => {
		
		readline.close();
		
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error('Error while trying to retrieve access token', err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log('Token succesfully stored.');
				console.log('Ready to use!');
				process.exit();
			});
			callback(oAuth2Client);
		});

	});

}

/**
 * Takes the user input, and passes it to generateFiles.
 * 
 * @param  {obj} auth google API auth object
 */
function getUserInput( auth ) {
		
	readline.question(`Enter spreadsheet ID: `, (sheetID) => {
		
		readline.question(`Enter data range (including headers): `, (dataRange) => {
		
			readline.question(`Header Column (C) or Header Row (R)? `, (colRow) => {

				if ( templateFile == '' ) { templateFile = './template/template.html' }
				
				generateFiles( auth, sheetID, dataRange, colRow );
				readline.close()
		
			});
		
		});
	
	});

}

/**
 * Writes a string to a file at the specified path
 * 
 * @param  {string} path   the path
 * @param  {string} string the string to write
 */
function writeFile( path, string ) {
	
	fs.writeFile( path, string, function(err) {
		
		if(err) {
			return console.log(err);
		}
		
		console.log('Saved file: ' + path);
	
	});

}

/**
 * Takes the results of a Google Spreadsheets API call, and generates an HTML
 * file for each row after the first using the columns as mustache variables
 * 
 * @param  {obj} res the results of a google spreadsheets API call
 */
function makeHTMLFiles( res ) {

	const rows = res.data.values;
		
	var templateKeys, view, sortedRows;
	
	if (rows.length) {

		var pass = 1;
		
		console.log('Generating HTML...');
		
		rows.map((row) => {
			
			if ( pass === 1 ) {

				// first pass, build templateKeys
				templateKeys = row;

			} else {

				var valKey = 0;
				var filePath = path.join('.', 'output', 'email_' + dateString + '_' + ( pass - 1 ) + '.html');

				// after first pass, use templateKeys to build view object
				view = {};
				
				templateKeys.map((key) => {
					view[key] = row[valKey];
					valKey++;
				});

				// pass template and view object to mustache to render HTML
				var output = mustache.render( template, view );
				
				// save template output to file
				writeFile( filePath, output );
				
			}
			
			pass++;
		
		});
	
	} else {
		
		console.log('ERROR: No data found.');
	
	}

}

/**
 * Translates values in spreadsheet to mustache variables and builds HTML output from template
 * 
 * @param  {obj} 	auth         google API auth object
 * @param  {string} sheetID      the google spreadsheet ID
 * @param  {string} lastCol      the last column of data in the spreadsheet
 */
// function generateFiles( auth, sheetID, dataRange, colRow ) {
function generateFiles( auth, sheetID, dataRange ) {
	
	const sheets = google.sheets({version: 'v4', auth});

	var majorDimensionVal = false;

	if ( colRow == 'C' ) {
		majorDimensionVal = 'COLUMNS';
	} else if ( colRow == 'R' ) {
		majorDimensionVal = 'ROWS';
	}

	if ( majorDimensionVal ) {

		console.log( 'Using template: ' + templatePath );

		sheets.spreadsheets.values.get({
			spreadsheetId: sheetID,
			range: dataRange,
			majorDimension: majorDimensionVal,
		}, (err, res) => {
			
			if (err) return console.log('The API returned an error: ' + err);

			makeHTMLFiles( res );
			
		});

	} else {

		console.log('ERROR: incorrect header entry');

	}

}