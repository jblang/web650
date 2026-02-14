## About the IBM 650

The [IBM 650](https://en.wikipedia.org/wiki/IBM_650) (wikipedia.org) is an early digital computer released by IBM in 1954. It was one of the first mass-produced computers in the world (at a time when just under 2000 was considered mass-produced).

Further reading:

- [The IBM 650](https://www.ibm.com/history/650) (ibm.com)
- [650 Manual of Operation](https://bitsavers.org/pdf/ibm/650/22-6060-2_650_OperMan.pdf) by IBM, 1955 (bitsavers.org)
- [Programming the Magnetic Drum Computer and Data-Processing Machine](https://bitsavers.org/pdf/ibm/650/Andree_Programming_the_IBM_650_Magnetic_Drum_Computer_and_Data-Processing_Machine_1958.pdf) by Richard V. Andree (bitsavers.org)
- [Other IBM 650 Documentation](https://bitsavers.org/pdf/ibm/650/) (bitsavers.org)
- [IBM's Early Computers](https://mitpress.mit.edu/9780262523936/ibms-early-computers/) by Bashe, Pugh, Palmer and Johnson (mitpress.mit.edu)


## Some Things to Try

> ### [ACHTUNG!](https://en.wikipedia.org/wiki/Blinkenlights)
> ALLES TURISTEN UND NONTEKNISCHEN LOOKENSPEEPERS!
> DAS KOMPUTERMASCHINE IST NICHT FÜR DER
> GEFINGERPOKEN UND MITTENGRABEN! ODERWISE IST EASY
> TO SCHNAPPEN DER SPRINGENWERK, BLOWENFUSEN UND
> POPPENCORKEN MIT SPITZENSPARKEN.
> IST NICHT FÜR GEWERKEN BEI DUMMKOPFEN. DER 
> RUBBERNECKEN SIGHTSEEREN KEEPEN DAS COTTONPICKEN
> HÄNDER IN DAS POCKETS MUSS.
> ZO RELAXEN UND WATSCHEN DER BLINKENLICHTEN.

### Blinkenlights Counting in Bi-Quinary

Go to the Emulator tab, and type the following commands:

```
set throttle 5/1
do /tests/fpcount.ini
```

Switch to the Front Panel tab and enjoy bi-quinary counting at its finest!

### Blinkenlights while the Tests Run

For this one, **you'll want to set Yield Steps to 10** (under Advanced Options at the bottom of the Emulator tab).  Throttling makes the card load stages take too long, but you'll want it to yield often enough for the lights to sample a good amount of the CPU activity.

```
set nothrottle
do /test/i650_test.ini
```

Now, switch back to the Front Panel tab and enjoy.

### Blinkenlights while the Demos Run

**Recommended Yield Steps: 100** (see above).

```
set nothrottle
cd sw
do i650_demo_all.ini
```

Switch to the Front Panel tab and be hypnotized!

Once the lights stop blinken, switch back to the Emulator tab for some bonus printer graphics:

```
***
*** Run Program
***
         0  1000000000  1000000000  1000000000  1000000000                               10040  
         1   100000000  1000000000          10  1000000000                               20040  
         2    10000000  1000000000              1000000000                               30040  
         3      100000  1000000000                10000000                               40040  
         4         100  1000000000                  100000                               50040  
         5              1000000000                   10000                               60040  
         6               100000000                    1000                               70040  
         7                  100000                     100                               80040  
         8                    1000                     100                               90040  
         9                     100                     100                              100040  
        10                      10                      10                              110040  
        11                     100                     100                              120040  
        12                    1000                     100                              130040  
        13                  100000                     100                              140040  
        14               100000000                    1000                              150040  
        15              1000000000                   10000                              160040  
        16         100  1000000000                  100000                              170040  
        17      100000  1000000000                10000000                              180040  
        18    10000000  1000000000              1000000000                              190040  
        19   100000000  1000000000          10  1000000000                              200040  
        20  1000000000  1000000000  1000000000  1000000000                              210040  

Programmed Stop, IC: 00216 ( 0102160470+   HLT   0216  0470 )
Press Enter to continue . . .  [cont] Goodbye
```

## About Open SIMH

[Open SIMH](https://opensimh.org) is a collection of simulators started by Robert Supnik and developed by a group of volunteers.  It includes simulators for many famous mini- and mainframe computers from the 1950s onwards, and specifically an [IBM 650 simulator](https://opensimh.org/simdocs/i650_doc) by Roberto Sancho.

## About Me

Hi, I'm [J.B. Langston](https://www.linkedin.com/in/jblangston/). I happen to work for IBM, but this project is not affiliated with or endorsed by IBM. I made this on my own time for fun.

## Credits

- [Open SIMH](https://opensimh.org) — simulator core (including the [IBM 650 simulator](https://opensimh.org/simdocs/i650_doc)).
- [Emscripten](https://emscripten.org) — compiles SIMH to WebAssembly for in-browser execution.
- [Next.js](https://nextjs.org) — web framework for the UI.
- [React](https://react.dev) — UI component model.
- [Carbon Design System](https://carbondesignsystem.com) — IBM’s open source design system and React components.
- [Vitest](https://vitest.dev) — test runner.
- [Playwright](https://playwright.dev) — end-to-end browser tests.

## Source Code

Check out the source code at [github.com/jblang/web650](https://github.com/jblang/web650). This site is deployed directly from the main branch by GitHub actions.

My fork of Open SIMH is at [github.com/jblang/simh](https://github.com/jblang/simh). Currently the changes to make it compile with Emscripten and expose an interface to JavaScript are not upstreamed, so you will need this fork for now if you want to hack on the emulator backend.

## MIT License

Copyright 2026 J.B. Langston

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
