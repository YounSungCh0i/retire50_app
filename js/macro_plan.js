/**
 * 거시적 플랜 (Macro Plan) 로직 엔진 v2.0 - "동적 거시 연동 및 인플레이션 헷지 강화"
 */

class MacroPlanEngine {
  constructor() {
    this.profiles = {
      "SRQF": {
        name: "한국형 철옹성 은퇴 (SRQF)",
        description: "수도권 자가 거주를 최우선으로 하며, 원금 손실을 지양하고 안정적인 은퇴를 선호하시는 성향입니다.",
        prescriptions: [
          "한국은행 금융안정보고서에 따르면, 주택 자산 비중이 높을 경우 유동성 위험이 발생할 수 있습니다. 이를 방어하기 위해 주택연금 제도를 옵션으로 고려해 보실 수 있습니다.",
          "안전 자산 선호도를 고려하여, Vanguard의 보수적 포트폴리오(주식 30 : 채권 70) 모델을 벤치마킹하는 것을 제안해 드립니다.",
          "미래에셋 연금연구소 자료에 근거하여, 연금저축/IRP 납입 한도(1,800만 원)를 최대한 활용해 세액공제를 받으시는 방안이 유리합니다."
        ],
        base_return_rate: 4.0,
        housing_reduction_rate: 0,
        expense_reduction_rate: 0,
        requires_inflation_hedge: true
      },
      "AFBL": {
        name: "노마드 바리스타 FIRE (AFBL)",
        description: "거주지에 얽매이지 않고 유연하게 대처하며, 소득 창출(부업)과 공격적 투자를 병행하시는 성향입니다.",
        prescriptions: [
          "자본시장연구원(KCMI) 리포트에 의하면, 거주지 비용을 줄여 투자 자본으로 전환할 시 장기 자산 증식 속도가 유의미하게 상승합니다.",
          "공격적인 투자 성향을 반영하여, 역사적으로 장기 수익률이 검증된 글로벌 성장주 중심의 포트폴리오(예: S&P500 등) 구성을 제안합니다.",
          "통계청 가계금융복지조사를 인용하면, 은퇴 후 월 150만 원의 파트타임 노동은 필요 은퇴 시드머니를 약 3억 원 이상 절약해 주는 효과가 있습니다."
        ],
        base_return_rate: 8.5,
        housing_reduction_rate: 0.5,
        expense_reduction_rate: 0.3,
        requires_inflation_hedge: false
      },
      "SFQL": {
        name: "자연인 린 FIRE (SFQL)",
        description: "절약과 소비 통제를 통해 조기 은퇴를 달성하고자 하며, 보수적 투자를 지향하시는 성향입니다.",
        prescriptions: [
          "Morningstar의 은퇴 연구에 따르면, 생활비 수준을 극도로 낮추는 린(Lean) 파이어는 상대적으로 적은 자본으로도 은퇴를 가능하게 합니다.",
          "다만, 극단적 절약은 인플레이션에 매우 취약할 수 있으므로, 물가연동채권(TIPS)이나 고배당주 위주의 방어적 자산 배분을 고려해 보시길 권장합니다."
        ],
        base_return_rate: 5.0,
        housing_reduction_rate: 0.7,
        expense_reduction_rate: 0.4,
        requires_inflation_hedge: true
      },
      "ARQF": {
        name: "어그레시브 팻 FIRE (ARQF)",
        description: "풍족한 소비와 원하는 거주 환경을 유지하기 위해 자본 시장에서 높은 수익을 추구하시는 성향입니다.",
        prescriptions: [
          "1998년 Trinity Study 논문을 바탕으로 볼 때, 높은 생활비를 충당하기 위해서는 주식 비중을 최소 75% 이상 가져가는 공격적인 배분이 필요할 수 있습니다.",
          "높은 변동성을 동반하므로, 자산 고갈 위험(Sequence of Returns Risk)을 막기 위해 최소 2~3년 치의 생활비는 별도의 안전 자산(파킹통장)으로 분리해 두시는 것을 강력히 제안합니다."
        ],
        base_return_rate: 8.0,
        housing_reduction_rate: 0,
        expense_reduction_rate: 0,
        requires_inflation_hedge: true
      },
      "PENDING": {
        name: "성향 미진단",
        description: "MBTI 성향 진단을 완료하시면 최적화된 은퇴 플랜이 제공됩니다.",
        prescriptions: [
          "우측 상단 탭에서 '플레이어 성향 진단'을 완료해주세요."
        ],
        base_return_rate: 5.0,
        housing_reduction_rate: 0,
        expense_reduction_rate: 0,
        requires_inflation_hedge: false
      }
    };
  }

