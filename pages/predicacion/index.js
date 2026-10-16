const terriContainer = document.getElementById("terriContainer");
const territories = {};

fetch("./territorios.json")
    .then(respuesta => respuesta.json())
    .then(territorios => {
        terriRender(territorios);
        territories.data = territorios;
    });

    function terriRender(terrisArray) {
        terriContainer.innerHTML = "";
        terrisArray.forEach(terri => {
            const cardTerri = document.createElement("button");
            cardTerri.className = "buttonTerri";
            cardTerri.innerHTML = ` <h3 class="buttonNumber" id=${terri.id}> ${terri.id} </h3> `;
            terriContainer.append(cardTerri);
        });
        terriContainer.addEventListener("click", showTerri);
    }
function showTerri(e) {
    if (e.target.classList.contains("buttonNumber")) {
        const result = territories.data.find(terri => terri.id == e.target.id);
        Swal.fire({
            imageUrl: result.imgUrl,
            imageWidth: result.imgUrl,
            imageAlt: `Territorio ${result.id}`,
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: `<a href="${result.ruta}">¿Cómo llegar?</a>`,
            customClass: "alertStyle"
        });
    }
}
const inputs = document.querySelectorAll('.inputDay');

let values = {
    lunes: '',
    martes: '',
    miercoles: '',
    jueves: '',
    viernes: '',
    sabado: '',
    domingo: '',
    otros: ''
};
    
const storedValues = JSON.parse(localStorage.getItem('values'));
    if (storedValues) {
        values = storedValues;
        inputs.forEach(input => {
            const inputId = input.id;
            input.value = values[inputId];
        });
    }
inputs.forEach(input => {
    input.addEventListener('input', handleInput);
    });
    
function handleInput(event) {
    const inputValue = event.target.value;
    const inputId = event.target.id;
    values[inputId] = inputValue;
    localStorage.setItem('values', JSON.stringify(values));
}