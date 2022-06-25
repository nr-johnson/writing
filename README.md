# Writing Blog Webpage
This is a Node.js based API. I wrote this because I was starting to write multiple apps for different personal purposes that all shared the same database. I am also starting to write apps in different languages (i.e. Python). I wanted a way to easily access all the data on my database from multiple apps. Plus, it was a great learning experience.

***

## Key Features
### White list authentication
I have a simple check at the start of the app that verifies that the requesting url is on a list. This list is stored as a comma seperated enviornment variable.
### MongoDB Database
The project is set up to connect to a cloud hosted [MonogDB](https://www.mongodb.com/ "MongoDB Webpage") database. The authentication url is stored as an envirnment variable.
### Cloudinary File Storage
The project is set up to connect to [Cloudinary](https://cloudinary.com "Cloudinary Webpage") file hosting. The authentication configurations are set up as enviornment variables.
### URL Hints
* Visiting `/` will give a welcome message for the API.
* Visiting `/data` will give a breakdown of available commands for the database.
* Visiting `/files` will give a breakdown of available commands for the media library.

### 

***

## You may use my code if you wish

Just be aware of two things; First, packages are not included, you will need to run `npm i` upon downloading. Second, access keys for cloudinary, the config url for MongoDB, and the white list are stored as enviornment variables, so you will need to set those yourself.

***

## Additional Notes
I built this for the purpose stated above, but also to test some concepts I have been learning. This is the first app I made that, in my humble view, uses my own middleware properly. So functions to access the database and media library are stored in a seperate file, pulled in at initilization and added to `req`. They are then called within the routes. This may seem excesive since most are only called once, but hey, I wanted to stretch that new knowledge.