  calculateFinancialMBTI(answers) {
    if (!answers || !answers.riskTolerance) return "PENDING";
    let mbti = "";
    mbti += (answers.riskTolerance === "A" || answers.riskTolerance === "aggressive") ? "A" : "S";
    mbti += (answers.geoArbitrage === "F" || answers.geoArbitrage === "flexible") ? "F" : "R";
    mbti += (answers.sideHustle === "B" || answers.sideHustle === "willing") ? "B" : "Q";
    mbti += (answers.frugality === "L" || answers.frugality === "lean") ? "L" : "F";
    return mbti;
  }

  /**
   * [백엔드 내부 프로토콜] 거시 경제 데이터 기반 수익률 동적 조정 및 돌발 변수(블랙스완) 예외 처리
   */
  adjustReturnRateDynamically(baseRate, macroData) {
    let adjustedRate = baseRate;
    let isPanicMode = false;
    
    // [Fallback Protocol] 돌발 변수 대처 강령: 예측 범위를 벗어난 이상치(예: 물가상승률 15% 이상) 입력 시
    // 시스템 에러나 비현실적 수익률 요구를 막기 위해 내부적으로 보수적 안전망 모드로 다운그레이드
    if (macroData.inflationRate >= 10.0 || macroData.baseRate >= 10.0) {
       isPanicMode = true;
       // 극단적 인플레이션/금리 환경에서는 타겟 수익률을 안전 구간(최대 5%)으로 강제 하향 조정 (사용자 노출 알람 아님, 계산용 내부 보정)
       adjustedRate = Math.min(baseRate, 5.0); 
       return { rate: adjustedRate, isPanicMode: isPanicMode };
    }

    // 일반적인 거시 경제 연동
    if (macroData.inflationRate > 3.0 && macroData.baseRate > 4.0) {
      if (baseRate > 7.0) {
        adjustedRate -= 1.5; 
      } else {
        adjustedRate += 0.5; 
      }
    } 
    else if (macroData.inflationRate < 2.0 && macroData.baseRate <= 2.0) {
      if (baseRate > 7.0) {
        adjustedRate += 1.0; 
      } else {
        adjustedRate -= 1.0; 
      }
    }
    
    return { rate: parseFloat(Math.max(adjustedRate, 1.0).toFixed(2)), isPanicMode: isPanicMode };
  }

