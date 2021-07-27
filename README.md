[![Go](https://github.com/Hein-Software-Solutions/goDashing/actions/workflows/go.yml/badge.svg)](https://github.com/Hein-Software-Solutions/goDashing/actions/workflows/go.yml)
# GoDashing

**Contentlist**  
- [Key features](#key-features)
- [Dependencies](#dependencies)
- [Getting started](#getting-started)
- [Developer informations](#developer-informations)
	- [Setting up the project](#setting-up-the-project)
	- [Build the project](#build-the-project)
	- [Helpful converters](#helpful-converters)

**Links**  
- [Source code annotations](./docs/code/README.md)

GoDashing is a [Golang](http://golang.org) based port of the original project [shopify/dashing](http://shopify.github.io/dashing) and [gigablah/dashing-go](https://github.com/gigablah/dashing-go) that lets you build beautiful dashboards. This dashing project was created at Shopify for displaying custom dashboards on TVs around the office.

![example dashbaord](./docs/screenshot.png)

## Key features
- **Easy to setup**: It works without setting up a webserver. The server is contained in GoDashing itself. The necessary files get extracted on the first start of the program.
- **Premade widgets**: The program already contains a small list of widgets (BarChart, graph, image, meter, PieChart, Sparkline, TwelveHourClock, comments, html, LineChart, myclock, PolarChart, switcher, DoughnutChart, iframe, list, number, RadarChart, text).  
The list can be extended with you own creations using CSS, HTML and JS.

## Dependencies
For running the jobs successfully your system must have `PHP` installed.

## Getting started
1. Get the app here https://github.com/Hein-Software-Solutions/goDashing/releases
2. Start goDashing `$ ./goDashing`
3. Go to http://127.0.0.1:8080

**Note on macOS**  
macOS requires to add the application to the Gatekeeper Approval. This can be done with the terminal:  
`spctl --add /Path/To/Application.app`  
For more Details please visit [OSXDaily.com](https://osxdaily.com/2015/07/15/add-remove-gatekeeper-app-command-line-mac-os-x)

# Developer informations
## Setting up the project
1. Download the source code
2. Download all dependencies:  
`go mod vendor`
3. Install packr for building the project:  
`go get github.com/gobuffalo/packr/packr`

## Build the project
To build the project in the terminal run the command  
`> packr build -o ./goDashing ./cmd/godashing/...`.  
Packr is a package used for including the necessary files into the binary itself.

To build a version for every operating system the script *release* can be executed. The binaries will be saved in the folder *release*.  
`> ./release.sh`

## Helpful converters
- CoffeeScript to JS: http://js2.coffee
- SCSS to CSS: http://www.sassmeister.com

-------------------------------
# TODO
- Pull Data from JIRA to your dashboard with a html attribute.
- Schedule and execute any script/binary file to feed data to your dashboard.
- Use the API to push data to your dashboards.

# Create a new dashboard
create a name_here.gerb file in the ```dashboards``` folder

* every 20s, goDashing will switch to each dashboard it founds in this folder.
* you can group your dashboard in a folder.
	* example : ```dashboards/subfolder/dashboard1.gerb```  will be available to http://127.0.0.1:8080/subfolder/dashboard1. 
	* doDash will auto switch dashboards it founds in the sub folder.

## Customize layout
* modify ```dashboards/layout.gerb```
	* if you add a layout.gerb in a dashboards/subfolder it will be used by goDashing when displaying a subfolder's dashboard.


# Feed data to your dashboard

## jobs folder usage
When you place a file in ```jobs``` folder Then goDashing will immediatly execute and schedule it according to this convention : ```NUMBEROFSECONDS_WIDGETID.ext```
* the filename has 2 parts :
	* NUMBEROFSECONDS,  interval in seconds for each execution of this file.
	* WIDGETID, the ID of the widget on your dashboard.

The output of the executed file should be a json representing the data to send to your widget, see examples in ```jobs``` folder.

2 cli arguments are provided to each executed file
1. The url of the current running goDashing
2. the token of the current running goDashing API
3. 
You can use this if you want to send data to multiple widgets. (see example)

## HTTP call usage (dashing API)
```
curl -d '{ "auth_token": "YOUR_AUTH_TOKEN", "text": "Hey, Look what I can do!" } http://127.0.0.1:8080/widgets/YOUR_WIDGET_ID
```


## JIRA Jql and filters
Edit your .gerb dashboard to add jira attributes to your widget :

* ```jira-count-filter='17531'``` - goDashing will search jiras with this filter and feed the widget with issues count.
* ```jira-count-jql='resolution is EMPTY'``` - goDashing will search jiras with this JQL and feed the widget with issues count.
* ```jira-warning-over='10'``` - widget status will pass to warning when there is more dans 10 issues
* ```jira-danger-over='20'``` - widget status will pass to danger when there is more dans 20 issues

You don't need to restart goDashing when editing gerb files to take changes into account.

### jira configuration
create a ```conf/jiraissuecount.ini``` file in goDashing working directory.
* set url, username, password, interval in the file, 

```
url = "https://jira.atlassian.com/"
username = "" #if empty jira will be used anonymously
password =  ""
interval = 30
```


# Use your custom assets, widgets...
* goDashing looks for assets in a ```public``` folder, when it can not found a file in this folder, it will use its embeded one.

## Widgets
To add a custom widget "Test"
* create a ```widgets``` folder in working directory
	* create a ```Test``` folder
		* add the ```Test.js```, ```Test.html```, ```Test.css``` files in it.

goDashing will use them as soon as you set a widget with a ```data-view="Test"```

Be sure to look at the [list of third party widgets][4].


[2]: 
[3]: 
[4]: https://github.com/Shopify/dashing/wiki/Additional-Widgets
