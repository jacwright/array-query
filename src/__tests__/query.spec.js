import { Query } from "../main.js";

describe("Query class tests", () => {
  it("should apply filters and sorts on an input array", async () => {
    const inputArray = [1, 2, 3, 4, 5];
    const myQuery = Query().sort().desc().limit(2).on(inputArray);

    expect(await myQuery).toEqual([5, 4]);
  });

  it("should return fruits weight different than 0.3", async () => {
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
    const myQuery = Query("weight").not().equals(0.3);

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
});
