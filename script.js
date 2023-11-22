const databaseURL = 'https://interactivequizapp-69f5a-default-rtdb.firebaseio.com/';
let currentQuestionIndex = 0; // Ensure this is a global variable
let quizQuestions = [];
let userAnswers = {};

document.addEventListener('DOMContentLoaded', async () => {
    await loadQuizProgress();
    await fetchQuestions();
    setupEventDelegationForNavigation();
    displayCurrentQuestion();
});

function setupEventDelegationForNavigation() {
    const navigationContainer = document.querySelector('.navigation');

    if (navigationContainer) {
        navigationContainer.addEventListener('click', handleNavButtonClick);
    }
}

function handleNavButtonClick(event) {
    const target = event.target;

    if (target.classList.contains('prev')) {
        // Handle previous button click
        handlePreviousButtonClick();
    } else if (target.classList.contains('next')) {
        // Handle next button click
        handleNextButtonClick();
    } else if (target.classList.contains('submit')) {
        // Handle submit button click
        validateAnswers();
    }
}

function handlePreviousButtonClick() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
        updateProgressBar();
    }
}

function handleNextButtonClick() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
        updateProgressBar();
    }
}

async function loadQuizProgress() {
    const progress = JSON.parse(localStorage.getItem('quizProgress'));
    if (progress) {
        currentQuestionIndex = progress.currentQuestionIndex;
        userAnswers = progress.userAnswers || {};
        console.log('Resuming quiz at index:', currentQuestionIndex);
    } else {
        currentQuestionIndex = 0; // Starting new quiz
        userAnswers = {}; // Reset user answers for a new quiz
    }
}

function randomQuestions(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function fetchQuestions() {
    try {
        const response = await fetch(databaseURL + '/data/Questions.json');
        const data = await response.json();
        if (data) {
            quizQuestions = Object.entries(data).map(([id, questionData]) => ({ id, ...questionData }));
            if (currentQuestionIndex === 0) {
                randomQuestions(quizQuestions); // Shuffle for a new quiz
            }
            console.log("Fetched Questions:", quizQuestions);
        } else {
            console.log("No data found at the specified path.");
        }
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

function displayCurrentQuestion() {
    if (quizQuestions.length > 0) {
        displayQuestion(currentQuestionIndex);
        updateProgressBar();
    } else {
        console.error('Quiz questions not loaded');
    }
}

// Initialize quiz
function initQuiz() {
    displayQuestion(0);
    updateProgressBar();
}

// funct to display a question based on its type
function displayQuestion(index) {
    const question = quizQuestions[index];
    clearPreviousQuestionDisplay();

    switch (question.type) {
        case 'fill-in-the-blank':
            displayFillInTheBlankQuestion(question);
            break;
        case "matching":
            displayMatchingQuestion(question);
            break;
        case "ordering":
            displayOrderingQuestion(question);
            break;
        default:
            displayMultipleChoiceQuestion(question);

    }
    //show or hide the submit button
    const submitButton = document.querySelector('.nav-button.submit');
    if (submitButton) {
    if (index === quizQuestions.length - 1) {
        submitButton.style.display = 'block';
    } else {
        submitButton.style.display = 'none';
    }
}}

function displayMultipleChoiceQuestion(question) {
    clearPreviousQuestionDisplay();

    const questionsArea = document.querySelector('.question-area');
    questionsArea.innerHTML = '';

    const questionText = document.createElement('p');
    questionText.textContent = question.text;
    questionsArea.appendChild(questionText);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options';

    question.options.forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.classList.add('option');
        optionButton.textContent = option;

        optionButton.addEventListener('click', function() {
            optionsContainer.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            optionButton.classList.add('selected');
            storeAnswer(question.id, option);
        })
        optionsContainer.appendChild(optionButton);
    });
    questionsArea.appendChild(optionsContainer);
};


function displayFillInTheBlankQuestion(question) {
    clearPreviousQuestionDisplay();

    // Display the question
    const questionsArea = document.querySelector('.question-area');
    questionsArea.innerHTML = question.text;

    // Find the fill-in-the-blank container and input field
    const fillInTheBlankContainer = document.querySelector('.fill-in-the-blank');
    const blankInput = document.querySelector('.blank-input');

    // Remove existing event listeners from the input field
    const newInput = blankInput.cloneNode(true);
    fillInTheBlankContainer.replaceChild(newInput, blankInput);

    // Update the input field value based on the stored answer or reset it
    newInput.value = userAnswers[question.id] || '';

    // Show the fill-in-the-blank container
    fillInTheBlankContainer.style.display = 'block';

    // Update the stored answer whenever the input changes
    newInput.addEventListener('input', function() {
        userAnswers[question.id] = newInput.value;
        localStorage.setItem('quizProgress', JSON.stringify({ currentQuestionIndex, userAnswers }));
    });
}



function displayOrderingQuestion(question) {
    clearPreviousQuestionDisplay();
    const questionsArea = document.querySelector('.question-area');
    questionsArea.innerHTML = '';

    // Displaying question text
    const questionText = document.createElement('p');
    questionText.textContent = question.text;
    questionsArea.appendChild(questionText);

    // Create list for ordering items
    const list = document.createElement('ul');
    list.id = 'ordering-list';

    // Populate list with items
    const orderFromStorage = userAnswers[question.id];
    const items = orderFromStorage || question.items;
    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        listItem.classList.add('ordering-item');
        listItem.addEventListener('click', function() {
            toggleSelection(listItem);
        });
        list.appendChild(listItem);
    });
    questionsArea.appendChild(list);
    addMovementButtons(list, question.id);
}

