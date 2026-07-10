<img src="without.svg" /><br>
<img src="https://kekse.biz/github.php?draw&override=github:unwiki" />

# `unwiki`
Converts the [Wikimedia Dumps](https://dumps.wikimedia.org/) to big **`text/plain`** files.

<br>

> [!TIP]
> **JFYI**: [`download-wiki-dumps.sh`](https://github.com/kekse1/scripts/?#download-wiki-dumpssh)

> [!WARNING]
> This is my personal example for messy code.. xD~

<br><br>

## News
* \[**2025-11-02**\] Also published my [`xml.js`](#xml) here. Plus some small changes.
* \[**2025-11-01**\] Initially published this script here.

<br><br><br>

## Description/Features
This list describes all (possible) operations:

- [x] First it'll extract the article bodies out of the `.xml` structure (see `<text>`)
- [x] All of the [**HTML entities**](https://html.spec.whatwg.org/entities.json) will be converted to real HTML code;
- [x] Then it'll (optionally) change the HTML code;
- [x] Also it'll (optionally) convert some of the **special syntax** to 'nice looking' code/text;
- [x] For every article there'll be a **direct** write operation (to clean the buffer and flush all new data)

For more info about the real filtering algorithms see the [`data.js`](src/js/data.js).

- [x] Buffered file I/O (configurable via `--buffer`; and w/ a sane state in the `Data` instance);
- [x] Event driven.. the console status output does *not* happen in the [`data.js`](src/js/data.js), only in the [`main.js`](src/js/main.js);

Try to run the [main script](src/js/main.js) without any command line parameters
to see kinda 'help' (the syntax and possible parameters).

> [!WARNING]
> The article extraction (out of pure XML structure) really works great, and also the
> entity conversion. But I'm not sure with the filtering functions.. the current results
> look really good (clean and nice looking language, ..) - but I'll have to inspect the
> used syntax better (mostly brackets like `[[` etc.)!!

<br>

## Source
Look into [this source directory](./src/).

There [**JavaScript**](https://node.js/) source is divided into the
[main startup script](./src/js/main.js) (and should be executable `+x`,
or called w/ the `node` interpreter), and the important part is in the
[`data.js`](./src/js/data.js) (`class extends EventEmitter`). ..etc.

<br>

### XML
Now I also included my (merely untested) [`xml.js`](src/js/xml.js).

This is for the entity conversion (and depends on the official
[`entitites.json`](https://html.spec.whatwg.org/entities.json),
which is being loaded in there).

Only a part of this class is being used here. The rest is not \*that\*
'clean' code (used for parsing data - which is done **here** in my
[`data.js`](./src/js/data.js) instead).

<br>

## Dependencies
Only my own extensions.. you need to create your own polyfill(s);
e.g. an `xml.js` for entity conversion, my [`getopt.js`](https://github.com/kekse1/getopt.js/),
or my [`ansi.js`](https://github.com/kekse1/ansi.js/); etc..

> [!IMPORTANT]
> I assume you want to use the [Wikimedia Dumps](https://dumps.wikimedia.org/)
> for your own A.I. work or smth. like this.. then you should be able to implement
> any necessary code. This repository is meant to be a place for most of the data
> processing/conversion code! ...

<br><br><br>

# Contact
<img src="https://kekse.biz/github.php?override=github:unwiki&draw&text=unwiki@kekse.biz&angle=6&size=38pt&fg=150,20,90&font=OpenSans&ro&readonly&h=64&v=16" />

<br>

# Copyright and License
The Copyright is [(c) Sebastian Kucharczyk](./COPYRIGHT.txt),
and it's licensed under the [MIT](./LICENSE.txt) (also known as 'X' or 'X11' license).

<a href="https://kekse.biz/">
<img src="favicon.png" alt="Favicon" />
</a>

