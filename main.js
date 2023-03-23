import {
  setupTable,
  setupFilterForm,
  setupClearButton,
} from "@/example/query-sample";

document.querySelector("#app").innerHTML = `
  <div>
    <div style="display:flex; gap: 5px; margin-bottom: 30px;">
      <form id="filters">
        <input name="queries" style="width: 4 00px;"/>
        <button type="submit">Click me to filter</button>
      </form>
      <button id="clearFilter">Reset</button>
    </div>
    
    
    <div id="query"></div>
  </div>
`;

setupFilterForm(document.querySelector("#filters"));

setupClearButton(document.querySelector("#clearFilter"));

setupTable(document.querySelector("#query"));
