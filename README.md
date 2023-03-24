# array-query

A JavaScript helper to find objects in a JavaScript array fast and with readable code. Can be used anywhere JavaScript
runs. TypeScript support included.

## Why?

Though you can do everything query provides you with the Array `filter` method, query makes it more readable and
concise.

## Install

```
npm install array-query
```

Import or require it, or use it in the browser.

```js
import { query } from "array-query";

const firstJacob = query("firstName").is("Jacob").first(users);
```

```js
const { query } = require("array-query");

const allJacobs = query("name").startsWith("Jacob").on(users);
```

```js
const { query } = ArrayQuery;

const noJacobs = query("name").not().startsWith("Jacob").on(users);
```

## querying

`query` supports chaining with `and` and `or` and subqueries. Call the `on` method with your array when done.

The following will return all users with the first name Bob whose last name is not Smith.

```js
const result = query("firstName")
  .is("Bob")
  .and("lastName")
  .not()
  .is("Smith")
  .on(users);
```

### Performant

When you call `query()` it creates a new query object which returns a reference to itself from each method. When the
query is executed by calling `on(array)` it compiles a function with the logic of the query making it very fast. You
can re-use the same query. Because query chaining returns itself, the following three queries are all the same.

```js
const q1 = query("author");
q1.is("Terence Hanbury White");
q1.and("title");
q1.is("The Once and Future King");

const q2 = query("author").is("Terence Hanbury White");
q2.and("title").is("The Once and Future King");

const q3 = query("author")
  .is("Terence Hanbury White")
  .and("title")
  .is("The Once and Future King");

if ((q1.toString() == q2.toString()) == q3.toString())
  alert("They're all the same!");
```

More examples:

```js
const whiteBooks = query("author").is("Terence Hanbury White").on(books);

const theBooks = query("title").startsWith("The").on(books);

const bigBooks = query("pages").gt(500).on(books);

const topTenBiggestBooks = query()
  .sort("pages")
  .numeric()
  .desc()
  .limit(10)
  .on(books);
```

### Select

If you'd rather start with the Array you may use the slightly different `select(array)` API.

```js
var aBooks = select(books).where("title").startsWith("A").end();
```

The two differences between `query` and `select` is that:

1. `query` ends with the array (e.g. `.on(books)`) and `select` starts with it (e.g. `select(books)`)
2. `select` needs to know when to be done chaining and to return the results, so it ends with `end()`

## Basics

### query

`query` is the start of our query and may optionally take the first field we want to filter by. The `query` method does
not need to take a field if you only want to sort or limit the objects.

```js
query().sort("lastName").limit(20).on(users);

query("age").gt(20).on(users);

const scores = [5, 140, 23, 10, 829, 13, 4];
const highscores = query().sort().limit(3).on(scores);
```

The first query listed here shows using `query()` without a parameter. It sorts by lastName and limits the results to 20
objects. The second query gets all the objects where age is greater than 20. The third sorts by the value itself.

### and, or

query provides the ability to use `and()` and `or()` in putting together your query. These usually take a parameter,
which can either be a field name or another query object. The field name is only the beginning of an expression and when
used should be followed up with another method call such as `equals()`, `gt()`, etc.

```js
query("username").equals("test").or("password").equals("test").on(users);
```

This looks up all objects whose username or password is "test".

### subqueries

Query objects may be used inside the methods `and()` and `or()` to provide subqueries. This is like putting parenthesis
around the expression.

```js
const notMiddleAged = query("firstName").equals("John").and(query("age").lt(20).or("age").gt(60)));
```

This query allows us to find all objects where the `firstName` is John and the age is either less than 20 or more than 60. We are unable to do this kind of sub-querying with the object-based API.

### not

The `not()` method can be used in an expression to negate the results. It can take a value which may make using `is`
more readable. The 2 following queries are the same.

```js
query("age").not().gt(20).and("eyeColor").not().equals("blue").on(users);

query("age").not().gt(20).and("eyeColor").is().not("blue").on(users);
```

This query will get every object where age is not more than 20 and eye color is not blue.

