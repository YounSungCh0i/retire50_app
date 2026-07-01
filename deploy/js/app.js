/**
 * 50세 은퇴 재무설계 — 공통 앱 유틸리티
 */

const App = {
  // ========== 포맷팅 ==========

  /** 금액을 한국어 표기로 포맷 */
  formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 100000000) {
      const billions = Math.round(abs / 100000000 * 100) / 100;
      return `${sign}${billions}억원`;
    } else if (abs >= 10000) {
      const tenThousands = Math.round(abs / 10000);
      return `${sign}${tenThousands.toLocaleString()}만원`;
    }
    return `${sign}${Math.round(abs).toLocaleString()}원`;
  },

  /** 금액을 만원 단위로 포맷 */
  formatWon(amount) {
    if (!amount) return '0원';
    return Math.round(amount).toLocaleString('ko-KR') + '원';
  },

  /** 퍼센트 포맷 */
  formatPercent(value) {
    return `${(Math.round(value * 100) / 100).toFixed(1)}%`;
  },

  /** 숫자 포맷 */
  formatNumber(value) {
    return Math.round(value).toLocaleString('ko-KR');
  },

  /** 소수점 둘째자리 반올림 */
  roundToTwo(value) {
    return Math.round(value * 100) / 100;
  },

  // ========== 네비게이션 ==========

  initNavigation() {
    // 현재 페이지 하이라이트
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      }
    });

    // 햄버거 메뉴
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.navbar-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        hamburger.classList.toggle('active');
      });
    }

    // 데이터 유무 확인 → 온보딩 필요 시 리다이렉트
    if (currentPage !== 'index.html' && currentPage !== 'onboarding.html') {
      // Test Mode: 온보딩 리다이렉트 비활성화
      // const userData = Storage.loadUserData();
      // if (!userData || !userData.age) {
      //   this.showNotification('먼저 재무 상담을 완료해주세요.', 'warning');
      //   setTimeout(() => {
      //     window.location.href = 'onboarding.html';
      //   }, 2000);
      // }
    }
  },

  navigateTo(page) {
    window.location.href = page;
  },

  // ========== 알림 ==========

  showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    };

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
      ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  // ========== 애니메이션 ==========

  /** 숫자 카운트업 애니메이션 */
  animateCountUp(element, targetValue, duration = 1500, formatter = null) {
    const start = 0;
    const startTime = performance.now();
    const format = formatter || this.formatCurrency.bind(this);

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = start + (targetValue - start) * eased;
      
      element.textContent = format(current);
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  },

  /** 스크롤 시 요소 애니메이션 */
  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });
  },

  // ========== 차트 공통 설정 ==========

  chartDefaults: {
    colors: {
      emerald: '#00D4AA',
      cyan: '#00B4D8',
      purple: '#A78BFA',
      warning: '#FFB347',
      danger: '#FF6B6B',
      success: '#4ECDC4',
      muted: '#5A6A7A',
      grid: 'rgba(255, 255, 255, 0.05)',
      text: '#8899AA'
    },
    
    getGradient(ctx, color1 = '#00D4AA', color2 = '#00B4D8') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color1 + '40');
      gradient.addColorStop(1, color1 + '05');
      return gradient;
    },

    baseOptions: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#8899AA',
            font: { family: "'Pretendard', 'Inter', sans-serif", size: 12 },
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 32, 53, 0.95)',
          titleColor: '#E8EDF3',
          bodyColor: '#8899AA',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: { family: "'Pretendard', sans-serif", weight: '600' },
          bodyFont: { family: "'Inter', sans-serif" }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#5A6A7A', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#5A6A7A', font: { family: "'Inter', sans-serif", size: 11 } }
        }
      }
    }
  },

  // ========== 공통 HTML 템플릿 ==========

  /** 네비게이션 바 HTML */
  getNavbarHTML(activePage) {
    return `
    <nav class="navbar">
      <div class="container flex-between">
        <a href="index.html" class="navbar-brand">
          <div class="logo-icon">🎯</div>
          <span>Retire50</span>
        </a>
        <ul class="navbar-links">
          <li><a href="index.html" ${activePage === 'index' ? 'class="active"' : ''}>홈</a></li>
          <li><a href="onboarding.html" ${activePage === 'onboarding' ? 'class="active"' : ''}>재무상담</a></li>
          <li><a href="dashboard.html" ${activePage === 'dashboard' ? 'class="active"' : ''}>대시보드</a></li>
          <li><a href="roadmap.html" ${activePage === 'roadmap' ? 'class="active"' : ''}>로드맵</a></li>
          <li><a href="simulation.html" ${activePage === 'simulation' ? 'class="active"' : ''}>시뮬레이션</a></li>
          <li><a href="bridge.html" ${activePage === 'bridge' ? 'class="active"' : ''}>브릿지전략</a></li>
        </ul>
        <div class="hamburger" onclick="document.querySelector('.navbar-links').classList.toggle('open')">
          <span></span><span></span><span></span>
        </div>
      </div>
    </nav>`;
  },

  /** 면책 고지 HTML */
  getDisclaimerHTML() {
    return `
    <div class="disclaimer mt-xl">
      본 서비스는 금융 교육 및 정보 제공 목적으로 제작되었으며, 투자자문에 해당하지 않습니다.
      과거 수익률은 미래 성과를 보장하지 않으며, 모든 투자 판단의 책임은 이용자에게 있습니다.
      제시된 데이터는 공식 통계 기반이나 실제와 차이가 있을 수 있으므로 반드시 전문가 상담을 권장합니다.
    </div>`;
  },

  /** 푸터 HTML */
  getFooterHTML() {
    return `
    <footer class="footer">
      <div class="container">
        <p>Retire50 — 50세 은퇴를 위한 재무설계 포트폴리오</p>
        <p class="mt-sm">데이터 기준: 2026년 | 출처: 한국은행, 통계청, 국민연금공단, 금융위원회</p>
      </div>
    </footer>`;
  }
};

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  App.initNavigation();
  App.initScrollAnimations();
});

if (typeof window !== 'undefined') {
  window.App = App;
}
