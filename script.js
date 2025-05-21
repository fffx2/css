// 색상 입력 필드 동기화
document.getElementById('backgroundColor').addEventListener('input', function(e) {
    document.getElementById('backgroundColorText').value = e.target.value.toUpperCase();
    updatePreview();
});

document.getElementById('backgroundColorText').addEventListener('input', function(e) {
    document.getElementById('backgroundColor').value = e.target.value;
    updatePreview();
});

document.getElementById('textColor').addEventListener('input', function(e) {
    document.getElementById('textColorText').value = e.target.value.toUpperCase();
    updatePreview();
});

document.getElementById('textColorText').addEventListener('input', function(e) {
    document.getElementById('textColor').value = e.target.value;
    updatePreview();
});

// 색상값을 RGB로 변환
function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 상대 휘도 계산
function getLuminance(r, g, b) {
    let [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// 명도 대비 계산
function getContrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// 미리보기 업데이트
function updatePreview() {
    const bgColor = document.getElementById('backgroundColor').value;
    const textColor = document.getElementById('textColor').value;
    const previewBox = document.getElementById('previewText');
    
    previewBox.style.backgroundColor = bgColor;
    previewBox.style.color = textColor;
}

// 명도 대비 검사
function checkContrast() {
    const bgColor = hexToRgb(document.getElementById('backgroundColor').value);
    const textColor = hexToRgb(document.getElementById('textColor').value);
    
    if (!bgColor || !textColor) {
        showError('올바른 색상값을 입력해주세요.');
        return;
    }
    
    const bgLuminance = getLuminance(bgColor.r, bgColor.g, bgColor.b);
    const textLuminance = getLuminance(textColor.r, textColor.g, textColor.b);
    const ratio = getContrastRatio(bgLuminance, textLuminance);
    
    displayContrastResults(ratio);
}

// 결과 표시
function displayContrastResults(ratio) {
    const contrastRatio = document.getElementById('contrastRatio');
    const wcagResults = document.getElementById('wcagResults');
    
    // 명도 대비 비율 표시
    contrastRatio.textContent = `명도 대비: ${ratio.toFixed(2)}:1`;
    
    // WCAG 기준 결과
    const results = [
        {
            level: 'AA',
            size: '작은 텍스트 (18pt 미만)',
            requirement: 4.5,
            pass: ratio >= 4.5
        },
        {
            level: 'AA',
            size: '큰 텍스트 (18pt 이상)',
            requirement: 3.0,
            pass: ratio >= 3.0
        },
        {
            level: 'AAA',
            size: '작은 텍스트 (18pt 미만)',
            requirement: 7.0,
            pass: ratio >= 7.0
        },
        {
            level: 'AAA',
            size: '큰 텍스트 (18pt 이상)',
            requirement: 4.5,
            pass: ratio >= 4.5
        }
    ];
    
    wcagResults.innerHTML = '';
    results.forEach(result => {
        const div = document.createElement('div');
        div.className = `wcag-level ${result.pass ? 'pass' : 'fail'}`;
        div.innerHTML = `
            <span class="material-icons">${result.pass ? 'check_circle' : 'error'}</span>
            <div>
                <strong>WCAG ${result.level}</strong> - ${result.size}<br>
                기준: ${result.requirement}:1 (${result.pass ? '통과' : '실패'})
            </div>
        `;
        wcagResults.appendChild(div);
    });
}

function analyzeCss() {
    const cssInput = document.getElementById('cssInput').value;
    
    if (!cssInput.trim()) {
        showError('CSS 코드를 입력해주세요.');
        return;
    }

    // 분석 결과 초기화
    clearResults();

    // 색상 대비 검사
    analyzeColorContrast(cssInput);
    
    // 글꼴 크기 검사
    analyzeFontSize(cssInput);
    
    // 반응형 디자인 검사
    analyzeResponsiveness(cssInput);
    
    // 애니메이션 접근성 검사
    analyzeAnimations(cssInput);
}

function clearResults() {
    const resultDivs = [
        'colorContrastResults',
        'fontSizeResults',
        'responsiveResults',
        'animationResults'
    ];
    
    resultDivs.forEach(id => {
        document.getElementById(id).innerHTML = '';
    });
}

function showError(message) {
    const results = document.getElementById('results');
    results.innerHTML = `<div class="error">${message}</div>`;
}

function addResult(containerId, message, isError = false) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = isError ? 'error' : 'success';
    div.textContent = message;
    container.appendChild(div);
}

function analyzeColorContrast(css) {
    const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g;
    const colors = css.match(colorRegex);

    if (!colors) {
        addResult('colorContrastResults', '색상 값이 발견되지 않았습니다.');
        return;
    }

    addResult('colorContrastResults', '발견된 색상들:', false);
    colors.forEach(color => {
        addResult('colorContrastResults', `- ${color}에 대한 권장사항:`, false);
        addResult('colorContrastResults', '  • 텍스트 색상으로 사용 시 배경색과의 대비율이 4.5:1 이상이어야 합니다.', false);
        addResult('colorContrastResults', '  • 큰 텍스트(18pt 이상)의 경우 대비율 3:1 이상이 권장됩니다.', false);
    });
}

function analyzeFontSize(css) {
    const fontSizeRegex = /font-size\s*:\s*([^;]+)/g;
    const fontSizes = css.match(fontSizeRegex);

    if (!fontSizes) {
        addResult('fontSizeResults', '글꼴 크기 설정이 발견되지 않았습니다.');
        return;
    }

    addResult('fontSizeResults', '글꼴 크기 분석:', false);
    fontSizes.forEach(size => {
        if (size.includes('px')) {
            addResult('fontSizeResults', `- ${size}: 상대 단위(rem, em) 사용을 권장합니다.`, true);
        } else {
            addResult('fontSizeResults', `- ${size}: 적절한 상대 단위를 사용하고 있습니다.`, false);
        }
    });
}

function analyzeResponsiveness(css) {
    const mediaQueryRegex = /@media[^{]+\{/g;
    const mediaQueries = css.match(mediaQueryRegex);

    if (!mediaQueries) {
        addResult('responsiveResults', '미디어 쿼리가 발견되지 않았습니다. 반응형 디자인을 위해 미디어 쿼리 사용을 권장합니다.', true);
        return;
    }

    addResult('responsiveResults', '반응형 디자인 분석:', false);
    mediaQueries.forEach(query => {
        addResult('responsiveResults', `- ${query.trim()}: 적절한 미디어 쿼리 사용`, false);
    });
}

function analyzeAnimations(css) {
    const animationRegex = /@keyframes|animation|transition/g;
    const animations = css.match(animationRegex);

    if (!animations) {
        addResult('animationResults', '애니메이션 관련 속성이 발견되지 않았습니다.');
        return;
    }

    addResult('animationResults', '애니메이션 접근성 검사:', false);
    addResult('animationResults', '- prefers-reduced-motion 미디어 쿼리 사용을 권장합니다.', false);
    addResult('animationResults', '- 깜빡임이 있는 애니메이션은 초당 3회 미만으로 제한해야 합니다.', false);
    addResult('animationResults', '- 자동 재생되는 애니메이션의 경우 정지 기능을 제공해야 합니다.', false);
} 
