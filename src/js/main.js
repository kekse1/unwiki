#!/usr/bin/env node

/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 *
 * Prepare Wikipedia .xml dumps for training Norbert.
 *
 */

//
import * as globals from '../shared/globals.js';
import * as server from '../shared/server.js';
import XML from '../shared/xml.js';
import Data from './data.js';
import getopt from '../shared/getopt.js';

import fs from 'node:fs';
import path from 'node:path';

//
const syntax = (_exit = 255) => {
	console.info(EOL + '\tSyntax: $0 < input.XML > < output.TXT >' + EOL);
	console.log('\t\t     --help'.warn(true).bold(true) + EOL);
	console.log('\t\t     --html'.warn(true) + '\tBoolean'.error(true));
	console.log('\t\t  --special'.warn(true) + '\tBoolean'.error(true));
	console.log('\t\t--separator'.warn(true) + '\tInteger'.error(true) + '/'.debug(true) + 'String'.error(true));
	console.log('\t\t   --buffer'.warn(true) + '\tInteger'.error(true));
	console.log('\t\t --encoding'.warn(true) + '\t String'.error(true));
	console.log('\t\t    --round'.warn(true) + '\tInteger'.error(true));
	console.eol();
	if(byte(_exit)) process.exit(_exit);
};

const opts = getopt(true, false);

if(opts.help)
{
	syntax(0);
}
else if(opts.length < 2)
{
	syntax(1);
}

const input = path.resolve(opts[0]);
const output = path.resolve(opts[1]);

if(fs.existsSync(output))
{
	console.error('Output path already exists!');
	process.exit(2);
}

if(!fs.existsSync(input))
{
	console.error('Input file doesn\'t exist!');
	process.exit(3);
}

console.debug(' Input: ' + input.bold(true).info(true).quote());
console.debug('Output: ' + output.bold(true).error(true).quote());
console.eol();

//
var tmp; const options = {
	bufferSize: null,
	separator: null,
	html: null,
	special: null };

if(int(tmp = opts.get('buffer')) && tmp > 0)
{
	options.bufferSize = tmp;
}

if(string(tmp = opts.get('separator'), true))
{
	options.separator = tmp;
}
else if(int(tmp))
{
	options.separator = eol(tmp);
}

if(bool(tmp = opts.get('html')))
{
	options.html = tmp;
}

if(bool(tmp = opts.get('special')))
{
	options.special = tmp;
}

if(string(tmp = opts.get('encoding'), false))
{
	options.encoding = tmp;
}

if(int(tmp = opts.get('round')) && tmp >= 0)
{
	options.round = tmp;
}

//
var data; const xml = new XML(true);

xml.once('ready', () => {
	xml.removeAllListeners('error');
	data = new Data(xml, input, output, options);
	data.once('open', () => {
		console.error(EOL + 'Both I/O files ' + 'opened'.
			info(true) + '!'.debug(true) + EOL);
	});
	data.once('close', (_e) => {
		console.info(EOL + 'Finished ' + '(and both I/O files closed)'.
			debug(true) + '!'.debug(true) + EOL);
		console.debug('Read: ' + Math.size.styled(
			_e.read).info(true));

		if(_e.written)
		{
			console.error('Written: ' + Math.size.styled(
				_e.written).info(true));
		}
		else
		{
			console.error('Nothing written; unlinked output file..');
		}

		process.exit();
	});
	data.on('article', (_e) => {
		const func = ((_e.count % 2) ? 'error' : 'warn');
		const infoLine = 'New article '.defaultFG(true) + '#'.info(true).bold(true) +
			_e.count.toLocaleString().bold(true)[func](true) + '\t'.debug(true) +
			Math.size.styled(_e.size).pad(16, ' ', true).defaultFG(true) +
			'; total { '.debug(true) + 'read'.defaultFG(true) + ': '.debug(true) +
			Math.size.styled(_e.total.read).warn(true) + ', '.debug(true) +
			'written'.defaultFG(true) + ': '.debug(true) + Math.size.styled(
			_e.total.written).error(true) + ' } ... '.debug(true) +
			_e.total.percent.bold(true).info(true);
		console.log(infoLine);
	});
	data.once('error', (_err) => {
		console.error(_err);
		process.exit(234);
	});
});

xml.once('error', (_path) => {
	console.error('Unable to load entity data!');
	console.warn(_path);
	process.exit(210);
});

//

