/**
 * 미시적 플랜 (Micro Plan) 로직 엔진 - "현행법 기반 마찰 비용 철통 방어 시스템"
 * 
 * 거시적 플랜으로 세워진 은퇴 예산을 세금, 건보료, 폭락장 리스크로부터 
 * 방어하기 위한 10가지 초정밀 마이크로 룰(Rules)을 담고 있습니다.
 */

const _DATA = (typeof window !== 'undefined') ? window.DATA : require('./data.js');

class MicroPlanEngine {
  constructor() {
    // 대한민국 현행법 및 금융 환경을 반영한 10가지 방어 프로토콜
    this.defenseRules = {
      // Rule 1: 건보료 피부양자 자격 방어 (금융소득 1천만 원, 합산 2천만 원 기준)
      "HEALTH_INSURANCE_10M_CUT": {
        id: "RULE_01",
        category: "건보료 방어 제안",
        condition: (financials) => (financials.projectedDividendInterest || 0) > _DATA.tax.healthInsuranceCutoff,
        tactics: [
          "자본시장연구원(KCMI) 리포트에 따르면, 배당 자산을 '중개형 ISA' 등 비과세 계좌로 이전 시 건보료 산정에서 배제되어 세후 수익률이 개선될 수 있습니다. 해당 옵션을 검토해 보시길 제안합니다.",
          "일반 계좌의 배당주 일부를 '성장주(시세차익 위주)'로 포트폴리오 리밸런싱하는 방안도 현행법상 건보료 부담을 낮추는 대안이 될 수 있습니다.",
          "국민건강보험공단 안내에 따라, 은퇴 전 직장에서 '임의계속가입제도'를 신청하시면 최대 3년간 직장가입자 자격 유지가 가능하므로 이를 활용해 보셔도 좋습니다."
        ]
      },
      // Rule 2: 사적연금 16.5% 분리과세 페널티 방어 (연 1,500만 원 한도)
      "PRIVATE_PENSION_15M_TAX": {
        id: "RULE_02",
        category: "사적연금 분리과세 한도 초과",
        condition: (financials) => (financials.requiredPensionWithdrawal || 0) > _DATA.tax.privatePensionLimit,
        tactics: [
          "세법 전문가들의 가이드에 따르면, 사적연금 인출 시 '과세 제외 원금(세액공제를 받지 않은 원금)'부터 우선 인출 신청하실 경우 1,500만 원 한도 계산에서 제외되어 절세에 유리합니다.",
          "연금 수령 기간을 10년에서 15년으로 이연하여 연간 수령액을 한도 내로 조절하는 옵션도 많은 은퇴자들이 활용하는 방법입니다."
        ]
      },
      // Rule 3: ISA 3년 주기 롤오버 연금화 (조세특례제한법 활용)
      "ISA_ROLLOVER_TACTIC": {
        id: "RULE_03",
        category: "세금 방어 & 자산 증식",
        condition: (financials) => financials.hasISA && financials.isaAge >= 3,
        tactics: [
          "만기가 도래한 ISA 계좌의 자금을 '연금저축계좌'로 전액 이체 신청",
          "이체 금액의 10%(최대 300만 원)에 해당하는 추가 세액공제 창출",
          "연금계좌로 이동된 자산에서 발생하는 운용 수익은 모두 건보료 산정에서 배제되는 효과 누림"
        ]
      },
      // Rule 4: 바리스타 FIRE 종합소득세 방어
      "BARISTA_COMPREHENSIVE_TAX_DEFENSE": {
        id: "RULE_04",
        category: "세금 방어",
        condition: (financials) => financials.hasSideHustle && ((financials.sideHustleIncome || 0) + (financials.projectedDividendInterest || 0) > 20000000),
        tactics: [
          "근로/사업 소득과 합산되어 누진세율을 맞는 것을 방지하기 위해 금융소득을 무조건 2천만 원 이하 분리과세 한도 내로 억제",
          "필요시 프리랜서/부업 소득을 법인 전환하여 세율 구조를 법인세율(최저 9%)로 다운사이징"
        ]
      },
      // Rule 5: 수익률 순서의 위험(SORR) 동적 방어 (폭락장 생존법)
      "SEQUENCE_OF_RETURNS_DEFENSE": {
        id: "RULE_05",
        category: "멘탈/수익률 방어 제안",
        condition: (financials) => financials.marketCondition === "bear" || financials.portfolioReturn < -10,
        tactics: [
          "Vanguard 은퇴 연구소의 '동적 인출(Dynamic Withdrawal)' 모델을 참고하여, 포트폴리오 하락 시 일시적으로 인출액을 10~15% 삭감하는 대안을 고려해 보세요.",
          "하락장에서는 보유 주식 매도를 멈추고, 준비해 두신 단기 생활비 현금(Bucket 1)을 활용하여 시장 회복기를 기다리시는 것이 장기적으로 유리할 수 있습니다."
        ]
      },
      // Rule 6: 주택연금을 활용한 유동성 창출
      "HOUSING_PENSION_TACTIC": {
        id: "RULE_06",
        category: "유동성/건보료 방어 제안",
        condition: (financials) => financials.realEstateRatio > 70 && financials.age >= 55,
        tactics: [
          "한국은행 금융안정보고서 등에서 지적하듯, 부동산 비중이 과도할 경우 현금흐름에 취약할 수 있습니다. 주택금융공사의 주택연금 제도를 활용하시면 세금 및 건보료 부과 없이 매월 안정적인 비과세 현금흐름을 창출하실 수 있습니다. 하나의 옵션으로 검토해 보세요."
        ]
      },
      // Rule 7: 국민연금 크레바스(소득 공백기) 방어
      "NATIONAL_PENSION_CREVASSE": {
        id: "RULE_07",
        category: "현금흐름 방어",
        condition: (financials) => financials.age < 65 && financials.age >= 50,
        tactics: [
          "국민연금 조기수령(연 6% 삭감) 신청 시 손익분기점(BEP)이 약 76세이므로, 가족력이 짧을 경우 적극 고려",
          "반대로 장수가 예상될 경우 일시적 크레바스를 IRP 계좌 및 예금 이자로 메우고 국민연금을 정상/연기 수령하여 인플레이션 헷지 극대화"
        ]
      },
      // Rule 8: 해외주식 양도소득세 250만 원 비과세 롤오버
      "FOREIGN_STOCK_TAX_HARVESTING": {
        id: "RULE_08",
        category: "세금 방어",
        condition: (financials) => (financials.foreignStockProfits || 0) > 0,
        tactics: [
          "매년 12월 말, 평가 이익이 난 해외주식을 매도하여 기본공제 250만 원 한도를 채운 후 즉시 재매수 (Tax Loss Harvesting)",
          "이를 통해 장기 투자 시 발생하는 막대한 양도소득세(22%) 폭탄을 매년 분할하여 면제받음"
        ]
      },
      // Rule 9: 연금소득세 감면 활용 (퇴직금 연금화)
      "SEVERANCE_PAY_ANNUITY": {
        id: "RULE_09",
        category: "세금 방어",
        condition: (financials) => (financials.severancePay || 0) > 0,
        tactics: [
          "퇴직금을 절대 일시금으로 수령하지 말고 IRP로 이전하여 연금으로 수령 (퇴직소득세의 30% 감면 효과)",
          "특히 10년 차 이후부터 수령하는 퇴직금은 이연퇴직소득세가 40% 감면되므로 장기 수령으로 세팅"
        ]
      },
      // Rule 10: 인플레이션 헤지 포지션 구축
      "INFLATION_HEDGE_TRIGGER": {
        id: "RULE_10",
        category: "구매력 방어",
        condition: (financials) => (financials.inflationRate || 0) > 3.0,
        tactics: [
          "소비자물가지수(CPI) 연동 채권(TIPS)이나 금(Gold), 원자재 비중을 10~15% 상향",
          "명목 수익률의 착시를 방지하기 위해 예적금 비중을 최소화하고 실물 자산 편입 비율 조정"
        ]
      }
    };
  }

