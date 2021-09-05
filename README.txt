NoMustache
----------
A simple node.js-based tool for processing data stored in a google spreadsheet
through a mustache-based HTML template.

(https://mustache.github.io/mustache.5.html)

Outputs an HTML file for each row or column of data as specifed by user input.


Setup
-----
You must create your own OAuth client ID and client secret file to use this
tool.

Create a new OAuth client ID for a Desktop App here:
(https://console.cloud.google.com/apis/credentials/oauthclient)

More info: 
(https://developers.google.com/workspace/guides/create-project)

Download the client secret JSON file and save it as "credentials.json" in
the no-mustache-cli directory


Installation
------------
`npm install`

`node .`

On first run, it will return an authorization URL for you to visit. Visit the
URL, accept the security warnings, and then copy the resulting access token
into the prompt.

You are now ready to go. Run with `node .`


Usage Instructions
------------------
`node .`

When run, you will be asked for a Google Spreadsheet ID, and details about the
data range to pull values from.

From there it will generate an HTML file for each of the rows or columns in the
data range and save them in the output folder.

It currently assumes that the first row or column of data should be used as the
variable names and that the following rows or columns should be used as the
data.
