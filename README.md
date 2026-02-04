# SIMH IBM 650 Simulator Web UI

This project provides a web-based user interface for [Open SIMH](https://opensimh.org)'s [IBM 650](https://opensimh.org/simdocs/i650_doc.html) simulator. The simulator runs entirely in the browser via WebAssembly, compiled from Open SIMH using [Emscripten](https://emscripten.org/).

![Front Panel](front_panel.png)

![Punched Card](punched_card.png)

## Getting Started

### Install Dependencies

The dependencies for this project are managed by npm. Run the following to install them:

```
npm install
```

If you don't have npm, install it via [Homebrew](https://brew.sh/) or your operating system's native package manager.

### Start the UI

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the UI.

## Developer Notes

For architecture details, testing guidance, and build notes, see [DEVNOTES.md](DEVNOTES.md).

## About the IBM 650

The [IBM 650](https://en.wikipedia.org/wiki/IBM_650) (wikipedia.org) is an early digital computer released by IBM in 1954. It was one of the first mass-produced computers in the world (at a time when just under 2000 was considered mass-produced).

Further reading:

- [The IBM 650](https://www.ibm.com/history/650) (ibm.com)
- [650 Manual of Operation](https://bitsavers.org/pdf/ibm/650/22-6060-2_650_OperMan.pdf) by IBM, 1955 (bitsavers.org)
- [Programming the Magnetic Drum Computer and Data-Processing Machine](https://bitsavers.org/pdf/ibm/650/Andree_Programming_the_IBM_650_Magnetic_Drum_Computer_and_Data-Processing_Machine_1958.pdf) by Richard V. Andree (bitsavers.org)
- [Other IBM 650 Documentation](https://bitsavers.org/pdf/ibm/650/) (bitsavers.org)
- [IBM's Early Computers](https://mitpress.mit.edu/9780262523936/ibms-early-computers/) by Bashe, Pugh, Palmer and Johnson (mitpress.mit.edu)

## About Me

Hi, I'm [J.B. Langston](https://www.linkedin.com/in/jblangston/). I happen to work for IBM, but this project is not affiliated with or endorsed by IBM. I made this on my own time for fun.

## Credits

- [Open SIMH](https://opensimh.org) — simulator core (including the [IBM 650 simulator](https://opensimh.org/simdocs/i650_doc)).
- [Emscripten](https://emscripten.org) — compiles SIMH to WebAssembly for in-browser execution.
- [Next.js](https://nextjs.org) — web framework for the UI.
- [React](https://react.dev) — UI component model.
- [Carbon Design System](https://carbondesignsystem.com) — IBM’s open source design system and React components.
- [Vitest](https://vitest.dev) — test runner.

## MIT License

Copyright 2026 J.B. Langston

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
