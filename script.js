const databaseURL = 'https://interactivequizapp-69f5a-default-rtdb.firebaseio.com/';

document.addEventListener('DOMContentLoaded', function() {
    const questions = document.querySelectorAll('.question');
    let currentQuestionIndex = 0;
    let quizQuestions = [];

    const prevButton = document.querySelector('.nav-button.prev');
    const nextButton = document.querySelector('.nav-button.next');
    const progressBar = document.querySelector('.progress');

    function fetchQuestions() {
        fetch(databaseURL + '/data/Questions.json')
            .then(response => response.json())
            .then(data => {
                console.log("Raw data from Firebase:", data); // Log raw data

                if (data) {
                    quizQuestions = Object.values(data);
                    console.log("Fetched Questions:", quizQuestions);
                    initQuiz();
                } else {
                    console.log("No data found at the specified path.");
                    // Handle the scenario of no data (e.g., display a message to the user)
                }
            })
            .catch(error => console.error("Error fetching data: ", error));
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
    }

    function displayMultipleChoiceQuestion(question) {
        const multipleChoiceContainer = document.querySelector('.multiple-choice');
        if (!multipleChoiceContainer) {
            console.error("Multiple choice container not found");
            return;
        }
        multipleChoiceContainer.style.display = 'block';

        const questionText = multipleChoiceContainer.querySelector('.question-text');
        if (questionText) {
            questionText.textContent = question.text;
        } else {
            console.error("Question text element not found in multiple-choice container");
            return;
        }

        const optionsContainer = multipleChoiceContainer.querySelector('.options');
        if (!optionsContainer) {
            console.error("Options container not found in multiple-choice container");
            return;
        }
        optionsContainer.innerHTML = ''; // Clear previous options

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.classList.add('option');
            button.textContent = option;
            optionsContainer.appendChild(button);
        });
    }


    function displayFillInTheBlankQuestion(question) {
        const orderingContainer = document.querySelector('.ordering');
        orderingContainer.style.display = 'block';
        orderingContainer.querySelector('question-text').textContent = question.text;

        const orderingOptions = orderingContainer.querySelector('ordering-options');
        orderingOptions.innerHTML = '';

        question.items.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('ordering-item');
            div.textContent = item;
            orderingOptions.appendChild(div);
        })
    }

    function clearPreviousQuestionDisplay() {
        const questionTypes = document.querySelectorAll('.question');
        questionTypes.forEach(type => {
            type.style.display = 'none';
        })
    }

    function showQuestion(index) {
        displayQuestion(index);
        currentQuestionIndex = index;
        updateProgressBar();
    }

    // Update the progress bar
    function updateProgressBar() {
        const progressPercentage = (currentQuestionIndex + 1) / questions.length * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    // Show a specific question
    function showQuestion(index) {
        const questions = document.querySelectorAll('.question');
        questions[currentQuestionIndex].style.display = 'none';
        questions[index].style.display = 'block';
        currentQuestionIndex = index;
        updateProgressBar();
    }

    // Event Listeners for Next and Previous buttons
    prevButton.addEventListener('click', function() {
        if (currentQuestionIndex > 0) {
            showQuestion(currentQuestionIndex - 1);
        }
    });

    nextButton.addEventListener('click', function() {
        if (currentQuestionIndex < questions.length - 1) {
            showQuestion(currentQuestionIndex + 1);
        }
    });

    // Event Listener for Multiple Choice Options
    document.querySelectorAll('.multiple-choice .option').forEach(option => {
        option.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });

    fetchQuestions();
});