
let materials = [];

function addMaterial(code, name) {
    const date = new Date().toLocaleDateString();
    const material = { code, name, date };
    materials.push(material);
    displayMaterials();
}

function editMaterial(index, newCode, newName) {
    if (materials[index]) {
        materials[index].code = newCode;
        materials[index].name = newName;
        materials[index].date = new Date().toLocaleDateString();
        displayMaterials();
    }
}

function deleteMaterial(index) {
    if (materials[index]) {
        materials.splice(index, 1);
        displayMaterials();
    }
}

function displayMaterials() {
    const materialsList = document.getElementById('materials-list');
    materialsList.innerHTML = '';
    materials.forEach((material, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Code: ${material.code}, Name: ${material.name}, Date: ${material.date}`;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteMaterial(index);
        listItem.appendChild(deleteButton);
        materialsList.appendChild(listItem);
    });
}
function saveMaterials() {
    localStorage.setItem('materials', JSON.stringify(materials));
}
function loadMaterials() {
    const data = localStorage.getItem('materials');
    materials = data ? JSON.parse(data) : [];
}