document.addEventListener('DOMContentLoaded', function() {
    // Lógica de login
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const mainContent = document.querySelector('main');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            loginError.textContent = '';

            if (username === 'Furlan' && password === 'Furl@n') {
                loginScreen.style.display = 'none';
                mainContent.style.display = 'block';
                initApp(); // Inicializa o app após login
            } else {
                loginError.textContent = 'Usuário ou senha incorretos';
            }
        });
    }
});

// Funções para manipulação de materiais no localStorage
function getMaterials() {
    return JSON.parse(localStorage.getItem('materials') || '[]');
}
function saveMaterials(materials) {
    localStorage.setItem('materials', JSON.stringify(materials));
}
function addMaterial(material) {
    const materials = getMaterials();
    materials.push(material);
    saveMaterials(materials);
}
function updateMaterial(index, updatedMaterial) {
    const materials = getMaterials();
    materials[index] = updatedMaterial;
    saveMaterials(materials);
}
function deleteMaterial(index) {
    const materials = getMaterials();
    materials.splice(index, 1);
    saveMaterials(materials);
}

// Inicialização do app após login
function initApp() {
    // Seletores dos elementos
    const materialForm = document.getElementById('materialForm');
    const materialCode = document.getElementById('materialCode');
    const materialName = document.getElementById('materialName');
    const materialsTableBody = document.getElementById('materialsTableBody');
    const purchaseRequestBtn = document.getElementById('purchaseRequestBtn');
    const materialRequestBtn = document.getElementById('materialRequestBtn');
    const materialRegistration = document.getElementById('materialRegistration');
    const materialList = document.getElementById('materialList');
    const materialRegisterBtn = document.getElementById('materialRegisterBtn');
    const importCsvInput = document.getElementById('importCsvInput');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const deleteAllInativosBtn = document.getElementById('deleteAllInativosBtn');
    const sortAZBtn = document.getElementById('sortAZBtn');
    const searchForm = document.getElementById('searchForm');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    let editingIndex = null;
    let currentAccess = 'lista'; // 'cadastro' ou 'lista'
    let currentPage = 1;
    let itemsPerPage = 30; // valor fixo

    // Variáveis para ordenação
    let sortField = 'code';
    let sortAsc = true;

    // Atualiza o contador de materiais SEMPRE com o total geral
    function updateMaterialsCount() {
        const countDiv = document.getElementById('materialsCount');
        if (countDiv) {
            const materials = getMaterials();
            countDiv.textContent = `Total de materiais: ${materials.length}`;
        }
    }

    // Renderiza todos os materiais normalmente (com paginação real e pesquisa eficiente)
    function renderMaterials(filteredList) {
        let materials = filteredList || getMaterials();

        // Ordenação
        materials = materials.slice().sort((a, b) => {
            let vA = a[sortField] || '';
            let vB = b[sortField] || '';
            if (sortField === 'date') {
                return sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
            }
            return sortAsc
                ? vA.toString().localeCompare(vB.toString(), undefined, {numeric:true})
                : vB.toString().localeCompare(vA.toString(), undefined, {numeric:true});
        });

        const totalPages = Math.ceil(materials.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, materials.length);

        materialsTableBody.innerHTML = '';

        if (materials.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="4" style="text-align:center; color:#b91c1c; font-weight:bold;">Nenhum material cadastrado</td>`;
            materialsTableBody.appendChild(tr);
        } else {
            // Pegue a lista completa para garantir o índice real
            const allMaterials = getMaterials();

            for (let idx = startIdx; idx < endIdx; idx++) {
                const mat = materials[idx];
                // Use o id único para encontrar o índice real
                const realIndex = allMaterials.findIndex(m => m.id === mat.id);
                const isEditing = editingIndex === realIndex;
                const row = document.createElement('tr');
                if (isEditing) row.classList.add('editing-row');
                if (isEditing) {
                    row.innerHTML = `
                        <td><input type="text" id="editCode" value="${mat.code}" style="width:100px"></td>
                        <td><input type="text" id="editName" value="${mat.name}" style="width:180px"></td>
                        <td>${mat.date}</td>
                        <td>
                            <button class="actions-btn edit" onclick="saveEdit(${realIndex})">Salvar</button>
                            <button class="actions-btn" onclick="cancelEdit()">Cancelar</button>
                        </td>
                    `;
                } else {
                    row.innerHTML = `
                        <td>${mat.code}</td>
                        <td>${mat.name}</td>
                        <td>${mat.date}</td>
                        <td>
                            ${
                                currentAccess === 'cadastro'
                                ? `
                                    <button class="actions-btn edit" onclick="editMaterial(${realIndex})">Editar</button>
                                    <button class="actions-btn" onclick="removeMaterial(${realIndex})">Excluir</button>
                                `
                                : ''
                            }
                            ${
                                currentAccess === 'lista'
                                ? `<button class="actions-btn" onclick="copyCode('${mat.code}')">Copiar código</button>`
                                : ''
                            }
                        </td>
                    `;
                }
                materialsTableBody.appendChild(row);
                // Foco automático ao editar
                if (isEditing) setTimeout(() => row.querySelector('#editCode').focus(), 100);
            }
        }

        // Paginação
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.style.display = currentPage > 1 ? '' : 'none';
        nextPageBtn.style.display = currentPage < totalPages ? '' : 'none';

        updateMaterialsCount();
    }

    // Adiciona ou edita material
    materialForm.onsubmit = function(e) {
        e.preventDefault();
        const code = materialCode.value.trim();
        const name = materialName.value.trim();
        if (!code || !name) {
            showToast('Erro ao adicionar material!', 'error');
            return;
        }

        // Validação para evitar códigos duplicados ao adicionar/editar
        const materials = getMaterials();
        if (materials.some((m, i) => m.code === code && i !== editingIndex)) {
            showToast('Já existe um material com este código!', 'error');
            return;
        }

        // Ao adicionar material manualmente:
        const material = {
            id: Date.now() + Math.random(), // ID único
            code,
            name,
            date: new Date().toLocaleDateString()
        };

        if (editingIndex !== null) {
            updateMaterial(editingIndex, material);
            editingIndex = null;
            showToast('Material editado com sucesso!', 'success');
        } else {
            addMaterial(material);
            showToast('Material adicionado com sucesso!', 'success');
        }
        materialForm.reset();
        currentPage = 1;
        renderMaterials();
    };

    // Editar material inline
    window.editMaterial = function(index) {
        editingIndex = index;
        renderMaterials();
        // Foco automático ao editar
        setTimeout(() => {
            const input = document.getElementById('editCode');
            if (input) input.focus();
        }, 100);
    };

    window.saveEdit = function(index) {
        const code = document.getElementById('editCode').value.trim();
        const name = document.getElementById('editName').value.trim();
        if (!code || !name) {
            showToast('Preencha todos os campos!', 'error');
            return;
        }
        // Validação para evitar códigos duplicados ao editar
        const materials = getMaterials();
        if (materials.some((m, i) => m.code === code && i !== index)) {
            showToast('Já existe um material com este código!', 'error');
            return;
        }
        // Atualiza a data para o momento da edição
        updateMaterial(index, { ...materials[index], code, name, date: new Date().toLocaleDateString() });
        editingIndex = null;
        showToast('Material editado com sucesso!', 'success');
        renderMaterials();
    };

    window.cancelEdit = function() {
        editingIndex = null;
        renderMaterials();
    };

    // Remover material com confirmação mostrando nome/código
    window.removeMaterial = function(index) {
        const materials = getMaterials();
        const mat = materials[index];
        if (confirm(`Deseja excluir o material "${mat.name}" (Código: ${mat.code})?`)) {
            deleteMaterial(index);
            currentPage = 1;
            showToast('Material excluído com sucesso!', 'success');
            renderMaterials();
        }
    };

    // Copiar código do material
    window.copyCode = function(code) {
        navigator.clipboard.writeText(code).then(() => {
            showToast('Código copiado!', 'success');
        });
    };

    // Alterna entre as seções e controla visibilidade dos botões e do campo de pesquisa
    purchaseRequestBtn.onclick = function() {
        materialRegistration.style.display = 'none';
        materialList.style.display = '';
        importCsvInput.style.display = 'none';
        deleteAllBtn.style.display = 'none';
        searchForm.style.display = ''; // Mostra o campo de pesquisa
        currentPage = 1;
        renderMaterials();
    };

    materialRequestBtn.onclick = function() {
        currentAccess = 'lista';
        materialRegistration.style.display = 'none';
        materialList.style.display = '';
        importCsvInput.style.display = 'none';
        deleteAllBtn.style.display = 'none';
        searchForm.style.display = ''; // Mostra o campo de pesquisa
        currentPage = 1;
        renderMaterials();
    };

    materialRegisterBtn.onclick = function() {
        currentAccess = 'cadastro';
        materialRegistration.style.display = '';
        materialList.style.display = '';
        importCsvInput.style.display = '';
        deleteAllBtn.style.display = '';
        searchForm.style.display = 'none'; // Esconde o campo de pesquisa
        currentPage = 1;
        renderMaterials();
    };

    // Paginação
    prevPageBtn.onclick = function() {
        if (currentPage > 1) {
            currentPage--;
            renderMaterials();
        }
    };
    nextPageBtn.onclick = function() {
        const materials = getMaterials();
        const totalPages = Math.ceil(materials.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderMaterials();
        }
    };

    // Excluir todos os materiais
    deleteAllBtn.onclick = function() {
        if (confirm('Tem certeza que deseja excluir TODOS os materiais?')) {
            saveMaterials([]);
            currentPage = 1;
            showToast('Todos os materiais foram excluídos!', 'success');
            renderMaterials();
        }
    };

    // Excluir todos os materiais com nome "inativo"
    deleteAllInativosBtn.onclick = function() {
        let materials = getMaterials();
        const originalLength = materials.length;
        materials = materials.filter(mat => mat.name.toLowerCase() !== 'inativo');
        saveMaterials(materials);
        currentPage = 1;
        renderMaterials();
        const removed = originalLength - materials.length;
        if (removed > 0) {
            showToast(`Removidos ${removed} materiais com nome "inativo".`, 'success');
        } else {
            showToast('Nenhum material com nome "inativo" encontrado.', 'error');
        }
    };

    // Limpar pesquisa
    clearSearchBtn.onclick = function() {
        document.getElementById('searchInput').value = '';
        currentPage = 1;
        renderMaterials();
    };

    // Pesquisa de materiais por nome (com paginação real)
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const termo = document.getElementById('searchInput').value.toLowerCase();

        let materials = getMaterials();
        let filtered = materials.filter(mat =>
            mat.name.toLowerCase().includes(termo)
        );

        currentPage = 1;
        renderMaterials(filtered);

        // Paginação só aparece se houver resultados
        const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        prevPageBtn.style.display = currentPage > 1 ? '' : 'none';
        nextPageBtn.style.display = currentPage < totalPages ? '' : 'none';

        // Mensagem se não encontrou nenhum resultado
        if (filtered.length === 0) {
            materialsTableBody.innerHTML = `<tr id="noResultsMsg"><td colspan="4" style="text-align:center; color:#b91c1c; font-weight:bold;">Sem resultados de pesquisa</td></tr>`;
        }
    });

    // Ao limpar a pesquisa, volta a mostrar todos os materiais normalmente
    document.getElementById('searchInput').addEventListener('input', function() {
        if (this.value.trim() === '') {
            currentPage = 1;
            renderMaterials();
            prevPageBtn.style.display = '';
            nextPageBtn.style.display = '';
        }
    });

    // Toast de feedback visual
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.className = 'toast';
        }, 2500);
    }

    document.getElementById('importCsvInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // Limite: 2MB
            showToast('Arquivo muito grande! Limite de 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split('\n').filter(l => l.trim());
            if (lines.length < 2) {
                showToast('Arquivo CSV vazio ou sem dados.', 'error');
                return;
            }

            // Detecta separador: ; ou ,
            let sep = ';';
            if (lines[0].indexOf(',') > -1 && lines[0].indexOf(';') === -1) sep = ',';

            let materials = getMaterials();
            let count = 0;

            // Ignora a primeira linha (cabeçalho)
            for (let i = 1; i < lines.length; i++) {
                const columns = lines[i].replace('\r', '').split(sep);
                const code = columns[0]?.replace(/"/g, '').trim();
                const name = columns[1]?.replace(/"/g, '').trim();
                if (code && name && !materials.some(mat => mat.code === code)) {
                    materials.push({
                        id: Date.now() + Math.random(),
                        code,
                        name,
                        date: new Date().toLocaleDateString()
                    });
                    count++;
                }
            }

            saveMaterials(materials);
            currentPage = 1;
            renderMaterials();
            showToast(count > 0 ? `Importado(s) ${count} material(is)!` : 'Nenhum material novo importado.', count > 0 ? 'success' : 'error');
        };
        reader.readAsText(file);
    });

    // Inicializa a renderização dos materiais
    renderMaterials();
}
// main.js
// Função para salvar dados no localStorage
function saveDataToLocalStorage() {
    const table = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const rows = Array.from(table.rows).map(row => ({
        name: row.cells[0].textContent,
        file: row.cells[1].textContent
    }));
    localStorage.setItem('savedData', JSON.stringify(rows));
}

// Função para carregar dados do localStorage
function loadDataFromLocalStorage() {
    const savedData = JSON.parse(localStorage.getItem('savedData')) || [];
    const table = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    table.innerHTML = ''; // Limpa a tabela antes de carregar

    savedData.forEach(item => {
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td>${item.name}</td>
            <td>${item.file}</td>
            <td>
                <button class="actions-btn edit">Editar</button>
                <button class="danger-btn">Excluir</button>
            </td>
        `;
    });

    // Reaplica eventos de edição e exclusão
    document.querySelectorAll('.danger-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('tr').remove();
            saveDataToLocalStorage(); // Salva após exclusão
        });
    });

    document.querySelectorAll('.actions-btn.edit').forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const newName = prompt('Novo nome:', row.cells[0].textContent);
            if (newName !== null) {
                row.cells[0].textContent = newName;
                saveDataToLocalStorage(); // Salva após edição
            }
        });
    });
}

