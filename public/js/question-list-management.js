// Question List Management JavaScript

// Global variables
let currentTestId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get test ID from URL or data attribute
  const urlParts = window.location.pathname.split('/');
  const testIdIndex = urlParts.indexOf('hsk') + 1;
  if (testIdIndex < urlParts.length) {
    currentTestId = urlParts[testIdIndex];
  }
  
  initializeQuestionList();
});

function initializeQuestionList() {
  // Add event listeners for question cards
  const questionCards = document.querySelectorAll('.question-card');
  questionCards.forEach(card => {
    // Add hover effects
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-1px)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
    
    // Add click to expand/collapse content
    const content = card.querySelector('.question-content');
    const header = card.querySelector('.question-header');
    
    if (content && header) {
      header.addEventListener('click', function(e) {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.question-actions')) {
          return;
        }
        
        card.classList.toggle('expanded');
      });
    }
  });
}

// Enhanced question management functions
function previewQuestion(questionId) {
  if (!currentTestId) {
    console.error('Test ID not found');
    return;
  }
  
  // Show loading state
  $('#previewModal .modal-body').html('<div class="text-center"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Đang tải câu hỏi...</p></div>');
  $('#previewModal').modal('show');
  
  // Fetch question data
  fetch(`/admin/hsk/${currentTestId}/questions/${questionId}/preview`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        renderQuestionPreview(data.question);
      } else {
        $('#previewModal .modal-body').html('<div class="alert alert-danger">Không thể tải câu hỏi: ' + data.message + '</div>');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      $('#previewModal .modal-body').html('<div class="alert alert-danger">Lỗi khi tải câu hỏi</div>');
    });
}

function openEditModal(questionId) {
  if (!currentTestId) {
    console.error('Test ID not found');
    return;
  }
  
  // Chuyển đến trang edit với form đầy đủ
  const editUrl = `/admin/hsk/${currentTestId}/questions/${questionId}/edit`;
  window.location.href = editUrl;
}

// Các function này không cần thiết nữa vì chuyển sang trang edit riêng biệt

function editQuestion(questionId) {
  openEditModal(questionId);
}

function deleteQuestion(questionId) {
  if (!currentTestId) {
    console.error('Test ID not found');
    return;
  }
  
  if (confirm('Bạn có chắc muốn xóa câu hỏi này? Hành động này không thể hoàn tác.')) {
    // Show loading state
    const card = document.querySelector(`[data-question-id="${questionId}"]`);
    if (card) {
      card.classList.add('loading');
    }
    
    // Submit form delete
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/admin/hsk/${currentTestId}/questions/${questionId}/delete`;
    document.body.appendChild(form);
    form.submit();
  }
}

// Question filtering and search
function filterQuestions(type = 'all', skill = 'all') {
  const questionCards = document.querySelectorAll('.question-card');
  
  questionCards.forEach(card => {
    let show = true;
    
    // Filter by type
    if (type !== 'all') {
      const questionType = card.querySelector('.question-type-badge').classList.contains(`question-type-${type}`);
      if (!questionType) show = false;
    }
    
    // Filter by skill
    if (skill !== 'all' && show) {
      const skillType = card.querySelector('.question-skill-badge').classList.contains(`skill-${skill}`);
      if (!skillType) show = false;
    }
    
    // Show/hide card
    card.style.display = show ? 'block' : 'none';
  });
  
  // Update counter
  updateQuestionCounter();
}

function searchQuestions(query) {
  const questionCards = document.querySelectorAll('.question-card');
  const searchTerm = query.toLowerCase();
  
  questionCards.forEach(card => {
    const questionText = card.querySelector('.text-content')?.textContent.toLowerCase() || '';
    const questionNumber = card.querySelector('.question-number')?.textContent.toLowerCase() || '';
    
    const matches = questionText.includes(searchTerm) || questionNumber.includes(searchTerm);
    card.style.display = matches ? 'block' : 'none';
  });
  
  updateQuestionCounter();
}

function updateQuestionCounter() {
  const visibleCards = document.querySelectorAll('.question-card[style*="block"], .question-card:not([style*="none"])');
  const counter = document.getElementById('question-counter');
  
  if (counter) {
    counter.textContent = `${visibleCards.length} câu hỏi`;
  }
}

// Question reordering
function enableReordering() {
  const questionsList = document.querySelector('.questions-list');
  if (!questionsList) return;
  
  // Add drag handles
  const questionCards = document.querySelectorAll('.question-card');
  questionCards.forEach(card => {
    const header = card.querySelector('.question-header');
    if (header) {
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
      dragHandle.style.cursor = 'grab';
      header.appendChild(dragHandle);
    }
  });
  
  // Initialize sortable (if using Sortable.js or similar)
  if (typeof Sortable !== 'undefined') {
    new Sortable(questionsList, {
      animation: 150,
      handle: '.drag-handle',
      onEnd: function(evt) {
        // Save new order
        saveQuestionOrder();
      }
    });
  }
}

function saveQuestionOrder() {
  const questionCards = document.querySelectorAll('.question-card');
  const orders = Array.from(questionCards).map((card, index) => ({
    question_id: card.dataset.questionId,
    order_in_test: index + 1
  }));
  
  // Send to server
  fetch(`/admin/hsk/${currentTestId}/questions/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orders })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Sắp xếp câu hỏi thành công!', 'success');
    } else {
      showNotification('Có lỗi khi sắp xếp câu hỏi!', 'error');
    }
  })
  .catch(error => {
    console.error('Error saving order:', error);
    showNotification('Có lỗi khi sắp xếp câu hỏi!', 'error');
  });
}

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Export functions for global access
window.previewQuestion = previewQuestion;
window.openEditModal = openEditModal;
window.editQuestion = editQuestion;
window.deleteQuestion = deleteQuestion;
window.filterQuestions = filterQuestions;
window.searchQuestions = searchQuestions;
window.enableReordering = enableReordering;

