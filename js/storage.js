/**
 * 50세 은퇴 재무설계 — 데이터 저장 & PDF 내보내기
 * LocalStorage 기반, 모든 대화 내용 및 결과 저장
 */

const Storage = {
  KEYS: {
    USER_DATA: 'retire50_userData',
    CONVERSATION: 'retire50_conversation',
    RESULTS: 'retire50_results',
    SETTINGS: 'retire50_settings'
  },

  // ========== 사용자 데이터 ==========

  saveUserData(data) {
    try {
      const existing = this.loadUserData() || {};
      const merged = { ...existing, ...data, lastUpdated: new Date().toISOString() };
      localStorage.setItem(this.KEYS.USER_DATA, JSON.stringify(merged));
      return true;
    } catch (e) {
      console.error('데이터 저장 실패:', e);
      return false;
    }
  },

  loadUserData() {
    try {
      const data = localStorage.getItem(this.KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('데이터 로드 실패:', e);
      return null;
    }
  },

  // ========== 대화 내용 ==========

  saveConversation(messages) {
    try {
      localStorage.setItem(this.KEYS.CONVERSATION, JSON.stringify(messages));
      return true;
    } catch (e) {
      console.error('대화 저장 실패:', e);
      return false;
    }
  },

  loadConversation() {
    try {
      const data = localStorage.getItem(this.KEYS.CONVERSATION);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addMessage(message) {
    const messages = this.loadConversation();
    messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    this.saveConversation(messages);
  },

  // ========== 계산 결과 ==========

  saveResults(results) {
    try {
      localStorage.setItem(this.KEYS.RESULTS, JSON.stringify({
        ...results,
        calculatedAt: new Date().toISOString()
      }));
      return true;
    } catch (e) {
      console.error('결과 저장 실패:', e);
      return false;
    }
  },

  loadResults() {
    try {
      const data = localStorage.getItem(this.KEYS.RESULTS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  // ========== 전체 데이터 ==========

  exportAllData() {
    return {
      userData: this.loadUserData(),
      conversation: this.loadConversation(),
      results: this.loadResults(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.userData) this.saveUserData(data.userData);
      if (data.conversation) this.saveConversation(data.conversation);
      if (data.results) this.saveResults(data.results);
      return true;
    } catch (e) {
      console.error('데이터 가져오기 실패:', e);
      return false;
    }
  },

  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },

  // ========== PDF 내보내기 ==========

  async exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const userData = this.loadUserData();
    const results = this.loadResults();
    const conversation = this.loadConversation();
    
    if (!userData || !results) {
      alert('저장된 데이터가 없습니다. 먼저 온보딩을 완료해주세요.');
      return;
    }

    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // 한글 폰트 대체 — 기본 폰트로 영문/숫자 중심 출력
    doc.setFont('helvetica');

    // ===== 표지 =====
    doc.setFillColor(10, 22, 40);
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(0, 212, 170);
    doc.setFontSize(28);
    doc.text('50 Retirement Plan', pageWidth / 2, 100, { align: 'center' });
    
    doc.setTextColor(232, 237, 243);
    doc.setFontSize(14);
    doc.text('Financial Portfolio Report', pageWidth / 2, 115, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(136, 153, 170);
    const date = new Date().toLocaleDateString('ko-KR');
    doc.text(`Generated: ${date}`, pageWidth / 2, 135, { align: 'center' });
    doc.text(`Age: ${userData.age || '-'} | Target Retire Age: ${userData.retireAge || 50}`, pageWidth / 2, 145, { align: 'center' });

    // ===== 요약 페이지 =====
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 297, 'F');
    
    y = margin;
    doc.setTextColor(10, 22, 40);
    doc.setFontSize(18);
    doc.text('Summary', margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    const summaryItems = [
      ['Current Monthly Income', this.formatForPDF(userData.monthlyIncome)],
      ['Current Total Assets', this.formatForPDF(userData.totalAssets)],
      ['Total Debt', this.formatForPDF(userData.totalDebt)],
      ['Investment Profile', userData.investmentProfile || '-'],
      ['Target Retire Age', `${userData.retireAge || 50}`],
      ['', ''],
      ['Target Retirement Fund', this.formatForPDF(results.totalRequired)],
      ['Bridge Fund (50-65)', this.formatForPDF(results.bridgeFund)],
      ['Required Monthly Saving', this.formatForPDF(results.requiredMonthlySaving)],
      ['Current Assets at Retire', this.formatForPDF(results.currentAssetsAtRetire)],
      ['Additional Required', this.formatForPDF(results.additionalRequired)],
      ['Success Rate', `${results.successRate || '-'}%`]
    ];

    for (const [label, value] of summaryItems) {
      if (label === '') { y += 5; continue; }
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + contentWidth, y, { align: 'right' });
      y += 7;
    }

    // ===== 자산 배분 =====
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Asset Allocation', margin, y);
    y += 10;
    
    doc.setFontSize(9);
    if (userData.allocation) {
      for (const [asset, weight] of Object.entries(userData.allocation)) {
        if (weight > 0) {
          const assetData = DATA.investmentReturns[asset];
          const label = assetData ? assetData.label : asset;
          doc.setFont('helvetica', 'normal');
          doc.text(`${label}`, margin + 5, y);
          doc.setFont('helvetica', 'bold');
          doc.text(`${weight}%`, margin + contentWidth, y, { align: 'right' });
          
          // 비율 바
          doc.setFillColor(0, 212, 170);
          doc.rect(margin + 80, y - 3, weight * 0.8, 3, 'F');
          y += 7;
        }
      }
    }

    // ===== 대화 내용 =====
    doc.addPage();
    y = margin;
    doc.setTextColor(10, 22, 40);
    doc.setFontSize(14);
    doc.text('Consultation Log', margin, y);
    y += 10;

    doc.setFontSize(8);
    for (const msg of conversation) {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      
      const prefix = msg.type === 'bot' ? '[Advisor]' : '[User]';
      const text = `${prefix} ${msg.text}`;
      
      doc.setFont('helvetica', msg.type === 'bot' ? 'normal' : 'bold');
      doc.setTextColor(msg.type === 'bot' ? 80 : 10, msg.type === 'bot' ? 80 : 22, msg.type === 'bot' ? 80 : 40);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 4 + 3;
    }

    // ===== 면책 고지 =====
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    y += 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    const disclaimer = 'Disclaimer: This report is for educational and informational purposes only. It does not constitute investment advice. Past performance does not guarantee future results. All investment decisions are the sole responsibility of the user.';
    const discLines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(discLines, margin, y);

    // 저장
    const filename = `retirement_plan_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    
    return filename;
  },

  formatForPDF(amount) {
    if (!amount && amount !== 0) return '-';
    if (typeof amount === 'string') return amount;
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}B KRW`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}M KRW`;
    }
    return `${amount.toLocaleString()} KRW`;
  },

  // ========== 페이지 캡처 → PDF ==========
  
  async capturePageToPDF(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0A1628',
        scale: 2,
        useCORS: true
      });

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let y = 10;
      let remainingHeight = imgHeight;
      
      while (remainingHeight > 0) {
        const pageHeight = 277;
        doc.addImage(imgData, 'PNG', 10, y - (imgHeight - remainingHeight), imgWidth, imgHeight);
        remainingHeight -= pageHeight;
        if (remainingHeight > 0) {
          doc.addPage();
          y = 10;
        }
      }

      const filename = `retire50_${elementId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      return filename;
    } catch (e) {
      console.error('PDF 캡처 실패:', e);
      return null;
    }
  }
};

if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
