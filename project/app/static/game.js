let tog = 1
let rollingSound = new Audio('rpg-dice-rolling-95182.mp3')
let winSound = new Audio('winharpsichord-39642.mp3')



let p1sum = 0

function showQuestionModal(questionText, options, timerSeconds, onSubmit) {
    let modal = document.createElement('div');
    modal.id = 'question-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    let optionsHtml = options.map((opt, idx) =>
        `<button class="option-btn" data-idx="${idx}" style="margin:5px;padding:10px 20px;">${opt}</button>`
    ).join('');

    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:10px;text-align:center;">
            <h2>Answer to proceed!</h2>
            <p id="modal-question">${questionText}</p>
            <div id="options">${optionsHtml}</div>
            <div style="margin-top:10px;">
                <span id="modal-timer">${timerSeconds}</span> seconds left
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    let timer = timerSeconds;
    let interval = setInterval(() => {
        timer--;
        document.getElementById('modal-timer').innerText = timer;
        if (timer <= 0) {
            clearInterval(interval);
            closeModal(null); // null means timeout
        }
    }, 1000);

    function closeModal(selectedIdx) {
        document.body.removeChild(modal);
        clearInterval(interval);
        onSubmit(selectedIdx);
    }

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = () => {
            closeModal(parseInt(btn.getAttribute('data-idx')));
        };
    });
}

const snakesAndLadders = {
    1: 38, 4: 14, 8: 30, 21: 42, 28: 76, 32: 10, 36: 6, 48: 26, 50: 67,
    62: 18, 71: 92, 80: 99, 88: 24, 95: 56, 97: 78
};

async function play(player, psum, correction, num) {
    let sum;
    if (psum == 'p1sum') {
        let nextSum = p1sum + num;
        if (nextSum > 100) {
            nextSum = p1sum;
        }

        if (snakesAndLadders[nextSum]) {
            document.getElementById("diceBtn").disabled = true;
            let q = await fetch('/get_question/');
            let qdata = await q.json();

            showQuestionModal(qdata.question, qdata.options, 30, async (selectedIdx) => {
                document.getElementById("diceBtn").disabled = false;
                if (selectedIdx === null) {
                    updatePlayerPosition(player, correction, p1sum);
                    return;
                }
                let verify = await fetch('/verify_answer/', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({selected_index: selectedIdx, question_id: qdata.id})
                });
                let vdata = await verify.json();

                let message = "";
                if (vdata.correct) {
                    if (snakesAndLadders[nextSum] > nextSum) {
                        p1sum = snakesAndLadders[nextSum]; // climb ladder
                        message = "Correct! You climbed the ladder!";
                    } else {
                        p1sum = nextSum; // avoid snake
                        message = "Correct! You survived the snake!";
                    }
                } else {
                    if (snakesAndLadders[nextSum] > nextSum) {
                        p1sum = nextSum; // don't climb ladder
                        message = "Wrong! You missed the ladder.";
                    } else {
                        p1sum = snakesAndLadders[nextSum]; // get swallowed by snake
                        message = "Wrong! You got swallowed by the snake!";
                    }
                }
                updatePlayerPosition(player, correction, p1sum);
                setTimeout(() => alert(message), 100); // Delay alert to ensure modal is gone
            });
            return;
        } else {
            p1sum = nextSum;
        }
        sum = p1sum;
    }

    updatePlayerPosition(player, correction, sum);
}

// Helper to update player position (refactor your code to use this)
function updatePlayerPosition(player, correction, sum) {
    document.getElementById(`${player}`).style.transition = `linear all .5s`;

    if (sum < 10) {
        document.getElementById(`${player}`).style.left = `${(sum - 1) * 62}px`;
        document.getElementById(`${player}`).style.top = `${-0 * 62 - correction}px`;
    } else if (sum == 100) {
        winSound.play();
        if (player == 'p1') {
            alert("Player  Won !!");
        }
        location.reload();
    } else {
        let numarr = Array.from(String(sum));
        let n1 = eval(numarr.shift());
        let n2 = eval(numarr.pop());
        if (n1 % 2 != 0) {
            if (n2 == 0) {
                document.getElementById(`${player}`).style.left = `${(9) * 62}px`;
                document.getElementById(`${player}`).style.top = `${(-n1 + 1) * 62 - correction}px`;
            } else {
                document.getElementById(`${player}`).style.left = `${(9 - (n2 - 1)) * 62}px`;
                document.getElementById(`${player}`).style.top = `${-n1 * 62 - correction}px`;
            }
        }
    }
}


document.getElementById("diceBtn").addEventListener("click", function () {
    rollingSound.play()
    num = Math.floor(Math.random() * (6 - 1 + 1) + 1)
    document.getElementById("dice").innerText = num


    if (tog % 2 != 0) {
        document.getElementById('tog').innerText = "Player's Turn : "
        play('p1', 'p1sum', 0, num)

    }






})