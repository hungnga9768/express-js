// Question Form Enhancements JavaScript

// Matching Functions
let matchingPairCount = 0;

function addMatchingPair() {
  matchingPairCount++;
  
  // Thêm vào cột A (Từ tiếng Trung)
  const leftColumn = document.getElementById('matching-left-column');
  const leftPair = document.createElement('div');
  leftPair.className = 'matching-pair-item mb-2';
  leftPair.id = `matching-left-${matchingPairCount}`;
  
  const leftLabel = getLetterLabel(matchingPairCount);
  leftPair.innerHTML = `
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text bg-primary text-white matching-label">${leftLabel}</span>
      </div>
      <input type="text" class="form-control" name="matching_left_${matchingPairCount}" placeholder="Nhập từ tiếng Trung...">
      <div class="input-group-append">
        <button type="button" class="btn btn-outline-danger" onclick="removeMatchingPair(${matchingPairCount})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  leftColumn.appendChild(leftPair);
  
  // Thêm vào cột B (Nghĩa tiếng Việt)
  const rightColumn = document.getElementById('matching-right-column');
  const rightPair = document.createElement('div');
  rightPair.className = 'matching-pair-item mb-2';
  rightPair.id = `matching-right-${matchingPairCount}`;
  
  rightPair.innerHTML = `
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text bg-success text-white matching-label">${matchingPairCount}</span>
      </div>
      <input type="text" class="form-control" name="matching_right_${matchingPairCount}" placeholder="Nhập nghĩa tiếng Việt...">
    </div>
  `;
  rightColumn.appendChild(rightPair);
  
  // Cập nhật dropdown đáp án
  updateMatchingAnswers();
  updateMatchingPairCount();
}

function removeMatchingPair(pairIndex) {
  // Xóa cặp khỏi cột A
  const leftPair = document.getElementById(`matching-left-${pairIndex}`);
  if (leftPair) leftPair.remove();
  
  // Xóa cặp khỏi cột B
  const rightPair = document.getElementById(`matching-right-${pairIndex}`);
  if (rightPair) rightPair.remove();
  
  // Cập nhật lại số thứ tự
  updateMatchingOrder();
  updateMatchingAnswers();
  updateMatchingPairCount();
}

function clearMatchingPairs() {
  // Dùng cho khởi tạo form edit: xóa không cần confirm
  document.getElementById('matching-left-column').innerHTML = '';
  document.getElementById('matching-right-column').innerHTML = '';
  document.getElementById('matching-answers-container').innerHTML = '';
  document.getElementById('matching-answers-section').style.display = 'none';
  matchingPairCount = 0;
  updateMatchingPairCount();
}

function updateMatchingOrder() {
  const leftPairs = document.querySelectorAll('#matching-left-column .matching-pair-item');
  const rightPairs = document.querySelectorAll('#matching-right-column .matching-pair-item');
  
  leftPairs.forEach((pair, index) => {
    const newIndex = index + 1;
    const label = getLetterLabel(newIndex);
    const labelSpan = pair.querySelector('.matching-label');
    const input = pair.querySelector('input');
    const removeBtn = pair.querySelector('button');
    
    if (labelSpan) labelSpan.textContent = label;
    if (input) input.name = `matching_left_${newIndex}`;
    if (removeBtn) removeBtn.onclick = () => removeMatchingPair(newIndex);
    
    pair.id = `matching-left-${newIndex}`;
  });
  
  rightPairs.forEach((pair, index) => {
    const newIndex = index + 1;
    const labelSpan = pair.querySelector('.matching-label');
    const input = pair.querySelector('input');
    
    if (labelSpan) labelSpan.textContent = newIndex;
    if (input) input.name = `matching_right_${newIndex}`;
    
    pair.id = `matching-right-${newIndex}`;
  });
  
  matchingPairCount = leftPairs.length;
}

function updateMatchingAnswers() {
  const answersContainer = document.getElementById('matching-answers-container');
  const answersSection = document.getElementById('matching-answers-section');
  
  if (matchingPairCount === 0) {
    answersSection.style.display = 'none';
    return;
  }
  
  answersSection.style.display = 'block';
  answersContainer.innerHTML = '';
  
  // Tạo dropdown cho từng cặp
  for (let i = 1; i <= matchingPairCount; i++) {
    const letter = getLetterLabel(i);
    const answerDiv = document.createElement('div');
    answerDiv.className = 'col-md-3 mb-2';
    answerDiv.innerHTML = `
      <div class="form-group">
        <label>${letter} ghép với:</label>
        <select class="form-control matching-answer-select" name="matching_answer_${i}">
          <option value="">-- Chọn --</option>
          ${generateAnswerOptions(matchingPairCount)}
        </select>
      </div>
    `;
    answersContainer.appendChild(answerDiv);
  }
  
  // Ẩn phần đáp án đúng chung khi có phần cấu hình đáp án riêng
  const answerTextGroup = document.getElementById('answer-text-group');
  if (answerTextGroup) {
    answerTextGroup.style.display = 'none';
  }
}

function generateAnswerOptions(count) {
  let options = '';
  for (let i = 1; i <= count; i++) {
    options += `<option value="${i}">${i}</option>`;
  }
  return options;
}

function getLetterLabel(index) {
  // Chuyển số thành chữ cái: 1->A, 2->B, 3->C, 4->D, 5->E, 6->F, ...
  return String.fromCharCode(64 + index);
}

function updateMatchingPairCount() {
  const countElement = document.getElementById('matching-pair-count');
  if (countElement) {
    countElement.textContent = `${matchingPairCount} cặp`;
  }
}

// Ordering Functions
let orderingItemCount = 4;

function addOrderingItem() {
  orderingItemCount++;
  const container = document.getElementById('ordering-items-container');
  const newItem = document.createElement('div');
  newItem.className = 'ordering-item mb-2';
  newItem.innerHTML = `
    <div class="input-group">
      <div class="input-group-prepend">
        <span class="input-group-text bg-warning text-dark ordering-number">${orderingItemCount}</span>
        <span class="input-group-text bg-light">
          <i class="fas fa-grip-vertical text-muted"></i>
        </span>
      </div>
      <input type="text" class="form-control" name="ordering_item_${orderingItemCount}" placeholder="Nhập từ/cụm từ cần sắp xếp...">
      <div class="input-group-append">
        <button type="button" class="btn btn-outline-danger" onclick="removeOrderingItem(this)">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  container.appendChild(newItem);
  updateOrderingNumbers();
}

