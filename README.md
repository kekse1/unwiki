<img src="https://kekse.biz/github.php?draw&override=github:unwiki" />

<br>

# `unwiki`
Converts the [Wikimedia Dumps](https://dumps.wikimedia.org/) to big **`text/plain`** files.

> [!TIP]
> **JFYI**: [`download-wiki-dumps.sh`](https://github.com/kekse1/scripts/?#download-wiki-dumpssh)

<br><br>

## News
* \[**2025-11-01**\] Initially published this script here.

<br>

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


## Source
Look into [this directory](src/).

<br>

## Dependencies
Only my own extensions.. you need to create your own polyfill(s);
e.g. an `xml.js` for entity conversion, my [`getopt.js`](https://github.com/kekse1/getopt.js/),
or my [`ansi.js`](https://github.com/kekse1/ansi.js/); etc.. **^\_^**

> [!IMPORTANT]
> I assume you want to use the [Wikimedia Dumps](https://dumps.wikimedia.org/) for your own A.I. work
> or smth. like this.. then you should be able to implement any necessary code. This repository is
> meant to be a place for most of the data processing code! ...

<br><br><br>

# Contact
<img src="https://kekse.biz/github.php?override=github:unwiki&draw&text=unwiki@kekse.biz&angle=6&size=38pt&fg=150,20,90&font=OpenSans&ro&readonly&h=64&v=16" />

# Copyright and License
The Copyright is [(c) Sebastian Kucharczyk](./COPYRIGHT.txt),
and it's licensed under the [MIT](./LICENSE.txt) (also known as 'X' or 'X11' license).

<a href="https://kekse.biz/">
<img src="favicon.png" alt="Favicon" />
</a>

