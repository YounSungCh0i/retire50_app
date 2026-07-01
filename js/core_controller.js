/**
 * Core Controller - "Master Plan Generator"
 * 거시적 솔버(MacroPlanEngine)와 미시적 방어 룰(MicroPlanEngine)을 통합하여
 * 사용자에게 제공할 최종 '마스터 플랜 JSON'을 조립하는 중앙 제어 시스템입니다.
 */

// Node.js 환경에서의 모듈 로드 (웹 환경에서는 HTML script 태그로 로드됨을 가정)
const MacroEngine = (typeof MacroPlanEngine !== 'undefined') ? MacroPlanEngine : require('./macro_plan.js');
const MicroEngine = (typeof MicroPlanEngine !== 'undefined') ? MicroPlanEngine : require('./micro_plan.js');
const Calc = (typeof Calculator !== 'undefined') ? Calculator : require('./calculator.js');

class CoreController {
  constructor() {
    this.macroSolver = new MacroEngine();
    this.microSolver = new MicroEngine();
  }

  /**
   * 사용자 인터뷰 데이터와 거시 경제 지표를 기반으로 마스터 플랜(종합 보고서)을 생성합니다.
   * @param {Object} userInputs 사용자의 자산(8개 카테고리), 지출, MBTI 성향 설문 결과
   * @param {Object} macroData 현재 수집된 거시 경제 데이터 (물가상승률, 기준금리 등)
   * @returns {Object} 최종 조립된 Master Plan JSON
   */
  generateMasterPlan(userInputs, macroData) {
    console.log("[Core Controller] 마스터 플랜 연산 시작...");
    
    // [신규] 8개 카테고리 파서 적용
    let parsedFinancials = userInputs.financials;
    if (userInputs.financials && userInputs.financials.categories) {
       parsedFinancials = this.parseAssets(userInputs.financials.categories, userInputs.financials.age || 40);
       // 기존 로직 호환을 위해 추가 속성 병합
       parsedFinancials.hasISA = userInputs.financials.hasISA || false;
       parsedFinancials.isaAge = userInputs.financials.isaAge || 0;
       parsedFinancials.hasSideHustle = userInputs.financials.hasSideHustle || false;
       parsedFinancials.sideHustleIncome = userInputs.financials.sideHustleIncome || 0;
    }

    // 1. 거시적 분석 (MBTI 도출 및 솔버 파라미터 셋업)
    const mbtiCode = this.macroSolver.calculateFinancialMBTI(userInputs.answers);
    const macroResult = this.macroSolver.generateScenarioOptions(mbtiCode, parsedFinancials, macroData);

    // 2. 미시적 분석 (현행법 기반 방어 룰 가동 및 기회비용 계산)
    // 매크로 솔버에서 조정된 목표 수익률과 거시 데이터를 미시적 엔진에 주입
    const enhancedFinancials = {
      ...parsedFinancials,
      portfolioReturn: macroResult.solver_parameters.adjustedTargetReturnRate,
      inflationRate: macroData.inflationRate || 2.8,
      baseRate: macroData.baseRate || 3.5
    };

    const triggeredTactics = this.microSolver.runDefenseDiagnostics(enhancedFinancials);
    const costBenefitAnalysis = this.microSolver.runCostBenefitAnalysis(enhancedFinancials);

    // 3. 자산 비유동성 패널티 체크 (한국형 부동산 몰빵 경고)
    let illiquidityWarning = null;
    const realEstateRatio = (enhancedFinancials.housingAsset / (enhancedFinancials.totalAssets || 1)) * 100;
    if (realEstateRatio > 60) {
      illiquidityWarning = `※ [유동성 경고] 총 자산의 ${realEstateRatio.toFixed(1)}%가 부동산에 묶여 있습니다. 장기 현금흐름 경색을 막기 위해 주택연금 가입이나 거주지 다운사이징(비율 50% 미만으로 축소)을 최우선으로 검토하시길 제안합니다.`;
    }

    // 4. 버킷 시스템 (4-Bucket System) 배분 설계
    const bucketSystem = this.calculateBucketAllocation(enhancedFinancials, macroResult);

    // 5. Calculator 모듈 연동 (수학적 시뮬레이션 결과 도출)
    const currentAge  = enhancedFinancials.age || 40;
    const retireAge   = 50;
    const adjustedReturn     = macroResult.solver_parameters.adjustedTargetReturnRate;
    const adjustedExpense    = macroResult.solver_parameters.adjustedMonthlyExpense;
    const inflationRate      = enhancedFinancials.inflationRate;
    const pensionMonthly     = (enhancedFinancials.requiredPensionWithdrawal || 0) / 12;

    const calcParams = {
      currentAge,
      retireAge,
      lifeExpectancy: 100,
      monthlyExpense: adjustedExpense,
      inflationRate,
      pensionMonthly,
      currentAssets: enhancedFinancials.totalAssets,
      expectedReturn: adjustedReturn
    };
    const calcResults = Calc.calculateRetirementFund(calcParams);

    // [Bug Fix] 연도별 자산 성장 차트 데이터를 별도로 산출 (monthlySaving 포함)
    // requiredMonthlySaving: 목표 달성에 필요한 월 적립액 (calcResults에서 가져옴)
    const monthlySaving = calcResults.requiredMonthlySaving || enhancedFinancials.monthlySaving || 0;
    const growthParams = {
      currentAge,
      retireAge,
      lifeExpectancy: 100,
      currentAssets: enhancedFinancials.totalAssets,
      monthlySaving,                  // ← Bug 2 수정: 월 저축액 주입
      annualReturn: adjustedReturn,
      inflationRate,
      monthlyExpense: adjustedExpense,
      pensionMonthly,
      pensionStartAge: 65,
      asset_allocation: macroResult.asset_allocation
    };
    const growthResults = Calc.projectAssetGrowth(growthParams);

    // [신규] 소비 민감도 분석 (Spending Sensitivity Analysis)
    const sensitivityParams = {
      ...growthParams,
      variableExpense: enhancedFinancials.monthlyVariable || 0
    };
    const spendingSensitivity = Calc.calculateSpendingSensitivity ? Calc.calculateSpendingSensitivity(sensitivityParams) : null;

    // [신규] 2030 B급 감성 명예 뱃지 부여
    const userBadge = this.awardBadge(enhancedFinancials, mbtiCode, bucketSystem);

    // [신규] 육각형 방사형 차트 능력치 계산 (Radar Stats)
    const radarStats = {
      taxDefense: (enhancedFinancials.hasISA ? 30 : 0) + ((enhancedFinancials.pensionAsset > 0) ? 70 : 40),
      liquidity: Math.max(0, 100 - realEstateRatio),
      riskTolerance: mbtiCode.includes("A") ? 95 : 55,
      diversification: Math.min(100, (Object.values(userInputs.financials.categories || {}).filter(c => c && (c.amount > 0 || c.marketValue > 0 || c.monthlyPremium > 0)).length / 6) * 100),
      cashFlow: Math.min(100, (enhancedFinancials.monthlySaving / (enhancedFinancials.monthlyExpense || 1)) * 50 + (enhancedFinancials.hasSideHustle ? 30 : 0))
    };
    Object.keys(radarStats).forEach(k => radarStats[k] = Math.min(100, Math.round(radarStats[k])));
    
    const statNames = { taxDefense: '세금 방어력', liquidity: '자산 유동성', riskTolerance: '리스크 선호도', diversification: '자산 분산도', cashFlow: '현금 흐름' };
    
    let maxStatKey = Object.keys(statNames)[0];
    let minStatKey = Object.keys(statNames)[0];
    for (const key of Object.keys(statNames)) {
      if (radarStats[key] > radarStats[maxStatKey]) maxStatKey = key;
      if (radarStats[key] < radarStats[minStatKey]) minStatKey = key;
    }

    // [신규] 타임라인 액션 플랜 생성
    const timeline = this.generateTimeline(enhancedFinancials, mbtiCode, calcResults);

    const maxStatName = statNames[maxStatKey];
    const minStatName = statNames[minStatKey];

    const totalScore = Math.round((radarStats.taxDefense + radarStats.liquidity + radarStats.riskTolerance + radarStats.diversification + radarStats.cashFlow) / 5);
    
    let persona = "";
    let styleComment = "";
    
    if (radarStats.riskTolerance >= 80 && totalScore < 70) {
      persona = "🔥 캐시 우드 (Cathie Wood) 스타일";
      styleComment = "전체적인 밸런스보다는 고수익을 추구하는 공격적인 투자 성향입니다.";
    } else if (totalScore >= 90) {
      persona = "👑 레이 달리오 (Ray Dalio) 스타일";
      styleComment = "어떤 경제 위기에도 흔들리지 않는 사계절(All-Weather) 완벽 육각형 밸런스입니다!";
    } else if (totalScore >= 75) {
      if (radarStats.taxDefense >= 80 || radarStats.liquidity >= 80) {
        persona = "🛡️ 존 보글 (John Bogle) 스타일";
        styleComment = "절세와 현금흐름을 중시하며, 절대 잃지 않는 철벽 방어형 투자자입니다.";
      } else {
        persona = "⭐ 피터 린치 (Peter Lynch) 스타일";
        styleComment = "방어와 공격을 적절히 조화시키며, 일상에서 투자 기회를 찾는 실전 대가입니다.";
      }
    } else if (totalScore >= 60) {
      persona = "⚖️ 워런 버핏 (Warren Buffett)의 20대 시절";
      styleComment = "복리의 마법을 깨닫고 이제 막 재무 뼈대를 단단하게 잡아가기 시작한 단계입니다.";
    } else {
      persona = "🔥 초고위험 투자자";
      styleComment = "단기 고수익을 추구하다 큰 손실을 볼 수 있는 불안정한 재무 상태입니다.";
    }

    let strengthWeaknessMsg = `💡 <b>가장 돋보이는 무기는 [${maxStatName}]</b>이고, 보완이 시급한 약점은 <b>[${minStatName}]</b>입니다.`;
    if (radarStats[maxStatKey] === radarStats[minStatKey]) {
      strengthWeaknessMsg = `💡 모든 지표가 고르게 밸런스를 맞추고 있습니다.`;
    }

    radarStats.totalScore = totalScore;
    radarStats.grade = persona; // 기존 필드 유지, 내용만 성향으로 변경
    radarStats.comment = `${strengthWeaknessMsg}<br><span style="color:#94a3b8; font-size:13px; display:block; margin-top:6px;">${styleComment}</span>`;

    // [신규] 플레이어 태그 생성 (TFT 스타일)
    const playerTags = [];
    if (enhancedFinancials.hasISA || enhancedFinancials.pensionAsset > 0) playerTags.push({ text: '절세 마스터', type: 'success' });
    if (enhancedFinancials.hasSideHustle) playerTags.push({ text: '투잡러', type: 'primary' });
    if (radarStats.riskTolerance >= 80) playerTags.push({ text: '초고위험 선호', type: 'danger' });
    if (radarStats.liquidity >= 80) playerTags.push({ text: '현금 부자', type: 'warning' });
    if (radarStats.diversification >= 80) playerTags.push({ text: '완벽한 분산', type: 'success' });
    if (enhancedFinancials.monthlySaving > (enhancedFinancials.monthlyExpense * 1.5)) playerTags.push({ text: '극한의 절약', type: 'primary' });
    if (realEstateRatio > 70) playerTags.push({ text: '부동산 영끌', type: 'danger' });
    
    radarStats.playerTags = playerTags.slice(0, 4);

    // 6. 마스터 플랜 JSON 조립
    const masterPlanJSON = {
      timestamp: new Date().toISOString(),
      user_profile: {
        mbti_code: mbtiCode,
        persona_name: macroResult.profile_name,
        badge: userBadge
      },
      macro_strategy: {
        target_return_rate: macroResult.solver_parameters.adjustedTargetReturnRate,
        dynamic_adjustment: macroResult.dynamic_adjustments.macro_effect,
        expert_advice: macroResult.dynamic_adjustments.advice,
        illiquidity_penalty_status: illiquidityWarning || "안정적 (부동산 비중 적정)",
        asset_allocation: macroResult.asset_allocation
      },
      micro_tactics: {
        cost_benefit_analysis: costBenefitAnalysis.message,
        recommended_rules: triggeredTactics.map(t => ({
           category: t.category,
           prescriptions: t.tactics
        }))
      },
      reasoning_logs: {
        macro: macroResult.reasoning || [],
        micro: costBenefitAnalysis.reasoning || [],
        calculator: calcResults.reasoning || []
      },
      chart_data: {
        asset_growth: {
          base_case:   growthResults.base_case   || [],   
          stress_test: growthResults.stress_test || [],
          mc_stats:    growthResults.mc_stats    || null
        },
        portfolio_pie: macroResult.asset_allocation.details || [],
        radar_stats: radarStats,
        cost_benefit_bar: costBenefitAnalysis.chart_data || null,
        spending_sensitivity: spendingSensitivity,
        timeline: timeline
      },
      bucket_allocation: bucketSystem,
      calculator_results: calcResults,
      next_action: "상기 제안된 레퍼런스를 바탕으로, 고객님의 최종 판단에 따라 대시보드의 목표치를 셋업하십시오."
    };

    console.log("[Core Controller] 마스터 플랜 생성 완료");
    return masterPlanJSON;
  }

