query
=====

Provides an interface to pull objects out of a JavaScript array with minimal code. Useful for Backbone collections and similar scenarios. Can be used in the browser and on the server (node.js).

## Why?

Though you can do everything query provides you with the built-in Array methods (forEach, map, filter, etc), query can make it much more readable and concise.

## Install

```
npm install array-query
```

Now you can use it in your node.js project.

```js
var query = require('array-query');

var firstJacob = query('name').startsWith('Jacob').on(users).pop();
```

Or just add the query.js file to your web page for use in your client-side JavaScript.

## querying

Finding objects in an array with query is easy. The API takes a property name first, then checks the value, then you can continue to add properties and checks until the `on` method is called with the array you are querying.

It is probably easier to see it in action. The following will return all users with the name Bob.

```js
var allBobs = query('firstName').is('Bob').on(users);
```

### query Chaining

When you call `query()` it creates a new query object which returns a reference to itself. In fact, most methods of the query object return a reference to itself enabling method chaining. For example, the following three queries are all the same.

```js
var q1 = query("author");
q1.is("Terence Hanbury White");
q1.and("title");
q1.is("The Once and Future King");

var q2 = query("author").is("Terence Hanbury White");
q2.and("title").is("The Once and Future King");

var q3 = query("author").is("Terence Hanbury White").and("title").is("The Once and Future King");

if (q1.toString() == q2.toString() == q3.toString()) alert("They're all the same!");
```

More examples:

```js
var whiteBooks = query("author").is("Terence Hanbury White").on(books);

var theBooks = query("title").startsWith("The").on(books);

var bigBooks = query("pages").gt(500).on(books);

var topTenBiggestBooks = query().sort("pages").numeric().desc().limit(10).on(books);
```

### Select

If you'd rather start with the Array you may use the slightly different select().

```js
var aBooks = select(books).where("title").startsWith("A").end();
```

The two differences between `query` and `select` is that:

  1. `query` ends with the array (e.g. `.on(books)`) and `select` starts with it (e.g. `select(books)`)
  2. `select` needs to know when to be done chaining and to return the results, so it ends with `end()`

## Basics

### query

`query` is the start of our query and may optionally take the first field we want to filter by. The `query` method does not need to take a field if you only want to sort or limit the objects.

```js
query().sort("lastName").limit(20).on(users);

query("age").gt(20).on(users);
```

The first query listed here shows using `query()` without a parameter. It sorts by lastName and limits the results to 20 objects. The second query gets all the objects where age is greater than 20. 

### and, or

query provides the ability to use `and()` and `or()` in putting together your query. These usually take a parameter, which can either be a field name or another query object. The field name is only the beginning of an expression and when used should be followed up with another method call such as `equals()`, `gt()`, etc.

```js
query("username").equals("test").or("password").equals("test").on(users);
```

This looks up all objects whose username or password is "test".

Query objects may be used inside the methods `and()` and `or()` to provide subqueries. This is like putting parenthesis around the expression.

```js
var notMiddleAged = query("firstName").equals("John").and(query("age").lt(20).or("age").gt(60)));
```

This query allows us to find all objects where the `firstName` is John and the age is either less than 20 or more than 60. We are unable to do this kind of sub-querying with the object-based API.

## not

The `not()` method can be used in an expression to negate the results.

```js
query("age").not().gt(20).and("eyeColor").not().equals("blue").on(users);
```

This query will get every object where age is not more than 20 and eye color is not blue.

## Operations


### is, equals

`equals` is the most basic. The query should just be the value you want to match.

```js
query("firstName").is("John").on(users);

query("lastName").equals("Smith").on(users);
```

This will match all objects where property `firstName` equals "John". `is` and `equals` are synonymous.

### within

`within` tests whether the object's value is within a provided array of values.

```js
query("firstName").within([ "John", "Jacob", "Jingle", "Heimer" ]).on(users);
```

This will match all objects whose firstName is "John", "Jacob", "Jingle", or "Heimer".

### has

`has` matches objects which have the provided value in an array.

```js
db.add({ colors: [ "red", "yellow", "blue" ] });

query("colors").has("red").on(users);
```

This will match the previously added object since it's colors array *has* the value "red". Note that if on the stored objects, colors is null or an empty array, it will not match since it doesn't have "red" in the colors array.

### hasAll

`hasAll` matches objects which have all the provided values in an array.

```js
query("colors").hasAll(["red, "blue"]).on(users);
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

### regex

`regex` matches objects whose values match the provided regular expression.

```js
query("name").regex(/[^\w\s]/).on(users);
```

This will match objects that have a non word-or-space character in the `name` property.

### same

`same` matches objects where the value is the same when serialized into JSON. This allows arrays or objects to be matched without a reference to the original.

```js
users.push({ name: { first: "John", last: "Smith" }, age: 30 });