// Legacy function for backward compatibility
function openEdit(id, closeOnly) {
  console.log('openEdit is deprecated, use editQuestion instead');
  editQuestion(id);
}

// Preview rendering functions
function renderQuestionPreview(question) {
  let content = `
    <div class="question-preview-container">
      <div class="question-header-preview">
        <div class="question-type-indicator">
          <span class="badge badge-primary">${getQuestionTypeName(question.question_type)}</span>
          <span class="badge badge-info">${getSkillTypeName(question.skill_type)}</span>
          <span class="badge badge-warning">${question.points || 1} điểm</span>
        </div>
      </div>
      
      <div class="question-content-preview">
        <div class="question-text-preview">
          ${question.question_text || 'Không có nội dung câu hỏi'}
        </div>
        
        ${renderQuestionTypeContent(question)}
      </div>
    </div>
  `;
  
  $('#previewModal .modal-body').html(content);
}

// Get question type name
function getQuestionTypeName(type) {
  const types = {
    'multiple_choice': 'Trắc nghiệm',
    'fill_blank': 'Điền từ',
    'matching': 'Ghép nối',
    'true_false': 'Đúng/Sai',
    'ordering': 'Sắp xếp',
    'rewrite': 'Viết lại'
  };
  return types[type] || type;
}

// Get skill type name
function getSkillTypeName(skill) {
  const skills = {
    'listening': 'Nghe hiểu',
    'reading': 'Đọc hiểu',
    'writing': 'Viết'
  };
  return skills[skill] || skill;
}

// Render question type specific content
function renderQuestionTypeContent(question) {
  switch (question.question_type) {
    case 'multiple_choice':
      return renderMultipleChoicePreview(question);
    case 'fill_blank':
      return renderFillBlankPreview(question);
    case 'matching':
      return renderMatchingPreview(question);
    case 'true_false':
      return renderTrueFalsePreview(question);
    case 'ordering':
      return renderOrderingPreview(question);
    case 'rewrite':
      return renderRewritePreview(question);
    default:
      return '<div class="alert alert-warning">Loại câu hỏi không được hỗ trợ</div>';
  }
}

