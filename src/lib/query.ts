export function query(field: string) {
  return new Query(field);
}

export function select(array: any[]) {
  return new Select(array);
}

type FilterFn = Parameters<typeof Array.prototype.filter>[0];
type SortFn = NonNullable<Parameters<typeof Array.prototype.sort>[0]>;
type SortType = (prop: string, order: number, fn?: SortFn) => SortFn;

let lookupId = 0;

export class Query {
  protected _eval: string = "";
  protected _lookups = new Map<number, any>();
  protected _sorts: Sort[] = [];
  protected _limit = Infinity;
  protected _offset = 0;
  protected _expression: Expression | undefined;
  protected _filterCache: FilterFn | undefined;
  protected _sortCache: SortFn | undefined;
  protected _isEqual = isEqual;

  constructor(field?: string) {
    if (field) this._expression = new Expression(field);
  }

  /**
   * Executes the query on the given array.
   */
  on<T = any>(input: PromiseLike<T[]>): PromiseLike<T[]>;
  on<T = any>(input: T[]): T[];
  on<T = any>(input: T[] | PromiseLike<T[]>): PromiseLike<T[]> | T[] {
    if (typeof (input as PromiseLike<T[]>).then === "function") {
      return (input as PromiseLike<T[]>).then((array) => this.on(array));
    }
    let array = input as T[];
    const filter = this._getFilter();
    const sort = this._getSort();
    if (filter) array = array.filter(filter, query);
    else array = array.slice(); // copy array
    if (!Array.isArray(array)) return [array]; // shortcut for first/last
    if (sort) array.sort(sort);
    if (this._offset || this._limit !== Infinity) {
      array = array.slice(this._offset, this._offset + this._limit);
    }
    return array;
  }

  /**
   * Executes the query on the given array and returns the first result.
   */
  first<T = any>(input: PromiseLike<T[]>): PromiseLike<T | undefined>;
  first<T = any>(input: T[]): T | undefined;
  first<T = any>(
    input: T[] | PromiseLike<T[]>
  ): PromiseLike<T | undefined> | T | undefined {
    if (typeof (input as PromiseLike<T[]>).then === "function") {
      return (input as PromiseLike<T[]>).then((array) => this.first(array));
    }
    return this.on(input as T[])[0];
  }

  /**
   * Executes the query on the given array and returns the last result.
   */
  last<T = any>(input: PromiseLike<T[]>): PromiseLike<T | undefined>;
  last<T = any>(input: T[]): T | undefined;
  last<T = any>(
    input: T[] | PromiseLike<T[]>
  ): PromiseLike<T | undefined> | T | undefined {
    if (typeof (input as PromiseLike<T[]>).then === "function") {
      return (input as PromiseLike<T[]>).then((array) => this.last(array));
    }
    const result = this.on(input as T[]);
    return result[result.length - 1];
  }

  /**
   * Ands two expressions or queries.
   */
  and(field?: string | Query) {
    return this._term("&&", field);
  }

  /**
   * Ors two expressions or queries.
   */
  or(field?: string | Query) {
    return this._term("||", field);
  }

  /**
   * Checks if the value is not equal to the given value.
   */
  not(value?: any) {
    if (this._expression) {
      this._expression.not = !this._expression.not;
      if (value !== undefined) this._expression.value = value;
    }
    return this;
  }

  /**
   * Checks if the value is equal to the given value.
   */
  equals(value: any) {
    return this._oper("===", value);
  }

  /**
   * Checks if the value is equal to the given value. Alias if `equals`.
   */
  is(value?: any) {
    return this.equals(value);
  }

  /**
   * Checks if the value is equal to the given value. Alias if `equals`.
   */
  isNaN(value?: any) {
    if (this._expression) this._expression.template = "%not%operator(%term)";
    return this._oper("isNaN", value);
  }

  /**
   * Checks if the value is not equal to the given value.
   */
  isnt(value: any) {
    return this.is(value).not();
  }

  /**
   * Checks if the value is in the given array or Set.
   */
  within(value: any[] | Set<any>) {
    if (!(value instanceof Set)) value = new Set(value);
    if (this._expression)
      this._expression.template = "%not%operator.has(%term)";
    return this._oper(this._store(value));
  }

  /**
   * Checks if the array value has the given value.
   */
  has(value: any) {
    if (this._expression)
      this._expression.template = "%not(%term && %term.includes?.(%value))";
    return this._oper("", value);
  }

  /**
   * Checks if the array value has all the given values.
   */
  hasAll(value: any[]) {
    if (this._expression)
      this._expression.template =
        "%not(%term && %value?.every(value => %term.includes?.(...value)))";
    return this._oper("", value);
  }

