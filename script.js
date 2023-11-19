const databaseURL = 'https://interactivequizapp-69f5a-default-rtdb.firebaseio.com/';

document.addEventListener('DOMContentLoaded', function() {
    let currentQuestionIndex = 0;
    let quizQuestions = [];

    const prevButton = document.querySelector('.nav-button.prev');
    const nextButton = document.querySelector('.nav-button.next');

    if(!prevButton || !nextButton) {
        console.error('nav buttons not found');
        return;
    }

    // Event Listeners for Next and Previous buttons
    prevButton.addEventListener('click', function() {
        // clearPreviousQuestionDisplay();
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
            updateProgressBar();
            console.log('prev btn click, currentQuestionIndex:' , currentQuestionIndex);
        }
    });

    nextButton.addEventListener('click', function() {
        // clearPreviousQuestionDisplay();
        if (currentQuestionIndex < quizQuestions.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
            updateProgressBar();
            console.log('next btn click, currentQuestionIndex:', currentQuestionIndex);
        }
    });

    function randomQuestions(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function fetchQuestions() {
        fetch(databaseURL + '/data/Questions.json')
            .then(response => response.json())
            .then(data => {
                console.log("Raw data from Firebase:", data); // Log raw data

                if (data) {
                    // Convert the object into an array and include the question keys as IDs
                    quizQuestions = Object.entries(data).map(([id, questionData]) => ({
                        id,
                        ...questionData
                    }));

                    randomQuestions(quizQuestions); // Shuffle the questions if needed
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
        //show or hide the submit button
        const submitButton = document.querySelector('.nav-button.submit');
        if (submitButton) {
        if (index === quizQuestions.length - 1) {
            submitButton.style.display = 'block';
        } else {
            submitButton.style.display = 'none';
        }
    }

    }

    document.querySelector('.nav-button.submit').addEventListener('click', function() {
        validateAnswers();
        localStorage.removeItem('quizProgress');
    });

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



    function displayOrderingQuestion(question){
        clearPreviousQuestionDisplay();
        const questionsArea = document.querySelector('.question-area');
        questionsArea.innerHTML = '';

        const questionText = document.createElement('p');
        questionText.textContent = question.text;
        questionsArea.appendChild(questionText);

        const list = document.createElement('ul');
        list.id = 'ordering-list';

        question.items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item;
            listItem.classList.add('ordering-item');
            listItem.addEventListener('click', function() {
                if(listItem.classList.contains('selected')){
                    listItem.classList.remove('selected');
                } else {
                    list.querySelectorAll('.ordering-item').forEach(item => item.classList.remove('selected'));
                    listItem.classList.add('selected');
                }
            });
            list.appendChild(listItem);
        });
        questionsArea.appendChild(list);
        addMovementButtons(list);
    }

    function addMovementButtons(list) {
        const moveUpButton = document.createElement('button');
        moveUpButton.textContent = 'Move Up';
        moveUpButton.addEventListener('click', function() {
            moveItem(list, -1);
        })

        const moveDownButton = document.createElement('button');
        moveDownButton.textContent = 'Move Down';
        moveDownButton.addEventListener('click', function() {
            moveItem(list, 1);
        })

        const buttonsContainer = document.createElement('div');
        buttonsContainer.appendChild(moveUpButton);
        buttonsContainer.appendChild(moveDownButton);

        const questionsArea = document.querySelector('.question-area');
        questionsArea.appendChild(buttonsContainer);
    }

    function moveItem(list, direction) {
        const selected = list.querySelector('.selected');
        if (!selected) return;

        if(direction === -1 && selected.previousElementSibling) {
            list.insertBefore(selected, selected.previousElementSibling);
        } else if (direction === 1 && selected.nextElementSibling){
            list.insertBefore(selected.nextElementSibling, selected);
        };
    };

    function displayMatchingQuestion(question) {
        clearPreviousQuestionDisplay();
        const questionsArea = document.querySelector('.question-area');
        questionsArea.innerHTML = 'Match correctly';

        const matchingArea = document.createElement('div');
        matchingArea.className = 'matching';

        Object.keys(question.pairs).forEach((key, index) => {
            const label = document.createElement('label');
            label.textContent = key + ': ';
            label.htmlFor = 'match-' + index;
            matchingArea.appendChild(label);

            const select = document.createElement('select');
            select.id = 'match-' + index;

            Object.values(question.pairs).forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });

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

    let userAnswers = {};

    function storeAnswer(questionId, answer) {
        userAnswers[questionId] = answer;
        console.log("storing answers:", questionId, answer);
        localStorage.setItem('quizProgress', JSON.stringify({currentQuestionIndex, userAnswers}));
    };

    function loadQuizProgress() {
        const progress = JSON.parse(localStorage.getItem('quizProgress'));
        if (progress) {
            currentQuestionIndex = progress.currentQuestionIndex;
            userAnswers = progress.userAnswers;
            displayQuestion(currentQuestionIndex);
            updateProgressBar();
        } else {
            displayQuestion(0);
        }
    }

    document.addEventListener('DOMContentLoaded', loadQuizProgress);

    function validateAnswers() {
        // if (Object.keys(userAnswers).length < quizQuestions.length) {
        //     alert("answer all questions to submit")
        //     return;
        // }

        let correctCount = 0;
        quizQuestions.forEach(question => {
            const userAnswer = userAnswers[question.id];
            const correctAnswer = question.answer;
            console.log(`Question ID: ${question.id}, User Answer: ${userAnswer}, Correct Answer: ${correctAnswer}`)
            if (userAnswer === correctAnswer) {
                correctCount++
            }
        });
        const totalQuestions = quizQuestions.length;
        alert(`You got ${correctCount} out of ${totalQuestions} questions correct.`);
    };

    // Update the progress bar
    function updateProgressBar() {
        const progressBar = document.querySelector('.progress');
        const progressPercentage = (currentQuestionIndex + 1) / quizQuestions.length * 100;
        progressBar.style.width = `${progressPercentage}%`;

        console.log('progress percentage', progressPercentage); // debugging
    }

    fetchQuestions();
});