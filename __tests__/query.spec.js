import { query } from "@/array-query.js";
import { expect, describe, it } from "@jest/globals";

describe("Query class tests", () => {
  const objects = [
    {
      name: "apple",
      category: "fruit",
      color: "red",
      weight: 0.2,
      characteristics: [
        "Juicy",
        "Sweet",
        "Crunchy",
        "Aromatic",
        "Slightly tart",
        "Firm texture",
        "Smooth skin",
        "Round shape",
        "Green stem",
        "Red blush",
        "Refreshing",
        "Nutritious",
      ],
    },
    {
      name: "banana",
      category: "fruit",
      color: "yellow",
      weight: 0.1,
      characteristics: [
        "Soft",
        "Sweet",
        "Mild flavor",
        "Easy to peel",
        "Curved shape",
        "White flesh",
        "Contains fiber",
        "Good source of potassium",
        "Energizing",
      ],
    },
    {
      name: "orange",
      category: "fruit",
      color: "orange",
      weight: 0.3,
      characteristics: [
        "Juicy",
        "Sweet",
        "Tangy",
        "Fragrant",
        "Easy to peel",
        "Round shape",
        "Sections of pulp",
        "Vitamin C",
        "Antioxidant",
        "Immune boosting",
        "Hydrating",
      ],
    },
    {
      name: "tangerine",
      category: "fruit",
      color: "orange",
      weight: 0.3,
      characteristics: [
        "Juicy",
        "Sweet",
        "Easy to peel",
        "Small size",
        "Red-orange flesh",
        "Seedless",
        "Sections of pulp",
        "Refreshing",
        "Contains vitamin C",
        "Boosts metabolism",
      ],
    },
  ];

  it("should apply filters and sorts on an input array", async () => {
    const inputArray = [1, 2, 3, 4, 5];
    const myQuery = query().sort().desc().limit(2).on(inputArray);

    expect(await myQuery).toEqual(expect.arrayContaining([5, 4]));
  });

  it("should return fruits weight different than 0.3", async () => {
    const myQuery = query("weight").not().equals(0.3);

    const result = await myQuery.on(objects);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "apple",
        }),
        expect.objectContaining({
          name: "banana",
        }),
      ])
    );
  });

  it("should return the first with a weight different than 0.3", () => {
    // Tests non-async method and is().not(value) style
    const myQuery = query("weight").is().not(0.3);

    const result = myQuery.first(objects);

    expect(result).toEqual(
      expect.objectContaining({
        name: "apple",
      })
    );
  });

  it("should work with promises", async () => {
    // Tests non-async method and is().not(value) style
    const myQuery = query("weight").is().not(0.3);

    const result = await myQuery.last(Promise.resolve(objects));

    expect(result).toEqual(
      expect.objectContaining({
        name: "banana",
      })
    );
  });

  it("should hasAll work with string", () => {
    const myQuery = query("category").hasAll(["f", "r"]);

    const result = myQuery.on(objects).length === objects.length;

    expect(result).toEqual(true);
  });

  it("should hasAll work with array", () => {
    const juicyAndSweetFruits = objects.filter((fruit) =>
      fruit.characteristics.includes(["Juicy", "Sweet"])
    );

    const myQuery = query("characteristics").hasAll(["Juicy", "Sweet"]);

    const result = myQuery.on(objects).length === juicyAndSweetFruits.length;

    expect(result).toEqual(true);
  });
});
