// ...existing code...
/*
  script.js final — persistência (localStorage), edição inline (somente produto + operações),
  toast visual e atalhos Enter/Esc. Substitua todo o arquivo por este.
*/

const STORAGE_KEY = "rcontrol:data";

const mainContent = document.getElementById("mainContent");
const addPersonBtn = document.getElementById("addOperationBtn");

const personInput = document.getElementById("personNameInput");
const productInput = document.getElementById("productNameInput");
const operationInput = document.getElementById("operationTypeInput");
const quantityInput = document.getElementById("operationQuantityInput");
const valueInput = document.getElementById("operationValueInput");

const peopleTables = new Map();

/* ---------- Persistence (localStorage) ---------- */
function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("loadDB", e);
    return {};
  }
}

function saveAll() {
  const out = {};
  for (const [person, data] of peopleTables.entries()) {
    out[person] = { produtos: data.produtos || {} };
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch (e) {
    console.error("saveAll", e);
  }
}

/* ---------- Toast (feedback) ---------- */
function showToast(msg, type = "ok", ms = 2200) {
  let toast = document.getElementById("rcontrolToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "rcontrolToast";
    toast.className = "rcontrol-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `rcontrol-toast rcontrol-toast--${type}`;
  toast.style.opacity = "1";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = "0";
  }, ms);
}

/* ---------- Hydrate from storage on load ---------- */
(function hydrate() {
  const db = loadDB();
  Object.keys(db).forEach((person) => {
    createPersonTable(person);
    const personData = peopleTables.get(person);
    personData.produtos = db[person].produtos || {};
    renderTable(person);
  });
})();

/* ---------- Events: add via top form ---------- */
addPersonBtn?.addEventListener("click", () => {
  const person = (personInput.value || "").trim().toLowerCase();
  const product = (productInput.value || "").trim().toLowerCase();
  const operation = (operationInput.value || "").trim();
  const quantity = parseInt(quantityInput.value, 10);
  const value = parseFloat(valueInput.value);

  if (
    !person ||
    !product ||
    !operation ||
    isNaN(value) ||
    isNaN(quantity) ||
    quantity <= 0
  ) {
    showToast("Preencha todos os campos corretamente.", "error");
    return;
  }

  if (!peopleTables.has(person)) createPersonTable(person);
  addProductOperation(person, product, operation, quantity, value);

  personInput.value = "";
  productInput.value = "";
  operationInput.value = "";
  quantityInput.value = "";
  valueInput.value = "";
  showToast("Produto adicionado", "ok");
});

/* ---------- Create person section and inputs ---------- */
function createPersonTable(person) {
  if (peopleTables.has(person)) return;

  const section = document.createElement("section");
  section.className = "person-section";

  const title = document.createElement("h2");
  title.textContent = `Tabela de ${capitalize(person)}`;
  section.appendChild(title);

  const deleteTableBtn = document.createElement("button");
  deleteTableBtn.textContent = "🗑️ Excluir Tabela";
  deleteTableBtn.className = "delete-table-btn";
  deleteTableBtn.style.marginBottom = "1rem";
  deleteTableBtn.addEventListener("click", () => {
    if (
      confirm(
        `Tem certeza que deseja excluir toda a tabela de ${capitalize(person)}?`
      )
    ) {
      section.remove();
      peopleTables.delete(person);
      saveAll();
      showToast("Tabela excluída", "ok");
    }
  });
  section.appendChild(deleteTableBtn);

  const table = document.createElement("table");
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

  const inputGroup = document.createElement("div");
  inputGroup.className = "person-add";
  inputGroup.style.marginTop = "0.8rem";
  const safeId = encodeURIComponent(person);
  inputGroup.innerHTML = `
    <input type="text" id="productInput-${safeId}" placeholder="Produto" />
    <input type="text" id="operationInput-${safeId}" placeholder="Operação" />
    <input type="number" id="quantityInput-${safeId}" placeholder="Qtd" min="1" />
    <input type="number" id="valueInput-${safeId}" placeholder="Valor unitário" step="0.01" min="0" />
    <button type="button" id="addProductBtn-${safeId}">➕ Adicionar Produto</button>
  `;
  section.appendChild(inputGroup);

  mainContent.appendChild(section);

  const personData = {
    produtos: {},
    tbody: table.querySelector("tbody"),
    section,
  };
  peopleTables.set(person, personData);

  inputGroup
    .querySelector(`#addProductBtn-${safeId}`)
    .addEventListener("click", () => {
      const prod = (
        inputGroup.querySelector(`#productInput-${safeId}`).value || ""
      )
        .trim()
        .toLowerCase();
      const op = (
        inputGroup.querySelector(`#operationInput-${safeId}`).value || ""
      ).trim();
      const qtd = parseInt(
        inputGroup.querySelector(`#quantityInput-${safeId}`).value,
        10
      );
      const val = parseFloat(
        inputGroup.querySelector(`#valueInput-${safeId}`).value
      );
      if (!prod || !op || isNaN(qtd) || isNaN(val) || qtd <= 0) {
        showToast("Preencha todos os campos do produto.", "error");
        return;
      }
      addProductOperation(person, prod, op, qtd, val);
      inputGroup.querySelector(`#productInput-${safeId}`).value = "";
      inputGroup.querySelector(`#operationInput-${safeId}`).value = "";
      inputGroup.querySelector(`#quantityInput-${safeId}`).value = "";
      inputGroup.querySelector(`#valueInput-${safeId}`).value = "";
      showToast("Produto adicionado", "ok");
    });
}