  /**
   * Checks if the value starts with the given value.
   */
  startsWith(value: string) {
    if (this._expression)
      this._expression.template =
        "%not(%term != null && %term.startsWith(%value))";
    return this._oper("", value);
  }

  /**
   * Checks if the value ends with the given value.
   */
  endsWith(value: string) {
    if (this._expression)
      this._expression.template =
        "%not(%term != null && %term.endsWith(%term.length - %value))";
    return this._oper("", value);
  }

  /**
   * Checks if the value is greater than the given value.
   */
  gt(value: any) {
    return this._oper(">", value);
  }

  /**
   * Checks if the value is greater than or equal to the given value.
   */
  gte(value: any) {
    return this._oper(">=", value);
  }

  /**
   * Checks if the value is less than the given value.
   */
  lt(value: any) {
    return this._oper("<", value);
  }

  /**
   * Checks if the value is less than or equal to the given value.
   */
  lte(value: any) {
    return this._oper("<=", value);
  }

  /**
   * Tests if the value matches with the given regular expression.
   */
  test(value: RegExp) {
    if (this._expression)
      this._expression.template =
        "%not(%term != null && %operator.test(%term))";
    return this._oper(this._store(value));
  }

  /**
   * Alias for `test`.
   */
  regex(value: RegExp) {
    return this.test(value);
  }

  /**
   * Checks if the value is equivalent to the given value using `isEqual`.
   */
  same(value: any, options?: { partial?: boolean }) {
    if (this._expression)
      this._expression.template =
        "%not(this._isEqual(%term, %value, %operator))";
    return this._oper(this._store(options), value);
  }

  /**
   * Filters by the given filter function.
   */
  filter(value: FilterFn) {
    if (typeof value != "function")
      throw new Error("query.filter() parameter must be a function");
    if (this._expression) this._expression.template = "%not(%operator(%term))";
    else {
      this._expression = new Expression();
      this._expression.template = "%not(%operator(obj))";
    }
    return this._oper(this._store(value));
  }

  /**
   * Checks if any of the whole words are present in the given field.
   */
  search(words: string) {
    words = escapeRegExp(words);
    var exp = new RegExp("\\b" + words.split(/\s/).join("|\\b"));
    return this.test(exp);
  }

  /**
   * Checks if the value is of the given type or instance
   */
  type(value: Function | string) {
    if (typeof value === "function") {
      if (!this._expression) {
        // check the type of the main object
        this._expression = new Expression();
        this._expression.template = "%not(obj instanceof %operator)";
      } else {
        this._expression.template = "%not(%term instanceof %operator)";
      }
      return this._oper(this._store(value));
    } else if (typeof value === "string") {
      if (this._expression)
        this._expression.template = "%not(typeof %term %operator %value)";
      return this._oper("==", value);
    }
    return this;
  }

  /**
   * Sorts the results by the given field.
   */
  sortOn(field: string) {
    return this.sort(field);
  }

  /**
   * Sorts the results by the given field. Alias of `sortOn` but `field` is not required.
   */
  sort(field?: string) {
    if (this._sortCache) this._sortCache = undefined;
    this._sorts.push(new Sort(field));
    return this;
  }

  /**
   * Sort the results in ascending order.
   */
  asc() {
    return this._sortDir(1);
  }

  /**
   * Sort the results in descending order.
   */
  desc() {
    return this._sortDir(-1);
  }

  /**
   * Sort the results using the given function.
   */
  custom(value: SortFn) {
    return this._sortType(value);
  }

  limit(value: number) {
    this._limit = value;
    return this;
  }

  offset(value: number) {
    this._offset = value;
    return this;
  }

  toString() {
    this._flush();
    return this._eval;
  }

  protected _getFilter() {
    let queryStr = this.toString();
    if (!queryStr) return null;
    if (!this._filterCache) {
      this._filterCache = new Function(
        "obj",
        "try { return " + queryStr + "; } catch (e) { return false; }"
      ).bind(this);
    }
    return this._filterCache;
  }

  protected _getSort() {
    if (!this._sorts.length) return null;
    if (!this._sortCache) {
      var sorts = this._sorts.map((sort) => sort.toFunction());
      this._sortCache = (a, b) => {
        let direction = 0,
          i = 0,
          len = sorts.length;
        while (i < len && direction === 0) {
          direction = sorts[i++](a, b);
        }
        return direction;
      };
    }
    return this._sortCache;
  }