## Operations

### is, equals, isNaN

`equals`/`is` are the most basic. The query should equal the value provided.

```js
query("firstName").is("John").on(users);

query("lastName").equals("Smith").on(users);
```

This will match all objects where property `firstName` equals "John". `is` and `equals` are synonymous.

### within

`within` tests whether the object's value is within a provided array of values.

```js
query("firstName").within(["John", "Jacob", "Jingle", "Heimer"]).on(users);
```

This will match all objects whose firstName is "John", "Jacob", "Jingle", or "Heimer".

### has

`has` matches objects which have the provided value in an array.

```js
users.push({ colors: ["red", "yellow", "blue"] });

const redOnes = query("colors").has("red").on(users);
```

This will match the previously added object since it's colors array _has_ the value "red". Note that if on the stored
objects, colors is null or an empty array, it will not match since it doesn't have "red" in the colors array. It will
also not throw an error. `query`'s compiled function handles undefined values gracefully.

### hasAll

`hasAll` matches objects which have all the provided values in an array.

```js
query("colors").hasAll(["red", "blue"]).on(users);
```

This will match all objects which have both "red" and "blue" in their colors array.

### startsWith

`startsWith` matches the beginning of a value.

```js
query("firstName").startsWith("J").on(users);
```

This will match all objects whose `firstName` begins with "J".

### endsWith

`endsWith` matches the end of a value.

```js
query("lastName").endsWith("son").on(users);
```

This will match all objects whose `lastName` ends with "son".

### gt

`gt` matches objects whose value is greater than what's provided. Dates are supported.

```js
query("age").gt(20).on(users);
```

This will match objects with `age` greater than 20;

### gte

`gte` matches objects whose value is greater than or equal to what's provided. Dates are supported.

```js
query("age").gte(20).on(users);
```

This will match objects with `age` greater than or equal to 20;

### lt

`lt` matches objects whose value is less than what's provided. Dates are supported.

```js
query("age").lt(20).on(users);
```

This will match objects with `age` less than 20;

### lte

`lte` matches objects whose value is less than or equal to what's provided. Dates are supported.

```js
query("age").lte(20).on(users);
```

This will match objects with `age` less than or equal to 20;

### test/regex

`test`/`regex` matches objects whose values match the provided regular expression. They are aliases of each other.

```js
query("name")
  .test(/[^\w\s]/)
  .on(users);

query("name")
  .regex(/[^\w\s]/)
  .on(users);
```

This will match objects that have a non word-or-space character in the `name` property.

### same

`same` matches objects where the value is the same using a deep equal comparison. This allows arrays or objects to be
matched without a reference to the original. It can match partially as well.

```js
users.push({ name: { first: "John", last: "Smith" }, age: 30 });

query("name").same({ first: "John", last: "Smith" }).on(users);

query().same({ name: { first: "John", last: "Smith" } }, { partial: true }).on(users);
```

This will match the added object since the `name` value is the same even if it isn't the exact instance in memory. The
second query matches anyone with the same name object because `partial` is set to true, even though `age` is left out of
the matching object.

### type

`type` matches objects where the object or property is of a given type. Valid types are a string of: object, array, number, boolean, null, undefined. Or an instance of a class (e.g. Date). If no property name is passed into the `query()`, `and()`, or `or()` methods then the type will match against the object itself rather than a property.

```js
query("age").type("number").on(users);

query("published").type(Date).on(users);

query("pet").type(Dog).on(users);

query().type(User).or().type(Person).on(users); // matches if the object is and instance of User or Person (or a subclass thereof)
```

The first call will match all objects with a number for the age. The second call will match all objects where published
is an instance of Date. The third call will match all `User` and `Person` objects in the database.

### filter

`filter` allows a custom filter function to be run against the value of a property or the object as a whole. If the
function returns true, the object is added to the query results.

```js
query("firstName")
  .filter(function (name) {
    return name.toLowerCase().charAt(0) === "a";
  })
  .on(users);

query()
  .("firstName").is("Jacob").and()
  .filter(function (obj) {
    if (obj instanceof User) {
      return obj.active;
    } else if (obj instanceof Person) {
      return obj.trustLevel === "trusted";
    } else {
      return false;
    }
  })
  .on(users);
```