// Carrega dados ao iniciar a página
window.addEventListener('load', loadDataFromLocalStorage);

// Salva dados após submissão do formulário
document.getElementById('dataForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('nameInput').value;
    const file = document.getElementById('fileInput').files[0];
    if (name && file) {
        const table = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td>${name}</td>
            <td>${file.name}</td>
            <td>
                <button class="actions-btn edit">Editar</button>
                <button class="danger-btn">Excluir</button>
            </td>
        `;
        document.getElementById('dataForm').reset();
        saveDataToLocalStorage(); // Salva após adição
    }
});

// Salva dados após exclusão
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('danger-btn')) {
        e.target.closest('tr').remove();
        saveDataToLocalStorage();
    }
});
document.addEventListener('DOMContentLoaded', function() {
    // Lógica de login
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const mainContent = document.querySelector('main');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            loginError.textContent = '';

            if (username === 'Furlan' && password === 'Furl@n') {
                loginScreen.style.display = 'none';
                mainContent.style.display = 'block';
                initApp(); // Inicializa o app após login
            } else {
                loginError.textContent = 'Usuário ou senha incorretos';
            }
        });
    }

    // Função de logout com transição
    function logoutWithTransition() {
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 300);
    }

    // Lógica do botão "Sair"
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutWithTransition);
    }
});