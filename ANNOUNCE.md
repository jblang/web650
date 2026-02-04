## Announcement posted to https://groups.io/g/simh:

Hi Folks,

I wanted to introduce myself and say thanks for a great project. I have enjoyed SIMH a lot over the years, especially the PDP-11, PDP-1, and AltairZ80 simulators.  More recently I've been playing with the IBM 650 simulator as I've been reading IBM's Early Computers and got interested in it.

Which brings me to the click bait subject line :).  I have been vibe coding a web-based front panel for the 650 for the past two weeks.  The code is here https://github.com/jblang/web650. Originally, I was running a slave simh process server-side and communicating with it over a REST API but that wasn't very performant or secure, so I've since moved on to running simh directly in the browser.

How, you ask? I have successfully compiled the current version of simh to WebAssembly (https://webassembly.org/) using emscripten (https://emscripten.org/), and it runs directly in the browser (in a WebWorker so it doesn't block the UI event loop), and my frontend Javascript code calls directly into the C code. My modifications to simh to build under emscripten are in this branch: https://github.com/jblang/simh/tree/emscripten.  It required very little modification to get up and running. Just some cmake customization, a few ifdefs, and some wrapper functions my JavaScript code can call into.

Where it currently stands: there is a web-based emulator console on the Emulator tab, which allows you to interact with simh using the normal commands. The IBM 650 sample software is loaded into emscripten's built-in file system in the sw and test directories. The front panel is pretty much complete, and you can perform all the actions you could perform on a real 650's front panel.  I still need to add real-time status updates so that the blinkenlights can go while it's running.  Besides that, I have a punched card visualizer on the Reader tab that you can load a .dck file into and see the punched card drawn in your browser. You can load a file and view the punched cards, but it isn't hooked up to the emulator yet. The rest of the tabs are just placeholders at the moment.

I'm happy to provide further technical details if anyone is interested. Hope you enjoy!

Best wishes,
J.B.