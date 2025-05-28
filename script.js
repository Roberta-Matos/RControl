const mainContent = document.getElementById('mainContent');
const addTableBtn = document.getElementById('addTableBtn');
const personNameInput = document.getElementById('personNameInput');

const existingTables = new Map();

function createTableForPerson(name) {
  if (existingTables.has(name)) {
    alert(`Já existe uma tabela para "${name}".`);
    return;
  }

  // Container da tabela
  const container = document.createElement('section');
  container.classList.add('table-container');

  // Título com o nome da pessoa
  const title = document.createElement('h2');
  title.textContent = `Produtos de: ${name}`;
  container.appendChild(title);

  // Ações da tabela
  const actionsDiv = document.createElement('div');
  actionsDiv.classList.add('table-actions');
  container.appendChild(actionsDiv);

  const addRowBtn = document.createElement('button');
  addRowBtn.textContent = '➕ Adicionar Produto';
  addRowBtn.classList.add('add-row-btn');
  actionsDiv.appendChild(addRowBtn);

  // Tabela HTML
  const table = document.createElement('table');

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Produto</th>
      <th>Quantidade</th>
      <th>Valor da Peça (R$)</th>
      <th>Total (R$)</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  container.appendChild(table);

  // Total geral
  const totalContainer = document.createElement('div');
  totalContainer.classList.add('total-container');
  totalContainer.textContent = 'Total Geral: R$ 0,00';
  container.appendChild(totalContainer);

  mainContent.appendChild(container);

  // Função para atualizar totais da tabela
  function updateTotals() {
    let totalSum = 0;
    tbody.querySelectorAll('tr').forEach(row => {
      const qtyInput = row.querySelector('.qty-input');
      const priceInput = row.querySelector('.price-input');
      const totalCell = row.querySelector('.row-total');

      const qty = parseFloat(qtyInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;

      const total = qty * price;
      totalCell.textContent = total.toFixed(2);

      totalSum += total;
    });

    totalContainer.textContent = `Total Geral: R$ ${totalSum.toFixed(2)}`;
  }

  // Função para criar uma nova linha na tabela
  function addRow() {
    const row = document.createElement('tr');

    // Produto
    const tdProduct = document.createElement('td');
    const productInput = document.createElement('input');
    productInput.type = 'text';
    productInput.placeholder = 'Nome do produto';
    productInput.required = true;
    productInput.classList.add('product-input');
    tdProduct.appendChild(productInput);
    row.appendChild(tdProduct);

    // Quantidade
    const tdQty = document.createElement('td');
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '0';
    qtyInput.step = '1';
    qtyInput.value = '0';
    qtyInput.classList.add('qty-input');
    tdQty.appendChild(qtyInput);
    row.appendChild(tdQty);

    // Valor da Peça
    const tdPrice = document.createElement('td');
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.value = '0.00';
    priceInput.classList.add('price-input');
    tdPrice.appendChild(priceInput);
    row.appendChild(tdPrice);

    // Total da linha
    const tdTotal = document.createElement('td');
    tdTotal.textContent = '0.00';
    tdTotal.classList.add('row-total');
    row.appendChild(tdTotal);

    tbody.appendChild(row);

    // Atualizar totais sempre que mudar quantidade ou preço
    [qtyInput, priceInput].forEach(input => {
      input.addEventListener('input', updateTotals);
    });

    updateTotals();
  }

  addRowBtn.addEventListener('click', addRow);

  // Começar com uma linha vazia
  addRow();

  existingTables.set(name, container);
}

addTableBtn.addEventListener('click', () => {
  const name = personNameInput.value.trim();
  if (!name) {
    alert('Por favor, insira o nome da pessoa antes de criar a tabela.');
    personNameInput.focus();
    return;
  }
  createTableForPerson(name);
  personNameInput.value = '';
  personNameInput.focus();
});


