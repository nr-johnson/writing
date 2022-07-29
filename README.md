# Writing Blog Webpage
This is a Node.js based webpage meant to share information about my creative writing.
[View Live Site](https://stories.nrjohnson.net/ "Site for App")

***

## Key Features
### Single Page App
The entire site (with one exception) is loaded onto a single html page. On initial load the server makes a request to itself using Axios to get the remaining data that is dynamically added to the page. After that, front end Javascript requests info from the server and adds it to the page. The front end also handles things such as changing the url, adding to history, changing the head meta tags, handeling popstate etc. 

This is done to provide a smooth user experience that isn't as choppy as traditional page loading.
### Also Works Without Javascript
All buttons are links that will trigger a redirect if Javascript doesn't prevent the default event. This is to ensure that everything works if, for some reason, the visitor doesn't have Javascript enabled or is running on an old browser. Menus and alert boxes are also set up to work with target classes.
### API Integration
The site pulls from a MongoDB Database (managed seperatly) using my [Personal API](https://github.com/nr-johnson/api "My API Repo") to populate the "stories" page and latest story card on the "home" page.
### Addition Integrations
Node-Mailer is used to send me an email from the Contact Me form

Google's reCaptcha is used to protect my forms from spam.

MailChimp's Node.JS Express API is used to add subscribers to a mailing list.

***

## You may use my code if you wish

If you find my work helpful, feel free to use it. Just keep in mind that the content displayed on my site (stories, map, character/location information, etc.) is copyrighted.
