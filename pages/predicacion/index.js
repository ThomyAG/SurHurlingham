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
    if (!e.target.classList.contains("buttonNumber")) return;

    const result = territories.data.find(
        terri => terri.id == e.target.id
    );

    // El territorio 1 usa el mapa real.
    if (result.id == 1) {
        Swal.fire({
            title: "Territorio 1",
            html: `
                <div id="mapWrap">
                    <div id="mapTerri"></div>
                    <div id="flechaBrujula">▲</div>
                    <button id="activarBrujula" type="button">
                        Activar brújula
                    </button>
                </div>
`,
            width: "90vw",
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: "¿Cómo llegar?",
            customClass: "alertStyle",

            didOpen: async () => {
                const map = L.map("mapTerri");

                const botonBrujula = document.getElementById("activarBrujula");
                const flechaBrujula = document.getElementById("flechaBrujula");

                let escuchandoBrujula = false;

                function actualizarBrujula(evento) {
                    let rumbo = null;

                    // Safari en iPhone puede proporcionar el rumbo directo.
                    if (typeof evento.webkitCompassHeading === "number") {
                        rumbo = evento.webkitCompassHeading;
                    } else if (
                        evento.absolute === true &&
                        typeof evento.alpha === "number"
                    ) {
                        rumbo = (360 - evento.alpha) % 360;
                    }

                    if (rumbo !== null) {
                        flechaBrujula.style.transform =
                            `translate(-50%, -50%) rotate(${rumbo}deg)`;

                        flechaBrujula.style.display = "block";
                        botonBrujula.textContent = "Brújula activada";
                    }
                }

                botonBrujula.addEventListener("click", async () => {
                    try {
                        // Algunos iPhone requieren permiso tras tocar el botón.
                        if (
                            typeof DeviceOrientationEvent !== "undefined" &&
                            typeof DeviceOrientationEvent.requestPermission === "function"
                        ) {
                            const permiso =
                                await DeviceOrientationEvent.requestPermission();

                            if (permiso !== "granted") {
                                botonBrujula.textContent = "Permiso no concedido";
                                return;
                            }
                        }

                        if (!escuchandoBrujula) {
                            window.addEventListener(
                                "deviceorientation",
                                actualizarBrujula
                            );

                            window.addEventListener(
                                "deviceorientationabsolute",
                                actualizarBrujula
                            );

                            escuchandoBrujula = true;
                            botonBrujula.textContent = "Buscando orientación...";
                        }
                    } catch (error) {
                        console.error("Error al activar la brújula:", error);
                        botonBrujula.textContent = "No se pudo activar";
                    }
                });

                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        attribution: '&copy; OpenStreetMap contributors'
                    }
                ).addTo(map);

                try {
                    const respuesta = await fetch("./territorio-1.geojson");

                    if (!respuesta.ok) {
                        throw new Error("No se pudo cargar el mapa");
                    }

                    const datos = await respuesta.json();

                    const manzanas = L.geoJSON(datos, {
                        style: {
                            color: "#513783",
                            weight: 3,
                            fillColor: "#9274c7",
                            fillOpacity: 0.35
                        },
                        onEachFeature: (feature, layer) => {
                            layer.bindTooltip(
                                "Manzana " + feature.properties.manzana,
                                { permanent: true, direction: "center" }
                            );
                        }
                    }).addTo(map);

                    map.fitBounds(manzanas.getBounds(), {
                        padding: [20, 20]
                    });

                    // Ubicación GPS en vivo.
                    let marcadorUsuario = null;
                    let circuloPrecision = null;

                    map.locate({
                        watch: true,
                        enableHighAccuracy: true
                    });

                    map.on("locationfound", (evento) => {
                        const posicion = evento.latlng;

                        if (!marcadorUsuario) {
                            marcadorUsuario = L.circleMarker(posicion, {
                                radius: 8,
                                color: "#ffffff",
                                weight: 3,
                                fillColor: "#1685ff",
                                fillOpacity: 1
                            }).addTo(map);

                            circuloPrecision = L.circle(posicion, {
                                radius: evento.accuracy,
                                color: "#1685ff",
                                weight: 1,
                                fillColor: "#1685ff",
                                fillOpacity: 0.12
                            }).addTo(map);
                        } else {
                            marcadorUsuario.setLatLng(posicion);
                            circuloPrecision.setLatLng(posicion);
                            circuloPrecision.setRadius(evento.accuracy);
                        }
                    });

                    map.on("locationerror", () => {
                        console.warn("No se pudo obtener la ubicación GPS.");
                    });

                    // Leaflet recalcula el tamaño al abrirse la ventana.
                    setTimeout(() => map.invalidateSize(), 100);

                } catch (error) {
                    console.error(error);
                    document.getElementById("mapTerri").innerHTML =
                        "No se pudo cargar el mapa. Revisá tu conexión.";
                }

                // Guardamos el mapa para que el botón pueda abrir Google Maps.
                window.mapaTerritorioActual = map;
            },

            preConfirm: () => {
                window.open(result.ruta, "_blank", "noopener");
                return false;
            }
        });

        return;
    }

    // Los demás territorios conservan su comportamiento actual.
    Swal.fire({
        imageUrl: result.imgUrl,
        imageAlt: `Territorio ${result.id}`,
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: `<a href="${result.ruta}" target="_blank" rel="noopener">¿Cómo llegar?</a>`,
        customClass: "alertStyle"
    });
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