
const $ = id => document.getElementById(id);

const screens = [
    "homeScreen",
    "quizScreen",
    "resultScreen"
];

const TOTAL = 10;

let questions = [];
let index = 0;
let score = 0;
let selected = null;
let answered = false;

let fileNow = "";
let titleNow = "";
let hintUsed = false;


function screen(id) {
    screens.forEach(x => {
        $(x).classList.toggle("hidden", x !== id);
    });

    scrollTo(0, 0);
}


// Mezclar elementos aleatoriamente
function shuffle(array) {
    array = [...array];

    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}


// Obtener el nombre del jugador
function player() {
    return $("playerName").value.trim() || "Jugador";
}

async function start(file) {

    try {
        const response = await fetch("data/" + file);

        if (!response.ok) {
            throw Error();
        }

        const data = await response.json();

        // Elegir 10 preguntas aleatorias
        questions = shuffle(data.questions).slice(0, TOTAL);

        // Reiniciar variables
        index = 0;
        score = 0;
        fileNow = file;
        titleNow = data.title;

        // Mostrar información
        $("categoryLabel").textContent = data.title;
        $("scoreLabel").textContent = "⭐ 0 puntos";

        screen("quizScreen");

        render();

    } catch (error) {

        alert(
            "No se pudieron cargar las preguntas. " +
            "Ejecuta el proyecto con Live Server " +
            "o con python -m http.server 8000."
        );

    }
}

function render() {

    const question = questions[index];

    selected = null;
    answered = false;
    hintUsed = false;

    // Información de la pregunta
    $("questionNumber").textContent =
        "PREGUNTA " + (index + 1);

    $("progressLabel").textContent =
        (index + 1) + " / " + TOTAL;

    $("progressBar").style.width =
        (index / TOTAL * 100) + "%";

    // Imagen y texto
    $("questionImage").textContent =
        question.image || "🐾";

    $("questionText").textContent =
        question.question;

    // Reiniciar mensajes
    $("feedback").textContent = "";

    // Reiniciar botones
    $("hintButton").disabled = false;
    $("hintButton").textContent = "💡 Pista";

    $("confirmButton").disabled = true;
    $("confirmButton").textContent =
        "Comprobar respuesta";

    // Limpiar respuestas anteriores
    $("answers").innerHTML = "";

    // Mostrar respuestas aleatorias
    shuffle(question.options).forEach(option => {

        const button = document.createElement("button");

        button.className = "answer";
        button.textContent = option;

        button.onclick = () => {

            if (answered) return;

            selected = option;

            document.querySelectorAll(".answer").forEach(answer => {
                answer.classList.toggle(
                    "selected",
                    answer === button
                );
            });

            $("confirmButton").disabled = false;

        };

        $("answers").append(button);

    });

}

function confirm() {

    // Primera pulsación: corregir respuesta
    if (!answered) {

        if (selected === null) return;

        answered = true;

        const question = questions[index];

        const correct = selected === question.answer;

        // Marcar respuestas correctas e incorrectas
        document.querySelectorAll(".answer").forEach(button => {

            button.disabled = true;

            if (button.textContent === question.answer) {

                button.classList.add("correct");

            } else if (button.textContent === selected) {

                button.classList.add("wrong");

            }

        });


        // Actualizar puntuación y mensaje
        if (correct) {

            score++;

            $("feedback").textContent =
                "¡Correcto! +1 punto 🎉";

            $("feedback").style.color = "#27845d";

        } else {

            $("feedback").textContent =
                "La respuesta correcta era: " + question.answer;

            $("feedback").style.color = "#d94b4b";

        }


        // Actualizar puntos
        $("scoreLabel").textContent =
            "⭐ " + score + " puntos";


        // Cambiar texto del botón
        $("confirmButton").textContent =
            index === TOTAL - 1
                ? "Ver resultado"
                : "Siguiente pregunta";


        // Actualizar barra de progreso
        $("progressBar").style.width =
            ((index + 1) / TOTAL * 100) + "%";

    }

    // Segunda pulsación: pasar a la siguiente pregunta
    else {

        index++;

        if (index < TOTAL) {

            render();

        } else {

            finish();

        }

    }

}

function finish() {

    // Recuperar ranking guardado
    const rankingData = JSON.parse(
        localStorage.getItem("zoo-ranking") || "[]"
    );

    // Añadir resultado del jugador
    rankingData.push({

        name: player(),
        score: score,
        total: TOTAL,
        quiz: titleNow,
        date: Date.now()

    });

    // Ordenar por puntuación
    rankingData.sort((a, b) =>
        b.score - a.score || b.date - a.date
    );

    // Guardar los 10 mejores resultados
    localStorage.setItem(
        "zoo-ranking",
        JSON.stringify(rankingData.slice(0, 10))
    );


    // Mostrar puntuación final
    $("finalScore").textContent = score;


    // Mensaje según el resultado
    $("resultTitle").textContent =
        score === 10
            ? "¡Perfecto!"
            : score >= 7
                ? "¡Excelente!"
                : "¡Buen intento!";


    $("resultMessage").textContent =
        player() +
        ", has conseguido " +
        score +
        " de " +
        TOTAL +
        " puntos en " +
        titleNow +
        ".";


    // Mostrar pantalla final
    screen("resultScreen");

    ranking();

}

function ranking() {

    const rankingData = JSON.parse(
        localStorage.getItem("zoo-ranking") || "[]"
    );

    $("rankingList").innerHTML = "";


    // Si no hay resultados
    if (!rankingData.length) {

        $("rankingList").textContent =
            "Aún no hay resultados. ¡Sé el primero!";

        return;

    }


    // Mostrar resultados
    rankingData.forEach(result => {

        const li = document.createElement("li");

        li.textContent =
            result.name +
            " · " +
            result.quiz +
            " — " +
            result.score +
            "/" +
            result.total;

        $("rankingList").append(li);

    });

}

$("hintButton").onclick = () => {

    if (hintUsed || answered) return;

    hintUsed = true;

    $("feedback").textContent =
        "💡 Pista: " + questions[index].hint;

    $("hintButton").disabled = true;

    $("hintButton").textContent =
        "Pista utilizada";

};

$("confirmButton").onclick = confirm;


// Elegir categoría
document.querySelectorAll(".quiz-card").forEach(button => {

    button.onclick = () => {
        start(button.dataset.file);
    };

});


// Volver al menú desde el quiz
$("quitQuiz").onclick = () => {

    if (confirm("¿Salir y perder el progreso de esta partida?")) {
        screen("homeScreen");
    }

};


// Volver al menú desde los resultados
$("backHome").onclick = () => {
    screen("homeScreen");
};


// Repetir el quiz
$("playAgain").onclick = () => {
    start(fileNow);
};


// Logo ZooQuiz
$("homeLink").onclick = event => {

    event.preventDefault();

    screen("homeScreen");

};


// Borrar ranking
$("clearRanking").onclick = () => {

    if (confirm("¿Borrar el ranking de este navegador?")) {

        localStorage.removeItem("zoo-ranking");

        ranking();

    }

};

ranking();