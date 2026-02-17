// =============================================
// GALERÍA POKÉMON - script.js
// Actividad 3.4 - Consumo de API con Fetch
// =============================================

// Variables globales para controlar cuántos pokémon llevamos cargados
let offsetActual = 0;      // desde qué número empezar a pedir
const LIMITE = 20;         // cuántos traer cada vez

// =============================================
// ENDPOINT 1: Obtener lista de pokémon
// https://pokeapi.co/api/v2/pokemon?limit=20&offset=0
// =============================================
async function obtenerListaPokemon() {
    try {
        mostrarCargando(true);

        const url = `https://pokeapi.co/api/v2/pokemon?limit=${LIMITE}&offset=${offsetActual}`;
        const respuesta = await fetch(url);

        // Si la respuesta no fue exitosa, lanzamos un error
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        // Con los nombres de la lista, pedimos el detalle de cada pokémon
        await mostrarPokemonEnPantalla(datos.results);

        offsetActual += LIMITE;

    } catch (error) {
        console.error('Error al obtener la lista:', error);
        mostrarError(true);
    } finally {
        // Esto se ejecuta siempre, con o sin error
        mostrarCargando(false);
    }
}

// =============================================
// ENDPOINT 2: Obtener detalle de UN pokémon
// https://pokeapi.co/api/v2/pokemon/{nombre}
// =============================================
async function obtenerDetallePokemon(nombre) {
    const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`);

    if (!respuesta.ok) {
        throw new Error(`No encontré a ${nombre}`);
    }

    return await respuesta.json();
}

// =============================================
// Mostrar la lista de pokémon en el DOM
// =============================================
async function mostrarPokemonEnPantalla(listaPokemon) {
    const contenedor = document.getElementById('pokemon-lista');

    // Pedimos el detalle de todos al mismo tiempo (más rápido que uno por uno)
    const promesas = listaPokemon.map(p => obtenerDetallePokemon(p.name));
    const detalles = await Promise.all(promesas);

    detalles.forEach(pokemon => {
        const tarjeta = crearTarjeta(pokemon);
        contenedor.appendChild(tarjeta);
    });
}

// =============================================
// Crear la tarjeta HTML de un pokémon
// =============================================
function crearTarjeta(pokemon) {
    const tarjeta = document.createElement('div');
    tarjeta.classList.add('tarjeta-pokemon');

    const imagen = pokemon.sprites.other['official-artwork'].front_default
                   || pokemon.sprites.front_default;

    const tiposHTML = pokemon.types
        .map(t => `<span class="tipo tipo-${t.type.name}">${t.type.name}</span>`)
        .join('');

    tarjeta.innerHTML = `
        <p class="numero-pokemon">#${String(pokemon.id).padStart(3, '0')}</p>
        <img src="${imagen}" alt="${pokemon.name}" loading="lazy">
        <h3>${pokemon.name}</h3>
        <div class="tipos">${tiposHTML}</div>
    `;

    tarjeta.addEventListener('click', () => abrirModal(pokemon));

    return tarjeta;
}

// =============================================
// Modal: mostrar estadísticas del pokémon
// =============================================
function abrirModal(pokemon) {
    const modal = document.getElementById('modal');
    const infoModal = document.getElementById('modal-info');

    const imagen = pokemon.sprites.other['official-artwork'].front_default
                   || pokemon.sprites.front_default;

    const statsHTML = pokemon.stats.map(s => `
        <div class="stat">
            <span class="stat-nombre">${s.stat.name}</span>
            <div class="stat-barra-contenedor">
                <div class="stat-barra" style="width: ${Math.min(s.base_stat, 150) / 150 * 100}%"></div>
            </div>
            <span class="stat-valor">${s.base_stat}</span>
        </div>
    `).join('');

    const tiposHTML = pokemon.types
        .map(t => `<span class="tipo tipo-${t.type.name}">${t.type.name}</span>`)
        .join('');

    infoModal.innerHTML = `
        <img src="${imagen}" alt="${pokemon.name}">
        <h2>${pokemon.name}</h2>
        <p style="color:#888; margin-bottom:12px;">
            #${String(pokemon.id).padStart(3,'0')} · 
            Peso: ${pokemon.weight / 10}kg · 
            Altura: ${pokemon.height / 10}m
        </p>
        <div class="tipos" style="margin-bottom:16px;">${tiposHTML}</div>
        <h4 style="margin-bottom:10px; color:#ffd60a;">Estadísticas base</h4>
        ${statsHTML}
    `;

    modal.classList.remove('escondido');
}

function cerrarModal() {
    document.getElementById('modal').classList.add('escondido');
}

// Cerrar modal si el usuario hace clic fuera del contenido
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) cerrarModal();
    });
});

// =============================================
// Botón "Cargar más"
// =============================================
function cargarMas() {
    mostrarError(false);
    obtenerListaPokemon();
}

// =============================================
// Búsqueda por nombre
// =============================================
async function buscarPokemon() {
    const input = document.getElementById('input-buscar').value.trim().toLowerCase();

    if (!input) {
        alert('Escribe el nombre de un pokémon para buscar');
        return;
    }

    try {
        mostrarError(false);
        mostrarCargando(true);

        const pokemon = await obtenerDetallePokemon(input);

        const contenedor = document.getElementById('pokemon-lista');
        contenedor.innerHTML = '';

        const tarjeta = crearTarjeta(pokemon);
        contenedor.appendChild(tarjeta);

        document.getElementById('btn-cargar-mas').style.display = 'none';

    } catch (error) {
        console.error('Pokémon no encontrado:', error);
        mostrarError(true, `No encontré ningún pokémon llamado "${input}"`);
    } finally {
        mostrarCargando(false);
    }
}

// Buscar también con Enter
document.getElementById('input-buscar')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') buscarPokemon();
});

// =============================================
// Funciones auxiliares
// =============================================
function mostrarCargando(mostrar) {
    let loader = document.getElementById('loader');

    if (mostrar) {
        if (!loader) {
            loader = document.createElement('p');
            loader.id = 'loader';
            loader.classList.add('cargando');
            loader.textContent = '⏳ Cargando pokémon...';
            document.getElementById('pokemon-lista').appendChild(loader);
        }
    } else {
        loader?.remove();
    }
}

function mostrarError(mostrar, mensaje = '❌ No se pudo cargar. Revisa tu conexión.') {
    const div = document.getElementById('mensaje-error');
    if (mostrar) {
        div.textContent = mensaje;
        div.classList.remove('escondido');
    } else {
        div.classList.add('escondido');
    }
}

// =============================================
// Arrancar la app al abrir la página
// =============================================
obtenerListaPokemon();