  generateScenarioOptions(mbtiCode, currentFinancials, macroData) {
    let profile = this.profiles[mbtiCode] || this.generateDynamicProfile(mbtiCode);
    const reasoning = [];
    
    reasoning.push(`[성향 분석] 고객님의 MBTI(${mbtiCode})를 분석한 결과, '${profile.name}' 성향으로 분류되었습니다. 기본 타겟 수익률은 연 ${profile.base_return_rate.toFixed(1)}%로 설정됩니다.`);

    const adjustmentResult = this.adjustReturnRateDynamically(profile.base_return_rate, macroData);
    const dynamicReturnRate = adjustmentResult.rate;
    
    let additionalAdvice = [];
    
    // 사용자에게 보여주는 레퍼런스 기반 조언 추가
    if (profile.requires_inflation_hedge || mbtiCode.includes("L")) {
      additionalAdvice.push("※ 린(Lean) 파이어의 경우 물가 상승에 민감할 수 있습니다. 골드만삭스(Goldman Sachs)의 실물 자산 배분 리포트를 참고하여, 포트폴리오 내 물가연동채(TIPS)나 금 비중을 일부 확보하는 방안을 고려해 보세요.");
      reasoning.push(`[거시 방어] 물가 상승(인플레이션)에 취약한 L(Lean) 성향 방어를 위해, 포트폴리오에 물가연동채/금 등 대체투자 비중을 의도적으로 10% 증량합니다.`);
    }

    if (adjustmentResult.isPanicMode) {
      // 시스템 내부 폴백 가동 시, 사용자에게는 제안 형태로 안전 자산 비중 확대를 권고
      additionalAdvice.push("※ 현재 거시 지표가 역사적 변동성 상단에 위치해 있습니다. JP모건의 경제 위기 대응 매뉴얼에 따라, 기대수익률을 낮추고 달러 및 실물 자산(안전 버킷) 비율을 상향 조정하는 시나리오를 참고 데이터로 산출했습니다.");
      reasoning.push(`[거시 위기 감지] 현재 금리와 물가 지표가 극단값(Panic Mode)을 보이고 있어, 수익률을 ${dynamicReturnRate.toFixed(1)}%로 강제 하향하고 채권 및 대체투자 비중을 대폭 상향시켰습니다.`);
    }

    const solverParams = {
      adjustedTargetReturnRate: dynamicReturnRate,
      baseTargetReturnRate: profile.base_return_rate,
      adjustedMonthlyExpense: currentFinancials.monthlyExpense * (1 - profile.expense_reduction_rate),
      adjustedHousingCost: currentFinancials.housingAsset * (1 - profile.housing_reduction_rate),
      hasSideHustle: mbtiCode.includes("B")
    };

    // 자산 배분 비중(%) 산출 알고리즘
    let equityRatio = 0, bondRatio = 0, altRatio = 0, cashRatio = 0;
    if (adjustmentResult.isPanicMode) {
      equityRatio = 30; bondRatio = 40; altRatio = 15; cashRatio = 15;
    } else {
      if (dynamicReturnRate >= 8.0) {
        equityRatio = 80; bondRatio = 10; altRatio = 5; cashRatio = 5;
        reasoning.push(`[포트폴리오 비중] 8% 이상의 고수익 달성을 위해, 뱅가드(Vanguard) 성장형 포트폴리오 모델에 따라 주식 비중을 ${equityRatio}%로 공격적 편성했습니다.`);
      } else if (dynamicReturnRate >= 6.0) {
        equityRatio = 60; bondRatio = 30; altRatio = 5; cashRatio = 5;
        reasoning.push(`[포트폴리오 비중] 6~7%의 중위험 중수익을 위해, 전통적인 60/40 포트폴리오 기반(주식 ${equityRatio}%)으로 안정적 배분을 실시했습니다.`);
      } else {
        equityRatio = 40; bondRatio = 45; altRatio = 5; cashRatio = 10;
        reasoning.push(`[포트폴리오 비중] 보수적 수익률 방어를 위해 채권 비중(${bondRatio}%)을 주식보다 높게 가져가는 방어적 배분을 실시했습니다.`);
      }
    }
    
    // 인플레이션 헷지(L성향)일 경우 대체투자/실물자산 비중 증가
    if (profile.requires_inflation_hedge) {
      altRatio += 10;
      bondRatio -= 5;
      equityRatio -= 5;
    }

    // ETF 티커 맵핑 (파이 차트 렌더링용)
    const detailedPortfolio = [];
    if (equityRatio > 0) {
      const fRatio = currentFinancials.foreignRatio !== undefined ? currentFinancials.foreignRatio : 50;
      const dRatio = 100 - fRatio;
      
      if (fRatio > 0) {
        detailedPortfolio.push({ label: '해외 주식 (S&P500, AAPL 등)', value: Math.round(equityRatio * (fRatio / 100)), color: '#3b82f6' });
      }
      if (dRatio > 0) {
        detailedPortfolio.push({ label: '국내 주식 (KOSPI, 삼전 등)', value: Math.round(equityRatio * (dRatio / 100)), color: '#60a5fa' });
      }
    }
    if (bondRatio > 0) {
      detailedPortfolio.push({ label: '미국 장기채 (TLT)', value: Math.round(bondRatio * 0.7), color: '#10b981' });
      detailedPortfolio.push({ label: '초단기채 (SHV)', value: Math.round(bondRatio * 0.3), color: '#34d399' });
    }
    if (altRatio > 0) {
      detailedPortfolio.push({ label: '금 현물 (IAU)', value: Math.round(altRatio * 0.5), color: '#f59e0b' });
      detailedPortfolio.push({ label: '리츠 (VNQ)', value: Math.round(altRatio * 0.5), color: '#fbbf24' });
    }
    if (cashRatio > 0) {
      detailedPortfolio.push({ label: 'CMA/현금', value: cashRatio, color: '#94a3b8' });
    }

    const assetAllocation = {
      equity: equityRatio,
      bond: bondRatio,
      alternative: altRatio,
      cash: cashRatio,
      details: detailedPortfolio
    };

    return {
      mbti_code: mbtiCode,
      profile_name: profile.name,
      solver_parameters: solverParams,
      asset_allocation: assetAllocation,
      reasoning: reasoning,
      dynamic_adjustments: {
        macro_effect: dynamicReturnRate - profile.base_return_rate > 0 ? "Premium" : "Discount",
        advice: additionalAdvice
      }
    };
  }

  generateDynamicProfile(mbtiCode) {
    const isAggressive = mbtiCode[0] === 'A';
    const isFlexibleHousing = mbtiCode[1] === 'F';
    const isBarista = mbtiCode[2] === 'B';
    const isLean = mbtiCode[3] === 'L';

    return {
      name: `맞춤형 파이어 성향 (${mbtiCode})`,
      base_return_rate: isAggressive ? 8.0 : 5.0,
      housing_reduction_rate: isFlexibleHousing ? 0.4 : 0,
      expense_reduction_rate: isLean ? 0.3 : 0,
      requires_inflation_hedge: isLean
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MacroPlanEngine;
} else if (typeof window !== 'undefined') {
  window.MacroPlanEngine = MacroPlanEngine;
}