The first query here uses a custom function to match against the value of the `firstName` property of every object. The
second query uses a custom function to use custom logic to match against every object because no property name was
passed into the `and()` function.

### search

`search` matches all objects with a pseudo full-text search on the given field. It will ensure that each word exists in
the value.

```js
query("bio").search("looking for all of these words").on(users);
```

This will match any objects which have the provided words in their `bio` field.

### sort

Sorts the returned results by property. `asc()` and `desc()` defined the order, and `custom()` allows a custom sort
function. The default sort uses `asc()` so these it don't need to be used explicitly. Custom allows sorting on a
property or on the object as a whole.
The default sort handles `NaN`, `null`, and `undefined` values which are all sorted to the end (when using
ascending order) in this order. When using a custom sort, you must handle this yourself if it is a possibility.
*Note: the sort methods to define the type of sort have been removed because they all did the same thing.*

```js
query("active").is(true).sort("lastName").on(users);

query().sort("lastName").desc().on(users);

query().sort("publishedDate").date().desc().sort("title").on(users);

query()
  .sort("someNumericStringValue")
  .custom((a, b) => {
    if (a.length !== b.length) return a.length - b.length;
    return a > b ? 1 : a < b ? -1 : 0
  }).desc()
  .on(users);

query()
  .sort()
  .custom((a, b) => a.age - b.age)
  .on(users);
```

The first query sorts by `lastName` after selecting only active objects. The second query sorts all objects by
`lastName` in descending or reverse order. The third query sorts by `publishDate` with most recent first, then by title
for dates that are the same. The fourth query uses a custom sort on a numeric string property (e.g. correctly sorts
`"1"`, `"100"`, and `"2"`). The last query uses a custom sort on the object as a whole.

### limit

Limit the results returned.

```js
query().limit(10).on(users);
```

This returns 10 objects from the top of the array.

```js
query().sort("noisy").limit(10).on(users);
```

This returns 10 noisiest users (whatever that might mean).

### offset

Works with limit to select an offset which to start your limit at. Use for pagination.

```js
query().limit(10).offset(100).on(users);
```

This returns 10 objects starting at the 100th object.

### Complex properties/fields

Query fields can be dot-delimited to match sub-properties. They may even use methods. Note that while query object does
gracefully handle undefineds, you may still want to check for that first.

```js
users.push({ name: "Bob", colors: ["red", "yellow", "blue"] });

query("colors.length").is(3).on(users);
query("colors.length").gt(2).on(users);
query("colors.length").lte(3).on(users);
```

These will _all_ match the added object because the length is equal to three, greater than two, and less than or equal
to three.

```js
users.push({ colors: ["red", "yellow", "blue"] });
users.push({ });

query("colors.length").is(0).on(users); // will not match the newly added object because it is null

query("colors").is(undefined).or("colors.length").is(0).on(users); // this is how you should check
```

To check for a name without respect to case you might do the following.

```js
query("firstName.toLowerCase()").is("bob");

query().sort("lastName.toLowerCase()");
```

The second query above will sort by last name irrespective of casing.

## Backbone Support and Adding query to Backbone.Collections

query was originally built with [Backbone.js](https://backbonejs.org/) in mind. Though you may use
`query("get("firstName")").is("John")` to effectively work with Backbone models, query allows you to shorten that to
just use `firstName` as in `query("firstName").is("John")`. You can even add methods like the previous section indicates
like: `query("firstName.toLowerCase()").is("john")`. This works with any objects that have a `get('property')` interface
such as [EmberObject](https://api.emberjs.com/ember/4.11/classes/EmberObject/methods/get?anchor=get).

You may find it useful to add query to the Collection interface so that it is avaiable with every collection.
*Note: The `set` method was removed from query. To replicate this, you may either extend query or simply run your own*
*logic with the results like this:*
```js
query("selected").is(true).on(users).forEach(user => user.set("selected", false));
```
