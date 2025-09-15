document.addEventListener('DOMContentLoaded', () => {
    // Element selections
    const pages = document.querySelectorAll('.page');
    const langBtns = document.querySelectorAll('.lang-btn');
    const inputBtns = document.querySelectorAll('.input-btn');
    const remedyBtns = document.querySelectorAll('.remedy-btn');
    const backBtns = document.querySelectorAll('.back-btn');
    const getSuggestionsBtn = document.getElementById('get-suggestions-btn');
    const symptomPrescriptionInput = document.getElementById('symptom-prescription-input');
    const suggestionBox = document.getElementById('suggestion-box');
    const pageTransition = document.getElementById('page-transition');
    const loadingScreen = document.getElementById('loading-screen');
    const factText = document.getElementById('fact-text');

    // State variables
    let currentLanguage = 'en';
    let currentInputType = '';
    let currentRemedyType = '';
    let currentInputText = '';
    let factInterval = null;

    // Random facts about medication availability in rural areas
    const medicationFacts = {
        en: [
            "Did you know? Rural areas often face medication shortages affecting 70% of the population.",
            "In remote villages, it can take up to 3 days to receive emergency medications.",
            "Traditional herbal remedies are used by 80% of rural communities worldwide.",
            "Mobile health clinics serve over 2 million people in rural areas annually.",
            "Many rural pharmacies stock only 40% of essential medications.",
            "Telemedicine has reduced rural healthcare access barriers by 60%.",
            "Local community health workers provide 70% of primary care in remote areas.",
            "Alternative medications can reduce treatment costs by up to 50% in rural settings.",
            "Seasonal roads make medication delivery challenging for 6 months yearly in some regions.",
            "Rural areas have 3 times higher rates of medication non-adherence due to accessibility issues."
        ],
        hi: [
            "क्या आप जानते हैं? ग्रामीण क्षेत्रों में दवाओं की कमी 70% आबादी को प्रभावित करती है।",
            "दूरदराज के गांवों में आपातकालीन दवाएं पहुंचने में 3 दिन तक लग सकते हैं।",
            "पारंपरिक जड़ी-बूटी का उपयोग दुनिया भर के 80% ग्रामीण समुदाय करते हैं।",
            "मोबाइल स्वास्थ्य क्लिनिक सालाना 20 लाख से अधिक ग्रामीण लोगों की सेवा करते हैं।",
            "कई ग्रामीण फार्मेसियों में केवल 40% आवश्यक दवाएं उपलब्ध होती हैं।",
            "टेलीमेडिसिन ने ग्रामीण स्वास्थ्य सेवा की बाधाओं को 60% तक कम किया है।",
            "स्थानीय सामुदायिक स्वास्थ्यकर्मी दूरदराज के क्षेत्रों में 70% प्राथमिक देखभाल प्रदान करते हैं।",
            "वैकल्पिक दवाएं ग्रामीण क्षेत्रों में उपचार लागत को 50% तक कम कर सकती हैं।",
            "मौसमी सड़कें कुछ क्षेत्रों में साल के 6 महीने दवा पहुंचाना चुनौतीपूर्ण बनाती हैं।",
            "पहुंच की समस्याओं के कारण ग्रामीण क्षेत्रों में दवा न लेने की दर 3 गुना अधिक है।"
        ],
        kn: [
            "ನಿಮಗೆ ಗೊತ್ತೇ? ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಔಷಧಿ ಕೊರತೆಯು 70% ಜನಸಂಖ್ಯೆಯನ್ನು ಪ್ರಭಾವಿಸುತ್ತದೆ.",
            "ದೂರದ ಹಳ್ಳಿಗಳಲ್ಲಿ ತುರ್ತು ಔಷಧಿಗಳು ತಲುಪಲು 3 ದಿನಗಳವರೆಗೆ ಬೇಕಾಗಬಹುದು.",
            "ಪಾರಂಪರಿಕ ಗಿಡಮೂಲಿಕೆ ಪರಿಹಾರಗಳನ್ನು ವಿಶ್ವದ 80% ಗ್ರಾಮೀಣ ಸಮುದಾಯಗಳು ಬಳಸುತ್ತವೆ.",
            "ಮೊಬೈಲ್ ಆರೋಗ್ಯ ಚಿಕಿತ್ಸಾಲಯಗಳು ವಾರ್ಷಿಕವಾಗಿ 20 ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ಗ್ರಾಮೀಣ ಜನರಿಗೆ ಸೇವೆ ಸಲ್ಲಿಸುತ್ತವೆ.",
            "ಅನೇಕ ಗ್ರಾಮೀಣ ಔಷಧಾಲಯಗಳಲ್ಲಿ ಕೇವಲ 40% ಅಗತ್ಯ ಔಷಧಿಗಳು ಮಾತ್ರ ಲಭ್ಯವಿದೆ.",
            "ಟೆಲಿಮೆಡಿಸಿನ್ ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಸೇವೆಯ ಅಡೆತಡೆಗಳನ್ನು 60% ರಷ್ಟು ಕಡಿಮೆ ಮಾಡಿದೆ.",
            "ಸ್ಥಳೀಯ ಸಮುದಾಯ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತರು ದೂರದ ಪ್ರದೇಶಗಳಲ್ಲಿ 70% ಪ್ರಾಥಮಿಕ ಆರೈಕೆಯನ್ನು ಒದಗಿಸುತ್ತಾರೆ.",
            "ಪರ್ಯಾಯ ಔಷಧಿಗಳು ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಚಿಕಿತ್ಸಾ ವೆಚ್ಚವನ್ನು 50% ವರೆಗೆ ಕಡಿಮೆ ಮಾಡಬಹುದು.",
            "ಕೆಲವು ಪ್ರದೇಶಗಳಲ್ಲಿ ಋತುಮಾನದ ರಸ್ತೆಗಳು ವರ್�ಕ್ಕೆ 6 ತಿಂಗಳು ಔಷಧಿ ವಿತರಣೆಯನ್ನು ಸವಾಲಿನಂತೆ ಮಾಡುತ್ತವೆ.",
            "ಪ್ರವೇಶದ ಸಮಸ್ಯೆಗಳ ಕಾರಣ ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಔಷಧಿ ಅನುಸರಣೆಯ ದರಗಳು 3 ಪಟ್ಟು ಹೆಚ್ಚು."
        ]
    };

    // All translation strings
    const translations = {
        en: {
            welcome: "Welcome to PrajaSeva",
            selectLanguage: "Please select your preferred language:",
            english: "English",
            hindi: "हिंदी",
            kannada: "ಕನ್ನಡ",
            tagline: "Rural Health Remedies",
            inputTypeTitle: "How would you like to provide information?",
            inputTypeInstruction: "Choose whether to enter symptoms or a doctor's prescription.",
            symptomsBtn: "Enter Symptoms",
            prescriptionBtn: "Enter Prescription",
            remedyTypeTitle: "Alternative Medication Suggestions",
            remedyTypeInstruction: "Please enter your details below to get alternative medication suggestions.",
            homeRemedyBtn: "Home Available Remedies",
            alternativeMedicationBtn: "Alternative Medication",
            symptomPlaceholder: "Enter your symptoms here (e.g., headache, fever, cough)...",
            prescriptionPlaceholder: "Enter the doctor's prescription here...",
            getSuggestionsBtn: "Get Suggestions",
            suggestionsTitle: "Your Suggestions",
            suggestionsInstruction: "Based on your input, here are some suggestions:",
            back: "Back",
            loading: "Loading suggestions, please wait...",
            loadingTitle: "Loading Your Suggestions..."
        },
        hi: {
            welcome: "प्रजासेवा में आपका स्वागत है",
            selectLanguage: "कृपया अपनी पसंदीदा भाषा चुनें:",
            english: "अंग्रेज़ी",
            hindi: "हिंदी",
            kannada: "कन्नड़",
            tagline: "ग्रामीण स्वास्थ्य उपचार",
            inputTypeTitle: "आप जानकारी कैसे प्रदान करना चाहेंगे?",
            inputTypeInstruction: "लक्षण दर्ज करने या डॉक्टर का नुस्खा दर्ज करने का विकल्प चुनें।",
            symptomsBtn: "लक्षण दर्ज करें",
            prescriptionBtn: "नुस्खा दर्ज करें",
            remedyTypeTitle: "वैकल्पिक दवा सुझाव",
            remedyTypeInstruction: "वैकल्पिक दवा सुझाव प्राप्त करने के लिए कृपया नीचे अपना विवरण दर्ज करें।",
            homeRemedyBtn: "घर पर उपलब्ध उपचार",
            alternativeMedicationBtn: "वैकल्पिक दवा",
            symptomPlaceholder: "अपने लक्षण यहां दर्ज करें (उदाहरण: सिरदर्द, बुखार, खांसी)...",
            prescriptionPlaceholder: "डॉक्टर का नुस्खा यहां दर्ज करें...",
            getSuggestionsBtn: "सुझाव प्राप्त करें",
            suggestionsTitle: "आपके सुझाव",
            suggestionsInstruction: "आपके इनपुट के आधार पर, यहां कुछ सुझाव दिए गए हैं:",
            back: "पीछे",
            loading: "सुझाव लोड हो रहे हैं, कृपया प्रतीक्षा करें...",
            loadingTitle: "आपके सुझाव लोड हो रहे हैं..."
        },
        kn: {
            welcome: "ಪ್ರಜಾಸೇವಾಗೆ ಸುಸ್ವಾಗತ",
            selectLanguage: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
            english: "ಇಂಗ್ಲಿಷ್",
            hindi: "ಹಿಂದಿ",
            kannada: "ಕನ್ನಡ",
            tagline: "ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಪರಿಹಾರಗಳು",
            inputTypeTitle: "ನೀವು ಮಾಹಿತಿಯನ್ನು ಹೇಗೆ ಒದಗಿಸಲು ಬಯಸುತ್ತೀರಿ?",
            inputTypeInstruction: "ರೋಗಲಕ್ಷಣಗಳನ್ನು ಅಥವಾ ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅನ್ನು ನಮೂದಿಸಲು ಆಯ್ಕೆಮಾಡಿ.",
            symptomsBtn: "ರೋಗಲಕ್ಷಣಗಳನ್ನು ನಮೂದಿಸಿ",
            prescriptionBtn: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ನಮೂದಿಸಿ",
            remedyTypeTitle: "ಪರ್ಯಾಯ ಔಷಧಿ ಸಲಹೆಗಳು",
            remedyTypeInstruction: "ಪರ್ಯಾಯ ಔಷಧಿ ಸಲಹೆಗಳನ್ನು ಪಡೆಯಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಕೆಳಗೆ ನಮೂದಿಸಿ.",
            homeRemedyBtn: "ಮನೆಯಲ್ಲಿ ಲಭ್ಯವಿರುವ ಪರಿಹಾರಗಳು",
            alternativeMedicationBtn: "ಪರ್ಯಾಯ ಔಷಧಿ",
            symptomPlaceholder: "ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ (ಉದಾ: ತಲೆನೋವು, ಜ್ವರ, ಕೆಮ್ಮು)...",
            prescriptionPlaceholder: "ವೈದ್ಯರ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅನ್ನು ಇಲ್ಲಿ ನಮೂದಿಸಿ...",
            getSuggestionsBtn: "ಸಲಹೆಗಳನ್ನು ಪಡೆಯಿರಿ",
            suggestionsTitle: "ನಿಮ್ಮ ಸಲಹೆಗಳು",
            suggestionsInstruction: "ನಿಮ್ಮ ಇನ್‌ಪುಟ್ ಆಧಾರದ ಮೇಲೆ, ಇಲ್ಲಿ ಕೆಲವು ಸಲಹೆಗಳಿವೆ:",
            back: "ಹಿಂದೆ",
            loading: "ಸಲಹೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ, ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ...",
            loadingTitle: "ನಿಮ್ಮ ಸಲಹೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..."
        }
    };

    function showPageTransition(callback, duration = 800) {
        pageTransition.classList.add('active');
        setTimeout(() => {
            if (callback) callback();
            setTimeout(() => {
                pageTransition.classList.remove('active');
            }, 300);
        }, duration);
    }

    function showLoadingScreen() {
        loadingScreen.classList.add('active');
        startFactRotation();
    }

    function hideLoadingScreen() {
        loadingScreen.classList.remove('active');
        stopFactRotation();
    }

    function startFactRotation() {
        const facts = medicationFacts[currentLanguage];
        let currentFactIndex = 0;
        
        // Show first fact immediately
        factText.textContent = facts[currentFactIndex];
        factText.style.opacity = '1';
        
        // Rotate facts every 5 seconds with smooth transitions
        factInterval = setInterval(() => {
            // Fade out current fact
            factText.style.opacity = '0';
            
            setTimeout(() => {
                // Change fact and fade in
                currentFactIndex = (currentFactIndex + 1) % facts.length;
                factText.textContent = facts[currentFactIndex];
                factText.style.opacity = '1';
            }, 300); // Wait for fade out to complete
        }, 5000); // Changed to 5 seconds for better readability
    }

    function stopFactRotation() {
        if (factInterval) {
            clearInterval(factInterval);
            factInterval = null;
        }
    }

    function updateContent() {
        const lang = translations[currentLanguage];
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.dataset.key;
            if (lang[key]) {
                element.textContent = lang[key];
            }
        });
        if (currentInputType === 'symptoms') {
            symptomPrescriptionInput.placeholder = lang.symptomPlaceholder;
        } else if (currentInputType === 'prescription') {
            symptomPrescriptionInput.placeholder = lang.prescriptionPlaceholder;
        }
        
        // Update facts if loading screen is active
        if (loadingScreen.classList.contains('active')) {
            stopFactRotation();
            startFactRotation();
        }
    }

    function showPage(id) {
        showPageTransition(() => {
            pages.forEach(page => page.classList.remove('active'));
            const newPage = document.getElementById(id);
            if (newPage) newPage.classList.add('active');
            if (id === 'remedy-type-page') {
                symptomPrescriptionInput.value = currentInputText;
                updateContent();
                // Reset remedy type and ensure button starts green (unselected)
                const alternativeMedicationBtn = document.querySelector('[data-remedy-type="alternative-medication"]');
                if (alternativeMedicationBtn) {
                    console.log('Remedy page loaded - button should be green (unselected)');
                    currentRemedyType = '';
                    remedyBtns.forEach(btn => btn.classList.remove('selected'));
                    console.log('Button classes after reset:', alternativeMedicationBtn.className);
                }
            }
        });
    }

    langBtns.forEach(button => {
        button.addEventListener('click', () => {
            currentLanguage = button.dataset.lang;
            updateContent();
            showPage('input-type-page');
        });
    });

    inputBtns.forEach(button => {
        button.addEventListener('click', () => {
            currentInputType = button.dataset.inputType;
            currentInputText = '';
            symptomPrescriptionInput.value = '';
            updateContent();
            showPage('remedy-type-page');
        });
    });

    remedyBtns.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Button clicked:', button.dataset.remedyType);
            currentRemedyType = button.dataset.remedyType;
            remedyBtns.forEach(btn => {
                btn.classList.remove('selected');
                console.log('Removed selected from:', btn);
            });
            button.classList.add('selected');
            console.log('Added selected to:', button);
            console.log('Button classes:', button.className);
        });
    });
    
    getSuggestionsBtn.addEventListener('click', async () => {
        currentInputText = symptomPrescriptionInput.value.trim();
        if (!currentInputText || !currentRemedyType) {
            const alertMessages = {
                en: "Please enter your details and select the remedy type.",
                hi: "कृपया अपना विवरण दर्ज करें और उपचार का प्रकार चुनें।",
                kn: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಪರಿಹಾರದ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ."
            };
            alert(alertMessages[currentLanguage]);
            return;
        }

        // Show loading screen immediately
        showLoadingScreen();

        try {
            const response = await fetch('http://127.0.0.1:8000/get_suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputText: currentInputText,
                    remedyType: currentRemedyType
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            
            // Hide loading screen and show suggestions page with data
            hideLoadingScreen();
            suggestionBox.value = data.suggestion.trim();
            showPage('suggestions-page');

        } catch (error) {
            console.error('Error fetching suggestions:', error);
            hideLoadingScreen();
            suggestionBox.value = "Sorry, an error occurred while fetching suggestions. Please check the console for details and ensure the backend server is running.";
            showPage('suggestions-page');
        }
    });

    backBtns.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageId = button.dataset.target;
            showPage(targetPageId);
            if (targetPageId === 'input-type-page' || targetPageId === 'language-page') {
                currentRemedyType = '';
                remedyBtns.forEach(btn => btn.classList.remove('selected'));
                console.log('Reset remedy selection - button should be green');
            }
            if (targetPageId === 'remedy-type-page') {
                currentRemedyType = '';
                remedyBtns.forEach(btn => btn.classList.remove('selected'));
                console.log('Back to remedy page - button should be green');
            }
        });
    });

    updateContent();
});
