const databaseURL = 'https://interactivequizapp-69f5a-default-rtdb.firebaseio.com/';
let currentQuestionIndex = 0; // Ensure this is a global variable
let quizQuestions = [];
let userAnswers = {};

let currentUser = null;

function showModal() {
    // Clear the input field each time the modal is shown
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.value = '';
    }

    // Display the modal
    document.getElementById('login-modal').style.display = 'block';
}


function closeModal() {
    document.getElementById('login-modal').style.display = 'none';
}

document.getElementById('login-button').addEventListener('click', async function() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert("Please enter a username.");
        return;
    }

    const userExists = await checkUserExists(username);
    if (userExists) {
        currentUser = username;
        closeModal();
        initQuiz(); // Start/resume the quiz
    } else {
        alert("User not found. Please enter a valid username.");
    }
});

async function checkUserExists(username) {
    try {
        const response = await fetch(`${databaseURL}/data/Users/${username}.json`);
        const data = await response.json();
        return data !== null; // User exists if data is not null
    } catch (error) {
        console.error("Error checking user:", error);
        return false;
    }
}



document.addEventListener('DOMContentLoaded', async () => {
    showModal();
    await fetchQuestions();
    await loadQuizProgress();
    await loadUserAnswers();
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
        resetUserData();
    }
}

function handlePreviousButtonClick() {
    console.log('Current Index Before Previous:', currentQuestionIndex);
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        console.log('Current Index After Previous:', currentQuestionIndex);
        displayQuestion(currentQuestionIndex);
        updateProgressBar();
    } else {
        console.log('Already at the first question, cannot go back further.');
    }
    saveProgressToLocalStorage();
}


function findPreviousUnansweredQuestion(startIndex) {
    // Find the last unanswered question before startIndex
    for (let i = startIndex; i >= 0; i--) {
        if (!userAnswers[quizQuestions[i].id]) {
            return i;
        }
    }
    return -1; // Return -1 if none found
}

function handleNextButtonClick() {
    console.log('Current Index Before Next:', currentQuestionIndex);
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        console.log('Current Index After Next:', currentQuestionIndex);
        displayQuestion(currentQuestionIndex);
        updateProgressBar();
    }
    saveProgressToLocalStorage()
}

