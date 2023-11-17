const databaseURL = 'https://interactivequizapp-69f5a-default-rtdb.firebaseio.com/';

document.addEventListener('DOMContentLoaded', function() {
    const questions = document.querySelectorAll('.question');
    let currentQuestionIndex = 0;

    const prevButton = document.querySelector('.nav-button.prev');
    const nextButton = document.querySelector('.nav-button.next');
    const progressBar = document.querySelector('.progress');

    // Initialize quiz
    function initQuiz() {
        questions.forEach((question, index) => {
            question.style.display = index === 0 ? 'block' : 'none';
        });
        updateProgressBar();
    }

    // Update the progress bar
    function updateProgressBar() {
        const progressPercentage = (currentQuestionIndex + 1) / questions.length * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }

    // Show a specific question
    function showQuestion(index) {
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

    // Initialize the Quiz
    initQuiz();
});