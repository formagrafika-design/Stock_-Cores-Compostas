// ===== CONFIGURAÇÃO =====
const authorizedPins = {
  "1972": "Fernando",
  "1969": "Zé Paulo",
  "4212": "Tiago",
  "1985": "Rui Paulo",
  "1974": "Carlos Morais"
};

// ===== DADOS =====
let colors = JSON.parse(localStorage.getItem('colors')) || [
  {name:"Vermelho", code:"#ff0000", quantity:10, shelf:"A1", sector:"C"},
  {name:"Azul", code:"#0000ff", quantity:5, shelf:"A2", sector:"B"},
  {name:"Verde", code:"#00ff00", quantity:8, shelf:"B1", sector:"A"}
];

let history = JSON.parse(localStorage.getItem('history')) || [];

// ===== SALVAR =====
function saveData(){
  localStorage.setItem('colors', JSON.stringify(colors));
  localStorage.setItem('history', JSON.stringify(history));
}

// ===== LIMPAR CAMPOS AO TROCAR SETOR =====
function clearFields(){
  document.querySelectorAll('input').forEach(i=>{
    if(i.type !== "submit") i.value="";
  });
  document.querySelectorAll('.color-sample').forEach(s=>{
    s.style.backgroundColor="";
  });
}

// ===== TROCAR SETOR =====
function showSector(sectorId){
  document.querySelectorAll('.sector').forEach(s => s.style.display='none');
  document.getElementById(sectorId).style.display='block';
  clearFields();
  updateSelectOptions();
  updateDeleteOptions();
}

// ===== VALIDAR PIN =====
function validatePin(pin){
  return authorizedPins[pin] || null;
}

// ===== MENSAGEM GLOBAL =====
function setGlobalMessage(text, color="#50fa7b"){
  const message = document.getElementById('message');
  message.textContent = text;
  message.style.color = color;
}

// ===== GERAR HEX AUTOMÁTICO =====
function generateHex(name){
  let hash=0;
  for(let i=0;i<name.length;i++)
    hash=name.charCodeAt(i)+((hash<<5)-hash);
  let color="#";
  for(let i=0;i<3;i++){
    const value=(hash>>(i*8)) & 0xFF;
    color+=("00"+value.toString(16)).substr(-2);
  }
  return color;
}

// ===== PREVIEW AUTOMÁTICO ADD =====
document.getElementById('addColorName').addEventListener('input', function(){
  const hex = generateHex(this.value);
  document.getElementById('addHex').value = hex;
  document.getElementById('colorSample').style.backgroundColor = hex;
});

document.getElementById('addHex').addEventListener('input', function(){
  document.getElementById('colorSample').style.backgroundColor = this.value;
});

// ===== ADICIONAR =====
document.getElementById('addForm').addEventListener('submit', function(e){
  e.preventDefault();

  const name = document.getElementById('addColorName').value.trim();
  const shelf = document.getElementById('addShelf').value;
  const sectorName = document.getElementById('addSectorName').value;
  const quantity = parseFloat(document.getElementById('addQuantity').value);
  const hexInput = document.getElementById('addHex').value.trim();
  const pin = document.getElementById('addPin').value;

  const user = validatePin(pin);
  if(!user){
    setGlobalMessage("🚨 não autorizado!", "red");
    return;
  }

  const code = hexInput || generateHex(name);

  colors.push({name, code, quantity, shelf, sector:sectorName});
  addHistory(user, `Adicionou ${name} (${quantity} kg)`, name);

  saveData();
  this.reset();
  setGlobalMessage("Cor adicionada com sucesso!");
  showSector('searchSector');
});

// ===== UPDATE SELECT =====
function updateSelectOptions(){
  const select = document.getElementById('updateSelect');
  if(!select) return;

  select.innerHTML='';
  colors.forEach((c,i)=>{
    const opt=document.createElement('option');
    opt.value=i;
    opt.textContent=`${c.name} (${c.quantity} kg) - ${c.shelf}/${c.sector}`;
    select.appendChild(opt);
  });

  if(colors.length){
    select.dispatchEvent(new Event('change'));
  }
}

// ===== MOSTRAR HEX AO SELECIONAR =====
document.getElementById('updateSelect').addEventListener('change', function(){
  const idx = this.value;
  if(colors[idx]){
    document.getElementById('updateHex').value = colors[idx].code || "";
    document.getElementById('updateSample').style.backgroundColor = colors[idx].code || "";
  }
});

document.getElementById('updateHex').addEventListener('input', function(){
  document.getElementById('updateSample').style.backgroundColor = this.value;
});

