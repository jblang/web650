Sent on 2026-02-26 to simh@groups.io:

Hi Folks,

I wanted to introduce myself and say thanks for a wonderful project. I have enjoyed SIMH quite a lot over the years, especially the PDP-11, PDP-1, and AltairZ80 simulators.  

More recently, I've become interested in the IBM 650 simulator after reading about the 650 in IBM's Early Computers by Bashe et al.  I have developed a web-based front panel and punched card visualizer for the IBM 650 using the SIMH i650 emulator as a backend. You can try it yourself at https://jblang.github.io/web650/ and the code is at https://github.com/jblang/web650. 

Current features: 

- The front panel is mostly complete, and you can perform all the actions you could perform on a real 650's front panel.  The only thing remaining to be implemented are the various operating lights.
- The Programming tab simulates an IBM 650 programming worksheet and allows storing the instructions into the simulator's memory. Currently there is no mechanism for reading values back out of memory but this is planned.
- The Punched Cards tab allows you to load a .dck into from the internal filesystem and see the punched card drawn in your browser.
- The Emulator tab provides a web-based emulator console, which allows you to interact with simh using the normal CLI. 
- The IBM 650 sample software is loaded into emscripten's built-in file system in the sw and test directories. /tests/i650_test.ini passes and /sw/i650_demo_all.ini runs successfully.  I have added /tests/fpcount.ini which simply increments the accumulator in a loop so you have something interesting to watch on the front panel.
- The Documentation tab contains a tutorial introduction, links to many resources about SIMH and the IBM 650, and license + credits.

Perhaps of more general interest to this group, I have ported simh to WebAssembly (https://webassembly.org/) using emscripten (https://emscripten.org/), allowing it to run directly in the browser or in Node.js. My modifications to simh to build under emscripten are in this branch: https://github.com/jblang/simh/tree/emscripten.  

Modifications made to simh:

- Cmake customization + ifdefs to get simh to compile under emscripten
- Wrapper functions in simh_api.c, which my frontend Javascript code calls directly into. The simulator runs in a WebWorker so it doesn't block the browser's event loop. 
- Cooperative yielding added to the simulation loop which allows the browser to receive updates and send commands while the simulator is running. This is controlled by the new set yieldsteps option, which determines how long the simulator will run before yielding.  
- Ring buffer for the register state that allows streaming updates to be sent to the front panel every time the simulation yields.

Full disclosure: this has been developed with the help of Claude and Codex AI tools.

I'm happy to provide further technical details if anyone is interested. Hope you enjoy!

Best wishes,
J.B.

P.S. I sent a version of this announcement earlier this month but it never went through. I'm not sure if it's sitting in some approval queue or if I broke some unwritten rule that caused it to be rejected, but I thought I would try to post again now. If I HAVE broken an unwritten rule with this post, please let me know so I can rectify it.
