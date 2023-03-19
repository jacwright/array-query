class Query {
  #eval;
  #lookups;
  #sorts;
  #actions;
  #map;
  #reduce;
  #offset;
  #limit;
  #filterCache;
  #sortCache;
  #expression;

  constructor(field) {
    if (!(this instanceof Query)) {
      return new Query(field);
    }
    if (field) this.#field(field);
    this.#eval = "";
    this.#lookups = {};
    this.#sorts = [];
    this.#actions = [];
    this.#map = [];
    this.#reduce = [];
  }

  on(input) {
    const promise = Promise.resolve(input);
    return promise.then((array) => {
      try {
        const arrayOperations = this.#arrayOperationsOn(array);
        return arrayOperations;
      } catch (error) {
        console.error(
          `An error occurred while performing array operations: ${error}`
        );
        return [];
      }
    });
  }

  #arrayOperationsOn(inputArray) {
    const filter = this.getFilter();
    const sort = this.getSort();

    let array = [...inputArray];
    if (filter) {
      array = array.filter(filter, Query);
    }
    if (sort) {
      array = array.sort(sort);
    }
    if (this.#offset) {
      array = array.slice(this.#offset, this.#offset + (this.#limit || 0));
    } else if (this.#limit) {
      array = array.slice(0, this.#limit);
    }
    this.#actions.forEach((action) => {
      array.forEach(action);
    });
    this.#map.forEach((action) => {
      array = array.map(action);
    });
    this.#reduce.forEach((action) => {
      array = array.reduce(action);
    });
    return array;
  }

  getFilter() {
    const queryStr = this.toString();
    if (!queryStr) return null;
    if (this.#filterCache?.query === queryStr) return this.#filterCache;
    this.#filterCache = new Function(
      "obj",
      `try { return ${queryStr}  } catch (e) { return false; }`
    ).bind(this);
    this.#filterCache.query = queryStr;
    return this.#filterCache;
  }

  getSort() {
    if (!this.#sorts.length) return null;
    if (this.#sortCache) return this.#sortCache;
    const sorts = this.#sorts.map((sort) => sort.toFunction());
    return (this.#sortCache = (a, b) => {
      let direction = 0,
        i = 0,
        len = sorts.length;
      while (i < len && direction == 0) {
        direction = sorts[i++](a, b);
      }
      return direction;
    });
  }

  getActions() {
    return this.#actions ?? [];
  }

  #field = (field) => {
    this.#expression = new Expression(field);
  };

  #add = (eval2, clean) => {
    this.#eval += eval2;
    if (clean) this.#expression = null;
    return this;
  };

  #term(condition, field) {
    this.#flush();
    this.#eval += ` ${condition} `;
    if (typeof field == "string") {
      this.#expression = new Expression(field);
    } else if (field instanceof Query) {
      Object.assign(this.#lookups, field.#lookups);
      this.#eval += `(${field})`;
    } else if (field) {
      this.#eval += `(${field})`;
    }
    return this;
  }

  #oper(operator, value) {
    if (this.#expression) {
      this.#expression.operator = operator;
      this.#expression.value = value;
    }
    return this;
  }

  #store(value) {
    const postFix = Math.round(Math.random() * 1000000);
    this.#lookups[postFix] = value;
    return "this.lookups[" + postFix + "]";
  }

  #sort(param, value) {
    if (this.#sorts.length == 0) return;
    if (this.#sortCache) this.#sortCache = null;
    const sort = this.#sorts[this.#sorts.length - 1];
    if (typeof param == "number") sort.direction = param;
    else {
      sort.type = sort[param];
      if (value !== undefined) sort.direction = value;
    }
    return this;
  }

  #flush() {
    if (this.#expression) this.#eval += this.#expression;
    this.#expression = null;
  }

  toString() {
    this.#flush();
    return this.#eval;
  }

  and(field) {
    return this.#term("&&", field);
  }

  or(field) {
    return this.#term("||", field);
  }

  not(value) {
    if (this.#expression) {
      this.#expression.not = !this.#expression.not;
      if (value !== undefined) this.#expression.value = value;
    }
    return this;
  }

  equals(value) {
    return this.#oper("===", value);
  }

  is(value) {
    return this.#oper("===", value);
  }

  isnt(value) {
    this.not();
    return this.is(value);
  }

  within(value) {
    // when an array of values is passed
    const lookup = {};
    for (const i in value) lookup[value[i]] = true;

    if (this.#expression) this.#expression.template = "%not%operator[%term]";
    return this.#oper(this.#store(lookup));
  }

  has(value) {
    if (this.#expression)
      this.#expression.template =
        "%not(%term != null && %term.indexOf(%value) != -1)";
    return this.#oper(null, value);
  }

  startsWith(value) {
    if (this.#expression)
      this.#expression.template =
        "%not(%term != null && %term.substr(0, %operator) == %value)";
    return this.#oper(value.length, value);
  }

  endsWith(value) {
    if (this.#expression)
      this.#expression.template =
        "%not(%term != null && %term.substr(%term.length - %operator) == %value)";
    return this.#oper(value.length, value);
  }

  gt(value) {
    return this.#oper(">", value);
  }

  gte(value) {
    return this.#oper(">=", value);
  }

  lt(value) {
    return this.#oper("<", value);
  }

  lte(value) {
    return this.#oper("<=", value);
  }

  regex(value) {
    if (this.#expression)
      this.#expression.template =
        "%not(%term != null && %operator.test(%term))";
    return this.#oper(this.#store(value));
  }

  same(value) {
    if (this.#expression)
      this.#expression.template =
        "%not(JSON.stringify(%term) %operator %value)";
    value = JSON.stringify(value);
    return this.#oper("==", value);
  }

  filter(value) {
    if (typeof value != "function")
      throw new Error("query.filter() parameter must be a function");
    if (this.#expression) this.#expression.template = "%not(%operator(%term))";
    else {
      this.#expression = new Expression();
      this.#expression.template = "%not(%operator(obj))";
    }
    return this.#oper(this.#store(value));
  }

  search(words) {
    words = escapeRegExp(words);
    const exp = new RegExp("\\b" + words.split(/\s/).join("|\\b"));
    return this.regex(exp);
  }

  type(value) {
    if (typeof value == "function") {
      if (!this.#expression) {
        // check the type of the main object
        this.#expression = new Expression();
        this.#expression.template = "%not(obj instanceof %operator)";
      } else {
        this.#expression.template = "%not(%term instanceof %operator)";
      }
      return this.#oper(this.#store(value));
    } else {
      if (this.#expression)
        this.#expression.template = "%not(type(%term) %operator %value)";
      return this.#oper("==", value);
    }
  }

  sort(field) {
    if (this.#sortCache) this.#sortCache = null;
    this.#sorts.push(new Sort(field));
    return this;
  }

  asc() {
    return this.#sort(1);
  }

  desc() {
    return this.#sort(-1);
  }

  regular() {
    return this.#sort("regular");
  }

  numeric() {
    return this.#sort("numeric");
  }

  date() {
    return this.#sort("date");
  }

  custom(value) {
    return this.#sort("custom", value);
  }

  limit(value) {
    this.#limit = value;
    return this;
  }

  offset(value) {
    this.#offset = value;
    return this;
  }

  set(attrs) {
    this.#actions.push(function (model) {
      model.set(attrs);
    });
    return this;
  }

  get lookups() {
    return this.#lookups;
  }

  setExpression(expression) {
    this.#expression = expression;
  }
}

class Select extends Query {
  constructor(array) {
    if (!Array.isArray(array)) {
      throw new TypeError("Must query on an Array, but passed: " + array);
    }
    if (!(this instanceof Select)) {
      return new Select(array);
    }
    this.array = array;
  }

  where(field) {
    if (field) this.setExpression(new Expression(field));
    return this;
  }

  end() {
    return this.on(this.array);
  }
}

class Expression {
  constructor(term, operator, value, not) {
    this.term = term;
    this.operator = operator;
    this.value = value;
    this.not = not;
    this.template = "%not(%term %operator %value)";
  }
  toString() {
    return this.template.replace(/%\w+/g, (match) => {
      switch (match) {
        case "%not":
          return this.not ? "!" : "";
        case "%term":
          return `
          ( 
            typeof obj["${this.term}"] !== "undefined" ? 
            obj["${this.term}"] : (typeof obj.get === "function" && obj.get("${
            this.term
          }"))
          )${this.value instanceof Date ? ".getTime()" : ""}
            `;
        case "%operator":
          return this.operator;
        case "%value":
          return JSON.stringify(
            this.value instanceof Date ? this.value.getTime() : this.value
          );
      }
    });
  }
}

class Sort {
  constructor(term, type, direction) {
    this.term = term;
    this.type = type || this.regular;
    this.direction = direction || 1;
  }
  toFunction() {
    return this.type(this.term, this.direction);
  }
  regular(prop, order) {
    return function (a, b) {
      a = a[prop];
      b = b[prop];
      if (b == null) return -1;
      if (a == null) return 1;
      return order * (a > b ? 1 : a < b ? -1 : 0);
    };
  }
  numeric(prop, order) {
    return function (a, b) {
      a = parseFloat(a[prop]);
      b = parseFloat(b[prop]);
      if (b == null || isNaN(b)) return -1;
      if (a == null || isNaN(a)) return 1;
      return order * (a - b);
    };
  }
  date(prop, order) {
    return function (a, b) {
      a = a[prop];
      b = b[prop];
      if (b == null) return -1;
      if (a == null) return 1;
      return order * (a.getTime() - b.getTime());
    };
  }
  custom(prop, func) {
    if (prop) {
      return function (a, b) {
        return func(a[prop], b[prop]);
      };
    } else {
      return function (a, b) {
        return func(a, b);
      };
    }
  }
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const queryProvider = (...params) => new Query(...params);

const selectProvider = (...params) => new Select(...params);

export {
  queryProvider as default,
  queryProvider as Query,
  selectProvider as Select,
};