// Render Multiple Choice Preview
function renderMultipleChoicePreview(question) {
  let options = question.options || [];
  let correctAnswer = question.correct_answer || '';
  
  // Handle nested options (for multiple sub-questions)
  if (options.length > 0 && Array.isArray(options[0])) {
    let content = '<div class="multiple-choice-nested">';
    options.forEach((subOptions, index) => {
      content += `
        <div class="sub-question">
          <h6>Câu ${index + 1}:</h6>
          <div class="options-list">
            ${subOptions.map((option, optIndex) => {
              const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D
              const isCorrect = correctAnswer.split(',')[index] === optionLabel;
              return `
                <div class="option-item ${isCorrect ? 'correct' : ''}">
                  <div class="option-label">${optionLabel}</div>
                  <div class="option-text">${option}</div>
                  ${isCorrect ? '<i class="fas fa-check text-success"></i>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });
    content += '</div>';
    return content;
  } else {
    // Single question with options
    return `
      <div class="options-list">
        ${options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
          const isCorrect = correctAnswer === optionLabel;
          return `
            <div class="option-item ${isCorrect ? 'correct' : ''}">
              <div class="option-label">${optionLabel}</div>
              <div class="option-text">${option}</div>
              ${isCorrect ? '<i class="fas fa-check text-success"></i>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
}

// Render Fill Blank Preview
function renderFillBlankPreview(question) {
  let options = question.options || [];
  let correctAnswer = question.correct_answer || '';
  let correctAnswers = correctAnswer.split(',');
  
  let content = '<div class="fill-blank-preview">';
  if (options.length > 0 && Array.isArray(options[0])) {
    // Multiple blanks
    options.forEach((blankOptions, index) => {
      content += `
        <div class="blank-item">
          <span class="blank-number">(${index + 1})</span>
          <div class="blank-options">
            ${blankOptions.map((option, optIndex) => {
              const optionLabel = String.fromCharCode(65 + optIndex);
              const isCorrect = correctAnswers[index] === optionLabel;
              return `
                <span class="blank-option ${isCorrect ? 'correct' : ''}">
                  ${optionLabel}. ${option}
                  ${isCorrect ? ' <i class="fas fa-check text-success"></i>' : ''}
                </span>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });
  } else {
    // Single blank
    content += `
      <div class="blank-item">
        <div class="blank-options">
          ${options.map((option, index) => {
            const optionLabel = String.fromCharCode(65 + index);
            const isCorrect = correctAnswer === optionLabel;
            return `
              <span class="blank-option ${isCorrect ? 'correct' : ''}">
                ${optionLabel}. ${option}
                ${isCorrect ? ' <i class="fas fa-check text-success"></i>' : ''}
              </span>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  content += '</div>';
  return content;
}

// Render Matching Preview
function renderMatchingPreview(question) {
  let pairs = question.matching_pairs || [];
  let correctAnswer = question.correct_answer || '';
  
  let content = '<div class="matching-preview">';
  content += '<div class="matching-grid">';
  content += '<div class="matching-column left-column">';
  content += '<h6>Cột A</h6>';
  
  pairs.forEach((pair, index) => {
    const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
    content += `
      <div class="matching-item left-item">
        <div class="item-label">${optionLabel}</div>
        <div class="item-content">${pair.left}</div>
      </div>
    `;
  });
  
  content += '</div>';
  content += '<div class="matching-column right-column">';
  content += '<h6>Cột B</h6>';
  
  pairs.forEach((pair, index) => {
    const numberLabel = index + 1;
    content += `
      <div class="matching-item right-item">
        <div class="item-label">${numberLabel}</div>
        <div class="item-content">${pair.right}</div>
      </div>
    `;
  });
  
  content += '</div>';
  content += '</div>';
  
  // Show correct answers
  if (correctAnswer) {
    content += '<div class="correct-answers">';
    content += '<h6>Đáp án đúng:</h6>';
    content += '<div class="answer-pairs">';
    correctAnswer.split(',').forEach(pair => {
      const [left, right] = pair.split('-');
      content += `<span class="answer-pair">${left} - ${right}</span>`;
    });
    content += '</div>';
    content += '</div>';
  }
  
  content += '</div>';
  return content;
}

// Render True/False Preview
function renderTrueFalsePreview(question) {
  let correctAnswer = question.correct_answer || '';
  
  return `
    <div class="true-false-preview">
      <div class="options-list">
        <div class="option-item ${correctAnswer === 'true' ? 'correct' : ''}">
          <div class="option-label">A</div>
          <div class="option-text">Đúng</div>
          ${correctAnswer === 'true' ? '<i class="fas fa-check text-success"></i>' : ''}
        </div>
        <div class="option-item ${correctAnswer === 'false' ? 'correct' : ''}">
          <div class="option-label">B</div>
          <div class="option-text">Sai</div>
          ${correctAnswer === 'false' ? '<i class="fas fa-check text-success"></i>' : ''}
        </div>
      </div>
    </div>
  `;
}

// Render Ordering Preview
function renderOrderingPreview(question) {
  let items = question.ordering_items || [];
  let correctAnswer = question.correct_answer || '';
  let correctOrder = correctAnswer.split(',');
  
  let content = '<div class="ordering-preview">';
  content += '<div class="ordering-items">';
  
  // Show correct order
  correctOrder.forEach((itemIndex, orderIndex) => {
    const item = items[parseInt(itemIndex) - 1];
    if (item) {
      content += `
        <div class="ordering-item">
          <div class="item-number">${orderIndex + 1}</div>
          <div class="item-content">${item}</div>
        </div>
      `;
    }
  });
  
  content += '</div>';
  content += '</div>';
  return content;
}

// Render Rewrite Preview
function renderRewritePreview(question) {
  let instruction = question.rewrite_instruction || '';
  let correctAnswer = question.correct_answer || '';
  
  return `
    <div class="rewrite-preview">
      ${instruction ? `
        <div class="instruction-box">
          <h6>Hướng dẫn:</h6>
          <p>${instruction}</p>
        </div>
      ` : ''}
      <div class="answer-box">
        <h6>Đáp án mẫu:</h6>
        <p>${correctAnswer}</p>
      </div>
    </div>
  `;
}