query("name").same({ first: "John", last: "Smith" }).on(users);
```

This will match the added object since the `name` value is the same even if it isn't the exact instance in memory. Note that this uses the serialized JSON representation of both objects to compare. Dates should work with this method but hasn't been tested cross-browser.

### type

`type` matches objects where the object or property is of a given type. Valid types are a string of: object, array, number, boolean, null, undefined. Or an instance of a class (e.g. Date). If no property name is passed into the `query()`, `and()`, or `or()` methods then the type will match against the object itself rather than a property.

```js
query("age").type("number").on(users);

query("published").type(Date).on(users);

query("pet").type(Dog).on(users);

query().type(User).or().type(Person).on(users); // matches if the object is and instance of User or Person (or a subclass thereof)
```

The first call will match all objects with a number for the age. The second call will match all objects where published is an instance of Date. The third call will match all `User` and `Person` objects in the database.

### filter

`filter` allows a custom filter function to be run against the value of a property or the object as a whole. If the function returns true, the object is added to the query results.

```js
query("firstName").filter(function(name) {
    return name.toLowerCase().charAt(0) === "a";
}).on(users);

query().filter(function(obj) {
    if (obj instanceof User) {
        return obj.active;
    } else if (obj instanceof Person) {
        return obj.trustLevel === "trusted";
    } else {
        return false;
    }
}).on(users);
```

The first query here uses a custom function to match against the value of the `firstName` property of every object. The second query uses a custom function to use custom logic to match against every object because no property name was passed into the `query()` function.

### search

`search` matches all objects with a full-text search on the given field.

```js
query('bio').search("looking for all of these words").on(users);
```

This will match any objects which have the provided words in their `bio` field.

### sort

Sorts the returned results by property. Additional sort methods may follow a sort to define it further: `asc()`, `desc()`, `regular()`, `numeric()`, `date()`, and `custom()`. The default sort uses `asc()` and `regular()`, so these don't need to be used explicitly. Custom allows sorting on a property or on the object as a whole.

```js
query("active").is(true).sort("lastName").on(users);

query().sort("lastName").desc().on(users);

query().sort("publishedDate").date().desc().sort("title").on(users);

query().sort("age").custom(function(age1, age2) {
    if (age1 < age2) return -1;
    else if (age1 > age2) return 1;
    else return 0;
}).on(users);

query().sort().custom(function(obj1, obj2) {
    return obj1.age - obj2.age;
}).on(users);
```

The first query sorts by `lastName` after selecting only active objects. The second query sorts all objects by `lastName` in descending or reverse order. The third query sorts by `publishDate` with most recent first, then by title for dates that are the same. The fourth query uses a custom sort on the age property. The last query uses a custom sort on the object as a whole.

### limit

Limit the results returned.

```js
query().limit(10).on(users);
```

This returns 10 objects from the top of the array.

```js
query().sort('noisy').limit(10).on(users);
```

This returns 10 noisiest users (whatever that might mean).

### offset

Works with limit to select an offset which to start your limit at. This is used mostly for pagination.

```js
query().limit(10).offset(100).on(users);
```

This returns 10 objects starting at the 100th object.


### Complex properties/fields

Query fields can be dot-delimited to match sub-properties. They may even use methods. Note that the query object does not check to ensure whether the property is null, so if it is on some objects but not others you'll want to check for that first.

```js
users.push({ name: "Bob", colors: [ "red", "yellow", "blue" ] });

query("colors.length").is(3).on(users);
query("colors.length").gt(2).on(users);
query("colors.length").lte(3).on(users);
```

These will *all* match the added object because the length is equal to three, greater than two, and less than or equal to three.

```js
users.push({ colors: [ "red", "yellow", "blue" ] });
users.push({ colors: null });

query("colors.length").is(0).on(users); // will not match the newly added object because it is null

query("colors").is(null).or("colors.length").is(0).on(users); // this is how you should check
```

To check for a name without respect to case you might do the following.

```js
query('firstName.toLowerCase()').is('bob');

query().sort('lastName.toLowerCase()');
```

The second query above will sort by last name irrespective of casing.

## Backbone Support and Adding query to Backbone.Collections

query was built with Backbone in mind. Though you may use `query("get('firstName')").is("John")` to effectively work with
Backbone models, query allows you to shorten that to just use `firstName` as in `query("firstName").is("John")`. You can
even add methods like the previous section indicates like: `query("firstName.toLowerCase()").is("john")`.

You may find it useful to add query to the Collection interface so that it is avaiable with every collection.

```js
var Backbone = require('backbone');
var query = require('array-query'); // these lines may be skipped when using in the browser

Backbone.Collection.prototype.query = function(field) {
    return query.select(this.models).where(field);
}

// then when using it remember to use `end()` as this is the `select()` style API.
var activeUsers = userCollection.query('active').is(true).end();

```

One addition which was added specifically for Backbone (though could be altered to work elsewhere if needed) was the `set()` method.
Using it you may set properties on all the matching objects.

```js
userCollection.query('selected').is(true).set({ selected: false }).end();
```

This will set all currently selected users to not selected. And because this is Backbone, any Views listening to the
`change:selected` event can update accordingly.