function removeOrderingItem(btn) {
  const item = btn.closest('.ordering-item');
  if (item) {
    item.remove();
    updateOrderingNumbers();
  }
}

function updateOrderingNumbers() {
  const items = document.querySelectorAll('.ordering-item');
  items.forEach((item, index) => {
    const numberSpan = item.querySelector('.ordering-number');
    const input = item.querySelector('input');
    if (numberSpan) {
      numberSpan.textContent = index + 1;
    }
    if (input) {
      input.name = `ordering_item_${index + 1}`;
    }
  });
  orderingItemCount = items.length;
}

// Form Validation
function validateMatchingForm() {
  const leftInputs = [];
  const rightInputs = [];
  const answers = [];
  
  // Lấy tất cả input từ cột A
  const leftInputElements = document.querySelectorAll('#matching-left-column input');
  leftInputElements.forEach(input => {
    leftInputs.push(input.value.trim());
  });
  
  // Lấy tất cả input từ cột B
  const rightInputElements = document.querySelectorAll('#matching-right-column input');
  rightInputElements.forEach(input => {
    rightInputs.push(input.value.trim());
  });
  
  // Lấy tất cả đáp án
  const answerElements = document.querySelectorAll('#matching-answers-container select');
  answerElements.forEach(select => {
    answers.push(select.value);
  });
  
  if (leftInputs.length === 0) {
    alert('Vui lòng thêm ít nhất một cặp ghép nối!');
    return false;
  }
  
  if (leftInputs.some(input => !input)) {
    alert('Vui lòng nhập đầy đủ các từ tiếng Trung!');
    return false;
  }
  if (rightInputs.some(input => !input)) {
    alert('Vui lòng nhập đầy đủ các nghĩa tiếng Việt!');
    return false;
  }
  if (answers.some(answer => !answer)) {
    alert('Vui lòng chọn đáp án ghép nối cho tất cả các cặp!');
    return false;
  }
  
  // Kiểm tra đáp án không trùng lặp
  const uniqueAnswers = [...new Set(answers)];
  if (uniqueAnswers.length !== answers.length) {
    alert('Mỗi cặp chỉ được ghép với một đáp án duy nhất!');
    return false;
  }
  
  return true;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize matching defaults ONLY when creating new matching question
  const questionTypeEl = document.getElementById('question_type');
  const currentType = questionTypeEl ? questionTypeEl.value : null;
  const leftCol = document.getElementById('matching-left-column');
  if (currentType === 'matching' && leftCol && leftCol.children.length === 0) {
    addMatchingPair();
    addMatchingPair();
  }
  
  // Add event listeners for form validation
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(e) {
      const questionType = document.getElementById('question_type')?.value;
      
      if (questionType === 'matching') {
        if (!validateMatchingForm()) {
          e.preventDefault();
          return false;
        }
      }
    });
  }
});

// Export functions for global access
window.addMatchingPair = addMatchingPair;
window.removeMatchingPair = removeMatchingPair;
window.clearMatchingPairs = clearMatchingPairs;
window.addOrderingItem = addOrderingItem;
window.removeOrderingItem = removeOrderingItem;
window.validateMatchingForm = validateMatchingForm;
