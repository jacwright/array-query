import { query } from "@/array-query.js";

describe("Query class tests", () => {
  const objects = [
    {
      name: "apple",
      color: "red",
      weight: 0.2,
    },
    {
      name: "banana",
      color: "yellow",
      weight: 0.1,
    },
    {
      name: "orange",
      color: "orange",
      weight: 0.3,
    },
    {
      name: "orange2",
      color: "orange",
      weight: 0.3,
    },
  ];

  it("should apply filters and sorts on an input array", async () => {
    const inputArray = [1, 2, 3, 4, 5];
    const myQuery = query().sort().desc().limit(2).on(inputArray);

    expect(await myQuery).toEqual([5, 4]);
  });

  it("should return fruits weight different than 0.3", async () => {
    const myQuery = query("weight").not().equals(0.3);

    const result = await myQuery.on(objects);

    expect(result).toEqual([
      {
        name: "apple",
        color: "red",
        weight: 0.2,
      },
      {
        name: "banana",
        color: "yellow",
        weight: 0.1,
      },
    ]);
  });

  it("should return the first with a weight different than 0.3", () => {
    // Tests non-async method and is().not(value) style
    const myQuery = query("weight").is().not(0.3);

    const result = myQuery.first(objects);

    expect(result).toEqual(
      {
        name: "apple",
        color: "red",
        weight: 0.2,
      },
    );
  });

  it("should work with promises", async () => {
    // Tests non-async method and is().not(value) style
    const myQuery = query("weight").is().not(0.3);

    const result = await myQuery.last(Promise.resolve(objects));

    expect(result).toEqual(
      {
        name: "banana",
        color: "yellow",
        weight: 0.1,
      },
    );
  });
});
