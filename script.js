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
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion(currentQuestionIndex);
            updateProgressBar();
            console.log('prev btn click, currentQuestionIndex:' , currentQuestionIndex);
        }
    });

    nextButton.addEventListener('click', function() {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
            updateProgressBar();
            console.log('next btn click, currentQuestionIndex:', currentQuestionIndex);
        }
    });

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
        questionsArea.innerHTML = '';

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
        const questionTypes = document.querySelectorAll('.question');
        questionTypes.forEach(type => {
            type.style.display = 'none';
        })
    }

    // Update the progress bar
    function updateProgressBar() {
        const progressBar = document.querySelector('.progress');
        const progressPercentage = (currentQuestionIndex + 1) / quizQuestions.length * 100;
        progressBar.style.width = `${progressPercentage}%`;

        console.log('progress percentage', progressPercentage); // debugging
    }

    fetchQuestions();
});