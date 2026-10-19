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

    if (!result) return;

    let mapa = null;
    let marcadorUsuario = null;
    let circuloPrecision = null;
    let limpiarBrujula = null;

    Swal.fire({
        title: `Territorio ${result.id}`,
        html: `
            <div id="mapWrap">
                <div id="mapTerri"></div>
                <button id="activarBrujula" type="button">
                    Activar brújula
                </button>
                <p id="estadoBrujula">Cargando mapa...</p>
            </div>
        `,
        width: "90vw",
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: "¿Cómo llegar?",
        customClass: "alertStyle",

        didOpen: async () => {
            const botonBrujula =
                document.getElementById("activarBrujula");
            const estadoBrujula =
                document.getElementById("estadoBrujula");

            try {
                mapa = L.map("mapTerri");

                L.tileLayer(
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        attribution: "&copy; OpenStreetMap contributors"
                    }
                ).addTo(mapa);

                // Cargar automáticamente el GeoJSON del territorio elegido.
                const respuesta = await fetch(
                    `./territorio-${result.id}.geojson`
                );

                if (!respuesta.ok) {
                    throw new Error(
                        `No se encontró territorio-${result.id}.geojson`
                    );
                }

                const datos = await respuesta.json();

                const manzanas = L.geoJSON(datos, {
                    style: feature => {
                        const relleno =
                            feature.properties?.fill ||
                            (result.id == 1 ? "#9274c7" : "#312E81");

                        return {
                            color: relleno,
                            weight: 3,
                            fillColor: relleno,
                            fillOpacity: 0.35
                        };
                    },

                    onEachFeature: (feature, layer) => {
                        if (feature.properties?.manzana) {
                            layer.bindTooltip(
                                "Manzana " + feature.properties.manzana,
                                {
                                    permanent: true,
                                    direction: "center"
                                }
                            );
                        }
                    }
                }).addTo(mapa);

                if (manzanas.getLayers().length > 0) {
                    mapa.fitBounds(manzanas.getBounds(), {
                        padding: [20, 20]
                    });
                }

                // Puntero GPS con flecha de orientación.
                let ultimoRumbo = 0;
                let escuchandoBrujula = false;

                function crearIconoUbicacion(rumbo = 0) {
                    return L.divIcon({
                        className: "iconoUbicacion",
                        html: `
                            <div class="ubicacionRotable"
                                 style="transform: rotate(${rumbo}deg)">
                                <svg viewBox="0 0 48 48"
                                     width="48" height="48">
                                    <path d="M24 2 L34 27 L24 22 L14 27 Z"
                                          fill="#1685ff"
                                          stroke="white"
                                          stroke-width="2.5"
                                          stroke-linejoin="round"/>
                                    <circle cx="24" cy="27" r="9"
                                            fill="#1685ff"
                                            stroke="white"
                                            stroke-width="3"/>
                                    <circle cx="24" cy="27" r="3"
                                            fill="white"/>
                                </svg>
                            </div>
                        `,
                        iconSize: [48, 48],
                        iconAnchor: [24, 27]
                    });
                }

                function actualizarOrientacion(evento) {
                    let rumbo = null;

                    if (
                        typeof evento.webkitCompassHeading === "number"
                    ) {
                        rumbo = evento.webkitCompassHeading;
                    } else if (
                        evento.absolute === true &&
                        typeof evento.alpha === "number"
                    ) {
                        rumbo = (360 - evento.alpha + 360) % 360;
                    }

                    if (rumbo === null) return;

                    ultimoRumbo = rumbo;

                    if (marcadorUsuario) {
                        marcadorUsuario.setIcon(
                            crearIconoUbicacion(rumbo)
                        );
                    }

                    estadoBrujula.textContent = "Brújula activada";
                    botonBrujula.style.display = "none";
                }

                function iniciarBrujula() {
                    if (escuchandoBrujula) return;

                    window.addEventListener(
                        "deviceorientation",
                        actualizarOrientacion
                    );
                    window.addEventListener(
                        "deviceorientationabsolute",
                        actualizarOrientacion
                    );

                    escuchandoBrujula = true;
                    estadoBrujula.textContent =
                        "Buscando orientación del teléfono...";
                }

                limpiarBrujula = () => {
                    window.removeEventListener(
                        "deviceorientation",
                        actualizarOrientacion
                    );
                    window.removeEventListener(
                        "deviceorientationabsolute",
                        actualizarOrientacion
                    );
                };

                botonBrujula.addEventListener("click", async () => {
                    try {
                        if (
                            typeof DeviceOrientationEvent !== "undefined" &&
                            typeof DeviceOrientationEvent.requestPermission ===
                                "function"
                        ) {
                            const permiso =
                                await DeviceOrientationEvent.requestPermission();

                            if (permiso !== "granted") {
                                estadoBrujula.textContent =
                                    "No se concedió permiso para la brújula.";
                                return;
                            }
                        }

                        iniciarBrujula();
                    } catch (error) {
                        console.warn("Error al activar la brújula:", error);
                        estadoBrujula.textContent =
                            "No se pudo activar la brújula en este navegador.";
                    }
                });

                // En navegadores que no requieren permiso manual,
                // intentar activar la orientación automáticamente.
                if (
                    typeof DeviceOrientationEvent !== "undefined" &&
                    typeof DeviceOrientationEvent.requestPermission !==
                        "function"
                ) {
                    iniciarBrujula();
                }

                // Actualizar el puntero con la ubicación GPS.
                mapa.on("locationfound", evento => {
                    const posicion = evento.latlng;

                    if (!marcadorUsuario) {
                        marcadorUsuario = L.marker(posicion, {
                            icon: crearIconoUbicacion(ultimoRumbo),
                            interactive: false,
                            zIndexOffset: 1000
                        }).addTo(mapa);

                        circuloPrecision = L.circle(posicion, {
                            radius: evento.accuracy,
                            color: "#1685ff",
                            weight: 1,
                            fillColor: "#1685ff",
                            fillOpacity: 0.12
                        }).addTo(mapa);
                    } else {
                        marcadorUsuario.setLatLng(posicion);
                        circuloPrecision.setLatLng(posicion);
                        circuloPrecision.setRadius(evento.accuracy);
                    }

                    estadoBrujula.textContent =
                        "Ubicación GPS disponible. Activá la brújula si hace falta.";
                });

                mapa.on("locationerror", evento => {
                    console.warn("Error de ubicación:", evento.message);
                    mapa.stopLocate();
                    estadoBrujula.textContent =
                        "Mapa disponible, pero no se pudo obtener la ubicación GPS.";
                });

                mapa.locate({
                    watch: true,
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                });

                setTimeout(() => mapa?.invalidateSize(), 100);

            } catch (error) {
                console.error("Error al cargar el territorio:", error);

                // Si todavía no hay GeoJSON, mostrar el croquis anterior.
                if (mapa) {
                    mapa.remove();
                    mapa = null;
                }

                Swal.update({
                    html: `
                        <p>No se encontró el mapa real de este territorio.</p>
                        <img src="${result.imgUrl}"
                             alt="Croquis del territorio ${result.id}"
                             style="max-width:100%;height:auto;">
                    `,
                    showConfirmButton: true,
                    confirmButtonText: "¿Cómo llegar?"
                });
            }
        },

        willClose: () => {
            if (limpiarBrujula) limpiarBrujula();

            if (mapa) {
                mapa.stopLocate();
                mapa.off();
                mapa.remove();
                mapa = null;
            }
        },

        preConfirm: () => {
            window.open(result.ruta, "_blank", "noopener");
            return false;
        }
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