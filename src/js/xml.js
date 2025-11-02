/*
 * Copyright (c) Sebastian Kucharczyk <kuchen@kekse.biz>
 * https://norbert.com.es/
 */

/*
 *
 * SIEHE < https://html.spec.whatwg.org/entities.json > ..! ;-)
 *
 */

//
const DEFAULT_BUFFER = 4096;
const DEFAULT_ENTITIES = '../../json/entities.json';

//
import EventEmitter from 'node:events';
import path from 'node:path';
import fs from 'node:fs';

//
class XML extends EventEmitter
{
	constructor(... _args)
	{
		super();

		this.entities = this.entitiesData = null;
		var loadEntities = null;

		for(var i = 0, j = 0; i < _args.length; ++i)
		{
			if(typeof _args[i] === 'boolean')
			{
				if(loadEntities = _args.splice(i--, 1)[0])
				{
					loadEntities = DEFAULT_ENTITIES;
				}
			}
			else if(typeof _args[i] === 'string')
			{
				const orig = loadEntities;

				try
				{
					loadEntities = fs.realpathSync(
						_args.splice(i--, 1)[0], {
							encoding: 'utf8' });
				}
				catch(_err)
				{
					loadEntities = orig;
				}
			}
			else if(int(_args[i]) && _args[i] > 0)
			{
				this._buffer = _args.splice(i--, 1)[0];
			}
		}

		if(loadEntities)
		{
			this.entitiesPath = loadEntities;
			setImmediate(() => this.loadEntities(
				loadEntities));
		}
		
		this.filterBuffer = null;
		this.extractBuffer = null;
		this.reset();
	}

	static get escapeChars()
	{
		return [
			[ '&', '&amp;' ],
			//[ ' ', '&nbsp;' ],
			[ '"', '&quot;' ],
			[ '\'', '&#39;' ],
			[ '<', '&lt;' ],
			[ '>', '&gt;' ]
		];
	}

	static escape(_string)
	{
		const escapeChars = this.escapeChars;
		const from = [], to = [];

		for(const item of escapeChars)
		{
			from.push(item[0]);
			to.push(item[1]);
		}

		var result = '';
		var idx;

		for(var i = 0; i < _string.length; ++i)
		{
			if((idx = from.indexOf(_string[i])) > -1)
			{
				result += to[idx];
				i += (from[idx].length - 1);
			}
			else
			{
				result += _string[i];
			}
		}

		return result;
	}

	static unescape(_string)
	{
		const escapeChars = this.escapeChars;
		const from = [], to = [];

		for(const item of escapeChars)
		{
			from.push(item[1]);
			to.push(item[0]);
		}

		var result = '';
		var idx;
		
		loop: for(var i = 0; i < _string.length; ++i)
		{
			for(var j = 0; j < from.length; ++j)
			{
				if(_string.at(i, from[j]))
				{
					result += to[j];
					i += (from[j].length - 1);
					continue loop;
				}
			}
			
			result += _string[i];
		}

		return result;
	}

	get hasEntities()
	{
		return (this.entities !== null);
	}

	loadEntities(_path)
	{
		const callback = (_err, _data) => {
			if(_err)
			{
				this.entitiesPath = null;
				this.emit('error', _path);
			}
			else
			{
				this.entities = JSON.parse(
					this.entitiesData = _data);
				this.emit('ready', _path,
					this.entities,
					this.entitiesData);
			}
		};

		if(!path.isAbsolute(_path))
		{
			_path = path.resolve(path.join(
				import.meta.dirname, _path));
		}
		else
		{
			_path = path.resolve(_path);
		}

		return fs.readFile(this.entitiesPath = _path, {
			encoding: 'utf8' }, callback);
	}

	renderEntity(_string)
	{
		if(typeof _string !== 'string')
		{
			return null;
		}

		if(!_string || _string[0] !== '&' || _string[_string.length - 1] !== ';')
		{
			return _string;
		}

		if(_string.startsWith('&#'))
		{
			return this.constructor.renderNumericEntity(_string);
		}

		return this.renderNamedEntity(_string);
	}

	renderNamedEntity(_string)
	{
		if(typeof _string !== 'string')
		{
			return null;
		}

		if(!this.hasEntities)
		{
			return _string;
		}

		if(!_string || _string[_string.length - 1] !== ';')
		{
			return _string;
		}

		if(_string[0] !== '&' || _string.startsWith('&#'))
		{
			return _string;
		}

		const entity = this.entities[_string];

		if(!entity)
		{
			return _string;
		}

		return String.fromCodePoint(
			... entity.codepoints);
	}

	static renderNumericEntity(_string)
	{
		if(typeof _string !== 'string')
		{
			return null;
		}

		if(!_string || _string[_string.length - 1] !== ';')
		{
			return _string;
		}

		if(_string[0] !== '&')
		{
			return _string;
		}

		if(_string.startsWith('&#x'))
		{
			return this.renderHexadecimalEntity(_string);
		}

		if(_string.startsWith('&#'))
		{
			return this.renderDecimalEntity(_string);
		}

		return _string;
	}

	static renderDecimalEntity(_string)
	{
		if(typeof _string !== 'string')
		{
			return null;
		}

		if(!_string || _string[_string.length - 1] !== ';' || !_string.startsWith('&#') || _string.startsWith('&#x'))
		{
			return _string;
		}

		const result = Number(_string.substr(2).slice(0, -1));

		if(Number.isNaN(result))
		{
			return _string;
		}

		return String.fromCodePoint(result);
	}

