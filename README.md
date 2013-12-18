# fantv-to-netflix-list

Script to update a Netflix My List from a Fan TV watch list.

## Why?

When Netflix introduced a streaming-only plan, I switched to it and discovered that (1) existing queue items that weren't available for streaming had disappeared, and (2) I couldn't add anything new to my list that wasn't currently available for streaming.  (Yes, they're effectively the same problem, but it's a really annoying one that reduces the value of the service.) 

Services like GoWatchIt and Fan TV (formerly Fanhattan) can be used to maintain one global list of movies and find out where they're available, but their UIs for browsing lists range from mediocre on the desktop to abysmal on mobile devices.

Fan TV appears to have the most complete and quickly updated movie database, so that's what I use.  This script logs in to Fan TV and gets all of the Watch List movies that are available for streaming on Netflix, then logs into Netflix and adds any missing movies to My List.  Since Fan TV has no public API and Netflix regrets theirs, it uses old tyme screen-scraping and may stop working when either site changes.

## Installation

Clone the repository.

Run ```npm install``` to install dependencies.

Open ```index.js``` and edit the Fan TV and Netflix account settings:

```
var fantvEmail = "edit@me>";
var fantvPassword = "edit me";
var netflixEmail = "edit@me";
var netflixPassword = "edit me";
```

Run ```npm start``` to execute the script.

## License

MIT license.