  /**
   * [신규] 8개 자산 카테고리 입력 파서 (Asset Input Parser)
   * 원시 데이터를 투자가능 자산(Investable)과 잠긴 자본(Locked)으로 이원화하고
   * 지출을 고정/재량으로 분리하여 월 저축액을 도출합니다.
   */
  parseAssets(categories, age) {
    const bank = categories.bank || { amount: 0 };
    const stock = categories.stock || { amount: 0, foreignRatio: 0 };
    const bond = categories.bond || { amount: 0 };
    const insurance = categories.insurance || { monthlyPremium: 0 };
    const pension = categories.pension || { public: {}, private: {} };
    const realEstate = categories.realEstate || { marketValue: 0, loanBalance: 0, isResidential: false, monthlyLoanPayment: 0 };
    const income = categories.income || { monthlyNet: 0, monthlyFixed: 0, monthlyVariable: 0 };

    // 1. 자산 이원화 (Investable vs Locked)
    const investableAssets = bank.amount + stock.amount + bond.amount;
    const lockedCapital = realEstate.marketValue + 
                          (pension.private.irp || 0) + 
                          (pension.private.savings || 0) + 
                          (pension.private.severance || 0);

    const totalAssets = investableAssets + lockedCapital;
    const housingAsset = realEstate.isResidential ? realEstate.marketValue : 0;

    // 2. 현금흐름 연산 (고정지출에 부동산 대출이자 강제 편입)
    const monthlyNet = income.monthlyNet || 0;
    const monthlyFixed = (income.monthlyFixed || 0) + (realEstate.monthlyLoanPayment || 0);
    const monthlyVariable = income.monthlyVariable || 0;
    const monthlyExpense = monthlyFixed + monthlyVariable;
    const monthlySaving = Math.max(0, monthlyNet - monthlyExpense);

    // 3. 세금/미시 방어 룰 트리거용 파생 변수
    const projectedDividendInterest = (stock.amount * 0.02) + (bank.amount * 0.03); // 배당 2%, 이자 3% 가정
    const foreignStockProfits = (stock.foreignRatio > 0 && stock.amount > 0) ? 1000000 : 0; // 해외주식 보유 시 Tax Harvesting 발동용
    const severancePay = pension.private.severance || 0;
    const requiredPensionWithdrawal = ((pension.private.irp || 0) + (pension.private.savings || 0)) * 0.05; // 단순 가정치 (분리과세 룰 체크용)

    return {
      age,
      totalAssets,
      investableAssets,
      lockedCapital,
      housingAsset,
      monthlyExpense,
      monthlySaving,
      monthlyFixed,
      monthlyVariable,
      projectedDividendInterest,
      foreignStockProfits,
      severancePay,
      requiredPensionWithdrawal,
      realEstateRatio: housingAsset / (totalAssets || 1) * 100,
      foreignRatio: stock.foreignRatio,
      rawCategories: categories // 대시보드 시각화용 보존
    };
  }

