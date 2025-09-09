// Debug script để kiểm tra form fill-in-the-blank
console.log('🔍 Debug script loaded');

// Kiểm tra xem các elements có tồn tại không
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 DOM loaded');
  
  const blanksContainer = document.getElementById('blanks-container');
  const addBlankBtn = document.getElementById('addBlankBtn');
  
  console.log('🔍 blanks-container:', blanksContainer);
  console.log('🔍 addBlankBtn:', addBlankBtn);
  
  if (addBlankBtn) {
    console.log('🔍 addBlankBtn onclick:', addBlankBtn.onclick);
    console.log('🔍 addBlankBtn onclick attribute:', addBlankBtn.getAttribute('onclick'));
  }
  
  // Kiểm tra xem function addBlank có tồn tại không
  console.log('🔍 typeof addBlank:', typeof addBlank);
  
  // Thêm event listener để debug
  if (addBlankBtn) {
    addBlankBtn.addEventListener('click', function(e) {
      console.log('🔍 addBlankBtn clicked');
      console.log('🔍 Event:', e);
      
      // Gọi function addBlank nếu tồn tại
      if (typeof addBlank === 'function') {
        console.log('🔍 Calling addBlank function');
        addBlank();
      } else {
        console.error('❌ addBlank function not found');
      }
    });
  }
});

// Override function addBlank để debug
window.addBlank = function() {
  console.log('🔍 addBlank function called');
  
  const container = document.getElementById('blanks-container');
  if (!container) {
    console.error('❌ blanks-container not found');
    return;
  }
  
  console.log('🔍 Current container children:', container.children.length);
  
  const blankIndex = container.children.length + 1;
  console.log('🔍 Creating blank index:', blankIndex);
  
  const blankDiv = document.createElement('div');
  blankDiv.className = 'border p-3 mt-3 mb-3 blank-group';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'd-flex justify-content-between align-items-center';
  headerDiv.innerHTML = `
      <h5 class="blank-title">Cấu hình cho Chỗ trống (${blankIndex})</h5>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeBlank(this)">Xóa</button>
  `;
  blankDiv.appendChild(headerDiv);

  const options = ['A', 'B', 'C', 'D'];
  options.forEach(option => {
      const optionGroup = document.createElement('div');
      optionGroup.className = 'input-group mb-2';
      optionGroup.innerHTML = `
          <div class="input-group-prepend">
              <div class="input-group-text">
                  <input type="radio" name="correct_answer_${blankIndex}" value="${option}" required>
              </div>
          </div>
          <input type="text" class="form-control" name="option_${blankIndex}_${option}" placeholder="Nội dung cho lựa chọn ${option}" required>
      `;
      blankDiv.appendChild(optionGroup);
  });

  container.appendChild(blankDiv);
  console.log(`🔍 Added blank ${blankIndex}`);
  console.log('🔍 Total blanks now:', container.children.length);
};

// Override function removeBlank để debug
window.removeBlank = function(btn) {
  console.log('🔍 removeBlank function called');
  
  const blankToRemove = btn.closest('.blank-group');
  if (blankToRemove) {
    console.log('🔍 Removing blank:', blankToRemove);
    blankToRemove.remove();
    updateBlankTitles();
  } else {
    console.error('❌ blank-group not found');
  }
};

// Override function updateBlankTitles để debug
window.updateBlankTitles = function() {
  console.log('🔍 updateBlankTitles function called');
  
  const blanks = document.querySelectorAll('.blank-group');
  console.log(`🔍 Updating ${blanks.length} blanks`);
  
  blanks.forEach((blankDiv, idx) => {
      const titleElement = blankDiv.querySelector('.blank-title');
      if (titleElement) {
          titleElement.textContent = `Cấu hình cho Chỗ trống (${idx + 1})`;
      }
      const radios = blankDiv.querySelectorAll('input[type="radio"]');
      const texts = blankDiv.querySelectorAll('input[type="text"]');
      
      console.log(`🔍 Blank ${idx + 1}: ${radios.length} radios, ${texts.length} texts`);
      
      radios.forEach(radio => {
          radio.name = `correct_answer_${idx + 1}`;
          console.log(`🔍 Radio name: ${radio.name}, value: ${radio.value}`);
      });
      texts.forEach((text, i) => {
          const opt = ['A', 'B', 'C', 'D'][i];
          text.name = `option_${idx + 1}_${opt}`;
          console.log(`🔍 Text name: ${text.name}, value: ${text.value}`);
      });
  });
};
