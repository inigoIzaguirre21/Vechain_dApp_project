import { ABI } from "./abi";

const contract = "0x36f63f0c47Ae804976c881D00E67625C388EfdE2";

const connex = new Connex({
  node: "https://vethor-node-test.vechaindev.com",
  network: "test"
});

let userLogin = false;
const loginBtn = document.querySelector('#login-btn');
const readBtn = document.querySelector('#read-btn');
let transactionId = 0;
let timestamps = [];
let quantities = [];
let myChart;

document.addEventListener("DOMContentLoaded", () => {
  initGraph();
  // Set the height of the canvas element
  const canvas = document.getElementById("products-sent-chart");
  canvas.style.height = "10px";
});

loginBtn.onclick = async () => {
  try {
    const message = {
      purpose: "identification",
      payload: {
        type: "text",
        content: "Sign this a certificate to prove your identity"
      }
    };

    const certResponse = await connex.vendor.sign("cert", message).request();

    if (certResponse) {
      const userAddress = certResponse.annex.signer;
      document.querySelector('#authentication-section').className = 'hidden';
      document.querySelector('#dapp-body').classList.remove('hidden');
      document.querySelector('#user-address').innerHTML = userAddress;
      userLogin = true;
    } else {
      alert("Wallet not found");
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("An error occurred during login");
  }
};

const storeBtn = document.querySelector('#store-btn');

storeBtn.onclick = async () => {
  try {
    if (!userLogin) {
      throw new Error("Please login first");
    }

    const userNumber = document.querySelector('#store-input').value;

    if (!userNumber) {
      throw new Error("Please add the number in input");
    }
    

    // Update the graph after updating the table
    

    const startTime = performance.now();
    const storeABI = ABI.find(({ name }) => name === 'store');
    const clause = connex.thor.account(contract).method(storeABI).asClause(userNumber);
    const result = await connex.vendor.sign("tx", [clause]).comment("Storing the number of products on Vechain").request();

    transactionId += 1;
    updateGraph();

    await result;
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    fillProductTable(executionTime)
  } catch (error) {
    console.error("Store Error:", error);
    alert(error.message);
  }
};

async function fillProductTable(extime) {
  try {
    const contractNumber = document.querySelector('#contract-number');
    const abiRetrieve = ABI.find(({ name }) => name === "read");

    contractNumber.innerHTML = "loading";

    const result = await connex.thor.account(contract).method(abiRetrieve).call();

    if (result) {
      contractNumber.innerHTML = result.decoded[0];

      const tableBody = document.querySelector("#product-table tbody");
      const row = document.createElement("tr");


      const transactionIdCell = document.createElement("td");
      transactionIdCell.textContent = transactionId;
      row.appendChild(transactionIdCell);

      const timestampCell = document.createElement("td");
      timestampCell.textContent = new Date().toLocaleString();
      row.appendChild(timestampCell);

      const quantityCell = document.createElement("td");
      quantityCell.textContent = result.decoded[0];
      row.appendChild(quantityCell);

      const timeCell = document.createElement("td");
      timeCell.textContent = (extime / 1000).toFixed(2);
      row.appendChild(timeCell);

      tableBody.appendChild(row);
    } else {
      contractNumber.innerHTML = "failed to fetch";
    }
  } catch (error) {
    console.error("Fill Table Error:", error);
    alert("An error occurred while filling the table");
  }
}
// Function to initialize the chart
function initGraph() {
  const ctx = document.getElementById("products-sent-chart").getContext("2d");
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Products Delivered',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Function to update the graph
function updateGraph() {
  const tableBody = document.querySelector("#product-table tbody");
  const rows = tableBody.querySelectorAll("tr");

  const timestamps = [];
  const quantities = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const timestamp = cells[1].textContent;
    const quantity = cells[2].textContent;

    timestamps.push(timestamp);
    quantities.push(quantity);
  });

  window.myChart.data.labels = timestamps;
  window.myChart.data.datasets[0].data = quantities;
  window.myChart.update();
}

readBtn.onclick = async () => {
  try {
    const contractNumber = document.querySelector('#contract-number');
    const abiRetrieve = ABI.find(({ name }) => name === "read");

    contractNumber.innerHTML = "loading";

    const result = await connex.thor.account(contract).method(abiRetrieve).call();

    if (result) {
      contractNumber.innerHTML = result.decoded[0];
    } else {
      contractNumber.innerHTML = "failed to fetch";
    }
  } catch (error) {
    console.error("Read Error:", error);
    alert("An error occurred during read operation");
  }
};