  /**
   * 4-Bucket System 자산 배분 로직
   */
  calculateBucketAllocation(financials, macroResult) {
    // 유동 자산 (총 자산 - 묶인 부동산 자산)
    const liquidAssets = Math.max(0, financials.totalAssets - financials.housingAsset);

    // Bucket 0: 비상/의료 방패 (공격형일수록 강제 락업 비중을 높이되 기본 2천만 원 셋업)
    const isAggressive = macroResult.mbti_code.includes("A");
    const bucket0_target = isAggressive ? 20000000 : 10000000; 
    const bucket0_emergency = Math.min(liquidAssets, bucket0_target);
    
    let remainingLiquid = liquidAssets - bucket0_emergency;

    // Bucket 1: 단기 생활비 (조정된 월 생활비 * 24개월치)
    const monthlyExpense = macroResult.solver_parameters.adjustedMonthlyExpense;
    const bucket1_target = monthlyExpense * 24;
    const bucket1_shortTerm = Math.min(remainingLiquid, bucket1_target);

    remainingLiquid = remainingLiquid - bucket1_shortTerm;

    // Bucket 2 & 3: 남은 투자 자산을 비율로 분배
    let bucket2_midTerm = 0;
    let bucket3_longTerm = 0;

    if (remainingLiquid > 0) {
      if (macroResult.mbti_code.includes("S")) {
        // 안전형 (S)
        bucket2_midTerm = remainingLiquid * 0.7; // 3~7년 혼합 자산 70%
        bucket3_longTerm = remainingLiquid * 0.3; // 장기 성장주 30%
      } else {
        // 공격형 (A)
        bucket2_midTerm = remainingLiquid * 0.3;
        bucket3_longTerm = remainingLiquid * 0.7; 
      }
    }

    return {
      "Bucket_0_EmergencyShield": bucket0_emergency,
      "Bucket_1_ShortTermLiving": bucket1_shortTerm,
      "Bucket_2_MidTermBridge": bucket2_midTerm,
      "Bucket_3_LongTermGrowth": bucket3_longTerm,
      "Message": remainingLiquid <= 0 
        ? "현재 유동 자산이 부족하여 중장기 투자(Bucket 2,3) 여력이 없습니다. 우선 유동성 확보에 집중하세요." 
        : "Bucket 0은 질병/특수 상황 전용 방패입니다. 투자 자금이 아닙니다."
    };
  }