// ===== UPDATE STOCK =====
function updateStock(){
  const idx = document.getElementById('updateSelect').value;
  const qty = parseFloat(document.getElementById('updateQuantity').value);
  const shelf = document.getElementById('updateShelf').value;
  const sectorName = document.getElementById('updateSectorName').value;
  const hex = document.getElementById('updateHex').value;
  const pin = document.getElementById('updatePin').value;

  const user = validatePin(pin);
  if(!user){
    document.getElementById('updateMessage').textContent="🚨  não autorizado!";
    return;
  }

  if(!isNaN(qty)) colors[idx].quantity += qty;
  if(shelf) colors[idx].shelf = shelf;
  if(sectorName) colors[idx].sector = sectorName;
  if(hex) colors[idx].code = hex;

  addHistory(user, `Atualizou ${colors[idx].name}`, colors[idx].name);

  saveData();
  setGlobalMessage("Alteração executada com sucesso!");
  showSector('searchSector');
}

// ===== ELIMINAR =====
function updateDeleteOptions(){
  const select = document.getElementById('deleteSelect');
  if(!select) return;

  select.innerHTML='';
  colors.forEach((c,i)=>{
    const opt=document.createElement('option');
    opt.value=i;
    opt.textContent=`${c.name} (${c.quantity} kg) - ${c.shelf}/${c.sector}`;
    select.appendChild(opt);
  });
}

function deleteProduct(){
  const idx = document.getElementById('deleteSelect').value;
  const pin = document.getElementById('deletePin').value;

  const user = validatePin(pin);
  if(!user){
    document.getElementById('deleteMessage').textContent="🚨  não autorizado!";
    return;
  }

  const removed = colors.splice(idx,1)[0];
  addHistory(user, `Eliminou ${removed.name}`, removed.name);

  saveData();
  setGlobalMessage("Cor eliminada com sucesso!");
  showSector('searchSector');
}

// ===== HISTÓRICO =====
function addHistory(user, action, colorName){
  const date = new Date().toLocaleString();

  let colorHistory = history.filter(h => h.name === colorName);
  colorHistory.push({user, action, date, name: colorName});

  if(colorHistory.length > 3){
    colorHistory = colorHistory.slice(-3);
  }

  history = history.filter(h => h.name !== colorName).concat(colorHistory);

  saveData();
  updateHistoryList();
}

function updateHistoryList(){
  const ul = document.getElementById('historyList');
  if(!ul) return;
  ul.innerHTML = '';
  history.forEach(h => {
    const li = document.createElement('li');
    li.textContent = `${h.date} - ${h.user} - ${h.action}`;
    ul.appendChild(li);
  });
}

// ===== PESQUISA (NOME OU HEX) =====
function searchColor(){
  const input = document.getElementById('searchInput').value.trim().toLowerCase();
  const resDiv = document.getElementById('searchResult');
  const sampleDiv = document.getElementById('searchSample');
  resDiv.innerHTML = '';

  const found = colors.find(c =>
    c.name.toLowerCase() === input ||
    (c.code && c.code.toLowerCase() === input)
  );

  if(!found){
    resDiv.textContent = "Nenhum stock encontrado";
    sampleDiv.style.backgroundColor="#111";
    return;
  }

  const qty = found.quantity;
  let qtyColor = "#fff";

  if(qty >= 0.5 && qty <= 0.75){
    qtyColor = "red";
  } else if(qty > 0.75){
    qtyColor = "green";
  }

  const p = document.createElement('p');
  p.innerHTML = `
    <strong>Pantone:</strong> ${found.name} |
    <strong>HEX:</strong> ${found.code} |
    <strong>Quantidade:</strong> 
    <span style="color:${qtyColor}">${qty} kg</span> |
    Prateleira: ${found.shelf} |
    Setor: ${found.sector}
  `;
  resDiv.appendChild(p);

  sampleDiv.style.backgroundColor = found.code;

  const lastUpdate = history
    .filter(h => h.name === found.name)
    .slice(-1)[0];

  if(lastUpdate){
    const lastP = document.createElement('p');
    lastP.style.color = "yellow";
    lastP.style.marginTop = "4px";
    lastP.textContent =
      `Última atualização: ${lastUpdate.date} - ${lastUpdate.user} - ${lastUpdate.action}`;
    resDiv.appendChild(lastP);
  }
}

// ===== INICIALIZAÇÃO =====
showSector('addSector');
updateSelectOptions();
updateDeleteOptions();
updateHistoryList();
