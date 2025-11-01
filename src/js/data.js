/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

//
const DEFAULT_FILTER_HTML = true;
const DEFAULT_FILTER_SPECIAL = true;

const DEFAULT_ARTICLE_SEP = 10;
const DEFAULT_BUFFER_SIZE = (1024 * 64);

const DEFAULT_ENCODING = 'utf8';//'latin1'?
const DEFAULT_ROUND = 1;

//
import Quant from '../shared/quant.js';

import fs from 'node:fs';
import path from 'node:path';

//
class Data extends Quant
{
	constructor(_xml, ... _args)
	{
		//
		super();

		//
		if(!(this.xml = _xml))
		{
			throw new Error('Expecting XML instance');
		}

		this.htmlFilter = DEFAULT_FILTER_HTML;
		this.specialFilter = DEFAULT_FILTER_SPECIAL;
		this.articleSeparator = DEFAULT_ARTICLE_SEP;
		this.bufferSize = DEFAULT_BUFFER_SIZE;
		this.round = DEFAULT_ROUND;
		this.encoding = DEFAULT_ENCODING;

		for(var i = 0; i < _args.length; ++i)
		{
			if(!object(_args[i]))
			{
				continue;
			}
			
			if(bool(_args[i].html))
			{
				this.htmlFilter =
					_args[i].html;
			}

			if(bool(_args[i].special))
			{
				this.specialFilter =
					_args[i].special;
			}
			
			if(string(_args[i].separator, true))
			{
				this.articleSeparator =
					_args[i].separator;
			}
			else if(int(_args[i].separator))
			{
				if(_args[i].separator < 0)
				{
					_args[i].separator = 0;
				}

				this.articleSeparator = eol(
					_args[i].separator);
			}

			if(int(_args[i].bufferSize) && _args[i].bufferSize > 0)
			{
				this.bufferSize = _args[i].bufferSize;
			}
			else if(int(_args[i].buffer) && _args[i].buffer > 0)
			{
				this.bufferSize = _args[i].buffer;
			}

			if(int(_args[i].round) && _args[i].round >= 0)
			{
				this.round = _args[i].round;
			}

			if(string(_args[i].encoding, false))
			{
				this.encoding = _args[i].encoding;
			}

			_args.splice(i--, 1);
		}

		if(int(this.articleSeparator))
		{
			this.articleSeparator = eol(
				this.articleSeparator);
		}

		setImmediate(() => {
			this.reset();
			
			if(this.xml.hasEntities)
			{
				this.start(... _args);
			}
			else if(this.xml.entitiesPath)
			{
				this.xml.once('load', () => this.
					start(... _args));
			}
			else
			{
				const err = 'Missing some XML metadata..';

				if(this.listenersCount('error'))
				{
					this.emit('error', err);
				}
				else
				{
					throw new Error(err);
				}
			}
		});
	}

	info()
	{
		throw new Error('todo');
	}

	reset()
	{
		this.read = this.written = 0;
		this.articleCount = 0;
		this.buffer = '';
		this.open = 0;
		this.state = {
			ready: '',
			tag: '' };
	}

	start(... _args)
	{
		var inputPath = null, outputPath = null;

		for(var i = 0; i < _args.length; ++i)
		{
			if(pathname(_args[i]))
			{
				if(inputPath === null)
				{
					inputPath = _args[i];
				}
				else if(outputPath === null)
				{
					outputPath = _args[i];
				}
				else
				{
					throw new Error('Only two path strings expected');
				}
			}
		}
		
		if(inputPath && outputPath)
		{
			if(fs.existsSync(inputPath) && !fs.existsSync(outputPath))
			{
				this.beginOutputStream(outputPath);
				this.beginInputStream(inputPath);
			}
			else if(this.listenerCount('error'))
			{
				this.emit('error', inputPath, outputPath);
			}
			else
			{
				throw new Error(inputPath + ' / ' + outputPath);
			}
		}
	}

	get inputPath()
	{
		if(this.inputStream)
		{
			return this.inputStream.path;
		}

		return (this._inputPath || null);
	}

	get outputPath()
	{
		if(this.outputStream)
		{
			return this.outputStream.path;
		}

		return (this._outputPath || null);
	}

	endInputStream()
	{
		if(!this.inputStream)
		{
			return null;
		}

		const result = this.inputPath;

		this.inputStream.close();
		this.inputStream = null;

		return result;
	}

	endOutputStream()
	{
		if(!this.outputStream)
		{
			return null;
		}

		const result = this.outputPath;

		//this.outputStream.close();
		this.outputStream.end();
		this.outputStream = null;

		return result;
	}

	countOpen()
	{
		if(++this.open === 2)
		{
			this.emit('open', {
				input: this.inputPath,
				output: this.outputPath });
		}
	}

	countClose()
	{
		if(--this.open === 0)
		{
			if(this.written === 0)
			{
				fs.unlinkSync(this.outputPath);
			}

			this.emit('close', {
				read: this.read,
				written: this.written,
				input: this.inputPath,
				output: this.outputPath });
		}
	}

