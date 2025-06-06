document.addEventListener('DOMContentLoaded', function () {
    const selectors = {
        loginForm: document.getElementById('loginForm'),
        loginError: document.getElementById('loginError'),
        loginScreen: document.getElementById('loginScreen'),
        mainContent: document.querySelector('main'),
        siteHeader: document.getElementById('siteHeader'),
        logoutBtn: document.getElementById('logoutBtn'),
        themeToggle: document.getElementById('themeToggle'),
        materialForm: document.getElementById('materialForm'),
        materialCode: document.getElementById('materialCode'),
        materialName: document.getElementById('materialName'),
        materialsTableBody: document.getElementById('materialsTableBody'),
        purchaseRequestBtn: document.getElementById('purchaseRequestBtn'),
        materialRequestBtn: document.getElementById('materialRequestBtn'),
        materialRegistration: document.getElementById('materialRegistration'),
        materialList: document.getElementById('materialList'),
        materialRegisterBtn: document.getElementById('materialRegisterBtn'),
        importCsvInput: document.getElementById('importCsvInput'),
        fileName: document.getElementById('fileName'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageInfo: document.getElementById('pageInfo'),
        deleteAllBtn: document.getElementById('deleteAllBtn'),
        deleteAllInativosBtn: document.getElementById('deleteAllInativosBtn'),
        sortAZBtn: document.getElementById('sortAZBtn'),
        searchForm: document.getElementById('searchForm'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        toast: document.getElementById('toast'),
        searchInput: document.getElementById('searchInput'),
        materialsCount: document.getElementById('materialsCount'),
        actionsArea: document.getElementById('actionsArea'),
    };

    let editingIndex = null;
    let currentAccess = 'lista';
    let currentPage = 1;
    const itemsPerPage = 30;
    let sortField = 'code';
    let sortAsc = true;

    // Troca de abas
    if (selectors.purchaseRequestBtn) {
        selectors.purchaseRequestBtn.addEventListener('click', () => {
            currentAccess = 'solicitacoes';
            updateView();
            animateMainTransition();
        });
    }
    if (selectors.materialRequestBtn) {
        selectors.materialRequestBtn.addEventListener('click', () => {
            currentAccess = 'lista';
            updateView();
            animateMainTransition();
        });
    }
    if (selectors.materialRegisterBtn) {
        selectors.materialRegisterBtn.addEventListener('click', () => {
            currentAccess = 'cadastro';
            updateView();
            animateMainTransition();
        });
    }

    // Login
    if (selectors.loginForm) {
        selectors.loginForm.addEventListener('submit', handleLogin);
    }
    function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        selectors.loginError.textContent = '';
        if (username === 'Furlan' && password === 'Furl@n') {
            selectors.loginScreen.style.display = 'none';
            selectors.mainContent.style.display = 'block';
            selectors.siteHeader.style.display = 'block';
            initApp();
            animateMainTransition();
        } else {
            selectors.loginError.textContent = 'Usuário ou senha incorretos';
        }
    }
    if (selectors.logoutBtn) {
        selectors.logoutBtn.addEventListener('click', () => {
            selectors.mainContent.style.display = 'none';
            selectors.siteHeader.style.display = 'none';
            selectors.loginScreen.style.display = 'block';
        });
    }
    if (selectors.themeToggle) {
        selectors.themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
        });
    }

    // CSV Import
    if (selectors.importCsvInput) {
        selectors.importCsvInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                selectors.fileName.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function (evt) {
                    const lines = evt.target.result.split(/\r?\n/);
                    const materials = localStorageUtils.getMaterials();
                    lines.forEach(line => {
                        // Suporta CSV separado por vírgula ou ponto e vírgula
                        let columns = line.split(';');
                        if (columns.length < 2) columns = line.split(',');
                        if (columns.length < 2) return; // ignora linhas inválidas

                        // Remove aspas e espaços extras
                        const code = columns[0].replace(/(^"|"$)/g, '').trim();
                        const name = columns[1].replace(/(^"|"$)/g, '').trim();

                        if (code && name) {
                            materials.push({
                                id: Date.now() + Math.random(),
                                code: code,
                                name: name,
                                date: new Date().toLocaleDateString('pt-BR')
                            });
                        }
                    });
                    localStorageUtils.saveMaterials(materials);
                    renderMaterials();
                };
                reader.readAsText(file);
            }
        });
    }

    // Excluir todos
    if (selectors.deleteAllBtn) {
        selectors.deleteAllBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir todos os materiais?')) {
                localStorageUtils.saveMaterials([]);
                renderMaterials();
                showToastMessage('Todos os materiais foram excluídos!', 'success');
            }
        });
    }
    // Excluir inativos
    if (selectors.deleteAllInativosBtn) {
        selectors.deleteAllInativosBtn.addEventListener('click', () => {
            if (confirm('Excluir todos os materiais com nome "Inativo" ou "Inativos"?')) {
                let materials = localStorageUtils.getMaterials();
                materials = materials.filter(m => !/inativo/i.test(m.name));
                localStorageUtils.saveMaterials(materials);
                renderMaterials();
                showToastMessage('Materiais inativos excluídos!', 'success');
            }
        });
    }

    const localStorageUtils = {
        getMaterials: () => JSON.parse(localStorage.getItem('materials') || '[]'),
        saveMaterials: (materials) => localStorage.setItem('materials', JSON.stringify(materials)),
        addMaterial: (material) => {
            const materials = localStorageUtils.getMaterials();
            materials.push(material);
            localStorageUtils.saveMaterials(materials);
        },
        updateMaterial: (index, updatedMaterial) => {
            const materials = localStorageUtils.getMaterials();
            materials[index] = updatedMaterial;
            localStorageUtils.saveMaterials(materials);
        },
        deleteMaterial: (index) => {
            const materials = localStorageUtils.getMaterials();
            materials.splice(index, 1);
            localStorageUtils.saveMaterials(materials);
        },
    };

    function showToastMessage(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `show-toast ${type}`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-30px)';
        }, 2200);
    }

    if (selectors.materialForm) {
        selectors.materialForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const code = selectors.materialCode.value.trim();
            const name = selectors.materialName.value.trim();
            if (!code || !name) {
                showToastMessage('Preencha todos os campos!', 'error');
                return;
            }
            localStorageUtils.addMaterial({
                id: Date.now() + Math.random(),
                code,
                name,
                date: new Date().toLocaleDateString('pt-BR')
            });
            selectors.materialCode.value = '';
            selectors.materialName.value = '';
            selectors.materialCode.focus();
            renderMaterials();
            showToastMessage('Material adicionado com sucesso!', 'success');
        });
    }

    // Pesquisa
    if (selectors.searchForm) {
        selectors.searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            renderMaterials();
        });
    }
    if (selectors.clearSearchBtn) {
        selectors.clearSearchBtn.addEventListener('click', function () {
            selectors.searchInput.value = '';
            renderMaterials();
        });
    }

    
    function updateView() {
        selectors.materialRegistration.style.display = currentAccess === 'cadastro' ? 'block' : 'none';
        selectors.materialList.style.display = 'block';
        selectors.actionsArea.style.display = currentAccess === 'cadastro' ? 'flex' : 'none';
        renderMaterials();
    }

  
    function initApp() {
        updateMaterialsCount();
        updateView();
        if (selectors.prevPageBtn) {
            selectors.prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderMaterials();
                }
            });
        }
        if (selectors.nextPageBtn) {
            selectors.nextPageBtn.addEventListener('click', () => {
                currentPage++;
                renderMaterials();
            });
        }
    }

    
    function updateMaterialsCount() {
        if (selectors.materialsCount) {
            const materials = localStorageUtils.getMaterials();
            selectors.materialsCount.textContent = `Total de materiais: ${materials.length}`;
        }
    }

   
    function renderMaterials() {
        let materials = localStorageUtils.getMaterials();
        const search = selectors.searchInput.value.trim().toLowerCase();
        if (search) {
            materials = materials.filter(m => m.name.toLowerCase().includes(search));
        }
        const sortedMaterials = sortMaterials(materials);
        const paginatedMaterials = paginateMaterials(sortedMaterials);

        selectors.materialsTableBody.innerHTML = '';
        if (paginatedMaterials.length === 0) {
            renderEmptyMessage();
        } else {
            renderMaterialRows(paginatedMaterials, sortedMaterials);
        }
        updatePaginationInfo(sortedMaterials.length);
        updateMaterialsCount();
    }

    function sortMaterials(materials) {
        return materials.slice().sort((a, b) => {
            const vA = a[sortField] || '';
            const vB = b[sortField] || '';
            return sortAsc
                ? vA.toString().localeCompare(vB.toString(), undefined, { numeric: true })
                : vB.toString().localeCompare(vA.toString(), undefined, { numeric: true });
        });
    }

    function paginateMaterials(materials) {
        const totalPages = Math.ceil(materials.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, materials.length);
        return materials.slice(startIdx, endIdx);
    }

    function renderEmptyMessage() {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" style="text-align:center; color:#b91c1c; font-weight:bold;">Nenhum material cadastrado</td>`;
        selectors.materialsTableBody.appendChild(tr);
    }

    function renderMaterialRows(paginatedMaterials, allMaterials) {
        paginatedMaterials.forEach((mat, idx) => {
            const realIndex = allMaterials.findIndex((m) => m.id === mat.id);
            const isEditing = editingIndex === realIndex;
            const row = document.createElement('tr');
            row.classList.toggle('editing-row', isEditing);

            row.innerHTML = isEditing
                ? renderEditingRow(mat, realIndex)
                : renderDefaultRow(mat, realIndex);

            selectors.materialsTableBody.appendChild(row);
        });
    }

    
    window.editMaterial = function(index) {
        editingIndex = index;
        renderMaterials();
    };
    window.saveEdit = function(index) {
        const code = document.getElementById('editCode').value.trim();
        const name = document.getElementById('editName').value.trim();
        let materials = localStorageUtils.getMaterials();
        if (code && name) {
            materials[index].code = code;
            materials[index].name = name;
            localStorageUtils.saveMaterials(materials);
            showToastMessage('Material editado com sucesso!', 'success');
        } else {
            showToastMessage('Preencha todos os campos!', 'error');
        }
        editingIndex = null;
        renderMaterials();
    };
    window.cancelEdit = function() {
        editingIndex = null;
        renderMaterials();
    };
    window.removeMaterial = function(index) {
        if (confirm('Deseja excluir este material?')) {
            localStorageUtils.deleteMaterial(index);
            editingIndex = null;
            renderMaterials();
            showToastMessage('Material excluído com sucesso!', 'success');
        }
    };
    window.copyCode = function(code) {
        navigator.clipboard.writeText(code);
        showToastMessage('Código copiado!', 'success');
    };

    function renderEditingRow(mat, realIndex) {
        return `
            <td><input type="text" id="editCode" value="${mat.code}" style="width:100px"></td>
            <td><input type="text" id="editName" value="${mat.name}" style="width:180px"></td>
            <td>${mat.date}</td>
            <td>
                <button class="actions-btn edit" onclick="saveEdit(${realIndex})">Salvar</button>
                <button class="actions-btn" onclick="cancelEdit()">Cancelar</button>
            </td>
        `;
    }

    function renderDefaultRow(mat, realIndex) {
        return `
            <td>${mat.code}</td>
            <td>${mat.name}</td>
            <td>${mat.date}</td>
            <td>
                ${currentAccess === 'cadastro' ? renderCadastroActions(realIndex) : ''}
                ${currentAccess !== 'cadastro' ? renderListaActions(mat.code) : ''}
            </td>
        `;
    }

    function renderCadastroActions(realIndex) {
        return `
            <button class="actions-btn edit" onclick="editMaterial(${realIndex})">Editar</button>
            <button class="actions-btn" onclick="removeMaterial(${realIndex})">Excluir</button>
        `;
    }

    function renderListaActions(code) {
        return `<button class="actions-btn" onclick="copyCode('${code}')">Copiar código</button>`;
    }

    function updatePaginationInfo(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        selectors.pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        selectors.prevPageBtn.style.display = currentPage > 1 ? '' : 'none';
        selectors.nextPageBtn.style.display = currentPage < totalPages ? '' : 'none';
    }

    function animateMainTransition() {
        const main = document.querySelector('main');
        main.style.opacity = 0;
        main.style.transform = 'translateY(40px) scale(0.98)';
        setTimeout(() => {
            main.style.transition = 'opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1)';
            main.style.opacity = 1;
            main.style.transform = 'translateY(0) scale(1)';
        }, 50);
    }
    
    renderMaterials();
});