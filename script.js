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
            })
            optionsContainer.appendChild(optionButton);
        });
        questionsArea.appendChild(optionsContainer);
    };


    function displayFillInTheBlankQuestion(question) {
        const fillInTheBlankContainer = document.querySelector('.fill-in-the-blank');
        const questionText = document.querySelector('.question-area');
        questionText.textContent = question.text;
        fillInTheBlankContainer.style.display = 'block';
    }

    function clearPreviousQuestionDisplay() {
        const questionTypes = document.querySelectorAll('.question');
        questionTypes.forEach(type => {
            type.style.display = 'none';
        })
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
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
        }
    });

    nextButton.addEventListener('click', function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
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