  /**
   * [신규] 2030 타겟 B급 감성 명예 뱃지 부여 시스템
   */
  awardBadge(financials, mbtiCode, bucketSystem) {
    const savingsRate = financials.monthlySaving / (financials.monthlyNet || 1);
    const foreignRatio = financials.rawCategories?.stock?.foreignRatio || 0;
    const stockAmount = financials.rawCategories?.stock?.amount || 0;
    const liquidAssets = bucketSystem.Bucket_0_EmergencyShield + bucketSystem.Bucket_1_ShortTermLiving + bucketSystem.Bucket_2_MidTermBridge + bucketSystem.Bucket_3_LongTermGrowth;

    // 1. 하우스푸어 철갑상어
    if (financials.realEstateRatio >= 70 && liquidAssets < 30000000) {
      return {
        title: "하우스푸어 철갑상어 🏰",
        description: "내 집 마련 성공! 근데 당장 내일 점심 사 먹을 돈이 없네? 벽돌 갉아먹고 살 수는 없잖아...",
        advice: "자산은 빵빵한데 현금흐름은 질식 직전. 금리 오르면 숨 막히니까 예적금 버킷부터 당장 채우세요."
      };
    }
    
    // 2. 인간 탕후루 (과소비/욜로)
    if (financials.monthlyNet >= 3000000 && savingsRate < 0.2) {
      const retireAgeTarget = financials.age ? (financials.age + 15) : 50; // 대략적인 목표 나이 폴백
      return {
        title: "인간 탕후루 🍓",
        description: `아주 행복한 인생을 살고 계시는군요! 이대로라면 ${retireAgeTarget}세에 은퇴 가능하겠어요! (물론 직장이 아니라 인생을 은퇴하는 걸로.. ㅋ)`,
        advice: "버는 족족 오마카세와 호캉스로 증발 중! 통장 잔고는 왜 항상 다이어트 중일까요? 뼈 맞았으면 당장 배달앱부터 지우세요."
      };
    }

    // 3. 무소유 풀소유 (극강 짠테크)
    if (savingsRate >= 0.6) {
      return {
        title: "무소유 풀소유 🧘‍♂️",
        description: "무지출 챌린지 폼 미쳤다. 이 시대의 진정한 구두쇠, 자본주의의 수도승 그 자체.",
        advice: "이 속도면 조기 은퇴 씹가능! 하지만 가끔은 나를 위해 치킨 한 마리 정도는 뜯어도 은퇴 플랜에 지장 없습니다. 릴렉스~"
      };
    }

    // 4. 공격적 투자자
    if (stockAmount > 50000000 && foreignRatio >= 70) {
      return {
        title: "초고위험 투자자 🦍",
        description: "리스크를 두려워하지 않는 공격적인 투자자",
        advice: "주식 시장의 큰 변동성에 대비해 최소 6개월치 현금 비상금을 반드시 확보하세요."
      };
    }

    // 5. 국밥 든든좌 (기본 뱃지)
    return {
      title: "국밥 든든좌 🐢",
      description: "뜨끈하고 든든한 국밥 같은 포트폴리오. 남들 상폐당할 때 나홀로 우상향 폼 미쳤다.",
      advice: "노잼 투자가 결국 승리합니다. 지금처럼만 하면 워렌 버핏도 박수 치고 갈 교과서적인 은퇴가 가능합니다."
    };
  }

