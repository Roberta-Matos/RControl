const mainContent = document.getElementById('mainContent');
const addPersonBtn = document.getElementById('addOperationBtn');

const personInput = document.getElementById('personNameInput');
const productInput = document.getElementById('productNameInput');
const operationInput = document.getElementById('operationTypeInput');
const quantityInput = document.getElementById('operationQuantityInput');
const valueInput = document.getElementById('operationValueInput');

const peopleTables = new Map();

addPersonBtn.addEventListener('click', () => {
  const person = personInput.value.trim().toLowerCase();
  const product = productInput.value.trim().toLowerCase();
  const operation = operationInput.value.trim();
  const quantity = parseInt(quantityInput.value);
  const value = parseFloat(valueInput.value);

  if (!person || !product || !operation || isNaN(value) || isNaN(quantity) || quantity <= 0) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  // Cria tabela da pessoa se necessário
  if (!peopleTables.has(person)) {
    createPersonTable(person);
  }

  // Adiciona a operação ao produto
  addProductOperation(person, product, operation, quantity, value);

  // Limpa campos principais
  personInput.value = '';
  productInput.value = '';
  operationInput.value = '';
  quantityInput.value = '';
  valueInput.value = '';
});

function createPersonTable(person) {
  const section = document.createElement('section');
  section.className = 'person-section';

  const title = document.createElement('h2');
title.textContent = `Tabela de ${capitalize(person)}`;
section.appendChild(title);

// 👇 Botão de excluir tabela
const deleteTableBtn = document.createElement('button');
deleteTableBtn.textContent = '🗑️ Excluir Tabela';
deleteTableBtn.className = 'delete-table-btn';
deleteTableBtn.style.marginBottom = '1rem';

deleteTableBtn.addEventListener('click', () => {
  const confirmar = confirm(`Tem certeza que deseja excluir toda a tabela de ${capitalize(person)}?`);
  if (confirmar) {
    section.remove(); // Remove visualmente
    peopleTables.delete(person); // Remove da estrutura de dados
  }
});

section.appendChild(deleteTableBtn);

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Produto</th>
        <th>Operações</th>
        <th>Total (R$)</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  section.appendChild(table);

  // Formulário interno
  const inputGroup = document.createElement('div');
  inputGroup.innerHTML = `
    <input type="text" id="productInput-${person}" placeholder="Produto" />
    <input type="text" id="operationInput-${person}" placeholder="Operação" />
    <input type="number" id="quantityInput-${person}" placeholder="Qtd" min="1" />
    <input type="number" id="valueInput-${person}" placeholder="Valor unitário" step="0.01" min="0" />
    <button type="button" id="addProductBtn-${person}">➕ Adicionar Produto</button>
  `;
  section.appendChild(inputGroup);

  mainContent.appendChild(section);

  const personData = {
    produtos: {},
    tbody: table.querySelector('tbody')
  };

  peopleTables.set(person, personData);

  // Botão interno da pessoa
  inputGroup.querySelector(`#addProductBtn-${person}`).addEventListener('click', () => {
    const prod = inputGroup.querySelector(`#productInput-${person}`).value.trim().toLowerCase();
    const op = inputGroup.querySelector(`#operationInput-${person}`).value.trim();
    const qtd = parseInt(inputGroup.querySelector(`#quantityInput-${person}`).value);
    const val = parseFloat(inputGroup.querySelector(`#valueInput-${person}`).value);

    if (!prod || !op || isNaN(qtd) || isNaN(val) || qtd <= 0) return;

    addProductOperation(person, prod, op, qtd, val);

    // Limpa inputs locais
    inputGroup.querySelector(`#productInput-${person}`).value = '';
    inputGroup.querySelector(`#operationInput-${person}`).value = '';
    inputGroup.querySelector(`#quantityInput-${person}`).value = '';
    inputGroup.querySelector(`#valueInput-${person}`).value = '';
  });
}

function addProductOperation(person, product, operation, quantity, unitValue) {
  const personData = peopleTables.get(person);

  if (!personData.produtos[product]) {
    personData.produtos[product] = [];
  }

  personData.produtos[product].push({
    tipo: operation,
    quantidade: quantity,
    valor: unitValue
  });

  renderTable(person);
}

