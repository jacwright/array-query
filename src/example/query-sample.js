import { Query } from "@/lib/query";
import { createRandomUser } from "@/example/utils";

const fakeUsers = Array.from({ length: 200 }, createRandomUser);

export async function setupTable(element) {
  const table = await generateFilledTableElement(fakeUsers);
  element.appendChild(table);
}

export async function setupClearButton(element) {
  element.addEventListener("click", async (event) => {
    event.preventDefault();
    const table = await generateFilledTableElement(fakeUsers);
    document.querySelector("#query").innerHTML = "";
    document.querySelector("#query").appendChild(table);
  });
}

export async function setupFilterForm(element) {
  element.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const query = formData.get("queries");
    const filteredArray = await generateFilteredArray(fakeUsers, query);
    const table = await generateFilledTableElement(filteredArray);
    document.querySelector("#query").innerHTML = "";
    document.querySelector("#query").appendChild(table);
  });
}

async function generateFilledTableElement(users) {
  // Create HTML table to display user data
  const table = document.createElement("table");
  // Create table header row
  const headerRow = table.insertRow();

  const headerCells = [
    { label: "id", variable: "_id" },
    { label: "Avatar", variable: "avatar" },
    { label: "First name", variable: "firstName" },
    { label: "Last name", variable: "lastName" },
    { label: "email", variable: "email" },
    { label: "Birthday", variable: "birthday" },
    { label: "sex", variable: "sex" },
    { label: "subscriptionTier", variable: "subscriptionTier" },
  ];

  for (const headerCell of headerCells) {
    const cell = headerRow.insertCell();
    cell.innerText = headerCell.label;
  }

  // Create table rows for each user
  for (const user of users) {
    const row = table.insertRow();
    const cells = headerCells.map((headerCells) => [
      headerCells.variable,
      user[headerCells.variable],
    ]);
    for (const [key, cellValue] of cells) {
      const cellElement = row.insertCell();
      if (key === "avatar") {
        const image = document.createElement("img");
        image.src = cellValue;
        cellElement.appendChild(image);
        continue;
      }
      cellElement.innerText = cellValue;
    }
  }
  return table;
}

async function generateFilteredArray(users, stringQueryCalls = "") {
  if (!stringQueryCalls) {
    return users;
  }
  const filteredArray = await eval(stringQueryCalls).on(users);
  return filteredArray;
}