function toggleSelection(listItem) {
    // Clear the 'selected' class from all items
    listItem.closest('ul').querySelectorAll('.ordering-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Toggle the 'selected' class on the clicked item
    listItem.classList.add('selected');
}

function addMovementButtons(list, questionId) {
    const moveUpButton = document.createElement('button');
    moveUpButton.textContent = 'Move Up';
    moveUpButton.addEventListener('click', function() {
        moveItem(list, -1, questionId);
    });

    const moveDownButton = document.createElement('button');
    moveDownButton.textContent = 'Move Down';
    moveDownButton.addEventListener('click', function() {
        moveItem(list, 1, questionId);
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.appendChild(moveUpButton);
    buttonsContainer.appendChild(moveDownButton);

    const questionsArea = document.querySelector('.question-area');
    questionsArea.appendChild(buttonsContainer);
}

function moveItem(list, direction, questionId) {
    const selected = list.querySelector('.selected');
    if (!selected) return;

    if (direction === -1 && selected.previousElementSibling) {
        list.insertBefore(selected, selected.previousElementSibling);
    } else if (direction === 1 && selected.nextElementSibling) {
        list.insertBefore(selected.nextElementSibling, selected);
    }
    saveOrder(list, questionId);
}

function saveOrder(list, questionId) {
    const orderedItems = Array.from(list.querySelectorAll('.ordering-item')).map(item => item.textContent);
    userAnswers[questionId] = orderedItems;
    storeAnswer(questionId, orderedItems);
}


function displayMatchingQuestion(question) {
    clearPreviousQuestionDisplay();
    const questionsArea = document.querySelector('.question-area');
    questionsArea.innerHTML = 'Match correctly';

    const matchingArea = document.createElement('div');
    matchingArea.className = 'matching';

    //store user's selection for this question
    let userSelection = {};

    Object.keys(question.pairs).forEach((key, index) => {
        const label = document.createElement('label');
        label.textContent = key + ': ';
        label.htmlFor = 'match-' + index;
        matchingArea.appendChild(label);

        const select = document.createElement('select');
        select.id = 'match-' + index;

        //add an empty default option
        const defaultOption = document.createElement('option');
        defaultOption.textContent = '--select--';
        defaultOption.value = '';
        select.appendChild(defaultOption);

        Object.values(question.pairs).forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        //set current selection if available
        if (userAnswers[question.id] && userAnswers[question.id][key]) {
            select.value = userAnswers[question.id][key];
        }

        //update the selection in the useranswers object
        select.addEventListener('change', () => {
            userSelection[key] = select.value;
            userAnswers[question.id] = userSelection;
            storeAnswer(question.id, userSelection);
        })

        matchingArea.appendChild(select);
        matchingArea.appendChild(document.createElement('br'));
    });

    questionsArea.appendChild(matchingArea);
};

function clearPreviousQuestionDisplay() {
    const questionArea = document.querySelector('.question-area');
    if (questionArea) {
        questionArea.innerHTML = '';
    }

    const fillInTheBlankContainer = document.querySelector('.fill-in-the-blank');
    if (fillInTheBlankContainer) {
        fillInTheBlankContainer.style.display = 'none';
    }
}

function storeAnswer(questionId, answer) {
    userAnswers[questionId] = answer;
    localStorage.setItem('quizProgress', JSON.stringify({currentQuestionIndex, userAnswers}));
}

document.addEventListener('DOMContentLoaded', loadQuizProgress);




function validateAnswers() {
    /*
    if (Object.keys(userAnswers).length < quizQuestions.length) {
        alert("Please answer all questions to submit.");
        return;
    }
    */
    console.log('validate answers is called...')
    let correctCount = quizQuestions.reduce((count, question) => {
        // Check if the question is of 'matching' type
        if (question.type === "matching") {
            // Compare each key-value pair in the answer object
            let isMatchCorrect = true;
            for (let key in question.answer) {
                if (!userAnswers[question.id] || userAnswers[question.id][key] !== question.answer[key]) {
                    isMatchCorrect = false;
                    break;
                }
            }
            return count + (isMatchCorrect ? 1 : 0);
        }
        // For 'ordering' questions, compare the order of the array elements
        else if (Array.isArray(question.answer)) {
            const isOrderCorrect = Array.isArray(userAnswers[question.id]) &&
                                    userAnswers[question.id].length === question.answer.length &&
                                    userAnswers[question.id].every((value, index) => value === question.answer[index]);
            return count + (isOrderCorrect ? 1 : 0);
        }
        // For other question types (like multiple choice, fill-in-the-blank)
        else {
            return count + (userAnswers[question.id] === question.answer ? 1 : 0);
        }
    }, 0);

    alert(`You got ${correctCount} out of ${quizQuestions.length} questions correct.`);
    localStorage.removeItem('quizProgress');
}

    // Update the progress bar
function updateProgressBar() {
    const progressBar = document.querySelector('.progress');
    const progressPercentage = (currentQuestionIndex + 1) / quizQuestions.length * 100;
    progressBar.style.width = `${progressPercentage}%`;

    console.log('progress percentage', progressPercentage); // debugging
}

// fetchQuestions();