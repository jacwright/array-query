var P = (u, t, e) => {
  if (!t.has(u))
    throw TypeError("Cannot " + e);
};
var r = (u, t, e) => (P(u, t, "read from private field"), e ? e.call(u) : t.get(u)), l = (u, t, e) => {
  if (t.has(u))
    throw TypeError("Cannot add the same private member more than once");
  t instanceof WeakSet ? t.add(u) : t.set(u, e);
}, o = (u, t, e, s) => (P(u, t, "write to private field"), s ? s.call(u, e) : t.set(u, e), e);
var h = (u, t, e) => (P(u, t, "access private method"), e);
var f, d, p, E, q, N, $, S, w, m, n, J, W, M, R, b, C, a, c, j, v, g, x, A, D;
const O = class {
  constructor(t) {
    l(this, J);
    l(this, b);
    l(this, a);
    l(this, j);
    l(this, g);
    l(this, A);
    l(this, f, void 0);
    l(this, d, void 0);
    l(this, p, void 0);
    l(this, E, void 0);
    l(this, q, void 0);
    l(this, N, void 0);
    l(this, $, void 0);
    l(this, S, void 0);
    l(this, w, void 0);
    l(this, m, void 0);
    l(this, n, void 0);
    l(this, M, (t) => {
      o(this, n, new F(t));
    });
    l(this, R, (t, e) => (o(this, f, r(this, f) + t), e && o(this, n, null), this));
    if (!(this instanceof O))
      return new O(t);
    t && r(this, M).call(this, t), o(this, f, ""), o(this, d, {}), o(this, p, []), o(this, E, []), o(this, q, []), o(this, N, []);
  }
  on(t) {
    return Promise.resolve(t).then((s) => {
      try {
        return h(this, J, W).call(this, s);
      } catch (i) {
        return console.error(
          `An error occurred while performing array operations: ${i}`
        ), [];
      }
    });
  }
  getFilter() {
    var e;
    const t = this.toString();
    return t ? ((e = r(this, w)) == null ? void 0 : e.query) === t ? r(this, w) : (o(this, w, new Function(
      "obj",
      `try { return ${t}  } catch (e) { return false; }`
    ).bind(this)), r(this, w).query = t, r(this, w)) : null;
  }
  getSort() {
    if (!r(this, p).length)
      return null;
    if (r(this, m))
      return r(this, m);
    const t = r(this, p).map((e) => e.toFunction());
    return o(this, m, (e, s) => {
      let i = 0, y = 0, z = t.length;
      for (; y < z && i == 0; )
        i = t[y++](e, s);
      return i;
    });
  }
  getActions() {
    return r(this, E) ?? [];
  }
  toString() {
    return h(this, A, D).call(this), r(this, f);
  }
  and(t) {
    return h(this, b, C).call(this, "&&", t);
  }
  or(t) {
    return h(this, b, C).call(this, "||", t);
  }
  not(t) {
    return r(this, n) && (r(this, n).not = !r(this, n).not, t !== void 0 && (r(this, n).value = t)), this;
  }
  equals(t) {
    return h(this, a, c).call(this, "===", t);
  }
  is(t) {
    return h(this, a, c).call(this, "===", t);
  }
  isnt(t) {
    return this.not(), this.is(t);
  }
  within(t) {
    const e = {};
    for (const s in t)
      e[t[s]] = !0;
    return r(this, n) && (r(this, n).template = "%not%operator[%term]"), h(this, a, c).call(this, h(this, j, v).call(this, e));
  }
  has(t) {
    return r(this, n) && (r(this, n).template = "%not(%term != null && %term.indexOf(%value) != -1)"), h(this, a, c).call(this, null, t);
  }
  startsWith(t) {
    return r(this, n) && (r(this, n).template = "%not(%term != null && %term.substr(0, %operator) == %value)"), h(this, a, c).call(this, t.length, t);
  }
  endsWith(t) {
    return r(this, n) && (r(this, n).template = "%not(%term != null && %term.substr(%term.length - %operator) == %value)"), h(this, a, c).call(this, t.length, t);
  }
  gt(t) {
    return h(this, a, c).call(this, ">", t);
  }
  gte(t) {
    return h(this, a, c).call(this, ">=", t);
  }
  lt(t) {
    return h(this, a, c).call(this, "<", t);
  }
  lte(t) {
    return h(this, a, c).call(this, "<=", t);
  }
  regex(t) {
    return r(this, n) && (r(this, n).template = "%not(%term != null && %operator.test(%term))"), h(this, a, c).call(this, h(this, j, v).call(this, t));
  }
  same(t) {
    return r(this, n) && (r(this, n).template = "%not(JSON.stringify(%term) %operator %value)"), t = JSON.stringify(t), h(this, a, c).call(this, "==", t);
  }
  filter(t) {
    if (typeof t != "function")
      throw new Error("query.filter() parameter must be a function");
    return r(this, n) ? r(this, n).template = "%not(%operator(%term))" : (o(this, n, new F()), r(this, n).template = "%not(%operator(obj))"), h(this, a, c).call(this, h(this, j, v).call(this, t));
  }
  search(t) {
    t = G(t);
    const e = new RegExp("\\b" + t.split(/\s/).join("|\\b"));
    return this.regex(e);
  }
  type(t) {
    return typeof t == "function" ? (r(this, n) ? r(this, n).template = "%not(%term instanceof %operator)" : (o(this, n, new F()), r(this, n).template = "%not(obj instanceof %operator)"), h(this, a, c).call(this, h(this, j, v).call(this, t))) : (r(this, n) && (r(this, n).template = "%not(type(%term) %operator %value)"), h(this, a, c).call(this, "==", t));
  }
  sort(t) {
    return r(this, m) && o(this, m, null), r(this, p).push(new B(t)), this;
  }
  asc() {
    return h(this, g, x).call(this, 1);
  }
  desc() {
    return h(this, g, x).call(this, -1);
  }
  regular() {
    return h(this, g, x).call(this, "regular");
  }
  numeric() {
    return h(this, g, x).call(this, "numeric");
  }
  date() {
    return h(this, g, x).call(this, "date");
  }
  custom(t) {
    return h(this, g, x).call(this, "custom", t);
  }
  limit(t) {
    return o(this, S, t), this;
  }
  offset(t) {
    return o(this, $, t), this;
  }
  set(t) {
    return r(this, E).push(function(e) {
      e.set(t);
    }), this;
  }
  get lookups() {
    return r(this, d);
  }
  setExpression(t) {
    o(this, n, t);
  }
};
let T = O;
f = new WeakMap(), d = new WeakMap(), p = new WeakMap(), E = new WeakMap(), q = new WeakMap(), N = new WeakMap(), $ = new WeakMap(), S = new WeakMap(), w = new WeakMap(), m = new WeakMap(), n = new WeakMap(), J = new WeakSet(), W = function(t) {
  const e = this.getFilter(), s = this.getSort();
  let i = [...t];
  return e && (i = i.filter(e, O)), s && (i = i.sort(s)), r(this, $) ? i = i.slice(r(this, $), r(this, $) + (r(this, S) || 0)) : r(this, S) && (i = i.slice(0, r(this, S))), r(this, E).forEach((y) => {
    i.forEach(y);
  }), r(this, q).forEach((y) => {
    i = i.map(y);
  }), r(this, N).forEach((y) => {
    i = i.reduce(y);
  }), i;
}, M = new WeakMap(), R = new WeakMap(), b = new WeakSet(), C = function(t, e) {
  return h(this, A, D).call(this), o(this, f, r(this, f) + ` ${t} `), typeof e == "string" ? o(this, n, new F(e)) : e instanceof O ? (Object.assign(r(this, d), r(e, d)), o(this, f, r(this, f) + `(${e})`)) : e && o(this, f, r(this, f) + `(${e})`), this;
}, a = new WeakSet(), c = function(t, e) {
  return r(this, n) && (r(this, n).operator = t, r(this, n).value = e), this;
}, j = new WeakSet(), v = function(t) {
  const e = Math.round(Math.random() * 1e6);
  return r(this, d)[e] = t, "this.lookups[" + e + "]";
}, g = new WeakSet(), x = function(t, e) {
  if (r(this, p).length == 0)
    return;
  r(this, m) && o(this, m, null);
  const s = r(this, p)[r(this, p).length - 1];
  return typeof t == "number" ? s.direction = t : (s.type = s[t], e !== void 0 && (s.direction = e)), this;
}, A = new WeakSet(), D = function() {
  r(this, n) && o(this, f, r(this, f) + r(this, n)), o(this, n, null);
};
class k extends T {
  constructor(t) {
    if (!Array.isArray(t))
      throw new TypeError("Must query on an Array, but passed: " + t);
    if (!(this instanceof k))
      return new k(t);
    this.array = t;
  }
  where(t) {
    return t && this.setExpression(new F(t)), this;
  }
  end() {
    return this.on(this.array);
  }
}
class F {
  constructor(t, e, s, i) {
    this.term = t, this.operator = e, this.value = s, this.not = i, this.template = "%not(%term %operator %value)";
  }
  toString() {
    return this.template.replace(/%\w+/g, (t) => {
      switch (t) {
        case "%not":
          return this.not ? "!" : "";
        case "%term":
          return `
          ( 
            typeof obj["${this.term}"] !== "undefined" ? 
            obj["${this.term}"] : (typeof obj.get === "function" && obj.get("${this.term}"))
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
class B {
  constructor(t, e, s) {
    this.term = t, this.type = e || this.regular, this.direction = s || 1;
  }
  toFunction() {
    return this.type(this.term, this.direction);
  }
  regular(t, e) {
    return function(s, i) {
      return s = s[t], i = i[t], i == null ? -1 : s == null ? 1 : e * (s > i ? 1 : s < i ? -1 : 0);
    };
  }
  numeric(t, e) {
    return function(s, i) {
      return s = parseFloat(s[t]), i = parseFloat(i[t]), i == null || isNaN(i) ? -1 : s == null || isNaN(s) ? 1 : e * (s - i);
    };
  }
  date(t, e) {
    return function(s, i) {
      return s = s[t], i = i[t], i == null ? -1 : s == null ? 1 : e * (s.getTime() - i.getTime());
    };
  }
  custom(t, e) {
    return t ? function(s, i) {
      return e(s[t], i[t]);
    } : function(s, i) {
      return e(s, i);
    };
  }
}
function G(u) {
  return u.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
const I = function(...u) {
  return new T(...u);
}, K = function(...u) {
  return new k(...u);
};
export {
  I as Query,
  K as Select,
  I as default
};