	static renderHexadecimalEntity(_string)
	{
		if(typeof _string !== 'string')
		{
			return null;
		}

		if(!_string || _string[_string.length - 1] !== ';' || !_string.startsWith('&#x'))
		{
			return _string;
		}

		const result = parseInt(_string.substr(3).slice(0, -1), 16);

		if(Number.isNaN(result))
		{
			return _string;
		}

		return String.fromCodePoint(result);
	}

	reset()
	{
		this.open = null;
		this.entity = null;
	}
	
	get buffer()
	{
		return (this._buffer || DEFAULT_BUFFER);
	}
	
	set buffer(_value)
	{
		if(int(_value) && _value > 0)
		{
			return this._buffer = _value;
		}
		
		return this.buffer;
	}
	
	filterTags(_string, _nested_code = false, _callback, _buffer = this.buffer)
	{
		if(typeof _callback !== 'function')
		{
			_callback = null;
		}

		if(_string === null)
		{
			if(!_callback)
			{
				return this.reset();
			}

			if(this.filterBuffer)
			{
				_callback(this.filterBuffer);
			}

			_callback(null);

			this.filterBuffer = null;
			return this.reset();
		}
		
		if(!int(_buffer) || _buffer < 1)
		{
			_buffer = this.buffer;
		}
		
		if(typeof _string !== 'string')
		{
			return null;
		}

		var result, open;
		
		if(_callback)
		{
			if(this.filterBuffer !== null)
			{
				throw new Error('Filter buffer is not yet cleared.. use .reset();');
			}

			result = 0;
			open = null;
			this.filterBuffer = '';
			this.open = false;
		}
		else
		{
			result = '';
			open = false;
		}

		const isOpen = (_value) => {
			if(_callback)
			{
				if(bool(_value))
				{
					return this.open = _value;
				}
				
				return this.open;
			}
			else if(bool(_value))
			{
				return open = _value;
			}
			
			return open;
		};

		const append = (_data) => {
			if(!_callback)
			{
				return result += _data;
			}

			if((this.filterBuffer += _data).length >= _buffer)
			{
				_callback(this.filterBuffer);
				this.filterBuffer = '';
			}

			return result += _data.length;
		};

		for(var i = 0; i < _string.length; ++i)
		{
			if(isOpen())
			{
				if(_string[i] === '>')
				{
					isOpen(false);
				}
				else if(_nested_code && _string.at(i, '&gt;'))
				{
					isOpen(false);
					i += 3;
				}
			}
			else if(_string[i] === '<')
			{
				isOpen(true);
			}
			else if(_nested_code && _string.at(i, '&lt;'))
			{
				isOpen(true);
				i += 3;
			}
			else
			{
				append(_string[i]);
			}
		}
		
		if(_callback && this.filterBuffer && !isOpen())
		{
			result += this.filterBuffer.length;
			_callback(this.filterBuffer);
			this.filterBuffer = '';
		}

		return result;
	}

	extractEntities(_string, _callback)
	{
		if(typeof _callback !== 'function')
		{
			_callback = null;
		}

		if(_string === null)
		{
			if(!_callback)
			{
				return this.reset();
			}

			if(this.entity)
			{
				this.extractBuffer += this.entity;
			}

			if(this.extractBuffer)
			{
				_callback(this.extractBuffer);
			}

			_callback(null);

			this.extractBuffer = null;
			return this.reset();
		}
		
		if(typeof _string !== 'string')
		{
			return null;
		}

		var result, entity, buffer;
		
		if(_callback)
		{
			if(this.extractBuffer !== null)
			{
				throw new Error('Extract buffer is not yet cleared.. use .reset();');
			}

			result = 0;
			entity = null;
			this.entity = '';
			this.extractBuffer = '';
		}
		else
		{
			result = [];
			entity = '';
			buffer = '';
		}
		
		aEntity = (_value) => {
			if(_callback)
			{
				if(string(_value))
				{
					return this.entity += _value;
				}
				else if(_value === null)
				{
					return this.entity = '';
				}
				
				return this.entity;
			}
			else if(string(_value))
			{
				return entity += _value;
			}
			else if(_value === null)
			{
				return entity = '';
			}
			
			return entity;
		};

		aBuffer = (_value) => {
			if(_callback)
			{
				if(string(_value))
				{
					return this.extractBuffer += _value;
				}
				else if(_value === null)
				{
					return this.extractBuffer = '';
				}
				
				return this.extractBuffer;
			}
			else if(string(_value))
			{
				return buffer += _value;
			}
			else if(_value === null)
			{
				return buffer = '';
			}
			
			return buffer;
		};

		append = (_item) => {
			if(!_callback)
			{
				return result.push(_item);
			}
			
			_callback(_item);
		};

		for(var i = 0, j = 0; i < _string.length; ++i)
		{
			if(aEntity())
			{
				if(_string[i] === ';')
				{
					++result;
					append(aEntity());
					aEntity(null);
				}
				else
				{
					aEntity(_string[i]);
				}
			}
			else if(_string[i] === '&')
			{
				if(aBuffer())
				{
					append(aBuffer());
					aBuffer(null);
				}
				
				aEntity('&');
			}
			else
			{
				aBuffer(_string[i]);
			}
		}
		
		if(this.extractBuffer && !this.entity)
		{
			append(this.extractBuffer);
			this.extractBuffer = '';
		}

		return result;
	}

	renderEntities(_string)
	{
		if(typeof _string !== 'string')
		{
			return null;
		}

		const data = this.extractEntites(_string, true, null);
		var result = '';

		for(var i = 0; i < data.length; ++i)
		{
			if(data[i][0] === '&')
			{
				result += this.renderEntity(data[i]);
			}
			else
			{
				result += data[i];
			}
		}

		return result;
	}
}

export default XML;

//

