// Enhanced Preview JavaScript for HSK Test

document.addEventListener('DOMContentLoaded', function() {
    // Initialize enhanced preview features
    initializePreviewEnhancements();
    
    // Add smooth scrolling for better UX
    addSmoothScrolling();
    
    // Add keyboard navigation
    addKeyboardNavigation();
    
    // Add tooltip functionality
    addTooltips();
    
    // Add animation triggers
    addAnimationTriggers();
});

function initializePreviewEnhancements() {
    console.log('🚀 Initializing Enhanced Preview Features...');
    
    // Add loading animation to all question containers
    const questionContainers = document.querySelectorAll('.preview-container');
    questionContainers.forEach((container, index) => {
        container.style.animationDelay = `${index * 0.1}s`;
        container.classList.add('enhanced-loading');
        
        // Remove loading class after animation
        setTimeout(() => {
            container.classList.remove('enhanced-loading');
        }, 1000 + (index * 100));
    });
    
    // Add hover effects to all interactive elements
    addHoverEffects();
    
    // Initialize question type indicators
    initializeQuestionTypeIndicators();
    
    // Add answer reveal animations
    addAnswerRevealAnimations();
}

function addHoverEffects() {
    // Enhanced option items
    const optionItems = document.querySelectorAll('.enhanced-option-item');
    optionItems.forEach(item => {
        item.classList.add('enhanced-hover-effect');
    });
    
    // Enhanced matching items
    const matchingItems = document.querySelectorAll('.enhanced-matching-item');
    matchingItems.forEach(item => {
        item.classList.add('enhanced-hover-effect');
    });
    
    // Enhanced ordering items
    const orderingItems = document.querySelectorAll('.enhanced-ordering-item');
    orderingItems.forEach(item => {
        item.classList.add('enhanced-hover-effect');
    });
    
    // Enhanced true/false options
    const trueFalseOptions = document.querySelectorAll('.enhanced-true-false-option');
    trueFalseOptions.forEach(option => {
        option.classList.add('enhanced-hover-effect');
    });
}

function initializeQuestionTypeIndicators() {
    const questionTypes = document.querySelectorAll('.question-type');
    questionTypes.forEach(type => {
        const typeText = type.textContent.trim();
        const icon = type.querySelector('i');
        
        // Add enhanced styling based on question type
        switch(typeText.toLowerCase()) {
            case 'multiple choice':
                type.style.background = 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)';
                type.style.color = 'white';
                break;
            case 'fill in the blank':
                type.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                type.style.color = 'white';
                break;
            case 'matching':
                type.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
                type.style.color = '#212529';
                break;
            case 'true/false':
                type.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                type.style.color = 'white';
                break;
            case 'ordering':
                type.style.background = 'linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%)';
                type.style.color = 'white';
                break;
            case 'rewrite':
                type.style.background = 'linear-gradient(135deg, #fd7e14 0%, #e55a00 100%)';
                type.style.color = 'white';
                break;
        }
    });
}

function addAnswerRevealAnimations() {
    const answerSections = document.querySelectorAll('.enhanced-answer-section');
    answerSections.forEach((section, index) => {
        // Add staggered animation delay
        section.style.animationDelay = `${index * 0.2}s`;
        
        // Add click to expand/collapse functionality
        const answerLabel = section.querySelector('.enhanced-answer-label');
        if (answerLabel) {
            answerLabel.style.cursor = 'pointer';
            answerLabel.addEventListener('click', function() {
                const answerValue = section.querySelector('.enhanced-answer-value');
                const explanation = section.querySelector('.enhanced-explanation');
                
                if (answerValue) {
                    answerValue.style.display = answerValue.style.display === 'none' ? 'block' : 'none';
                }
                
                if (explanation) {
                    explanation.style.display = explanation.style.display === 'none' ? 'block' : 'none';
                }
                
                // Toggle icon
                const icon = this.querySelector('i') || document.createElement('i');
                icon.className = answerValue.style.display === 'none' ? 'fas fa-eye' : 'fas fa-eye-slash';
                if (!this.querySelector('i')) {
                    this.appendChild(icon);
                }
            });
        }
    });
}

function addSmoothScrolling() {
    // Add smooth scrolling to all internal links
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function addKeyboardNavigation() {
    // Add keyboard navigation for accessibility
    document.addEventListener('keydown', function(e) {
        const questionContainers = document.querySelectorAll('.preview-container');
        const currentIndex = Array.from(questionContainers).findIndex(container => {
            const rect = container.getBoundingClientRect();
            return rect.top >= 0 && rect.top <= window.innerHeight / 2;
        });
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < questionContainers.length - 1) {
                    questionContainers[currentIndex + 1].scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    questionContainers[currentIndex - 1].scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                break;
            case 'Home':
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'End':
                e.preventDefault();
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                break;
        }
    });
}

function addTooltips() {
    // Add tooltips for truncated text
    const truncatedTexts = document.querySelectorAll('.question-text-truncated');
    truncatedTexts.forEach(text => {
        if (text.title) {
            // Create custom tooltip
            text.addEventListener('mouseenter', function(e) {
                const tooltip = document.createElement('div');
                tooltip.className = 'enhanced-tooltip';
                tooltip.textContent = this.title;
                tooltip.style.cssText = `
                    position: absolute;
                    background: rgba(0,0,0,0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    z-index: 1000;
                    max-width: 300px;
                    word-wrap: break-word;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                
                document.body.appendChild(tooltip);
                
                // Position tooltip
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.bottom + 5) + 'px';
                
                // Show tooltip
                setTimeout(() => {
                    tooltip.style.opacity = '1';
                }, 100);
                
                this._tooltip = tooltip;
            });
            
            text.addEventListener('mouseleave', function() {
                if (this._tooltip) {
                    this._tooltip.remove();
                    this._tooltip = null;
                }
            });
        }
    });
}

function addAnimationTriggers() {
    // Add intersection observer for scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Add specific animations for different elements
                const correctAnswers = entry.target.querySelectorAll('.correct, .enhanced-option-item.correct');
                correctAnswers.forEach((answer, index) => {
                    answer.style.animationDelay = `${index * 0.1}s`;
                });
            }
        });
    }, observerOptions);
    
    // Observe all question containers
    const questionContainers = document.querySelectorAll('.preview-container');
    questionContainers.forEach(container => {
        observer.observe(container);
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add window resize handler
window.addEventListener('resize', debounce(function() {
    // Recalculate tooltip positions if needed
    const tooltips = document.querySelectorAll('.enhanced-tooltip');
    tooltips.forEach(tooltip => {
        tooltip.remove();
    });
}, 250));

// Add print functionality
function printPreview() {
    window.print();
}

// Add fullscreen functionality
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Export functions to global scope
window.previewEnhancements = {
    printPreview,
    toggleFullscreen,
    initializePreviewEnhancements
};