  /**
   * 사용자의 재무 데이터를 입력받아, 10가지 방어 룰 중 발동되는 택틱스 목록을 반환합니다.
   * @param {Object} financials 사용자의 재정 상태 데이터 
   * @returns {Array} 발동된 방어 룰의 배열
   */
  runDefenseDiagnostics(financials) {
    let triggeredTactics = [];

    for (const key in this.defenseRules) {
      const rule = this.defenseRules[key];
      // 조건에 부합하면 해당 방어 룰(옵션들)을 발동 배열에 추가
      if (rule.condition(financials)) {
        triggeredTactics.push({
          rule_id: rule.id,
          category: rule.category,
          tactics: rule.tactics
        });
      }
    }

    return triggeredTactics;
  }

  /**
   * [심화] 세금/건보료 방어 시 기회비용 비교 분석 (Cost-Benefit Analysis)
   * 꼬리(세금)가 몸통(수익)을 흔들지 않도록, 세금을 낼 때와 피했을 때의 최종 수익을 비교합니다.
   * @param {Object} financials 
   */
  runCostBenefitAnalysis(financials) {
    const analysisResult = {
      isEvasionProfitable: false,
      message: "",
      details: {},
      reasoning: []
    };

    const targetReturn = financials.portfolioReturn || 7.0; // 기본 7% 가정
    const totalAssets = financials.totalAssets || 500000000;
    const annualHealthInsuranceCost = 3000000; // 보수적 연 300만 원(월 25)
    const COMP_YEARS = 10; // 10년 복리 시뮬레이션

    const formatKRW = (val) => {
      if (val >= 100000000) return (val / 100000000).toFixed(1) + '억 원';
      return Math.round(val / 10000).toLocaleString('ko-KR') + '만 원';
    };

    analysisResult.reasoning.push(`[비용-편익 모델 세팅] 초기 자산 ${formatKRW(totalAssets)}을 기준으로 향후 ${COMP_YEARS}년간 2가지 복리 시나리오를 가동합니다.`);

    // 시나리오 A: 정면 돌파 (건보료 납부, 목표 수익률 그대로 달성)
    let scenarioA_assets = totalAssets;
    for(let y=0; y<COMP_YEARS; y++) {
      scenarioA_assets = (scenarioA_assets * (1 + targetReturn/100)) - annualHealthInsuranceCost;
    }
    analysisResult.reasoning.push(`[시나리오 A: 정면돌파] 매년 건보료 ${formatKRW(annualHealthInsuranceCost)}를 납부하지만 타겟 수익률(${targetReturn}%)을 온전히 유지할 경우, ${COMP_YEARS}년 뒤 최종 자산은 ${formatKRW(scenarioA_assets)}이 됩니다.`);

    // 시나리오 B: 건보료 회피 (수익률을 낮추고, 건보료 0)
    // 회피를 위해 예적금/비과세 중심으로 가므로 기대수익률이 약 2.5% 포인트 하락한다고 가정
    const evasiveReturn = Math.max(targetReturn - 2.5, 2.0);
    let scenarioB_assets = totalAssets;
    for(let y=0; y<COMP_YEARS; y++) {
      scenarioB_assets = (scenarioB_assets * (1 + evasiveReturn/100)); // 건보료 0
    }
    analysisResult.reasoning.push(`[시나리오 B: 수익률 포기 및 회피] 건보료를 한 푼도 내지 않기 위해 비과세/저수익 자산에 묶어두어 수익률이 ${evasiveReturn}%로 하락할 경우, 건보료는 방어하지만 ${COMP_YEARS}년 뒤 최종 자산은 ${formatKRW(scenarioB_assets)}에 그칩니다.`);

    const difference = Math.round(scenarioA_assets - scenarioB_assets);

    analysisResult.chart_data = {
      labels: ['정면 돌파 (수익률 유지)', '건보료 회피 (수익률 저하)'],
      datasets: [{
        label: '10년 뒤 최종 자산',
        data: [scenarioA_assets, scenarioB_assets],
        backgroundColor: ['#10b981', '#f43f5e']
      }]
    };

    if (difference > 0) {
      analysisResult.isEvasionProfitable = false;
      analysisResult.reasoning.push(`[결론 도출] 수학적으로 시나리오 A가 시나리오 B보다 ${formatKRW(difference)} 더 우월합니다. 따라서 건보료를 두려워하지 말고 정면 투자하십시오.`);
      analysisResult.message = `[10년 복리 기회비용 분석] 건보료를 피하기 위해 안전 자산으로 회피투자를 할 경우, 10년 뒤 오히려 <strong>${formatKRW(difference)}</strong>의 자산 손실(기회비용)이 발생합니다. 건강보험료(연 300만 원)를 기꺼이 납부하더라도 타겟 수익률(${targetReturn}%)을 유지하여 정면 돌파하는 것이 압도적으로 유리합니다. (꼬리가 몸통을 흔들게 두지 마십시오)`;
    } else {
      analysisResult.isEvasionProfitable = true;
      analysisResult.reasoning.push(`[결론 도출] 현재 자본 및 수익률 수준에서는 건보료를 회피(시나리오 B)하는 전략이 ${formatKRW(Math.abs(difference))} 더 유리합니다.`);
      analysisResult.message = `[10년 복리 기회비용 분석] 건보료 회피 전략(비과세 계좌 적극 활용 및 수익률 조절)이 정면 돌파 시나리오보다 10년 뒤 <strong>${formatKRW(Math.abs(difference))}</strong> 더 유리하게 산출되었습니다.`;
    }

    return analysisResult;
  }
}

// 환경 호환성
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MicroPlanEngine;
} else if (typeof window !== 'undefined') {
  window.MicroPlanEngine = MicroPlanEngine;
}