/* ---------- Data mutation: add operation ---------- */
function addProductOperation(person, product, operation, quantity, unitValue) {
  const personData = peopleTables.get(person);
  if (!personData) return;
  if (!personData.produtos[product]) personData.produtos[product] = [];
  personData.produtos[product].push({
    tipo: operation,
    quantidade: quantity,
    valor: unitValue,
  });
  saveAll();
  renderTable(person);
}

/* ---------- Render table and inline edit (produto + operações) ---------- */
function renderTable(person) {
  const personData = peopleTables.get(person);
  if (!personData) return;
  const { produtos, tbody } = personData;

  tbody.innerHTML = "";
  let totalGeral = 0;

  const esc = (t) =>
    String(t || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  for (const produtoKey in produtos) {
    const operacoes = produtos[produtoKey] || [];
    let subtotal = 0;

    const opsList = document.createElement("ul");
    opsList.style.paddingLeft = "1rem";
    opsList.style.margin = "0";

    operacoes.forEach((op) => {
      const totalOp = op.quantidade * op.valor;
      subtotal += totalOp;
      const li = document.createElement("li");
      li.style.marginBottom = "0.35rem";
      li.innerHTML = `${esc(op.tipo)}: ${op.quantidade} × R$ ${op.valor.toFixed(
        2
      )} = <strong>R$ ${totalOp.toFixed(2)}</strong>`;
      opsList.appendChild(li);
    });

    totalGeral += subtotal;

    const tr = document.createElement("tr");

    const tdProd = document.createElement("td");
    tdProd.className = "prod-name";
    tdProd.textContent = produtoKey;
    tr.appendChild(tdProd);

    const tdOps = document.createElement("td");
    tdOps.appendChild(opsList);
    tr.appendChild(tdOps);

    const tdTotal = document.createElement("td");
    tdTotal.innerHTML = `<strong>R$ ${subtotal.toFixed(2)}</strong><br>`;

    const editBtn = document.createElement("button");
    editBtn.className = "edit-product-btn";
    editBtn.dataset.produto = produtoKey;
    editBtn.dataset.pessoa = person;
    editBtn.textContent = "✏️ Editar";
    editBtn.style.marginRight = "8px";

    const delBtn = document.createElement("button");
    delBtn.className = "delete-product-btn";
    delBtn.dataset.produto = produtoKey;
    delBtn.dataset.pessoa = person;
    delBtn.textContent = "🗑️ Excluir";

    tdTotal.appendChild(editBtn);
    tdTotal.appendChild(delBtn);
    tr.appendChild(tdTotal);

    tbody.appendChild(tr);

    /* excluir produto */
    delBtn.addEventListener("click", () => {
      if (
        confirm(
          `Deseja excluir o produto "${produtoKey}" da tabela de ${capitalize(
            person
          )}?`
        )
      ) {
        delete produtos[produtoKey];
        saveAll();
        renderTable(person);
        showToast("Produto excluído", "ok");
      }
    });

    /* editar inline: somente produto + operações */
    editBtn.addEventListener("click", () => {
      if (tr.classList.contains("editing")) return;
      tr.classList.add("editing");

      const originalKey = produtoKey;
      const originalOps = operacoes.map((o) => ({ ...o }));

      /* produto -> input */
      const inputName = document.createElement("input");
      inputName.type = "text";
      inputName.className = "inline-edit-name";
      inputName.value = tdProd.textContent;
      inputName.style.width = "100%";
      inputName.style.boxSizing = "border-box";
      tdProd.innerHTML = "";
      tdProd.appendChild(inputName);

      /* operações -> edit rows */
      const opsContainer = document.createElement("div");
      opsContainer.className = "inline-ops";
      opsContainer.style.display = "flex";
      opsContainer.style.flexDirection = "column";
      opsContainer.style.gap = "6px";

      originalOps.forEach((op) =>
        opsContainer.appendChild(
          makeOpEditRow(op.tipo, op.quantidade, op.valor)
        )
      );

      const addOpBtn = document.createElement("button");
      addOpBtn.type = "button";
      addOpBtn.className = "inline-add-op";
      addOpBtn.textContent = "+ Adicionar operação";
      addOpBtn.addEventListener("click", () =>
        opsContainer.appendChild(makeOpEditRow("", 1, 0))
      );

      tdOps.innerHTML = "";
      tdOps.appendChild(opsContainer);
      tdOps.appendChild(addOpBtn);

      /* esconder botões originais e adicionar Salvar/Cancelar */
      editBtn.style.display = "none";
      delBtn.style.display = "none";

      const saveBtn = document.createElement("button");
      saveBtn.className = "inline-save-btn";
      saveBtn.textContent = "💾 Salvar";
      saveBtn.style.marginRight = "8px";

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "inline-cancel-btn";
      cancelBtn.textContent = "❌ Cancelar";

      tdTotal.appendChild(saveBtn);
      tdTotal.appendChild(cancelBtn);

      /* keyboard: Enter => save, Esc => cancel (scoped to tr) */
      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelBtn.click();
        } else if (e.key === "Enter") {
          const active = document.activeElement;
          if (
            tr.contains(active) &&
            (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
          ) {
            e.preventDefault();
            saveBtn.click();
          }
        }
      }
      tr._keyHandler = onKey;
      tr.addEventListener("keydown", onKey);

      cancelBtn.addEventListener("click", () => {
        tr.removeEventListener("keydown", tr._keyHandler);
        renderTable(person);
        showToast("Edição cancelada", "error");
      });

      saveBtn.addEventListener("click", () => {
        const newProdRaw = (inputName.value || "").trim();
        const newKey = newProdRaw ? newProdRaw.toLowerCase() : originalKey;

        const newOps = Array.from(
          opsContainer.querySelectorAll(".inline-op-row")
        )
          .map((row) => {
            const tipo = (
              row.querySelector(".inline-edit-tipo")?.value || ""
            ).trim();
            const quantidade =
              parseInt(
                row.querySelector(".inline-edit-qtd")?.value || "0",
                10
              ) || 0;
            const valor =
              parseFloat(row.querySelector(".inline-edit-val")?.value || "0") ||
              0;
            return { tipo, quantidade, valor };
          })
          .filter((o) => o.tipo && o.quantidade > 0 && !Number.isNaN(o.valor));

        if (newOps.length === 0) {
          showToast("Informe ao menos uma operação válida.", "error");
          return;
        }

        /* atualizar somente o necessário */
        if (newKey !== originalKey && produtos[newKey]) {
          const ok = confirm(
            `Produto "${newKey}" já existe. Deseja sobrescrever?`
          );
          if (!ok) return;
          delete produtos[originalKey];
          produtos[newKey] = newOps;
        } else if (newKey !== originalKey) {
          delete produtos[originalKey];
          produtos[newKey] = newOps;
        } else {
          produtos[originalKey] = newOps;
        }

        saveAll();
        tr.removeEventListener("keydown", tr._keyHandler);
        renderTable(person);
        showToast("Produto atualizado", "ok");
      });
    });
  }

  /* total geral */
  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <td colspan="2" style="text-align:right;"><strong>Total Geral:</strong></td>
    <td><strong style="color:#c026d3;">R$ ${totalGeral.toFixed(2)}</strong></td>
  `;
  tbody.appendChild(totalRow);
}

/* ---------- Helpers ---------- */
function makeOpEditRow(tipoVal = "", qtdVal = 1, valVal = 0) {
  const row = document.createElement("div");
  row.className = "inline-op-row";
  row.style.display = "flex";
  row.style.gap = "8px";
  row.style.alignItems = "center";

  const tipo = document.createElement("input");
  tipo.type = "text";
  tipo.className = "inline-edit-tipo";
  tipo.placeholder = "Operação";
  tipo.value = tipoVal || "";
  tipo.style.flex = "1";

  const qtd = document.createElement("input");
  qtd.type = "number";
  qtd.min = "1";
  qtd.className = "inline-edit-qtd";
  qtd.value = String(qtdVal || 1);
  qtd.style.width = "84px";

  const val = document.createElement("input");
  val.type = "number";
  val.step = "0.01";
  val.min = "0";
  val.className = "inline-edit-val";
  val.value = String(valVal || 0);
  val.style.width = "110px";

  const rem = document.createElement("button");
  rem.type = "button";
  rem.className = "inline-remove-op";
  rem.textContent = "Remover";
  rem.addEventListener("click", () => row.remove());

  row.appendChild(tipo);
  row.appendChild(qtd);
  row.appendChild(val);
  row.appendChild(rem);

  return row;
  
}

function capitalize(str = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
// ...existing code...