async function loadQuizProgress() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${databaseURL}/data/Users/${currentUser}/progress.json`);
        const progress = await response.json();

        if (progress) {
            const lastQuestionIndex = quizQuestions.findIndex(q => q.id === progress.lastQuestionId);
            currentQuestionIndex = lastQuestionIndex + 1;

            // Check if the currentQuestionIndex is beyond the list of questions
            if (currentQuestionIndex >= quizQuestions.length) {
                currentQuestionIndex = -1; // Indicate all questions have been answered
            }
        } else {
            currentQuestionIndex = 0; // Start from the beginning if no progress is found
        }
    } catch (error) {
        console.error("Error loading quiz progress:", error);
    }
    saveProgressToLocalStorage();
}




function findNextUnansweredQuestion() {
    for (let i = 0; i < quizQuestions.length; i++) {
        if (!userAnswers.hasOwnProperty(quizQuestions[i].id)) {
            return i; // Return index of next unanswered question
        }
    }
    return -1; // Return -1 if all questions are answered
}



function randomQuestions(array) {
    let shuffledArray = [...array]; // Create a copy of the array
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray; // Return the shuffled array
}


async function fetchQuestions() {
    try {
        const response = await fetch(databaseURL + '/data/Questions.json');
        const data = await response.json();
        if (data) {
            let fetchedQuestions = Object.entries(data).map(([id, questionData]) => ({ id, ...questionData }));

            if (!localStorage.getItem('questionOrder')) {
                // Shuffle only if the question order is not saved
                quizQuestions = randomQuestions(fetchedQuestions);
                localStorage.setItem('questionOrder', JSON.stringify(quizQuestions.map(q => q.id)));
            } else {
                // Load questions in saved order
                let savedOrder = JSON.parse(localStorage.getItem('questionOrder'));
                quizQuestions = savedOrder.map(id => fetchedQuestions.find(q => q.id === id));
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
    // Check if there are no questions available
    if (quizQuestions.length === 0) {
        console.error('No quiz questions available.');
        displayMessage('No questions are available at this time.');
        return;
    }

    // Check if all questions have been answered
    if (currentQuestionIndex === -1) {
        console.log('All questions have been answered.');
        displayMessage('You have completed all questions. Check your results!');
        return;
    }

    // Check for an invalid index
    if (currentQuestionIndex < 0 || currentQuestionIndex >= quizQuestions.length) {
        console.error('Invalid question index:', currentQuestionIndex);
        displayMessage('Invalid question index. Please restart the quiz.');
        return;
    }

    // Display the current question
    displayQuestion(currentQuestionIndex);
    updateProgressBar();
}


function displayMessage(message) {
    const questionsArea = document.querySelector('.question-area');
    questionsArea.innerHTML = `<p>${message}</p>`;
}



// Initialize quiz
async function initQuiz() {
    await loadQuizProgress();
    await fetchQuestions();
    displayCurrentQuestion();
    setupEventDelegationForNavigation();
    saveProgressToLocalStorage();
}

document.addEventListener('DOMContentLoaded', initQuiz);

// funct to display a question based on its type
function displayQuestion(index) {
    if (index < 0 || index >= quizQuestions.length) {
        console.error('Invalid question index:', index);
        return; // Exit the function if index is invalid
    }

    const question = quizQuestions[index];
    if (!question) {
        console.error('No question found at index:', index);
        return; // Exit the function if question is undefined
    }
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

    // Update the stored answer and Firebase whenever the input changes
    newInput.addEventListener('input', function() {
        const answer = newInput.value.trim();
        userAnswers[question.id] = answer;
        storeAnswer(question.id, answer);
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
    if (!currentUser) return;

    // Update the user's responses
    const timestamp = new Date().toISOString();
    const userResponse = { response: answer, timestamp };
    fetch(`${databaseURL}/data/Users/${currentUser}/responses/${questionId}.json`, {
        method: 'PUT',
        body: JSON.stringify(userResponse),
        headers: {'Content-Type': 'application/json'}
    }).catch(error => console.error('Error saving response:', error));

    // Update the userAnswers object
    userAnswers[questionId] = answer;

    // Calculate the total score
    let totalScore = 0;
    quizQuestions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer && userAnswer === question.answer) {
            totalScore++; // Increment score for each correct answer
        }
    });

    // Update the user's progress
    const progress = { lastQuestionId: questionId, totalScore: totalScore };
    fetch(`${databaseURL}/data/Users/${currentUser}/progress.json`, {
        method: 'PUT',
        body: JSON.stringify(progress),
        headers: {'Content-Type': 'application/json'}
    }).catch(error => console.error('Error updating progress:', error));
    saveProgressToLocalStorage();
}


document.addEventListener('DOMContentLoaded', loadQuizProgress);




function validateAnswers() {
    console.log("validateAnswers called");
    console.log("User Answers:", userAnswers);
    console.log("Quiz Questions:", quizQuestions);

    let correctCount = 0;
    quizQuestions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        console.log(`Checking Question: ${question.id}, Type: ${question.type}`);
        if (!userAnswer) return; // Skip if no answer

        switch (question.type) {
            case 'multiple-choice':
                if (userAnswer === question.answer) {
                    correctCount++;
                }
                break;
            case 'ordering':
                if (Array.isArray(userAnswer) && Array.isArray(question.answer) &&
                    userAnswer.every((value, index) => value === question.answer[index])) {
                    correctCount++;
                }
                break;
            case 'fill-in-the-blank':
                if (userAnswer.trim().toLowerCase() === question.answer.toLowerCase()) {
                    correctCount++;
                }
                break;
            case 'matching':
                let isMatchCorrect = Object.keys(question.answer).every(key =>
                    userAnswer[key] && userAnswer[key] === question.answer[key]);
                if (isMatchCorrect) {
                    correctCount++;
                }
                break;
        }
    });

    // Display the score and update in Firebase
    alert(`You got ${correctCount} out of ${quizQuestions.length} questions correct.`);
    updateScoreInFirebase(correctCount);

    // Redirect to login
    redirectToLogin();
}

function redirectToLogin() {
    // Redirect to login modal or login page
    showModal('login-modal'); // Show the login
}

function updateScoreInFirebase(score) {
    const progress = { lastQuestionId: quizQuestions[quizQuestions.length - 1].id, totalScore: score };
    fetch(`${databaseURL}/data/Users/${currentUser}/progress.json`, {
        method: 'PUT',
        body: JSON.stringify(progress),
        headers: {'Content-Type': 'application/json'}
    }).catch(error => console.error('Error updating progress:', error));
}



    // Update the progress bar
function updateProgressBar() {
    const progressBar = document.querySelector('.progress');
    const progressPercentage = (currentQuestionIndex + 1) / quizQuestions.length * 100;
    progressBar.style.width = `${progressPercentage}%`;

    console.log('progress percentage', progressPercentage); // debugging
}

function resetUserData() {
    if (!currentUser) return;

    // Reset progress in Firebase
    const initialProgress = {
        lastQuestionId: null,
        totalScore: 0
    };
    fetch(`${databaseURL}/data/Users/${currentUser}/progress.json`, {
        method: 'PUT',
        body: JSON.stringify(initialProgress),
        headers: {'Content-Type': 'application/json'}
    }).catch(error => console.error('Error resetting progress:', error));

    // Clear responses in Firebase
    const clearResponses = {};
    fetch(`${databaseURL}/data/Users/${currentUser}/responses.json`, {
        method: 'PUT',
        body: JSON.stringify(clearResponses),
        headers: {'Content-Type': 'application/json'}
    }).catch(error => console.error('Error clearing responses:', error));

    // Clear local user answers and question order
    userAnswers = {};
    localStorage.removeItem('quizProgress');
    localStorage.removeItem('questionOrder'); // Add this line to clear question order

    // reshuffle questions
    fetchQuestions();
}

async function loadUserAnswers() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${databaseURL}/data/Users/${currentUser}/responses.json`);
        const answers = await response.json();

        if (answers) {
            userAnswers = answers;
        } else {
            userAnswers = {};
        }
    } catch (error) {
        console.error("Error loading user answers:", error);
    }
}

function saveProgressToLocalStorage() {
    if (!currentUser) return;

    const progressKey = `quizProgress_${currentUser}`;
    const answersKey = `userAnswers_${currentUser}`;

    console.log('Saving to local storage:', progressKey, currentQuestionIndex);
    console.log('Saving to local storage:', answersKey, userAnswers);

    localStorage.setItem(progressKey, JSON.stringify(currentQuestionIndex));
    localStorage.setItem(answersKey, JSON.stringify(userAnswers));
}


async function loadProgressFromLocalStorage() {
    if (!currentUser) return;

    const progressKey = `quizProgress_${currentUser}`;
    const answersKey = `userAnswers_${currentUser}`;

    const savedProgress = localStorage.getItem(progressKey);
    const savedAnswers = localStorage.getItem(answersKey);

    currentQuestionIndex = savedProgress ? JSON.parse(savedProgress) : 0;
    userAnswers = savedAnswers ? JSON.parse(savedAnswers) : {};
}

localStorage.setItem('test', '123');
console.log(localStorage.getItem('test')); // Should log '123'