  protected _term(condition: string, field?: string | Query) {
    this._flush();
    this._eval += " " + condition + " ";
    if (typeof field === "string") {
      this._expression = new Expression(field);
    } else if (field !== undefined) {
      if (field instanceof Query) {
        for (const [key, value] of field._lookups) {
          this._lookups.set(key, value);
        }
      }
      this._eval += "(" + field + ")";
    }
    return this;
  }

  protected _oper(operator: string, value?: any) {
    if (this._expression) {
      this._expression.operator = operator;
      this._expression.value = value;
    }
    console.log(this._expression);
    return this;
  }

  protected _store(value: any) {
    this._lookups.set(++lookupId, value);
    return `this._lookups.get(${lookupId})`;
  }

  protected _sortDir(dir: number) {
    if (this._sorts.length === 0) return;
    if (this._sortCache) this._sortCache = undefined;
    this._sorts[this._sorts.length - 1].direction = dir;
    return this;
  }

  protected _sortType(type: SortFn) {
    if (this._sorts.length === 0) return;
    if (this._sortCache) this._sortCache = undefined;
    const lastSort = this._sorts[this._sorts.length - 1];
    lastSort.type = type;
    return this;
  }

  protected _flush() {
    if (this._expression) {
      this._eval += this._expression;
      this._expression = undefined;
      this._filterCache = undefined;
    }
  }
}

export class Select extends Query {
  constructor(protected array: any[]) {
    super("");
  }

  where(field: string) {
    this._expression = new Expression(field);
  }

  end() {
    return this.on(this.array);
  }
}

class Expression {
  operator = "";
  value: any;
  not = false;
  template = "%not(%term %operator %value)";

  constructor(public term?: string) {}
  toString() {
    return this.template.replace(/%\w+/g, (match) => {
      if (match === "%not") return this.not ? "!" : "";
      if (match === "%term") {
        if (!this.term) throw new Error('Missing "field" in query');
        return `(obj?.${this.term.replace(
          /(?:\.|(\[))/g,
          "?.$1"
        )} ?? obj?.get?.("${this.term}"))`;
      }
      if (match === "%operator") return this.operator;
      if (match === "%value")
        return JSON.stringify(
          this.value instanceof Date ? this.value.getTime() : this.value
        );
      return "";
    });
  }
}

class Sort {
  public type: SortFn = Sort.regular;
  public direction: number = 1;

  constructor(public term?: string) {}

  static regular(a: any, b: any) {
    if (b == null || isEqNaN(b)) {
      if (a == null || isEqNaN(a)) {
        a = a === undefined ? 2 : a === null ? 1 : 0;
        b = b === undefined ? 2 : b === null ? 1 : 0;
        return a > b ? 1 : a < b ? -1 : 0;
      }
      return -1;
    }
    if (a == null || isEqNaN(b)) return 1;
    return a > b ? 1 : a < b ? -1 : 0;
  }

  toFunction() {
    const { term, direction, type } = this;
    let fn = type;
    if (term) {
      fn = (a, b) => direction * type(a[term], b[term]);
    } else if (direction !== 1) {
      fn = (a, b) => direction * type(a, b);
    }
    return fn;
  }
}

function escapeRegExp(str: string) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function isEqual(
  value: any,
  other: any,
  options: { partial?: boolean }
): boolean {
  if (value === other) return true;
  const valueType = typeof value;
  const otherType = typeof value;

  // Special case for NaN
  if (
    valueType === "number" &&
    otherType === "number" &&
    isNaN(value) &&
    isNaN(other)
  )
    return true;

  // If a basic type or not the same class
  if (
    !value ||
    !other ||
    valueType !== "object" ||
    otherType !== "object" ||
    value.constructor !== other.constructor
  ) {
    return false;
  }

  // Dates
  if (value.valueOf() !== value) {
    return isEqual(value.valueOf(), other.valueOf(), options);
  }

  // Iterables including arrays
  if (typeof value[Symbol.iterator] === "function") {
    const valueIter = value[Symbol.iterator]();
    const otherIter = other[Symbol.iterator]();
    let valueResult = valueIter.next();
    let otherResult = otherIter.next();
    while (!valueResult.done && !otherResult.done) {
      if (!isEqual(valueResult.value, otherResult.value, options)) return false;
      valueResult = valueIter.next();
      otherResult = otherIter.next();
    }
    return valueResult.done === otherResult.done;
  }

  // Objects
  const valueKeys = Object.keys(value);
  const otherKeys = Object.keys(other);

  return (
    (options?.partial || valueKeys.length === otherKeys.length) &&
    otherKeys.every(
      (key) =>
        value.hasOwnProperty(key) && isEqual(other[key], value[key], options)
    )
  );
}

function isEqNaN(value: any) {
  return typeof value === "number" && isNaN(value);
}