  /**
   * [신규] 타임라인 액션 플랜 동적 생성
   * 사용자의 자산 상황, 나이, MBTI에 따라 개인화된 할 일 목록을 생성합니다.
   */
  generateTimeline(enhancedFinancials, mbtiCode, calcResults) {
    const hasISA = enhancedFinancials.rawCategories?.bank?.amount > 0;
    const hasIRP = (enhancedFinancials.rawCategories?.pension?.private?.irp || 0) > 0;
    const hasForeignStock = (enhancedFinancials.foreignRatio || 0) > 0;
    const isAggressive = mbtiCode && mbtiCode.includes('A');
    const yearsToRetire = calcResults?.yearsToRetire || 15;
    const monthlyVariable = enhancedFinancials.monthlyVariable || 0;

    const t0 = [
      { id: 'isa-open', text: 'ISA 계좌 개설 후 연간 2,000만 원 한도 납입 시작 (비과세 절세 필수)' },
      { id: 'emergency-fund', text: '비상금 통장 별도 분리 — 최소 6개월치 생활비 현금 확보' },
      { id: 'irp-auto', text: 'IRP 자동이체 설정 — 연 900만 원 납입 시 세액공제 최대화' },
    ];

    if (hasForeignStock) {
      t0.push({ id: 'tax-harvest', text: '해외주식 연간 250만 원 기본공제 활용 — Tax Harvesting 전략 실행' });
    }
    if (monthlyVariable > 500000) {
      t0.push({ id: 'variable-cut', text: `월 재량 지출(${Math.round(monthlyVariable/10000)}만 원) 점검 — 소비 다이어트 1순위 항목` });
    }

    const t1to5 = [
      { id: 'fcf-target', text: `월 저축 목표 달성 유지 — 연 복리 효과로 은퇴 자산 급증 구간` },
      { id: 'isa-rollover', text: 'ISA 만기(3~5년) 도래 시 → IRP/연금저축으로 즉시 롤오버 (납입한도 초과 혜택)' },
      { id: 'portfolio-check', text: '매년 1회 포트폴리오 리밸런싱 — 목표 비중 대비 ±5% 이상 이탈 시 조정' },
    ];

    if (isAggressive) {
      t1to5.push({ id: 'risk-check', text: '공격적 포트폴리오 유지 중 — 연 1회 MDD 허용 범위(30%) 초과 여부 점검 필수' });
    }

    const t5plus = [
      { id: 'glide-path', text: `은퇴 ${Math.min(5, yearsToRetire - 1)}년 전부터 Glide Path 전환 — 주식 비중을 매년 5%씩 안전자산으로 이동` },
      { id: 'pension-timing', text: '국민연금 수령 시점 전략 결정 — 조기/정시/연기 수령 중 최적 타이밍 선택 (연기 시 연 7.2% 증가)' },
      { id: 'housing-plan', text: '거주 부동산 활용 전략 확정 — 주택연금 전환 또는 다운사이징 후 투자 재배치 검토' },
    ];

    if (hasIRP) {
      t5plus.push({ id: 'irp-strategy', text: 'IRP/연금저축 수령 전략 — 연간 1,200만 원 이하 인출 시 분리과세(3.3~5.5%) 유지' });
    }

    return { t0, t1to5, t5plus };
  }
}

// 환경 호환성
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreController;
} else if (typeof window !== 'undefined') {
  window.CoreController = CoreController;
}