	beginInputStream(_path = this.inputPath)
	{
		if(this.inputStream)
		{
			return this.inputStream;
		}

		try
		{
			if((this.size = fs.statSync(_path = path.resolve(_path), {
				bigint: false, throwIfNoEntry: true }).size) <= 0)
			{
				console.error('Unable to determine input file size (or it\'s empty)!');
				process.exit(true);
			}
		}
		catch(_err)
		{
			console.error('Unable to stat your input file:');
			console.error(_err.message);
			process.exit(true);
		}

		const result = fs.createReadStream(_path = path.resolve(_path), {
			encoding: this.encoding, autoClose: true, emitClose: true,
			highWaterMark: this.bufferSize });

		if(!this.outputStream)
		{
			result.pause();
		}

		result.once('open', () => this.countOpen());
		result.once('close', () => this.countClose());
		result.once('end', (... _a) => {
			this.createArticle();
			this.endOutputStream(); });
		result.on('data', (... _a) => {
			this.read += _a[0].length;
			this.extractArticles(... _a); });

		this._inputPath = result.path;
		return this.inputStream = result;
	}

	beginOutputStream(_path = this.outputPath)
	{
		if(this.outputStream)
		{
			return this.outputStream;
		}

		const result = fs.createWriteStream(_path = path.resolve(_path), {
			encoding: this.encoding, highWaterMark: this.bufferSize });

		result.once('finish', () => this.
			countClose());
		result.once('open', () => {
			this.countOpen();
			
			if(this.inputStream)
			{
				this.inputStream.resume();
			}
		});
		result.once('close', () => {
			this.countClose();
			this.endInputStream();
		});

		this._outputPath = result.path;
		return this.outputStream = result;
	}

	writeOutput(_data)
	{
		this.written += _data.length;
		return this.outputStream.write(_data);
	}

	//
	handleArticle(_item)
	{
		try
		{
			if(_item = this.editArticle(_item))
			{
				_item = this.writeArticle(_item.trim());
			}
			else
			{
				--this.articleCount;
			}
		}
		catch(_err)
		{
			if(this.listenerCount('error'))
			{
				this.emit('error', _err);
			}
			else
			{
				throw _err;
			}
		}

		return _item;
	}

	editArticle(_item)
	{
		_item = this.convertEntities(_item.trim());

		if((_item = _item.trim()) && this.htmlFilter)
		{
			_item = this.filterHTML(_item);
		}

		if((_item = _item.trim()) && this.specialFilter)
		{
			_item = this.filterSpecial(_item);
		}

		return _item;
	}

	//
	static get ignoreTags()
	{
		return [
			'templatestyles',
			'imagemap'
		];
	}

	filterHTML(_item)
	{
		var	open = null, tags = [], sep, comment = false, result = '';
		const	ignoreTags = this.constructor.ignoreTags;

		loop: for(var i = 0; i < _item.length; ++i)
		{
			if(comment)
			{
				if(_item.at(i, '-->'))
				{
					comment = false;
					i += 2;
				}
			}
			else if(open !== null)
			{
				if(_item[i] === '>')
				{
					if(open[0] === '/')
					{
						tags.remove(open.substr(1));
					}
					else if(open.endsWith(' /'))
					{
						tags.remove(open.slice(0, -2));
					}
					else
					{
						tags.push(open);
					}

					open = null;
				}
				else if(_item.at(i, ' />'))
				{
					open += ' /';
					++i;
				}
				else if(!_item[i].trim())
				{
					sep = true;
				}
				else if(!sep)
				{
					open += _item[i];
				}
			}
			else if(_item.at(i, '<!--'))
			{
				comment = true;
				i += 3;
			}
			else if(_item[i] === '<')
			{
				open = '';
				sep = false;
			}
			else
			{
				for(const tag of tags)
				{
					if(ignoreTags.includes(tag))
					{
						continue loop;
					}
				}

				if(open === null)
				{
					result += _item[i];
				}
			}
		}

		return result;
	}

	static get ignoreSpecialTags()
	{
		return [
			'File',
			'Datei',
			'Bild',
			'Image',
			'Kategorie'
		];
	}

