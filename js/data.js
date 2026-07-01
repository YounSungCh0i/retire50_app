/**
 * 50세 은퇴 재무설계 — 경제 데이터 상수
 * 모든 데이터는 2026년 기준, 공식 출처 기반
 * 소수점 둘째자리 반올림 적용
 */

const DATA = {
  // ========== 물가 / 금리 ==========
  inflation: {
    current: 2.80,        // 2026년 소비자물가상승률 (%) — 출처: 한국은행
    scenarios: {
      optimistic: 2.00,
      base: 2.80,
      pessimistic: 4.00
    },
    source: '한국은행, 통계청 (2026)'
  },

  // ========== 연봉인상률 ==========
  salaryGrowth: {
    byCompanySize: {
      large: { label: '대기업', rate: 5.50 },        // 출처: 인크루트 2026
      medium: { label: '중견기업', rate: 4.50 },
      small: { label: '중소기업', rate: 3.50 },
      startup: { label: '스타트업', rate: 6.00 },
      public: { label: '공무원/공기업', rate: 3.00 },
      selfEmployed: { label: '자영업', rate: 2.50 },
      freelance: { label: '프리랜서', rate: 3.00 }
    },
    scenarios: {
      optimistic: 7.50,    // 실제 인상자 평균
      base: 4.00,          // 시장 평균
      pessimistic: 2.00
    },
    source: '인크루트 2026 연봉인상률 조사'
  },

  // ========== 투자 기대수익률 ==========
  investmentReturns: {
    savings: {
      label: '예금/적금',
      icon: '🏦',
      rate: { optimistic: 4.00, base: 3.00, pessimistic: 2.00 },
      risk: '초저위험',
      description: '시중은행 정기예금 평균 금리',
      source: '한국은행 경제통계시스템 (2026)'
    },
    bonds: {
      label: '채권',
      icon: '📜',
      rate: { optimistic: 5.00, base: 4.00, pessimistic: 3.00 },
      risk: '저위험',
      description: '한국 국고채 10년물 기준',
      source: '한국은행 (2026)'
    },
    kospiStocks: {
      label: '국내주식 (KOSPI)',
      icon: '📈',
      rate: { optimistic: 10.00, base: 6.60, pessimistic: 3.00 },
      risk: '중위험',
      description: '2002~2022년 연평균 수익률 기반',
      source: '삼성증권 리서치센터'
    },
    globalStocks: {
      label: '해외주식 (S&P500)',
      icon: '🌍',
      rate: { optimistic: 12.00, base: 9.50, pessimistic: 5.00 },
      risk: '중위험',
      description: '30년 장기 연평균 수익률 기반',
      source: 'officialdata.org, FRED'
    },
    realEstate: {
      label: '부동산',
      icon: '🏠',
      rate: { optimistic: 6.00, base: 4.00, pessimistic: 1.00 },
      risk: '중위험',
      description: '전국 아파트 매매가 상승률 기반 (임대수익 별도)',
      source: '한국부동산원 (2026)'
    },
    crypto: {
      label: '가상화폐',
      icon: '₿',
      rate: { optimistic: 30.00, base: 10.00, pessimistic: -20.00 },
      risk: '초고위험',
      description: '극도의 변동성, 원금 손실 가능',
      source: '시장 데이터 종합'
    },
    pension: {
      label: '연금저축/IRP',
      icon: '🔐',
      rate: { optimistic: 7.00, base: 5.00, pessimistic: 3.00 },
      risk: '중저위험',
      description: '연금 펀드 평균 수익률 + 세액공제 효과',
      source: '금융감독원 (2026)'
    },
    insurance: {
      label: '보험 (저축성)',
      icon: '🛡️',
      rate: { optimistic: 3.50, base: 2.50, pessimistic: 1.50 },
      risk: '저위험',
      description: '저축성 보험 평균 공시이율',
      source: '생명보험협회 (2026)'
    },
    // 주식-채권 역상관관계 (포트폴리오 헤징 효과 시뮬레이션용)
    correlations: {
      stockBond: -0.20
    }
  },

  // ========== 세금 & 절세 ==========
  tax: {
    incomeTaxBrackets: [
      { limit: 14000000, rate: 6 },
      { limit: 50000000, rate: 15 },
      { limit: 88000000, rate: 24 },
      { limit: 150000000, rate: 35 },
      { limit: 300000000, rate: 38 },
      { limit: 500000000, rate: 40 },
      { limit: 1000000000, rate: 42 },
      { limit: Infinity, rate: 45 }
    ],
    pensionSavingsDeduction: 6000000,    // 연금저축 세액공제 한도
    irpDeduction: 3000000,               // IRP 추가 세액공제 한도
    totalPensionDeduction: 9000000,      // 합산 최대 한도
    pensionDeductionRate: {
      under55m: 16.5,    // 총급여 5,500만원 이하: 16.5%
      over55m: 13.2      // 초과: 13.2%
    },
    isaAnnualLimit: 40000000,            // ISA 연간 납입한도
    isaTaxFreeLimit: {
      general: 5000000,   // 일반형 비과세 한도
      special: 10000000   // 서민형/농어민형
    },
    isaToRetirementBonus: {
      rate: 10,            // ISA→연금전환 시 추가 세액공제율
      limit: 3000000       // 최대 300만원
    },
    healthInsuranceCutoff: 10000000,     // 건보료 피부양자 탈락 금융소득 기준 (1천만원)
    privatePensionLimit: 15000000,       // 사적연금 분리과세 한도 (1500만원)
    source: '국세청, 금융위원회 (2026)'
  },

  // ========== 국민연금 ==========
  pension: {
    // 1969년생 이후 기준
    normalAge: 65,
    earlyAge: 60,
    earlyPenaltyPerYear: 6,    // 조기수령 시 연 6% 감액
    maxEarlyPenalty: 30,       // 최대 30% 감액
    contributionRate: 9,        // 보험료율 (%)
    halfByEmployee: 4.5,
    incomeReplacementRate: 40,  // 소득대체율 (%)
    estimatedDepletionYear: 2055, // 기금 소진 예상 연도
    source: '국민연금공단 (2026)'
  },

  // ========== 생애 이벤트 비용 ==========
  lifeEvents: {
    marriage: {
      label: '결혼',
      icon: '💒',
      totalCost: {
        min: 200000000,     // 2억
        avg: 280000000,     // 2.8억 (주거비 포함)
        max: 380000000      // 3.8억
      },
      breakdown: {
        housing: { label: '주거비 (전세/매매)', ratio: 0.70 },
        ceremony: { label: '예식/스드메', ratio: 0.15 },
        honeymoon: { label: '신혼여행/예물/혼수', ratio: 0.15 }
      },
      taxBenefit: 1000000,   // 결혼세액공제 100만원 (2024~2026)
      source: '결혼정보 포털 종합 (2025~2026)'
    },
    child: {
      label: '출산/양육',
      icon: '👶',
      birthCost: 3000000,          // 출산 비용 (실비 후)
      monthlyRearing: {
        infant: 1500000,           // 0~3세 월 양육비
        preschool: 1200000,        // 4~6세
        elementary: 1000000,       // 7~12세
        middle: 1200000,           // 13~15세
        high: 1500000,             // 16~18세
        college: 8000000           // 대학 등록금 (학기당)
      },
      source: '통계청 가계동향조사 (2026)'
    },
    housing: {
      label: '주택 구매',
      icon: '🏡',
      avgPrice: {
        seoul: 1200000000,         // 서울 평균 12억
        metro: 600000000,          // 수도권 6억
        local: 300000000           // 지방 3억
      },
      loanRate: 3.50,              // 주택담보대출 평균 금리
      ltv: 70,                     // LTV 비율 (%)
      source: '한국부동산원, KB부동산 (2026)'
    },
    funeral: {
      label: '상조/장례',
      icon: '🕯️',
      avgCost: 15000000,           // 평균 장례 비용
      monthlyFee: 50000,           // 상조회 월 납입금
      source: '공정거래위원회 (2026)'
    }
  },

  // ========== 보험 ==========
  insurance: {
    types: {
      health: {
        label: '실손보험',
        monthlyPremium: { min: 30000, avg: 50000, max: 80000 },
        necessity: '필수',
        description: '질병/상해 치료비 보장'
      },
      term: {
        label: '정기보험 (사망)',
        monthlyPremium: { min: 20000, avg: 40000, max: 80000 },
        necessity: '권장 (가족 있는 경우)',
        description: '사망/후유장해 시 가족 보장'
      },
      ci: {
        label: 'CI보험 (중대질병)',
        monthlyPremium: { min: 30000, avg: 60000, max: 100000 },
        necessity: '선택',
        description: '암, 뇌졸중, 심근경색 진단금'
      },
      longTermCare: {
        label: '간병/요양보험',
        monthlyPremium: { min: 20000, avg: 40000, max: 70000 },
        necessity: '권장 (40대 이후)',
        description: '장기요양 시 월 지급금'
      }
    },
    // 은퇴 후 건강보험료 (지역가입자)
    retiredHealthInsurance: {
      monthlyAvg: 150000,
      source: '국민건강보험공단 (2026)'
    }
  },

  // ========== 은퇴 후 지출 ==========
  retirementExpenses: {
    monthlyBase: {
      single: 1500000,       // 1인 기준 최소 월 생활비
      couple: 2500000        // 2인 기준
    },
    healthInsurance: 150000,  // 지역가입자 건강보험료
    longTermCare: 200000,     // 장기요양 대비 월 적립금
    leisure: 300000,          // 여가/문화 활동
    source: '통계청 가계동향조사 (2026)'
  },

  // ========== 브릿지자금 (50세~65세) ==========
  bridgeFund: {
    strategies: [
      {
        id: 'isa_pension',
        label: 'ISA → 연금전환',
        description: 'ISA 만기 후 연금저축/IRP로 이전하여 추가 세액공제 및 연금 수령',
        riskLevel: '저위험',
        source: '금융위원회 (2026)'
      },
      {
        id: 'irp_annuity',
        label: '퇴직금 IRP 연금화',
        description: '퇴직금을 IRP로 이전하여 연금으로 분할 수령 (퇴직소득세 30~40% 절감)',
        riskLevel: '저위험',
        source: '국세청 (2026)'
      },
      {
        id: 'dividend',
        label: '배당주 포트폴리오',
        description: '고배당 주식/ETF를 통한 정기 현금흐름 확보 (배당수익률 3~5%)',
        riskLevel: '중위험',
        source: '시장 데이터'
      },
      {
        id: 'rental',
        label: '부동산 임대 소득',
        description: '소형 오피스텔/상가 등 임대 수익 기반 월 현금흐름',
        riskLevel: '중위험',
        source: '한국부동산원'
      },
      {
        id: 'reverse_mortgage',
        label: '주택연금',
        description: '소유 주택 담보 평생 연금 수령 (9억 원 주택 기준 월 100만원+)',
        riskLevel: '저위험',
        source: '한국주택금융공사 (2026)'
      },
      {
        id: 'early_pension',
        label: '국민연금 조기수령',
        description: '60세부터 수령 가능, 단 1년 조기 시 6% 감액 (최대 30%)',
        riskLevel: '주의',
        source: '국민연금공단 (2026)'
      }
    ]
  },

  // ========== 투자 성향 ==========
  investmentProfiles: {
    ultraConservative: {
      id: 'ultraConservative',
      label: '초안정형',
      icon: '🛡️',
      description: '원금 보장을 최우선시합니다.',
      allocation: {
        savings: 60, bonds: 25, kospiStocks: 5,
        globalStocks: 5, realEstate: 5, crypto: 0
      },
      expectedReturn: { min: 2.50, max: 4.00 }
    },
    conservative: {
      id: 'conservative',
      label: '안정형',
      icon: '🔵',
      description: '안정적 수익을 추구하며 낮은 변동성을 선호합니다.',
      allocation: {
        savings: 30, bonds: 30, kospiStocks: 15,
        globalStocks: 15, realEstate: 10, crypto: 0
      },
      expectedReturn: { min: 3.50, max: 5.50 }
    },
    balanced: {
      id: 'balanced',
      label: '균형형',
      icon: '🟢',
      description: '위험과 수익의 균형을 중시합니다.',
      allocation: {
        savings: 10, bonds: 20, kospiStocks: 20,
        globalStocks: 30, realEstate: 15, crypto: 5
      },
      expectedReturn: { min: 4.50, max: 7.50 }
    },
    aggressive: {
      id: 'aggressive',
      label: '적극형',
      icon: '🟠',
      description: '높은 수익을 위해 변동성을 감수합니다.',
      allocation: {
        savings: 5, bonds: 10, kospiStocks: 25,
        globalStocks: 35, realEstate: 15, crypto: 10
      },
      expectedReturn: { min: 5.50, max: 10.00 }
    },
    ultraAggressive: {
      id: 'ultraAggressive',
      label: '공격형',
      icon: '🔴',
      description: '최대 수익을 추구하며 높은 위험을 감수합니다.',
      allocation: {
        savings: 0, bonds: 5, kospiStocks: 25,
        globalStocks: 35, realEstate: 15, crypto: 20
      },
      expectedReturn: { min: 6.00, max: 15.00 }
    }
  },

  // ========== 기대수명 ==========
  lifeExpectancy: {
    male: 80.60,
    female: 86.60,
    avg: 83.60,
    scenarios: {
      conservative: 85,
      base: 90,
      extended: 95
    },
    source: '통계청 생명표 (2025)'
  },

  // ========== 최저임금 ==========
  minimumWage: {
    hourly: 10320,
    monthly: 2158650,    // 209시간 기준
    source: '고용노동부 (2026)'
  }
};

// 전역 접근
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DATA;
} else if (typeof window !== 'undefined') {
  window.DATA = DATA;
}
