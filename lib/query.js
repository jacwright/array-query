
function query(field) {
	if ( !(this instanceof query) ) {
		return new query(field);
	}

	if (field) this._field(field);
	this._eval = '';
	this._lookups = {};
	this._sorts = [];
	this._actions = [];
	this._map = [];
	this._reduce = [];
}

function select(array) {
	if ( !(this instanceof select) ) {
		return new select(array);
	}
	query.call(this);
	this.array = array;
}

query.select = select;

(function() {

	query.prototype = {
		on: function(array) {
			var filter = this.getFilter();
			var sort = this.getSort();

			if (filter) array = array.filter(filter, query);
			else array = array.slice(); // copy array
			if (sort) array.sort(sort);
			if (this._offset) array = array.slice(this._offset, this._offset + (this._limit || 0));
			else if (this._limit) array.length = Math.min(array.length, this._limit);
			this._actions.forEach(function(action) {
				array.forEach(action);
			});
			this._map.forEach(function(action) {
				array = array.map(action);
			});
			this._reduce.forEach(function(action) {
				array = array.reduce(action);
			});
			return array;
		},
		getFilter: function() {
			var queryStr = this.toString();
			if (!queryStr) return null;
			if (this._filterCache && this._filterCache.query == queryStr) return this._filterCache;
			this._filterCache = new Function('obj', 'try { return ' + queryStr + '; } catch (e) { return false; }').bind(this);
			this._filterCache.query = queryStr;
			return this._filterCache;
		},
		getSort: function() {
			if (!this._sorts.length) return null;
			if (this._sortCache) return this._sortCache;
			var sorts = this._sorts.map(function(sort) {
				return sort.toFunction();
			});
			return this._sortCache = function(a, b) {
				var direction = 0, i = 0, len = sorts.length;
				while (i < len && direction == 0) {
					direction = sorts[i++](a, b);
				}
				return direction;
			};
		},
		getActions: function() {
			return this._actions;
		},
		_field: function(field) {
			this._expression = new Expression(field);
		},
		_add: function(eval, clean) {
			this._eval += eval;
			if (clean) this._expression = null;
			return this;
		},
		_term: function(condition, field) {
			this._flush();
			this._eval += ' ' + condition + ' ';
			if (typeof field == 'string') {
				this._expression = new Expression(field);
			} else if (field instanceof query) {
				for (var i in field._lookups) {
					if (field._lookups.hasOwnProperty(i)) this._lookups[i] = field._lookups[i];
				}
				this._eval += '(' + field + ')';
			} else if (field) {
				this._eval += '(' + field + ')';
			}
			return this;
		},
		_oper: function(operator, value) {
			if (this._expression) {
				this._expression.operator = operator;
				this._expression.value = value;
			}
			return this;
		},
		_store: function(value) {
			var postFix = Math.round(Math.random()*1000000);
			this._lookups[postFix] = value;
			return 'this._lookups[' + postFix + ']';
		},
		_sort: function(param, value) {
			if (this._sorts.length == 0) return;
			if (this._sortCache) delete this._sortCache;
			var sort = this._sorts[this._sorts.length - 1];
			if (typeof param == 'number') sort.direction = param;
			else {
				sort.type = sort[param];
				if (value !== undefined) sort.direction = value;
			}
			return this;
		},
		_flush: function() {
			if (this._expression) this._eval += this._expression;
			this._expression = null;
		},
		toString: function() {
			this._flush();
			return this._eval;
		},
		and: function(field) {
			return this._term('&&', field);
		},
		or: function(field) {
			return this._term('||', field);
		},
		not: function(value) {
			if (this._expression) {
				this._expression.not = !this._expression.not;
				if (value !== undefined) this._expression.value = value;
			}
			return this;
		},
		equals: function(value) {
			return this._oper('===', value);
		},
		is: function(value) {
			return this._oper('===', value);
		},
		isnt: function(value) {
			this.not();
			return this.is(value);
		},
		within: function(value) { // when an array of values is passed
			var lookup = {};
			for (var i in value) lookup[value[i]] = true;

			if (this._expression) this._expression.template = '%not%operator[%term]';
			return this._oper(this._store(lookup));
		},
		has: function(value) {
			if (this._expression) this._expression.template = '%not(%term != null && %term.indexOf(%value) != -1)';
			return this._oper(null, value);
		},
		startsWith: function(value) {
			if (this._expression) this._expression.template = '%not(%term != null && %term.substr(0, %operator) == %value)';
			return this._oper(value.length, value);
		},
		endsWith: function(value) {
			if (this._expression) this._expression.template = '%not(%term != null && %term.substr(%term.length - %operator) == %value)';
			return this._oper(value.length, value);
		},
		gt: function(value) {
			return this._oper('>', value);
		},
		gte: function(value) {
			return this._oper('>=', value);
		},
		lt: function(value) {
			return this._oper('<', value);
		},
		lte: function(value) {
			return this._oper('<=', value);
		},
		regex: function(value) {
			if (this._expression) this._expression.template = '%not(%term != null && %operator.test(%term))';
			return this._oper(this._store(value));
		},
		same: function(value) {
			if (this._expression) this._expression.template = '%not(JSON.stringify(%term) %operator %value)';
			value = JSON.stringify(value);
			return this._oper('==', value);
		},
		filter: function(value) {
			if (typeof value != 'function') throw new Error('query.filter() parameter must be a function');
			if (this._expression) this._expression.template = '%not(%operator(%term))';
			else {
				this._expression = new Expression();
				this._expression.template = '%not(%operator(obj))';
			}
			return this._oper(this._store(value));
		},
		search: function(words) {
			words = RegExp.escape(words);
			var exp = new RegExp('\\b' + words.split(/\s/).join('|\\b'));
			return this.regex(exp);
		},
		type: function(value) {
			if (typeof value == 'function') {
				if (!this._expression) { // check the type of the main object
					this._expression = new Expression();
					this._expression.template = '%not(obj instanceof %operator)';
				} else {
					this._expression.template = '%not(%term instanceof %operator)';
				}
				return this._oper(this._store(value));
			} else {
				if (this._expression) this._expression.template = '%not(type(%term) %operator %value)';
				return this._oper('==', value);
			}
		},
		sort: function(field) {
			if (this._sortCache) delete this._sortCache;
			this._sorts.push(new Sort(field));
			return this;
		},
		asc: function() {
			return this._sort(1);
		},
		desc: function() {
			return this._sort(-1);
		},
		regular: function() {
			return this._sort('regular');
		},
		numeric: function() {
			return this._sort('numeric');
		},
		date: function() {
			return this._sort('date');
		},
		custom: function(value) {
			return this._sort('custom', value);
		},
		limit: function(value) {
			this._limit = value;
			return this;
		},
		offset: function(value) {
			this._offset = value;
			return this;
		},
		set: function(attrs) {
			this._actions.push(function(model) {
				model.set(attrs);
			});
			return this;
		}
	};


	select.prototype = Object.create(query.prototype);
	select.prototype.where = function(field) {
		if (field) this._expression = new Expression(field);
		return this;
	};
	select.prototype.end = function() {
		return this.on(this.array);
	};




	function Expression(term, operator, value, not) {
		this.term = term;
		this.operator = operator;
		this.value = value;
		this.not = not;
		this.template = '%not(%term %operator %value)';
	}

	Expression.prototype = {
		toString: function() {
			var self = this;
			return this.template.replace(/%\w+/g, function(match) {
				switch(match) {
					case '%not':
						return self.not ? '!' : '';
					case '%term':
						return '(typeof obj.' + self.term + ' !== "undefined" ? obj.' + self.term + ' : (typeof obj.get === "function" && obj.get("' + self.term + '")))' + (self.value instanceof Date ? '.getTime()' : '');
					case '%operator':
						return self.operator;
					case '%value':
						return JSON.stringify(self.value instanceof Date ? self.value.getTime() : self.value);
				}
			});
		}
	};


	function Sort(term, type, direction) {
		this.term = term;
		this.type = type || this.regular;
		this.direction = direction || 1;
	}

	Sort.prototype = {
		toFunction: function() {
			return this.type(this.term, this.direction);
		},
		regular: function(prop, order) {
			return function(a, b) {
				a = a[prop];
				b = b[prop];
				if (b == null) return -1;
				if (a == null) return 1;
				return order * (a > b ? 1 : (a < b ? -1 : 0));
			};
		},
		numeric: function(prop, order) {
			return function(a, b) {
				a = parseFloat(a[prop]);
				b = parseFloat(b[prop]);
				if (b == null || isNaN(b)) return -1;
				if (a == null || isNaN(a)) return 1;
				return order * (a - b);
			};
		},
		date: function(prop, order) {
			return function(a, b) {
				a = a[prop];
				b = b[prop];
				if (b == null) return -1;
				if (a == null) return 1;
				return order * (a.getTime() - b.getTime());
			};
		},
		custom: function(prop, func) {
			if (prop) {
				return function(a, b) {
					return func(a[prop], b[prop]);
				};
			} else {
				return function(a, b) {
					return func(a, b);
				};
			}
		}
	};

})();

if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
	module.exports = query;
}
