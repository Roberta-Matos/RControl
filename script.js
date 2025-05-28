const mainContent = document.getElementById('mainContent');
const addTableBtn = document.getElementById('addTableBtn');

let tableCount = 0;

function createRow() {
  const tr = document.createElement('tr');

  // Nome da Pessoa
  const tdNome = document.createElement('td');
  const inputNome = document.createElement('input');
  inputNome.type = 'text';
  inputNome.placeholder = 'Nome';
  inputNome.required = true;
  inputNome.autocomplete = "name";
  tdNome.appendChild(inputNome);
  tr.appendChild(tdNome);

  // Produto
  const tdProduto = document.createElement('td');
  const inputProduto = document.createElement('input');
  inputProduto.type = 'text';
  inputProduto.placeholder = 'Produto';
  inputProduto.required = true;
  tdProduto.appendChild(inputProduto);
  tr.appendChild(tdProduto);

  // Quantidade
  const tdQuantidade = document.createElement('td');
  const inputQuantidade = document.createElement('input');
  inputQuantidade.type = 'number';
  inputQuantidade.min = '1';
  inputQuantidade.placeholder = 'Quantidade';
  inputQuantidade.required = true;
  tdQuantidade.appendChild(inputQuantidade);
  tr.appendChild(tdQuantidade);

  // Valor por Peça
  const tdValor = document.createElement('td');
  const inputValor = document.createElement('input');
  inputValor.type = 'number';
  inputValor.min = '0.01';
  inputValor.step = '0.01';
  inputValor.placeholder = 'R$ 0,00';
  inputValor.required = true;
  tdValor.appendChild(inputValor);
  tr.appendChild(tdValor);

  // Ações
  const tdActions = document.createElement('td');
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remover';
  removeBtn.style.backgroundColor = '#c0392b';
  removeBtn.style.margin = '0 auto';
  removeBtn.style.display = 'block';
  removeBtn.setAttribute('aria-label', 'Remover esta linha');
  removeBtn.addEventListener('click', () => {
    tr.remove();
    checkSubmitBtnState(tr.closest('.table-container'));
  });
  tdActions.appendChild(removeBtn);
  tr.appendChild(tdActions);

  return tr;
}

function createTable() {
  tableCount++;

  const container = document.createElement('section');
  container.className = 'table-container';
  container.setAttribute('aria-label', `Tabela de formulário ${tableCount}`);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'table-actions';

  const addRowBtn = document.createElement('button');
  addRowBtn.type = 'button';
  addRowBtn.textContent = '➕ Adicionar Linha';
  addRowBtn.setAttribute('aria-label', 'Adicionar Linha');
  addRowBtn.addEventListener('click', () => {
    addRow(container);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.textContent = '✔️ Enviar Dados';
  submitBtn.setAttribute('aria-label', 'Enviar Dados');
  submitBtn.disabled = true;
  submitBtn.addEventListener('click', () => {
    handleSubmit(container);
  });

  actionsDiv.appendChild(addRowBtn);
  actionsDiv.appendChild(submitBtn);

  container.appendChild(actionsDiv);

  // Tabela
  const table = document.createElement('table');
  table.setAttribute('aria-label', `Tabela de entrada ${tableCount}`);

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  ['Nome da Pessoa', 'Produto', 'Quantidade', 'Valor por Peça (R$)', 'Ações'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbody.id = `tbody-${tableCount}`;
  table.appendChild(tbody);

  container.appendChild(table);

  // Container para mostrar o total da tabela
  const totalDiv = document.createElement('div');
  totalDiv.className = 'total-container';
  totalDiv.textContent = 'Total: R$ 0,00';
  container.appendChild(totalDiv);

  // Mensagem de resposta
  const responseMessage = document.createElement('div');
  responseMessage.className = 'response-message';
  responseMessage.setAttribute('role', 'alert');
  responseMessage.setAttribute('aria-live', 'polite');
  container.appendChild(responseMessage);

  mainContent.appendChild(container);

  // Adicionar a primeira linha automática
  addRow(container);
}

function addRow(container) {
  const tbody = container.querySelector('tbody');
  const newRow = createRow();
  tbody.appendChild(newRow);

  // Atualiza o estado do botão enviar
  checkSubmitBtnState(container);

  // Adiciona evento para recalcular o total quando os inputs mudarem
  newRow.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
      updateTotal(container);
      checkSubmitBtnState(container);
    });
  });

  // Também para inputs de texto para habilitar o submit se preencher
  newRow.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('input', () => {
      checkSubmitBtnState(container);
    });
  });

  updateTotal(container);
}

function updateTotal(container) {
  const tbody = container.querySelector('tbody');
  let total = 0;

  tbody.querySelectorAll('tr').forEach(tr => {
    const qtdInput = tr.querySelector('input[type="number"]:nth-child(1), input[placeholder="Quantidade"]') || tr.cells[2].querySelector('input');
    const valorInput = tr.querySelector('input[type="number"]:nth-child(2), input[placeholder*="R$"]') || tr.cells[3].querySelector('input');

    const qtd = Number(qtdInput.value);
    const valor = Number(valorInput.value);

    if (!isNaN(qtd) && !isNaN(valor)) {
      total += qtd * valor;
    }
  });

  const totalDiv = container.querySelector('.total-container');
  totalDiv.textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
}

function checkSubmitBtnState(container) {
  const submitBtn = container.querySelector('.table-actions button[type="button"]:last-child');
  const rows = container.querySelectorAll('tbody tr');

  if (rows.length === 0) {
    submitBtn.disabled = true;
    return;
  }

  let allValid = true;

  rows.forEach(tr => {
    tr.querySelectorAll('input').forEach(input => {
      if (!input.value.trim()) {
        allValid = false;
      }
    });
  });

  submitBtn.disabled = !allValid;
}

function handleSubmit(container) {
  const rows = container.querySelectorAll('tbody tr');
  let allValid = true;

  rows.forEach(tr => {
    tr.querySelectorAll('input').forEach(input => {
      if (!input.value.trim()) {
        allValid = false;
        input.focus();
      }
    });
  });

  if (!allValid) {
    alert('Por favor, preencha todos os campos corretamente antes de enviar.');
    return;
  }

  // Você pode colocar aqui lógica para enviar os dados para um servidor, por exemplo
  // Por enquanto só mostramos uma mensagem

  const responseMessage = container.querySelector('.response-message');
  responseMessage.textContent = 'Dados enviados com sucesso! 🎉';
  responseMessage.classList.add('show');

  // Esconder a mensagem após 4 segundos
  setTimeout(() => {
    responseMessage.classList.remove('show');
  }, 4000);
}

addTableBtn.addEventListener('click', () => {
  createTable();
});

// Criar uma tabela inicial ao carregar
createTable();