function renderTable(person) {
  const { produtos, tbody } = peopleTables.get(person);
  tbody.innerHTML = '';

  let totalGeral = 0;

  for (const produto in produtos) {
    const operacoes = produtos[produto];
    let subtotal = 0;

    const opsHTML = operacoes.map(op => {
      const totalOp = op.quantidade * op.valor;
      subtotal += totalOp;
      return `<li>${op.tipo}: ${op.quantidade} × R$ ${op.valor.toFixed(2)} = <strong>R$ ${totalOp.toFixed(2)}</strong></li>`;
    }).join('');

    totalGeral += subtotal;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${produto}</td>
      <td><ul>${opsHTML}</ul></td>
      <td>
        <strong>R$ ${subtotal.toFixed(2)}</strong><br>
        <button class="edit-product-btn" data-produto="${produto}" data-pessoa="${person}">✏️ Editar</button>
        <button class="delete-product-btn" data-produto="${produto}" data-pessoa="${person}">🗑️ Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `
    <td colspan="2" style="text-align:right;"><strong>Total Geral:</strong></td>
    <td><strong style="color:#c026d3;">R$ ${totalGeral.toFixed(2)}</strong></td>
  `;
  tbody.appendChild(totalRow);

  // Excluir produto
  tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const produto = btn.dataset.produto;
      const pessoa = btn.dataset.pessoa;
      if (confirm(`Deseja excluir o produto "${produto}" da tabela de ${capitalize(pessoa)}?`)) {
        delete peopleTables.get(pessoa).produtos[produto];
        renderTable(pessoa);
      }
    });
  });

  // Editar produto
  tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const produto = btn.dataset.produto;
      const pessoa = btn.dataset.pessoa;
      const produtoAtual = peopleTables.get(pessoa).produtos[produto];

      // Prompt para nova descrição (simples)
      const novoNome = prompt(`Editar nome do produto "${produto}":`, produto);
      if (!novoNome) return;

      // Opcional: redefinir operações
      const redefinir = confirm("Deseja redefinir as operações existentes?");
      let novasOperacoes = produtoAtual;

      if (redefinir) {
        const novaLista = prompt("Digite novas operações no formato: tipo,qtd,valor;tipo,qtd,valor...");
        if (novaLista) {
          novasOperacoes = novaLista.split(";").map(item => {
            const [tipo, qtd, val] = item.split(",");
            return {
              tipo: tipo.trim(),
              quantidade: parseInt(qtd),
              valor: parseFloat(val)
            };
          }).filter(op => op.tipo && !isNaN(op.quantidade) && !isNaN(op.valor));
        }
      }

      // Atualiza dados
      const tabela = peopleTables.get(pessoa);
      delete tabela.produtos[produto];
      tabela.produtos[novoNome.toLowerCase()] = novasOperacoes;
      renderTable(pessoa);
    });
    tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const produto = btn.dataset.produto;
    const pessoa = btn.dataset.pessoa;
    const tabela = peopleTables.get(pessoa);
    const operacoes = tabela.produtos[produto];

    // Cria nova linha com formulário
    const editRow = document.createElement('tr');
    editRow.innerHTML = `
      <td><input type="text" class="edit-produto-nome" value="${produto}" /></td>
      <td>
        <div class="edit-ops">
          ${operacoes.map((op, i) => `
            <div style="margin-bottom: 0.5rem;">
              <input type="text" placeholder="Operação" value="${op.tipo}" data-i="${i}" class="edit-op" />
              <input type="number" min="1" value="${op.quantidade}" data-i="${i}" class="edit-qtd" />
              <input type="number" min="0" step="0.01" value="${op.valor}" data-i="${i}" class="edit-val" />
            </div>
          `).join('')}
        </div>
      </td>
      <td>
        <button class="save-edit-btn" data-produto="${produto}" data-pessoa="${pessoa}">💾 Salvar</button>
        <button class="cancel-edit-btn">❌ Cancelar</button>
      </td>
    `;

    // Substitui a linha original pela edição
    btn.closest('tr').replaceWith(editRow);

    // Cancelar
    editRow.querySelector('.cancel-edit-btn').addEventListener('click', () => {
      renderTable(pessoa);
    });

    // Salvar
    editRow.querySelector('.save-edit-btn').addEventListener('click', () => {
      const novoNome = editRow.querySelector('.edit-produto-nome').value.trim().toLowerCase();

      const novosDados = Array.from(editRow.querySelectorAll('.edit-ops > div')).map(div => ({
        tipo: div.querySelector('.edit-op').value.trim(),
        quantidade: parseInt(div.querySelector('.edit-qtd').value),
        valor: parseFloat(div.querySelector('.edit-val').value)
      })).filter(op => op.tipo && !isNaN(op.quantidade) && !isNaN(op.valor));

      if (!novoNome || novosDados.length === 0) {
        alert("Preencha todos os campos corretamente.");
        return;
      }

      delete tabela.produtos[produto]; // Remove antigo
      tabela.produtos[novoNome] = novosDados; // Adiciona novo
      renderTable(pessoa);
    });
  });
});
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}