	filterSpecial(_item)
	{
		const	ignoreTags = this.constructor.ignoreSpecialTags;
		var	result = '', firstChar = '', sub, ign;

		loop: for(var i = 0; i < _item.length; ++i)
		{
			if(_item.at(i, '[['))
			{
				ign = false;
				sub = '';

				for(i += 2; i < _item.length; ++i)
				{
					if(_item.at(i, ']]'))
					{
						if(sub = sub.trim())
						{
							if(sub.startsWith('{{') && sub.endsWith('}}'))
							{
								sub = '';
							}
						}

						if(sub)
						{
							result += sub;
							sub = '';
						}

						++i;
						break;
					}

					if(ign)
					{
						continue;
					}

					if(_item[i] === '|')
					{
						sub = '';
					}
					else if(_item[i] === ':')
					{
						if(ignoreTags.includes(sub))
						{
							ign = true;
							sub = '';
						}
					}
					else
					{
						sub += _item[i];
					}
				}

				if(sub = sub.trim())
				{
					result += sub;
					sub = '';
				}
			}
			else if(_item.at(i, '{|'))
			{
				for(i += 2; i < _item.length; ++i)
				{
					if(_item.at(i, '|}'))
					{
						++i;
						break;
					}
				}
			}
			else if(_item.at(i, '{{'))
			{
				for(i += 2; i < _item.length; ++i)
				{
					if(_item.at(i, '}}'))
					{
						++i;
						break;
					}
				}
			}
			else if(_item[i] === '[')
			{
				ign = -1;
				sub = '';

				for(++i; i < _item.length; ++i)
				{
					if(_item[i] === ']')
					{
						break;
					}
					else if(ign > -1)
					{
						result += _item[i];
					}
					else if(_item[i].trim())
					{
						sub += _item[i];
					}
					else
					{
						ign = i;
					}
				}

				if(sub = sub.trim())
				{
					if(ign > -1) result += ' ';
					result += '<' + sub;
					result += '>';
					sub = '';
				}
			}
			else if(_item[i] === '\n')
			{
				firstChar = (_item[i + 1] || '');

				switch(firstChar)
				{
					case '*':
						result += '\n\n* ';
						++i;
						break;
					case ':':
						result += '; ';
						i += 2;
						break;
					case '=':
						result += '\n\n';
						++i;
						break;
					default:
						result += '\n';
						continue loop;
				}

				for(++i; i < _item.length; ++i)
				{
					if(_item[i].trim())
					{
						--i;
						break;
					}
				}
			}
			else
			{
				result += _item[i];
			}
		}

		if(result.toUpperCase() === result)
		{
			return '';
		}

		return result;
	}

	convertEntities(_item)
	{
		var result = '', entity = '';

		for(var i = 0; i < _item.length; ++i)
		{
			if(entity)
			{
				entity += _item[i];

				if(_item[i] === ';')
				{
					result += this.
						xml.renderEntity(
							entity);
					entity = '';
				}
			}
			else if(_item[i] === '&')
			{
				entity = '&';
			}
			else
			{
				result += _item[i];
			}
		}

		return result;
	}

	writeArticle(_item)
	{
		if(!(_item = _item.trim()))
		{
			--this.articleCount;
			return '';
		}

		this.writeOutput(_item +
			this.articleSeparator);
		
		this.emit('article', {
			article: _item,
			size: _item.length,
			count: this.articleCount,
			total: { size: this.size,
				 read: this.read,
				 written: this.written,
				 percent: this.percent }});

		return _item;
	}
	
	get percent()
	{
		return (Math.round(Math.min(1, this.read / this.size) * 100,
			this.round).toFixed(this.round).padStart(3, ' ') + '%');
	}

	createArticle()
	{
		if(!(this.buffer = this.buffer.trim()))
		{
			return this.buffer = '';
		}
		
		const item = this.buffer;
		++this.articleCount;
		this.buffer = '';
		
		return this.handleArticle(item);
	}

	//
	//*nur hier* globale states.. alles andere agiert mit
	//jeweils vollstaendigen articles (die nun nur noch
	//reine strings sind somit ;-) ...
	//
	extractArticles(_chunk)
	{
		const START = '<text ';
		const STOP = '</text>';

		var result = 0;
		
		for(var i = 0; i < _chunk.length; ++i)
		{
			if(_chunk[i] === '\r')
			{
				continue;
			}
			else if(_chunk[i] === '\'')
			{
				continue;
			}
			else if(this.state.ready === 'data')
			{
				if(this.state.tag)
				{
					this.state.tag += _chunk[i];

					if(this.state.tag === STOP)
					{
						this.state.tag = '';
						this.state.ready = '';
						this.createArticle();
						++result;
					}
					else if(_chunk[i] === '>')
					{
						this.buffer += this.state.tag;
						this.state.tag = '';
					}
				}
				else if(_chunk[i] === '<')
				{
					this.state.tag = '<';
				}
				else
				{
					this.buffer += _chunk[i];
				}
			}
			else if(this.state.ready === 'text')
			{
				if(_chunk[i] === '>')
				{
					this.state.ready = 'data';
					this.state.tag = '';
				}
			}
			else if(this.state.tag)
			{
				this.state.tag += _chunk[i];

				if(this.state.tag === START)
				{
					this.state.ready = 'text';
					this.state.tag = '';
				}
				else if(_chunk[i] === '>')
				{
					this.state.tag = '';
				}
			}
			else if(_chunk[i] === '<')
			{
				this.state.tag = '<';
			}
		}
		
		return result;
	}
}

export default Data;

//

